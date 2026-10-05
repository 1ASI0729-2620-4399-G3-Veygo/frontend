import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const bookingsEndpointPath = import.meta.env.VITE_BOOKINGS_ENDPOINT_PATH;

/**
 * RESTful API client for the Booking bounded context.
 */
export class BookingApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #bookingsEndpoint;

    constructor() {
        super();
        this.#bookingsEndpoint = new BaseEndpoint(this, bookingsEndpointPath);
    }

    /**
     * Retrieves the bookings requested by a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getBookingsByRenterId(renterId) {
        return this.#bookingsEndpoint.getAll({renterId, _sort: 'startDate', _order: 'desc'});
    }

    /**
     * Retrieves the bookings received by an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getBookingsByOwnerId(ownerId) {
        return this.#bookingsEndpoint.getAll({ownerId, _sort: 'startDate', _order: 'desc'});
    }

    /**
     * Retrieves the bookings of a vehicle (used to check availability).
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getBookingsByVehicleId(vehicleId) {
        return this.#bookingsEndpoint.getAll({vehicleId});
    }

    /**
     * Creates a booking request.
     *
     * @param {import('./booking-resources.js').BookingResource} resource - The booking resource.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createBooking(resource) {
        return this.#bookingsEndpoint.create(resource);
    }

    /**
     * Changes the status of a booking.
     *
     * @param {number} id - The booking identifier.
     * @param {import('./booking-resources.js').UpdateBookingStatusRequest} request - The new status.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    updateBookingStatus(id, request) {
        return this.#bookingsEndpoint.patch(id, request);
    }
}
