namespace DoRentMe.Api.Common.Errors;

public static class ErrorCodes
{
    public const string ValidationError = "VALIDATION_ERROR";

    public const string BadRequest = "BAD_REQUEST";

    public const string NotFound = "NOT_FOUND";

    public const string Unauthorized = "UNAUTHORIZED";

    public const string Forbidden = "FORBIDDEN";

    public const string InternalServerError = "INTERNAL_SERVER_ERROR";

    // Auth specific
    public const string DuplicateEmail = "DUPLICATE_EMAIL";
    public const string InvalidRole = "INVALID_ROLE";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string AccountDisabled = "ACCOUNT_DISABLED";
    // Product specific
    public const string ShopNotFound = "SHOP_NOT_FOUND";
    public const string BrandNotFound = "BRAND_NOT_FOUND";
    public const string CategoryNotFound = "CATEGORY_NOT_FOUND";
    public const string ProductNotFound = "PRODUCT_NOT_FOUND";

    // Cart specific
    public const string CartItemNotFound = "CART_ITEM_NOT_FOUND";
    public const string ProductUnavailable = "PRODUCT_UNAVAILABLE";
    public const string VariantNotFound = "VARIANT_NOT_FOUND";
    public const string VariantUnavailable = "VARIANT_UNAVAILABLE";
    public const string InsufficientStock = "INSUFFICIENT_STOCK";
    public const string InvalidRentalPeriod = "INVALID_RENTAL_PERIOD";
    public const string VoucherNotFound = "VOUCHER_NOT_FOUND";
    public const string VoucherNotApplicable = "VOUCHER_NOT_APPLICABLE";

    // Order specific
    public const string EmptyCart = "EMPTY_CART";
    public const string OrderNotFound = "ORDER_NOT_FOUND";
    public const string OrderCannotBeCancelled = "ORDER_CANNOT_BE_CANCELLED";
    public const string InvalidOrderStatus = "INVALID_ORDER_STATUS";
    public const string InvalidOrderStatusTransition = "INVALID_ORDER_STATUS_TRANSITION";
    public const string RentalInventoryConflict = "RENTAL_INVENTORY_CONFLICT";
}
