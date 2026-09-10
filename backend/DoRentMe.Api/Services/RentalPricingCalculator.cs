using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services;

public static class RentalPricingCalculator
{
    public static int CalculateRentalDays(DateOnly rentalStartDate, DateOnly rentalEndDate)
    {
        return rentalEndDate.DayNumber - rentalStartDate.DayNumber;
    }

    public static decimal CalculateRentalPrice(Product product, int rentalDays)
    {
        if (rentalDays <= 1)
        {
            return product.Price1Day;
        }

        if (rentalDays <= 3)
        {
            return product.Price3Day;
        }

        return product.Price3Day + (product.ExtraDayPrice * (rentalDays - 3));
    }
}
