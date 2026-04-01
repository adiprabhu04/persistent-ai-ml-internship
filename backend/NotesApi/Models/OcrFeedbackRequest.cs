public class OcrFeedbackRequest
{
    public string ExtractedText { get; set; } = string.Empty;
    public string? Engine { get; set; }
    public float? Confidence { get; set; }
    public bool IsAccurate { get; set; }
    public string? CorrectedText { get; set; }
}
