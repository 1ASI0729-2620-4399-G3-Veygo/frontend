import {DateTime} from '@/shared/domain/model/date-time.js';

/** Maximum length of a review comment. */
export const MAX_COMMENT_LENGTH = 500;

/**
 * Domain entity representing the Review a Renter writes after completing a rental.
 */
export class Review {
    /**
     * Creates a new Review.
     *
     * @param {Object} props - The review properties.
     * @param {number} [props.id] - Unique identifier.
     * @param {number} props.bookingId - The completed booking.
     * @param {number} props.vehicleId - The rented vehicle.
     * @param {number} props.ownerId - The owner of the vehicle.
     * @param {number} props.renterId - The author.
     * @param {number} props.rating - Stars from 1 to 5.
     * @param {string} [props.comment] - Free text.
     * @param {string|Date|DateTime} [props.createdAt] - Publication date.
     * @throws {Error} If the rating is out of range or the comment is too long.
     */
    constructor({id = null, bookingId, vehicleId, ownerId, renterId, rating, comment = '', createdAt = new Date()}) {
        if (!bookingId || !vehicleId || !ownerId || !renterId) throw new Error('Review must reference a booking, vehicle, owner and renter');
        if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) throw new Error('Review rating must be an integer from 1 to 5');
        if (comment.length > MAX_COMMENT_LENGTH) throw new Error(`Review comment must have at most ${MAX_COMMENT_LENGTH} characters`);
        this.id = id;
        this.bookingId = bookingId;
        this.vehicleId = vehicleId;
        this.ownerId = ownerId;
        this.renterId = renterId;
        this.rating = Number(rating);
        this.comment = comment.trim();
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
    }

    /** @returns {boolean} True for 4 or 5 stars. */
    isPositive() {
        return this.rating >= 4;
    }

    /**
     * Factory method: a renter reviews one of their completed bookings.
     *
     * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
     * @param {number} rating - Stars.
     * @param {string} comment - Comment.
     * @returns {Review}
     * @throws {Error} If the booking is not finished.
     */
    static forBooking(booking, rating, comment) {
        if (!booking.isFinished()) throw new Error('Only completed rentals can be reviewed');
        return new Review({
            bookingId: booking.id, vehicleId: booking.vehicleId, ownerId: booking.ownerId,
            renterId: booking.renterId, rating, comment
        });
    }
}
