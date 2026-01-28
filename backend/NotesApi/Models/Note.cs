public class Note
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
