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

app.Run();

record Note
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
