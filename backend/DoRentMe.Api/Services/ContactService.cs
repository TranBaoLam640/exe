using DoRentMe.Api.Contracts.Contact;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services;

public class ContactService
{
    private readonly DoRentMeDbContext _dbContext;

    public ContactService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ContactMessage> CreateAsync(
        CreateContactRequest request,
        CancellationToken cancellationToken = default)
    {
        var contactMessage = new ContactMessage
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Message = request.Message
        };

        _dbContext.ContactMessages.Add(contactMessage);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return contactMessage;
    }
}