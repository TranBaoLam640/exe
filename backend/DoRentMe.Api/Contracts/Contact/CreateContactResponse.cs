namespace DoRentMe.Api.Contracts.Contact;

public class CreateContactResponse
{
    public int Id { get; set; }

    public string Message { get; set; } = null!;
}