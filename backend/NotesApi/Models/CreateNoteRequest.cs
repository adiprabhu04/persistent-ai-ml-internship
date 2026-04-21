public class CreateNoteRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string? ImageData { get; set; }
    public string? Summary { get; set; }
    public string? Color { get; set; }
}
