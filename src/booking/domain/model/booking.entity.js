import {DateRange} from '@/shared/domain/model/date-range.js';
import {DateTime} from '@/shared/domain/model/date-time.js';
import {Money} from '@/shared/domain/model/money.js';
import {BookingStatus, PaymentMethod} from '@/booking/domain/model/booking-status.js';

/**
 * Properties for creating a Booking entity.
 *
 * @typedef {Object} BookingProps
 * @property {number} [id] - Unique identifier (absent for new bookings).
 * @property {number} vehicleId - Booked vehicle.
 * @property {number} renterId - Renter that requested the booking.
 * @property {number} ownerId - Owner of the vehicle.
 * @property {DateRange} [period] - Rental period (or startDate / endDate).
 * @property {string} [startDate] - Pickup date "YYYY-MM-DD".
 * @property {string} [endDate] - Return date "YYYY-MM-DD".
 * @property {number|Money} pricePerDay - Daily rate agreed at booking time.
 * @property {number|Money} [totalPrice] - Total price (calculated when absent).
 * @property {string} [status] - One of {@link BookingStatus}.
 * @property {string} [paymentMethod] - One of {@link PaymentMethod}.
 * @property {string|Date|DateTime} [createdAt] - Creation date.
 * @property {string|Date|DateTime|null} [confirmedAt] - When the owner confirmed it (payment captured).
 */

/**
 * Domain entity (aggregate root of the Booking bounded context) representing a Booking:
 * the request of a Renter to use a Vehicle during a Rental Period.
 */
export class Booking {
    /**
     * Creates a new Booking.
     *
     * @param {BookingProps} props - The booking properties.
     * @throws {Error} If a business rule is violated.
     */
    constructor({
                    id = null, vehicleId, renterId, ownerId, period = null, startDate = '', endDate = '',
                    pricePerDay = 0, totalPrice = null, status = BookingStatus.PENDING,
                    paymentMethod = PaymentMethod.CARD, createdAt = new Date(), confirmedAt = null
                }) {
        if (!vehicleId) throw new Error('Booking must reference a vehicle');
        if (!renterId) throw new Error('Booking must reference a renter');
        if (!ownerId) throw new Error('Booking must reference an owner');
        if (renterId === ownerId) throw new Error('Owners cannot book their own vehicles');
        if (!Object.values(BookingStatus).includes(status)) throw new Error(`Unsupported booking status: ${status}`);
        if (!Object.values(PaymentMethod).includes(paymentMethod)) throw new Error(`Unsupported payment method: ${paymentMethod}`);

        this.id = id;
        this.vehicleId = vehicleId;
        this.renterId = renterId;
        this.ownerId = ownerId;
        this.period = period instanceof DateRange ? period : new DateRange(startDate, endDate);
        this.pricePerDay = pricePerDay instanceof Money ? pricePerDay : new Money(pricePerDay);
        this.totalPrice = totalPrice === null
            ? this.pricePerDay.multiply(this.period.days)
            : (totalPrice instanceof Money ? totalPrice : new Money(totalPrice));
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
        this.confirmedAt = confirmedAt ? (confirmedAt instanceof DateTime ? confirmedAt : new DateTime(confirmedAt)) : null;
    }

    /** @returns {boolean} True while waiting for the owner's answer. */
    isPending() {
        return this.status === BookingStatus.PENDING;
    }

    /** @returns {boolean} True when the booking blocks the vehicle's availability. */
    isActive() {
        return this.status === BookingStatus.PENDING || this.status === BookingStatus.CONFIRMED;
    }

    /** @returns {boolean} True when the booking is confirmed and the period is running today. */
    isInProgress() {
        return this.status === BookingStatus.CONFIRMED && !this.period.isUpcoming() && !this.period.isPast();
    }

    /** @returns {boolean} True when the renter or owner may still cancel it. */
    canBeCancelled() {
        return this.isActive() && this.period.isUpcoming();
    }

    /**
     * Checks whether this booking blocks the given period.
     *
     * @param {DateRange} period - The requested period.
     * @returns {boolean}
     */
    conflictsWith(period) {
        return this.isActive() && this.period.overlaps(period);
    }

    /** @returns {boolean} True when the booking was completed or its confirmed period already ended. */
    isFinished() {
        return this.status === BookingStatus.COMPLETED || (this.status === BookingStatus.CONFIRMED && this.period.isPast());
    }

    /** @returns {boolean} True when the booking was paid (confirmed at some point) and later cancelled. */
    wasRefunded() {
        return this.status === BookingStatus.CANCELLED && this.confirmedAt !== null;
    }

    /**
     * Status to show to users, distinguishing confirmed bookings in progress or already finished.
     *
     * @returns {string} A {@link BookingStatus} value or "in-progress".
     */
    get displayStatus() {
        if (this.isInProgress()) return 'in-progress';
        if (this.isFinished()) return BookingStatus.COMPLETED;
        return this.status;
    }

    /**
     * Owner accepts the booking request.
     *
     * @throws {Error} If the booking is not pending.
     */
    confirm() {
        if (!this.isPending()) throw new Error('Only pending bookings can be confirmed');
        this.status = BookingStatus.CONFIRMED;
        this.confirmedAt = DateTime.now();
    }

    /**
     * Owner rejects the booking request.
     *
     * @throws {Error} If the booking is not pending.
     */
    reject() {
        if (!this.isPending()) throw new Error('Only pending bookings can be rejected');
        this.status = BookingStatus.REJECTED;
    }

    /**
     * Renter or owner cancels the booking before it starts.
     *
     * @throws {Error} If the booking cannot be cancelled.
     */
    cancel() {
        if (!this.canBeCancelled()) throw new Error('Only upcoming pending or confirmed bookings can be cancelled');
        this.status = BookingStatus.CANCELLED;
    }

    /**
     * Factory method that creates a booking request for a vehicle.
     *
     * @param {Object} params - The request data.
     * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} params.vehicle - The vehicle to book.
     * @param {number} params.renterId - The renter identifier.
     * @param {DateRange} params.period - The rental period.
     * @param {string} params.paymentMethod - The payment method.
     * @returns {Booking} A new pending booking.
     * @throws {Error} If the period starts in the past.
     */
    static request({vehicle, renterId, period, paymentMethod}) {
        if (!period.isUpcoming()) throw new Error('Rental period must start today or later');
        return new Booking({
            vehicleId: vehicle.id,
            renterId,
            ownerId: vehicle.ownerId,
            period,
            pricePerDay: vehicle.pricePerDay,
            paymentMethod,
            status: BookingStatus.PENDING
        });
    }
}