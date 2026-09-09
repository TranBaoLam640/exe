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
}
