using DoRentMe.Api.Contracts.Contact;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;
using DoRentMe.Api.Common.Responses;

namespace DoRentMe.Api.Controllers;

[Route("api/contact")]
public class ContactController : ApiControllerBase
{
    private readonly ContactService _contactService;

    public ContactController(ContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<CreateContactResponse>),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        CreateContactRequest request,
        CancellationToken cancellationToken)
    {
        var contact = await _contactService.CreateAsync(
            request,
            cancellationToken);

        var response = new CreateContactResponse
        {
            Id = contact.Id,
            Message = "Contact message submitted successfully."
        };

        return CreatedSuccess(response);
    }
}