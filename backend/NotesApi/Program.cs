using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<NotesDbContext>(options =>
    options.UseSqlite("Data Source=notes.db"));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

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
    NotesDbContext db) =>
{
    page = page <= 0 ? 1 : page;
    pageSize = pageSize <= 0 ? 10 : pageSize;
    pageSize = pageSize > 50 ? 50 : pageSize;

    var totalCount = await db.Notes.CountAsync();

    var notes = await db.Notes
        .OrderByDescending(n => n.CreatedAt)
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
});

app.MapPost("/notes", async (CreateNoteRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest(new { error = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "Title must be under 200 characters" });

    var note = new Note
    {
        Id = Guid.NewGuid(),
        Title = request.Title.Trim(),
        Content = request.Content?.Trim() ?? string.Empty,
        CreatedAt = DateTime.UtcNow
    };

    db.Notes.Add(note);
    await db.SaveChangesAsync();

    return Results.Created($"/notes/{note.Id}", note);
});

app.MapPut("/notes/{id}", async (Guid id, UpdateNoteRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest(new { error = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "Title must be under 200 characters" });

    var note = await db.Notes.FindAsync(id);
    if (note == null)
        return Results.NotFound();

    note.Title = request.Title.Trim();
    note.Content = request.Content?.Trim() ?? string.Empty;

    await db.SaveChangesAsync();
    return Results.Ok(note);
});

app.MapDelete("/notes/{id}", async (Guid id, NotesDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note == null)
        return Results.NotFound();

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();
