import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const blockedDatesEndpointPath = import.meta.env.VITE_BLOCKED_DATES_ENDPOINT_PATH;

/**
 * RESTful API client for the Fleet (Vehicle Listing) bounded context.
 */
export class FleetApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #vehiclesEndpoint;
    /** @type {BaseEndpoint} */
    #blockedDatesEndpoint;

    constructor() {
        super();
        this.#vehiclesEndpoint = new BaseEndpoint(this, vehiclesEndpointPath);
        this.#blockedDatesEndpoint = new BaseEndpoint(this, blockedDatesEndpointPath);
    }

    /**
     * Retrieves the vehicles visible to renters.
     *
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getPublishedVehicles() {
        return this.#vehiclesEndpoint.getAll({published: true});
    }

    /**
     * Retrieves the vehicles of an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getVehiclesByOwnerId(ownerId) {
        return this.#vehiclesEndpoint.getAll({ownerId});
    }

    /**
     * Retrieves a vehicle by identifier.
     *
     * @param {number} id - The vehicle identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getVehicleById(id) {
        return this.#vehiclesEndpoint.getById(id);
    }

    /**
     * Creates a vehicle.
     *
     * @param {import('./fleet-resources.js').VehicleResource} resource - The vehicle resource.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createVehicle(resource) {
        return this.#vehiclesEndpoint.create(resource);
    }

    /**
     * Updates a vehicle.
     *
     * @param {number} id - The vehicle identifier.
     * @param {import('./fleet-resources.js').VehicleResource} resource - The vehicle resource.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    updateVehicle(id, resource) {
        return this.#vehiclesEndpoint.update(id, resource);
    }

    /**
     * Partially updates a vehicle (e.g. its rating after a new review).
     *
     * @param {number} id - The vehicle identifier.
     * @param {Object} changes - The fields to change.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    patchVehicle(id, changes) {
        return this.#vehiclesEndpoint.patch(id, changes);
    }

    /**
     * Deletes a vehicle.
     *
     * @param {number} id - The vehicle identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    deleteVehicle(id) {
        return this.#vehiclesEndpoint.delete(id);
    }

    /**
     * Retrieves the days blocked by the owner for a vehicle.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getBlockedDatesByVehicleId(vehicleId) {
        return this.#blockedDatesEndpoint.getAll({vehicleId});
    }

    /**
     * Blocks a day for a vehicle.
     *
     * @param {import('./fleet-resources.js').BlockedDateResource} resource - The blocked day.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createBlockedDate(resource) {
        return this.#blockedDatesEndpoint.create(resource);
    }

    /**
     * Unblocks a day.
     *
     * @param {number} id - The blocked day identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    deleteBlockedDate(id) {
        return this.#blockedDatesEndpoint.delete(id);
    }
}
