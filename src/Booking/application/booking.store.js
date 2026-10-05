import {reactive} from 'vue';
import {BookingApi} from '@/booking/infrastructure/booking-api.js';
import {BookingAssembler} from '@/booking/infrastructure/booking.assembler.js';
import {Booking} from '@/booking/domain/model/booking.entity.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';
import {FleetApi} from '@/fleet/infrastructure/fleet-api.js';
import {AvailabilityCalendar} from '@/fleet/domain/model/availability-calendar.js';

const bookingApi = new BookingApi();
const fleetApi = new FleetApi();

/**
 * Application service (store) for the Booking bounded context.
 *
 * @remarks
 * Orchestrates booking requests (checking availability to avoid overlaps) and the
 * owner's decisions (confirm / reject) as well as cancellations.
 */
export const bookingStore = reactive({
    /** @type {Booking[]} Bookings of the signed-in renter. */
    renterBookings: [],
    /** @type {Booking[]} Bookings received by the signed-in owner. */
    ownerBookings: [],
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Loads the bookings of a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @returns {Promise<void>}
     */
    loadRenterBookings(renterId) {
        this.errors = [];
        this.loading = true;
        return bookingApi.getBookingsByRenterId(renterId)
            .then(response => {
                this.renterBookings = BookingAssembler.toEntitiesFromResponse(response);
            })
            .catch(message => {
                this.errors.push(message);
                this.renterBookings = [];
            })
            .finally(() => {
                this.loading = false;
            });
    },

    /**
     * Loads the bookings received by an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<void>}
     */
    loadOwnerBookings(ownerId) {
        this.errors = [];
        this.loading = true;
        return bookingApi.getBookingsByOwnerId(ownerId)
            .then(response => {
                this.ownerBookings = BookingAssembler.toEntitiesFromResponse(response);
            })
            .catch(message => {
                this.errors.push(message);
                this.ownerBookings = [];
            })
            .finally(() => {
                this.loading = false;
            });
    },

    /**
     * Checks whether a vehicle is free during a period (no active booking overlaps it).
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @param {import('@/shared/domain/model/date-range.js').DateRange} period - The requested period.
     * @returns {Promise<boolean>}
     */
    isVehicleAvailable(vehicleId, period) {
        return Promise.all([bookingApi.getBookingsByVehicleId(vehicleId), fleetApi.getBlockedDatesByVehicleId(vehicleId)])
            .then(([bookingsResponse, blockedResponse]) => new AvailabilityCalendar({
                vehicleId,
                bookings: BookingAssembler.toEntitiesFromResponse(bookingsResponse),
                blockedDates: blockedResponse.data.map(item => item.date)
            }).isRangeAvailable(period));
    },

    /**
     * Creates a booking request after validating availability.
     *
     * @param {Object} params - The request data (see {@link Booking.request}).
     * @returns {Promise<Booking>} The created booking.
     */
    requestBooking(params) {
        this.errors = [];
        let booking;
        try {
            booking = Booking.request(params);
        } catch (error) {
            this.errors.push(error.message);
            return Promise.reject(error.message);
        }
        return this.isVehicleAvailable(booking.vehicleId, booking.period)
            .then(available => {
                if (!available) throw 'errors.vehicle-not-available';
                return bookingApi.createBooking(BookingAssembler.toResourceFromEntity(booking));
            })
            .then(response => {
                const created = BookingAssembler.toEntityFromResource(response.data);
                this.renterBookings.unshift(created);
                domainEventBus.publish(DomainEvents.BOOKING_REQUESTED, {booking: created, actorId: created.renterId});
                return created;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Owner confirms a pending booking.
     *
     * @param {Booking} booking - The booking.
     * @returns {Promise<Booking>}
     */
    confirmBooking(booking) {
        return this.changeStatus(booking, candidate => candidate.confirm(), DomainEvents.BOOKING_CONFIRMED, booking.ownerId);
    },

    /**
     * Owner rejects a pending booking.
     *
     * @param {Booking} booking - The booking.
     * @returns {Promise<Booking>}
     */
    rejectBooking(booking) {
        return this.changeStatus(booking, candidate => candidate.reject(), DomainEvents.BOOKING_REJECTED, booking.ownerId);
    },

    /**
     * Renter or owner cancels an upcoming booking.
     *
     * @param {Booking} booking - The booking.
     * @param {number} actorId - The user who cancels (renter or owner).
     * @returns {Promise<Booking>}
     */
    cancelBooking(booking, actorId) {
        return this.changeStatus(booking, candidate => candidate.cancel(), DomainEvents.BOOKING_CANCELLED, actorId);
    },

    /**
     * Applies a domain transition on a copy of the booking and persists the new status.
     *
     * @param {Booking} booking - The booking.
     * @param {(booking: Booking) => void} transition - The domain method to apply.
     * @param {string} eventType - The domain event to publish on success.
     * @param {number} actorId - The user who performs the change.
     * @returns {Promise<Booking>} The updated booking.
     */
    changeStatus(booking, transition, eventType, actorId) {
        const candidate = BookingAssembler.toEntityFromResource(BookingAssembler.toResourceFromEntity(booking));
        try {
            transition(candidate);
        } catch (error) {
            this.errors.push(error.message);
            return Promise.reject(error.message);
        }
        const request = {status: candidate.status, confirmedAt: candidate.confirmedAt ? candidate.confirmedAt.toISOString() : null};
        return bookingApi.updateBookingStatus(booking.id, request)
            .then(response => {
                const updated = BookingAssembler.toEntityFromResource(response.data);
                [this.renterBookings, this.ownerBookings].forEach(list => {
                    const index = list.findIndex(item => item.id === updated.id);
                    if (index >= 0) list.splice(index, 1, updated);
                });
                domainEventBus.publish(eventType, {booking: updated, actorId});
                return updated;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    }
});
