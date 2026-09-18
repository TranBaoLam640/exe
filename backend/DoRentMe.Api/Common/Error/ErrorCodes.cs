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

    // Payment specific
    public const string PaymentNotFound = "PAYMENT_NOT_FOUND";
    public const string PaymentAlreadyExists = "PAYMENT_ALREADY_EXISTS";
    public const string InvalidPaymentStatus = "INVALID_PAYMENT_STATUS";
    public const string InvalidPaymentTransition = "INVALID_PAYMENT_TRANSITION";
    public const string PaymentNotEligible = "PAYMENT_NOT_ELIGIBLE";
    public const string ActivePaymentTransactionExists = "ACTIVE_PAYMENT_TRANSACTION_EXISTS";
    public const string PaymentTransactionNotFound = "PAYMENT_TRANSACTION_NOT_FOUND";
    public const string PayOsConfigurationMissing = "PAYOS_CONFIGURATION_MISSING";
    public const string PayOsCreatePaymentFailed = "PAYOS_CREATE_PAYMENT_FAILED";
    public const string PayOsInvalidWebhook = "PAYOS_INVALID_WEBHOOK";
    public const string PaymentAmountMismatch = "PAYMENT_AMOUNT_MISMATCH";

    // Refund specific
    public const string RefundNotFound = "REFUND_NOT_FOUND";
    public const string RefundAlreadyExists = "REFUND_ALREADY_EXISTS";
    public const string InvalidRefundStatus = "INVALID_REFUND_STATUS";
    public const string InvalidRefundTransition = "INVALID_REFUND_TRANSITION";
    public const string OrderNotEligibleForDepositSettlement = "ORDER_NOT_ELIGIBLE_FOR_DEPOSIT_SETTLEMENT";
    public const string InvalidRefundAmount = "INVALID_REFUND_AMOUNT";
    public const string DepositSettlementAlreadyExists = "DEPOSIT_SETTLEMENT_ALREADY_EXISTS";
    public const string PaymentNotPaid = "PAYMENT_NOT_PAID";

    // Return inspection specific
    public const string InspectionNotFound = "INSPECTION_NOT_FOUND";
    public const string InspectionAlreadyExists = "INSPECTION_ALREADY_EXISTS";
    public const string OrderNotReadyForInspection = "ORDER_NOT_READY_FOR_INSPECTION";
    public const string InventoryItemNotPartOfOrder = "INVENTORY_ITEM_NOT_PART_OF_ORDER";
    public const string InvalidInspectionCondition = "INVALID_INSPECTION_CONDITION";
    public const string InvalidDamageAssessment = "INVALID_DAMAGE_ASSESSMENT";
    public const string InvalidDamageDeduction = "INVALID_DAMAGE_DEDUCTION";
    public const string InspectionRequiredBeforeSettlement = "INSPECTION_REQUIRED_BEFORE_SETTLEMENT";
    public const string InspectionLockedAfterSettlement = "INSPECTION_LOCKED_AFTER_SETTLEMENT";

    // Inventory specific
    public const string InventoryItemNotFound = "INVENTORY_ITEM_NOT_FOUND";
    public const string DuplicateAssetCode = "DUPLICATE_ASSET_CODE";
    public const string InvalidInventoryStatus = "INVALID_INVENTORY_STATUS";
    public const string InvalidInventoryCondition = "INVALID_INVENTORY_CONDITION";
    public const string ProductVariantMismatch = "PRODUCT_VARIANT_MISMATCH";
    public const string InventoryHasRentalHistory = "INVENTORY_HAS_RENTAL_HISTORY";
}
