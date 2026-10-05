/**
 * Search criteria used by renters to filter the vehicle catalog.
 *
 * @remarks
 * Implements the Specification pattern: {@link VehicleSearchCriteria#isSatisfiedBy}
 * encapsulates the business rules that decide whether a vehicle matches a search,
 * so the same rules can be reused by any view.
 */
export class VehicleSearchCriteria {
    /**
     * Creates new search criteria. Empty values mean "no filter".
     *
     * @param {Object} [props] - The criteria.
     * @param {string} [props.district] - Pickup district (or empty for all Lima).
     * @param {string} [props.text] - Free text over brand, model and district.
     * @param {string} [props.category] - Category (or empty for all).
     * @param {string[]} [props.transmissions] - Accepted transmissions.
     * @param {string[]} [props.fuelTypes] - Accepted fuel types.
     * @param {number[]} [props.priceRange] - [min, max] daily price.
     * @param {number} [props.minRating] - Minimum rating.
     */
    constructor({district = '', text = '', category = '', transmissions = [], fuelTypes = [], priceRange = [0, 1000], minRating = 0} = {}) {
        this.district = district;
        this.text = text;
        this.category = category;
        this.transmissions = transmissions;
        this.fuelTypes = fuelTypes;
        this.priceRange = priceRange;
        this.minRating = minRating;
    }

    /**
     * Checks whether a vehicle satisfies the criteria.
     *
     * @param {import('./vehicle.entity.js').Vehicle} vehicle - The vehicle to evaluate.
     * @returns {boolean}
     */
    isSatisfiedBy(vehicle) {
        const text = this.text.trim().toLowerCase();
        const matchesText = !text || [vehicle.brand, vehicle.model, vehicle.location.district]
            .some(value => value.toLowerCase().includes(text));
        const matchesDistrict = !this.district || vehicle.location.district === this.district;
        const matchesCategory = !this.category || vehicle.category === this.category
            || (this.category === 'electric' && vehicle.fuelType === 'electric');
        const matchesTransmission = this.transmissions.length === 0 || this.transmissions.includes(vehicle.transmission);
        const matchesFuel = this.fuelTypes.length === 0 || this.fuelTypes.includes(vehicle.fuelType);
        const [minPrice, maxPrice] = this.priceRange;
        const matchesPrice = vehicle.pricePerDay.amount >= minPrice && vehicle.pricePerDay.amount <= maxPrice;
        const matchesRating = this.minRating === 0 || vehicle.rating >= this.minRating;
        return matchesDistrict && matchesText && matchesCategory && matchesTransmission && matchesFuel && matchesPrice && matchesRating;
    }

    /** @returns {VehicleSearchCriteria} Criteria that match every vehicle. */
    static empty() {
        return new VehicleSearchCriteria();
    }
}
