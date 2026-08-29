namespace DoRentMe.Api.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int ChatSessionId { get; set; }
    public string Role { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatSession ChatSession { get; set; } = null!;
}
