namespace DoRentMe.Api.Models;

public class NewsArticle
{
    public int Id { get; set; }
    public int? AuthorId { get; set; }
    public string Title { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? Author { get; set; }
}
