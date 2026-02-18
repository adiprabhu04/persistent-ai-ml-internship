using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

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

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

if (string.IsNullOrEmpty(databaseUrl))
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? throw new InvalidOperationException("Connection string not found.");
}
else if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var builder2 = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = Uri.UnescapeDataString(userInfo[1]),
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = Npgsql.SslMode.Require,
        TrustServerCertificate = true
    };
    connectionString = builder2.ConnectionString;
}
else
{
    connectionString = databaseUrl;
}

builder.Services.AddDbContext<NotesDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
{
    if (builder.Environment.IsDevelopment())
    {
        jwtKey = "DEVELOPMENT_ONLY_SECRET_KEY_MINIMUM_32_CHARACTERS_LONG";
    }
    else
    {
        throw new InvalidOperationException("JWT_SECRET_KEY environment variable must be at least 32 characters");
    }
}
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

var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',') ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowConfigured", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowConfigured");

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

    if (note == null) return Results.NotFound();

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

app.MapPut("/notes/{id}", async (
    Guid id,
    UpdateNoteRequest request,
    HttpContext context,
    NotesDbContext db) =>
{
    var userId = AuthHelpers.GetUserId(context);
    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
    
    if (note == null) return Results.NotFound();

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
    
    if (note == null) return Results.NotFound();

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
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
        return Results.BadRequest(new { error = "No file uploaded" });

    const long maxFileSize = 10 * 1024 * 1024;
    if (file.Length > maxFileSize)
        return Results.BadRequest(new { error = "File size must be under 10MB" });

    var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp" };
    if (!allowedTypes.Contains(file.ContentType.ToLower()))
        return Results.BadRequest(new { error = "Only image files (JPEG, PNG, GIF, WebP, BMP) are allowed" });

    var aiServiceBase = Environment.GetEnvironmentVariable("AI_SERVICE_URL")
        ?? "http://localhost:8000";
    var aiServiceUrl = aiServiceBase.TrimEnd('/') + "/extract-text";

    using var uploadMemoryStream = new MemoryStream();
    await file.OpenReadStream().CopyToAsync(uploadMemoryStream);
    var uploadFileBytes = uploadMemoryStream.ToArray();

    const int uploadMaxRetries = 3;
    for (int attempt = 0; attempt < uploadMaxRetries; attempt++)
    {
        try
        {
            using var client = clientFactory.CreateClient();
            using var formContent = new MultipartFormDataContent();
            var streamContent = new StreamContent(new MemoryStream(uploadFileBytes));
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            formContent.Add(streamContent, "file", file.FileName);

            var response = await client.PostAsync(aiServiceUrl, formContent);

            if ((int)response.StatusCode == 429)
            {
                if (attempt < uploadMaxRetries - 1)
                {
                    await Task.Delay((attempt + 1) * 1000);
                    continue;
                }
                return Results.Json(new { error = "OCR service is busy. Please try again in a moment." }, statusCode: 503);
            }

            if (!response.IsSuccessStatusCode)
                return Results.Json(new { error = "Python AI Service failed." }, statusCode: 502);

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);

            string extractedText = "";
            if (doc.RootElement.TryGetProperty("text", out var textElement))
            {
                extractedText = textElement.GetString() ?? "";
            }

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
        catch (Exception)
        {
            if (attempt < uploadMaxRetries - 1)
            {
                await Task.Delay((attempt + 1) * 1000);
                continue;
            }
            return Results.Problem("AI service is currently unavailable. Please try again later.");
        }
    }

    return Results.Problem("AI service is currently unavailable. Please try again later.");
})
.RequireAuthorization()
.DisableAntiforgery();

app.MapPost("/notes/scan", async (
    IFormFile file,
    IHttpClientFactory clientFactory,
    HttpContext context) =>
{
    var userId = AuthHelpers.GetUserId(context);
    if (userId == null) return Results.Unauthorized();

    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No file uploaded" });

    const long maxFileSize = 10 * 1024 * 1024;
    if (file.Length > maxFileSize)
        return Results.BadRequest(new { error = "File size must be under 10MB" });

    var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp" };
    if (!allowedTypes.Contains(file.ContentType.ToLower()))
        return Results.BadRequest(new { error = "Only image files are allowed" });

    var aiServiceBase = Environment.GetEnvironmentVariable("AI_SERVICE_URL")
        ?? "http://localhost:8000";
    var aiServiceUrl = aiServiceBase.TrimEnd('/') + "/extract-text";

    using var memoryStream = new MemoryStream();
    await file.OpenReadStream().CopyToAsync(memoryStream);
    var fileBytes = memoryStream.ToArray();

    const int maxRetries = 3;
    for (int attempt = 0; attempt < maxRetries; attempt++)
    {
        try
        {
            using var client = clientFactory.CreateClient();
            using var formContent = new MultipartFormDataContent();
            var streamContent = new StreamContent(new MemoryStream(fileBytes));
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            formContent.Add(streamContent, "file", file.FileName);

            var response = await client.PostAsync(aiServiceUrl, formContent);

            if ((int)response.StatusCode == 429)
            {
                if (attempt < maxRetries - 1)
                {
                    await Task.Delay((attempt + 1) * 1000);
                    continue;
                }
                return Results.Json(new { error = "OCR service is busy. Please try again in a moment." }, statusCode: 503);
            }

            if (!response.IsSuccessStatusCode)
                return Results.Json(new { error = "OCR service failed" }, statusCode: 502);

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);

            string extractedText = "";
            if (doc.RootElement.TryGetProperty("text", out var textElement))
                extractedText = textElement.GetString() ?? "";

            return Results.Ok(new { text = extractedText });
        }
        catch (Exception)
        {
            if (attempt < maxRetries - 1)
            {
                await Task.Delay((attempt + 1) * 1000);
                continue;
            }
            return Results.Problem("AI service is currently unavailable. Please try again later.");
        }
    }

    return Results.Problem("AI service is currently unavailable. Please try again later.");
})
.RequireAuthorization()
.DisableAntiforgery();

app.MapPost("/auth/register", async (RegisterRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required" });

    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest(new { error = "Name is required" });

    var email = request.Email.Trim().ToLower();

    if (!System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
        return Results.BadRequest(new { error = "Please enter a valid email address" });

    if (request.Password.Length < 6)
        return Results.BadRequest(new { error = "Password must be at least 6 characters" });

    if (await db.Users.AnyAsync(u => u.Email == email))
        return Results.Conflict(new { error = "User already exists" });

    var user = new User
    {
        Id = Guid.NewGuid(),
        Name = request.Name.Trim(),
        Email = email,
        PasswordHash = PasswordHasher.Hash(request.Password),
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created("/auth/register", new { user.Id, user.Email, user.Name });
});

app.MapPost("/auth/login", async (LoginRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required" });

    var email = request.Email.Trim().ToLower();

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = keyBytes;
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(token);

    return Results.Ok(new
    {
        token = tokenString,
        name = user.Name,
        user = new { user.Id, user.Email }
    });
});

app.Run();