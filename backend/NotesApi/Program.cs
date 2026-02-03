using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "NotesApi",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<NotesDbContext>(options =>
    options.UseSqlite("Data Source=notes.db"));

var jwtKey = "THIS_IS_A_DEV_ONLY_SECRET_KEY_CHANGE_LATER";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow
    });
});

app.MapGet("/notes", async (
    int page,
    int pageSize,
    string? search,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);

    page = page <= 0 ? 1 : page;
    pageSize = pageSize <= 0 ? 10 : pageSize;
    pageSize = pageSize > 50 ? 50 : pageSize;

    var query = db.Notes.Where(n => n.UserId == userId);

    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(n => n.Title.ToLower().Contains(search.ToLower()) 
                              || n.Content.ToLower().Contains(search.ToLower()));
    }

    var totalCount = await query.CountAsync();

    var notes = await query
        .OrderByDescending(n => n.UpdatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        page,
        pageSize,
        totalCount,
        data = notes
    });
})
.RequireAuthorization();

app.MapGet("/notes/{id}", async (
    Guid id,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);

    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

    if (note == null)
        return Results.NotFound();

    return Results.Ok(note);
})
.RequireAuthorization();

app.MapPost("/notes", async (
    CreateNoteRequest request,
    HttpContext context,
    NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest(new { error = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "Title must be under 200 characters" });

    var userId = AuthHelpers.GetUserId(context);

    var note = new Note
    {
        Id = Guid.NewGuid(),
        Title = request.Title.Trim(),
        Content = request.Content?.Trim() ?? string.Empty,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        UserId = userId
    };

    db.Notes.Add(note);
    await db.SaveChangesAsync();

    return Results.Created($"/notes/{note.Id}", note);
})
.RequireAuthorization();

app.MapPost("/notes/upload", async (
    IFormFile file,
    IHttpClientFactory clientFactory,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);
    if (userId == null) return Results.Unauthorized();

    if (file == null || file.Length == 0)
        return Results.BadRequest("No file uploaded.");

    // 2. Prepare to send file to Python
    var pythonUrl = "http://localhost:8000/ocr";

    using var client = clientFactory.CreateClient();
    using var content = new MultipartFormDataContent();

    using var fileStream = file.OpenReadStream();
    var streamContent = new StreamContent(fileStream);
    streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

    content.Add(streamContent, "file", file.FileName);

    try
    {

        var response = await client.PostAsync(pythonUrl, content);

        if (!response.IsSuccessStatusCode)
            return Results.Json(new { error = "Python AI Service failed." }, statusCode: (int)response.StatusCode);

        var jsonString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonString);
        
        // Extract the text safely
        string extractedText = "";
        if (doc.RootElement.TryGetProperty("text", out var textElement))
        {
            extractedText = textElement.GetString() ?? "";
        }

        // 5. Save as a New Note
        var newNote = new Note
        {
            Id = Guid.NewGuid(),
            Title = "Scanned Note - " + DateTime.Now.ToShortDateString(),
            Content = extractedText,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Notes.Add(newNote);
        await db.SaveChangesAsync();

        return Results.Ok(newNote);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Connection Error: {ex.Message}");
    }
})
.RequireAuthorization()
.DisableAntiforgery();

app.MapPut("/notes/{id}", async (
    Guid id,
    UpdateNoteRequest request,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);

    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
    if (note == null)
        return Results.NotFound();

    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest(new { error = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "Title must be under 200 characters" });

    note.Title = request.Title.Trim();
    note.Content = request.Content?.Trim() ?? string.Empty;
    note.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.Ok(note);
})
.RequireAuthorization();

app.MapDelete("/notes/{id}", async (
    Guid id,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);

    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
    if (note == null)
        return Results.NotFound();

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.RequireAuthorization();

app.MapPost("/auth/register", async (RegisterRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required" });

    if (request.Password.Length < 6)
        return Results.BadRequest(new { error = "Password must be at least 6 characters" });

    var email = request.Email.Trim().ToLower();

    if (await db.Users.AnyAsync(u => u.Email == email))
        return Results.Conflict(new { error = "User already exists" });

    var user = new User
    {
        Id = Guid.NewGuid(),
        Email = email,
        PasswordHash = PasswordHasher.Hash(request.Password),
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created("/auth/register", new { user.Id, user.Email });
});

app.MapPost("/auth/login", async (LoginRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required" });

    var email = request.Email.Trim().ToLower();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        return Results.Unauthorized();

    var token = JwtTokenGenerator.Generate(user, jwtKey);

    return Results.Ok(new
    {
        token,
        user = new { user.Id, user.Email }
    });
});

app.Run();