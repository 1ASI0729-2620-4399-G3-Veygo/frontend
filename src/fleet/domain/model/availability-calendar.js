import {DateRange} from '@/shared/domain/model/date-range.js';

/**
 * Day states shown in the availability calendar.
 *
 * @readonly
 * @enum {string}
 */
export const DayStatus = Object.freeze({
    AVAILABLE: 'available',
    CONFIRMED: 'confirmed',
    PENDING: 'pending',
    BLOCKED: 'blocked'
});

/**
 * Formats a Date as "YYYY-MM-DD" using local time.
 *
 * @param {Date} date - The date.
 * @returns {string}
 */
export const toIsoDate = date => [
    date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')
].join('-');

/**
 * Domain model (read model of the Fleet context) with the Availability of one vehicle:
 * days taken by active bookings and days blocked by the owner.
 *
 * @remarks
 * A booking occupies the nights between pickup and return, so the return day is free
 * for a new pickup. Blocked days are full days the owner keeps for personal use.
 */
export class AvailabilityCalendar {
    /**
     * Creates a new AvailabilityCalendar.
     *
     * @param {Object} props - The calendar data.
     * @param {number} props.vehicleId - The vehicle.
     * @param {import('@/booking/domain/model/booking.entity.js').Booking[]} [props.bookings] - Bookings of the vehicle.
     * @param {string[]} [props.blockedDates] - Blocked days "YYYY-MM-DD".
     */
    constructor({vehicleId, bookings = [], blockedDates = []}) {
        this.vehicleId = vehicleId;
        this.bookings = bookings.filter(booking => booking.vehicleId === vehicleId && booking.isActive());
        this.blockedDates = new Set(blockedDates);
    }

    /**
     * Booking that occupies a given day, if any.
     *
     * @param {Date} date - The day.
     * @returns {import('@/booking/domain/model/booking.entity.js').Booking|undefined}
     */
    bookingOn(date) {
        const day = new DateRange(date, date);
        return this.bookings.find(booking => booking.period.start <= day.start && day.start < booking.period.end);
    }

    /**
     * State of a day.
     *
     * @param {Date} date - The day.
     * @returns {string} A {@link DayStatus} value.
     */
    statusOf(date) {
        const booking = this.bookingOn(date);
        if (booking) return booking.isPending() ? DayStatus.PENDING : DayStatus.CONFIRMED;
        if (this.blockedDates.has(toIsoDate(date))) return DayStatus.BLOCKED;
        return DayStatus.AVAILABLE;
    }

    /**
     * Checks whether a rental period is free: no active booking overlaps it and no night is blocked.
     *
     * @param {DateRange} period - The requested period.
     * @returns {boolean}
     */
    isRangeAvailable(period) {
        if (this.bookings.some(booking => booking.conflictsWith(period))) return false;
        const cursor = period.start;
        do {
            if (this.blockedDates.has(toIsoDate(cursor))) return false;
            cursor.setDate(cursor.getDate() + 1);
        } while (cursor < period.end);
        return true;
    }

    /**
     * Checks whether the owner may block a day (it must not be taken by a booking).
     *
     * @param {Date} date - The day.
     * @returns {boolean}
     */
    canBlock(date) {
        return !this.bookingOn(date);
    }
}
