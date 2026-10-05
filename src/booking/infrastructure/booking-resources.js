/**
 * Booking data structure as returned by the Veygo API.
 *
 * @typedef {Object} BookingResource
 * @property {number} id - Unique identifier.
 * @property {number} vehicleId - Vehicle identifier.
 * @property {number} renterId - Renter identifier.
 * @property {number} ownerId - Owner identifier.
 * @property {string} startDate - Pickup date "YYYY-MM-DD".
 * @property {string} endDate - Return date "YYYY-MM-DD".
 * @property {number} pricePerDay - Daily rate in PEN.
 * @property {number} totalPrice - Total price in PEN.
 * @property {string} status - Booking status.
 * @property {string} paymentMethod - "card" or "yape".
 * @property {string} createdAt - ISO-8601 creation date.
 * @property {string|null} confirmedAt - ISO-8601 confirmation date.
 */

/**
 * Request to change the status of a booking.
 *
 * @typedef {Object} UpdateBookingStatusRequest
 * @property {string} status - The new status.
 * @property {string|null} [confirmedAt] - Confirmation date (when confirming).
 */

export {};
