namespace DoRentMe.Api.Models;

public class ChatSession
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string SessionId { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? User { get; set; }
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
