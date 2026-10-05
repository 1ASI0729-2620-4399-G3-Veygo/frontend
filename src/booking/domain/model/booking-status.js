/**
 * Lifecycle states of a Booking.
 *
 * @remarks
 * pending → confirmed → completed; pending → rejected; pending|confirmed → cancelled.
 *
 * @readonly
 * @enum {string}
 */
export const BookingStatus = Object.freeze({
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
});

/**
 * Payment methods accepted when requesting a booking.
 *
 * @readonly
 * @enum {string}
 */
export const PaymentMethod = Object.freeze({
    CARD: 'card',
    YAPE: 'yape'
});
