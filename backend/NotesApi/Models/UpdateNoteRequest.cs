public class UpdateNoteRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string? ImageData { get; set; }
    public bool? IsPinned { get; set; }
    public string? Summary { get; set; }
}
