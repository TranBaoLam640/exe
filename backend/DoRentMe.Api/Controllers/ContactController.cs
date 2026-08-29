using DoRentMe.Api.Contracts.Contact;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly ContactService _contactService;

    public ContactController(ContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateContactRequest request,
        CancellationToken cancellationToken)
    {
        var contact = await _contactService.CreateAsync(
            request,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new
        {
            contact.Id,
            Message = "Contact message submitted successfully."
        });
    }
}