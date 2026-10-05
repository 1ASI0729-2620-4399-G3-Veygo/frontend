import {DateTime} from '@/shared/domain/model/date-time.js';

/**
 * Domain entity representing a vehicle saved by a Renter to review it later.
 */
export class Favorite {
    /**
     * Creates a new Favorite.
     *
     * @param {Object} props - The favorite properties.
     * @param {number} [props.id] - Unique identifier.
     * @param {number} props.renterId - The renter that saved the vehicle.
     * @param {number} props.vehicleId - The saved vehicle.
     * @param {string|Date|DateTime} [props.createdAt] - When it was saved.
     * @throws {Error} If the renter or the vehicle are missing.
     */
    constructor({id = null, renterId, vehicleId, createdAt = new Date()}) {
        if (!renterId) throw new Error('Favorite must reference a renter');
        if (!vehicleId) throw new Error('Favorite must reference a vehicle');
        this.id = id;
        this.renterId = renterId;
        this.vehicleId = vehicleId;
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
    }
}
