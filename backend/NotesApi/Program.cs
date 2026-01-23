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
        return Results.BadRequest("Title is required");

    var note = new Note
    {
        Id = Guid.NewGuid(),
        Title = request.Title,
        Content = request.Content,
        CreatedAt = DateTime.UtcNow
    };

    db.Notes.Add(note);
    await db.SaveChangesAsync();

    return Results.Created($"/notes/{note.Id}", note);
});

app.MapPut("/notes/{id:guid}", async (Guid id, UpdateNoteRequest request, NotesDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note is null)
        return Results.NotFound();

    note.Title = request.Title;
    note.Content = request.Content;

    await db.SaveChangesAsync();
    return Results.Ok(note);
});

app.MapDelete("/notes/{id:guid}", async (Guid id, NotesDbContext db) =>
{
    var note = await db.Notes.FindAsync(id);
    if (note is null)
        return Results.NotFound();

    db.Notes.Remove(note);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();
