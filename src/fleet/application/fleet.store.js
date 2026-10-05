import {reactive} from 'vue';
import {FleetApi} from '@/fleet/infrastructure/fleet-api.js';
import {VehicleAssembler} from '@/fleet/infrastructure/vehicle.assembler.js';
import {VehicleSearchCriteria} from '@/fleet/domain/model/vehicle-search-criteria.js';

const fleetApi = new FleetApi();

/**
 * Application service (store) for the Fleet bounded context.
 *
 * @remarks
 * Loads the public catalog for renters, the fleet of the signed-in owner and
 * orchestrates the publication and edition of vehicles.
 */
export const fleetStore = reactive({
    /** @type {import('@/fleet/domain/model/vehicle.entity.js').Vehicle[]} Published catalog. */
    vehicles: [],
    /** @type {import('@/fleet/domain/model/vehicle.entity.js').Vehicle[]} Vehicles of the signed-in owner. */
    ownerVehicles: [],
    /** @type {VehicleSearchCriteria} */
    criteria: VehicleSearchCriteria.empty(),
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /** @returns {import('@/fleet/domain/model/vehicle.entity.js').Vehicle[]} Vehicles that satisfy the current criteria. */
    get filteredVehicles() {
        return this.vehicles.filter(vehicle => this.criteria.isSatisfiedBy(vehicle));
    },

    /**
     * Replaces the search criteria.
     *
     * @param {Object} props - Criteria properties.
     */
    setCriteria(props) {
        this.criteria = new VehicleSearchCriteria({...this.criteria, ...props});
    },

    /** Resets the search criteria. */
    clearCriteria() {
        this.criteria = VehicleSearchCriteria.empty();
    },

    /**
     * Loads the published catalog.
     *
     * @returns {Promise<void>}
     */
    loadPublishedVehicles() {
        this.errors = [];
        this.loading = true;
        return fleetApi.getPublishedVehicles()
            .then(response => {
                this.vehicles = VehicleAssembler.toEntitiesFromResponse(response);
            })
            .catch(message => {
                this.errors.push(message);
                this.vehicles = [];
            })
            .finally(() => {
                this.loading = false;
            });
    },

    /**
     * Loads the vehicles of an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<void>}
     */
    loadOwnerVehicles(ownerId) {
        this.errors = [];
        this.loading = true;
        return fleetApi.getVehiclesByOwnerId(ownerId)
            .then(response => {
                this.ownerVehicles = VehicleAssembler.toEntitiesFromResponse(response);
            })
            .catch(message => {
                this.errors.push(message);
                this.ownerVehicles = [];
            })
            .finally(() => {
                this.loading = false;
            });
    },

    /**
     * Retrieves the published vehicles of an owner (public profile), without changing the store state.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<import('@/fleet/domain/model/vehicle.entity.js').Vehicle[]>}
     */
    fetchPublishedVehiclesByOwner(ownerId) {
        return fleetApi.getVehiclesByOwnerId(ownerId)
            .then(response => VehicleAssembler.toEntitiesFromResponse(response).filter(vehicle => vehicle.published))
            .catch(message => {
                this.errors.push(message);
                return [];
            });
    },

    /**
     * Retrieves one vehicle, using the loaded lists as cache.
     *
     * @param {number} id - The vehicle identifier.
     * @returns {Promise<import('@/fleet/domain/model/vehicle.entity.js').Vehicle|null>}
     */
    fetchVehicleById(id) {
        const cached = [...this.vehicles, ...this.ownerVehicles].find(vehicle => vehicle.id === id);
        if (cached) return Promise.resolve(cached);
        return fleetApi.getVehicleById(id)
            .then(response => VehicleAssembler.toEntityFromResource(response.data))
            .catch(message => {
                this.errors.push(message);
                return null;
            });
    },

    /**
     * Retrieves several vehicles by identifier.
     *
     * @param {number[]} ids - The vehicle identifiers.
     * @returns {Promise<Map<number, import('@/fleet/domain/model/vehicle.entity.js').Vehicle>>}
     */
    fetchVehiclesByIds(ids) {
        const uniqueIds = [...new Set(ids)];
        return Promise.all(uniqueIds.map(id => this.fetchVehicleById(id)))
            .then(vehicles => new Map(vehicles.filter(Boolean).map(vehicle => [vehicle.id, vehicle])));
    },

    /**
     * Creates or updates a vehicle of the signed-in owner.
     *
     * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle to save.
     * @returns {Promise<import('@/fleet/domain/model/vehicle.entity.js').Vehicle>} The saved vehicle.
     */
    saveVehicle(vehicle) {
        const resource = VehicleAssembler.toResourceFromEntity(vehicle);
        const request = vehicle.id === null ? fleetApi.createVehicle(resource) : fleetApi.updateVehicle(vehicle.id, resource);
        return request
            .then(response => {
                const saved = VehicleAssembler.toEntityFromResource(response.data);
                const index = this.ownerVehicles.findIndex(item => item.id === saved.id);
                if (index >= 0) this.ownerVehicles.splice(index, 1, saved);
                else this.ownerVehicles.unshift(saved);
                return saved;
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Publishes or unpublishes a vehicle.
     *
     * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
     * @returns {Promise<import('@/fleet/domain/model/vehicle.entity.js').Vehicle>}
     */
    togglePublication(vehicle) {
        vehicle.published ? vehicle.unpublish() : vehicle.publish();
        return this.saveVehicle(vehicle);
    },

    /**
     * Deletes a vehicle of the signed-in owner.
     *
     * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
     * @returns {Promise<void>}
     */
    deleteVehicle(vehicle) {
        return fleetApi.deleteVehicle(vehicle.id)
            .then(() => {
                this.ownerVehicles = this.ownerVehicles.filter(item => item.id !== vehicle.id);
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    }
});
