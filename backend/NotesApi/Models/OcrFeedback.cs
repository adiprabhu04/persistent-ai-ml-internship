public class OcrFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string ExtractedText { get; set; } = string.Empty;
    public string Engine { get; set; } = string.Empty;
    public float? Confidence { get; set; }
    public bool IsAccurate { get; set; }
    public string? CorrectedText { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
