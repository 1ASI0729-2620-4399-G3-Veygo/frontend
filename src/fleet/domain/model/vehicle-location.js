import {StringValidator} from '@/shared/domain/model/string-validator.js';

/**
 * Value object representing the Pickup Location of a vehicle.
 *
 * @remarks
 * Holds the address and geographic coordinates used by the map (external service)
 * to show vehicles near the renter. It is immutable.
 */
export class VehicleLocation {
    /**
     * Creates a new VehicleLocation.
     *
     * @param {Object} props - The location properties.
     * @param {string} props.address - Street address or reference.
     * @param {string} props.district - District (e.g. "San Isidro").
     * @param {string} [props.city='Lima'] - City.
     * @param {number} [props.latitude] - Latitude in decimal degrees.
     * @param {number} [props.longitude] - Longitude in decimal degrees.
     * @throws {Error} If the district is empty or coordinates are out of range.
     */
    constructor({address = '', district = '', city = 'Lima', latitude = null, longitude = null}) {
        if (!StringValidator.isNotEmptyString(district)) throw new Error('Vehicle location district must be a non-empty string');
        const hasCoordinates = latitude !== null && longitude !== null && latitude !== '' && longitude !== '';
        if (hasCoordinates && (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
            throw new Error('Vehicle location coordinates are out of range');
        }
        this.address = address;
        this.district = district;
        this.city = city;
        this.latitude = hasCoordinates ? Number(latitude) : null;
        this.longitude = hasCoordinates ? Number(longitude) : null;
        Object.freeze(this);
    }

    /** @returns {boolean} True when the location can be drawn on a map. */
    hasCoordinates() {
        return this.latitude !== null && this.longitude !== null;
    }

    /** @returns {string} Short label, e.g. "San Isidro, Lima". */
    get shortLabel() {
        return `${this.district}, ${this.city}`;
    }
}
