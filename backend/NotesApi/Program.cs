var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

var notes = new List<Note>
{
    new Note
    {
        Id = Guid.NewGuid(),
        Title = "Welcome Note",
        Content = "This is your first note 🎉",
        CreatedAt = DateTime.UtcNow
    }
};

app.MapGet("/notes", () =>
{
    return Results.Ok(notes);
})
.WithName("GetNotes");

app.MapGet("/notes/{id:guid}", (Guid id) =>
{
    var note = notes.FirstOrDefault(n => n.Id == id);

    if (note is null)
        return Results.NotFound();

    return Results.Ok(note);
})
.WithName("GetNoteById");

app.MapPost("/notes", (CreateNoteRequest request) =>
{
    var note = new Note
    {
        Id = Guid.NewGuid(),
        Title = request.Title,
        Content = request.Content,
        CreatedAt = DateTime.UtcNow
    };

    notes.Add(note);

    return Results.Created($"/notes/{note.Id}", note);
})
.WithName("CreateNote");

app.MapPut("/notes/{id:guid}", (Guid id, UpdateNoteRequest request) =>
{
    var index = notes.FindIndex(n => n.Id == id);

    if (index == -1)
        return Results.NotFound();

    var updatedNote = notes[index] with
    {
        Title = request.Title,
        Content = request.Content
    };

    notes[index] = updatedNote;

    return Results.Ok(updatedNote);
})
.WithName("UpdateNote");

app.MapDelete("/notes/{id}", (Guid id) =>
{
    var note = notes.FirstOrDefault(n => n.Id == id);
    if (note is null)
    {
        return Results.NotFound();
    }

    notes.Remove(note);
    return Results.NoContent();
})
.WithName("DeleteNote");

app.Run();

record Note
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

record CreateNoteRequest
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
}

record UpdateNoteRequest
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
}
