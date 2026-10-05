namespace DoRentMe.Api.Contracts.Order;

public class ReturnRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    public List<Guid> PhotoIds { get; set; } = new();
}
