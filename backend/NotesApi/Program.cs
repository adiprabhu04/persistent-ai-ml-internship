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

app.MapGet("/notes", async (NotesDbContext db) =>
{
    var notes = await db.Notes
        .OrderByDescending(n => n.CreatedAt)
        .ToListAsync();

    return Results.Ok(notes);
});

app.MapGet("/notes/{id:guid}", async (Guid id, NotesDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    return note is null ? Results.NotFound() : Results.Ok(note);
});

app.MapPost("/notes", async (CreateNoteRequest request, NotesDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
        return Results.BadRequest(new { error = "ValidationError", message = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "ValidationError", message = "Title must be under 200 characters" });

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
        return Results.BadRequest(new { error = "ValidationError", message = "Title is required" });

    if (request.Title.Length > 200)
        return Results.BadRequest(new { error = "ValidationError", message = "Title must be under 200 characters" });

    var note = await db.Notes.FindAsync(id);
    if (note == null)
        return Results.NotFound(new { error = "NotFound", message = "Note not found" });

    note.Title = request.Title.Trim();
    note.Content = request.Content?.Trim() ?? string.Empty;

    await db.SaveChangesAsync();
    return Results.Ok(note);
});

app.MapDelete("/notes/{id}", async (Guid id, NotesDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note == null)
        return Results.NotFound(new { error = "NotFound", message = "Note not found" });

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
});


app.Run();
