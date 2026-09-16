using System.Linq.Expressions;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services;

public static class RentalAvailabilityRules
{
    public const string AvailableInventoryStatus = "AVAILABLE";
    public const string ReservedReservationStatus = "RESERVED";
    public const string ActiveReservationStatus = "ACTIVE";

    public static readonly string[] RentableInventoryStatuses = [AvailableInventoryStatus];
    public static readonly string[] BlockingReservationStatuses = [ReservedReservationStatus, ActiveReservationStatus];

    public static void ValidateRentalPeriod(DateOnly rentalStartDate, DateOnly rentalEndDate)
    {
        if (rentalStartDate == default || rentalEndDate == default || rentalStartDate >= rentalEndDate)
        {
            throw new ApiException(
                ErrorCodes.InvalidRentalPeriod,
                "RentalEndDate must be after RentalStartDate.",
                StatusCodes.Status400BadRequest);
        }
    }

    public static bool DateRangesOverlap(
        DateOnly startDate,
        DateOnly endDate,
        DateOnly requestedStartDate,
        DateOnly requestedEndDate)
    {
        return startDate < requestedEndDate && endDate > requestedStartDate;
    }

    public static IQueryable<RentalReservation> WhereBlocking(
        this IQueryable<RentalReservation> query)
    {
        return query.Where(reservation => BlockingReservationStatuses.Contains(reservation.Status));
    }

    public static IQueryable<RentalReservation> WhereOverlaps(
        this IQueryable<RentalReservation> query,
        DateOnly rentalStartDate,
        DateOnly rentalEndDate)
    {
        return query.Where(Overlaps(rentalStartDate, rentalEndDate));
    }

    public static Expression<Func<RentalReservation, bool>> Overlaps(
        DateOnly rentalStartDate,
        DateOnly rentalEndDate)
    {
        return reservation => reservation.StartDate < rentalEndDate
            && reservation.EndDate > rentalStartDate;
    }
}
