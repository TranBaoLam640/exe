using DoRentMe.Api.Contracts.Cart;

namespace DoRentMe.Api.Services;

public interface ICartService
{
    Task<CartResponse> GetCurrentCartAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<CartResponse> AddItemAsync(
        int userId,
        CartItemRequest request,
        CancellationToken cancellationToken = default);

    Task<CartResponse> UpdateItemAsync(
        int userId,
        int itemId,
        CartItemUpdateRequest request,
        CancellationToken cancellationToken = default);

    Task<CartResponse> RemoveItemAsync(
        int userId,
        int itemId,
        CancellationToken cancellationToken = default);

    Task<CartResponse> ClearAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<CartResponse> PreviewDiscountAsync(
        int userId,
        DiscountPreviewRequest request,
        CancellationToken cancellationToken = default);
}
