import {reactive} from 'vue';
import {FleetApi} from '@/fleet/infrastructure/fleet-api.js';
import {BookingApi} from '@/booking/infrastructure/booking-api.js';
import {BookingAssembler} from '@/booking/infrastructure/booking.assembler.js';
import {AvailabilityCalendar, toIsoDate} from '@/fleet/domain/model/availability-calendar.js';

const fleetApi = new FleetApi();
const bookingApi = new BookingApi();

/**
 * Application service (store) that manages the Availability of the owner's vehicles.
 *
 * @remarks
 * Combines the bookings of a vehicle (Booking context) with the days blocked by the owner
 * into an {@link AvailabilityCalendar}, and blocks or unblocks days.
 */
export const availabilityStore = reactive({
    /** @type {AvailabilityCalendar|null} */
    calendar: null,
    /** @type {Array<{id: number, vehicleId: number, date: string}>} */
    blockedDates: [],
    /** @type {import('@/booking/domain/model/booking.entity.js').Booking[]} Every booking of the vehicle (any status). */
    vehicleBookings: [],
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads bookings and blocked days of a vehicle.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {Promise<void>}
     */
    loadCalendar(vehicleId) {
        this.errors = [];
        this.loading = true;
        return Promise.all([bookingApi.getBookingsByVehicleId(vehicleId), fleetApi.getBlockedDatesByVehicleId(vehicleId)])
            .then(([bookingsResponse, blockedResponse]) => {
                this.blockedDates = blockedResponse.data;
                this.vehicleBookings = BookingAssembler.toEntitiesFromResponse(bookingsResponse);
                this.calendar = new AvailabilityCalendar({
                    vehicleId,
                    bookings: this.vehicleBookings,
                    blockedDates: this.blockedDates.map(item => item.date)
                });
            })
            .catch(message => this.errors.push(message))
            .finally(() => this.loading = false);
    },

    /**
     * Blocks the selected days that are free.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @param {Date[]} dates - The days to block.
     * @returns {Promise<number>} Number of days blocked.
     */
    blockDates(vehicleId, dates) {
        const candidates = dates.filter(date => this.calendar.canBlock(date) && !this.calendar.blockedDates.has(toIsoDate(date)));
        return Promise.all(candidates.map(date => fleetApi.createBlockedDate({vehicleId, date: toIsoDate(date)})))
            .then(() => this.loadCalendar(vehicleId))
            .then(() => candidates.length);
    },

    /**
     * Unblocks the selected days.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @param {Date[]} dates - The days to unblock.
     * @returns {Promise<number>} Number of days unblocked.
     */
    unblockDates(vehicleId, dates) {
        const isoDates = new Set(dates.map(toIsoDate));
        const toRemove = this.blockedDates.filter(item => isoDates.has(item.date));
        return Promise.all(toRemove.map(item => fleetApi.deleteBlockedDate(item.id)))
            .then(() => this.loadCalendar(vehicleId))
            .then(() => toRemove.length);
    }
});
