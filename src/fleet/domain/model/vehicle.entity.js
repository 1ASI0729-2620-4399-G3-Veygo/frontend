import {StringValidator} from '@/shared/domain/model/string-validator.js';
import {Url} from '@/shared/domain/model/url.js';
import {Money} from '@/shared/domain/model/money.js';
import {VehicleLocation} from '@/fleet/domain/model/vehicle-location.js';
import {FuelType, TransmissionType, VehicleCategory} from '@/fleet/domain/model/vehicle-enums.js';

const placeholderPhoto = new Url('/images/vehicles/placeholder.svg');
const minimumYear = 1990;

/**
 * Properties for creating a Vehicle entity.
 *
 * @typedef {Object} VehicleProps
 * @property {number} [id] - Unique identifier (absent for new vehicles).
 * @property {number} ownerId - Identifier of the Owner.
 * @property {string} brand - Brand, e.g. "Toyota".
 * @property {string} model - Model, e.g. "Corolla".
 * @property {number} year - Manufacturing year.
 * @property {string} category - One of {@link VehicleCategory}.
 * @property {string} bodyType - Body type.
 * @property {string} transmission - One of {@link TransmissionType}.
 * @property {string} fuelType - One of {@link FuelType}.
 * @property {number} seats - Passenger capacity.
 * @property {number} doors - Number of doors.
 * @property {number|Money} pricePerDay - Rental Rate per day.
 * @property {number|Money} [pricePerWeek] - Rental Rate per week.
 * @property {number|Money} [pricePerMonth] - Rental Rate per month.
 * @property {number|Money} [securityDeposit] - Security deposit.
 * @property {string} [description] - Free text description.
 * @property {string[]} [features] - Equipment identifiers.
 * @property {Array<string|Url>} [photos] - Photo URLs (first one is the main photo).
 * @property {Object|VehicleLocation} location - Pickup location.
 * @property {boolean} [published] - Whether the Vehicle Listing is visible to renters.
 * @property {number} [rating] - Average rating (0-5).
 * @property {number} [reviewsCount] - Number of reviews.
 * @property {string} [plate] - License plate.
 * @property {string} [color] - Color.
 * @property {number} [mileage] - Mileage in km.
 * @property {string} [lastMaintenanceAt] - Last maintenance date "YYYY-MM-DD".
 * @property {{provider: string, validUntil: string}} [insurance] - Insurance policy.
 * @property {string} [technicalInspectionUntil] - Technical inspection expiration "YYYY-MM-DD".
 */

/**
 * Domain entity (aggregate root of the Fleet bounded context) representing a Vehicle Listing.
 */
export class Vehicle {
    /**
     * Creates a new Vehicle.
     *
     * @param {VehicleProps} props - The vehicle properties.
     * @throws {Error} If a business rule is violated.
     */
    constructor({
                    id = null, ownerId, brand = '', model = '', year = new Date().getFullYear(),
                    category = VehicleCategory.CAR, bodyType = '', transmission = TransmissionType.MANUAL,
                    fuelType = FuelType.GASOLINE, seats = 5, doors = 4, pricePerDay = 0, pricePerWeek = 0,
                    pricePerMonth = 0, securityDeposit = 0, description = '', features = [], photos = [],
                    location, published = false, rating = 0, reviewsCount = 0, plate = '', color = '', mileage = 0,
                    lastMaintenanceAt = '', insurance = null, technicalInspectionUntil = ''
                }) {
        if (!ownerId) throw new Error('Vehicle must belong to an owner');
        if (!StringValidator.isNotEmptyString(brand)) throw new Error('Vehicle brand must be a non-empty string');
        if (!StringValidator.isNotEmptyString(model)) throw new Error('Vehicle model must be a non-empty string');
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(Number(year)) || year < minimumYear || year > currentYear + 1) {
            throw new Error(`Vehicle year must be between ${minimumYear} and ${currentYear + 1}`);
        }
        if (!Object.values(TransmissionType).includes(transmission)) throw new Error(`Unsupported transmission: ${transmission}`);
        if (!Object.values(FuelType).includes(fuelType)) throw new Error(`Unsupported fuel type: ${fuelType}`);
        if (!Object.values(VehicleCategory).includes(category)) throw new Error(`Unsupported category: ${category}`);
        if (Number(seats) < 1) throw new Error('Vehicle must have at least one seat');

        const dailyRate = pricePerDay instanceof Money ? pricePerDay : new Money(pricePerDay);
        if (dailyRate.amount <= 0) throw new Error('Vehicle price per day must be greater than zero');

        this.id = id;
        this.ownerId = ownerId;
        this.brand = brand.trim();
        this.model = model.trim();
        this.year = Number(year);
        this.category = category;
        this.bodyType = bodyType;
        this.transmission = transmission;
        this.fuelType = fuelType;
        this.seats = Number(seats);
        this.doors = Number(doors);
        this.pricePerDay = dailyRate;
        this.pricePerWeek = pricePerWeek instanceof Money ? pricePerWeek : new Money(pricePerWeek || 0);
        this.pricePerMonth = pricePerMonth instanceof Money ? pricePerMonth : new Money(pricePerMonth || 0);
        this.securityDeposit = securityDeposit instanceof Money ? securityDeposit : new Money(securityDeposit || 0);
        this.description = description;
        this.features = [...new Set(features)];
        this.photos = photos.map(photo => photo instanceof Url ? photo : new Url(photo)).filter(photo => !photo.isEmpty());
        this.location = location instanceof VehicleLocation ? location : new VehicleLocation(location || {});
        this.published = Boolean(published);
        this.rating = Number(rating) || 0;
        this.reviewsCount = Number(reviewsCount) || 0;
        this.plate = plate.trim().toUpperCase();
        this.color = color;
        this.mileage = Number(mileage) || 0;
        this.lastMaintenanceAt = lastMaintenanceAt;
        this.insurance = insurance?.provider ? Object.freeze({provider: insurance.provider, validUntil: insurance.validUntil ?? ''}) : null;
        this.technicalInspectionUntil = technicalInspectionUntil;
    }

    /** @returns {string} Display name, e.g. "Toyota Corolla 2023". */
    get displayName() {
        return `${this.brand} ${this.model} ${this.year}`;
    }

    /** @returns {Url} The main photo, or a placeholder when the vehicle has no photos. */
    get mainPhotoUrl() {
        return this.photos[0] ?? placeholderPhoto;
    }

    /** @returns {boolean} True when the vehicle has been rated at least once. */
    hasReviews() {
        return this.reviewsCount > 0;
    }

    /** @returns {boolean} True when the insurance policy is registered and not expired. */
    hasValidInsurance() {
        return Boolean(this.insurance?.validUntil) && new Date(`${this.insurance.validUntil}T23:59:59`) >= new Date();
    }

    /**
     * Makes the Vehicle Listing visible to renters.
     */
    publish() {
        this.published = true;
    }

    /**
     * Hides the Vehicle Listing from search results, keeping its history.
     */
    unpublish() {
        this.published = false;
    }

    /**
     * Estimates the rental price for a period using the daily Rental Rate.
     *
     * @param {import('@/shared/domain/model/date-range.js').DateRange} period - The rental period.
     * @returns {Money} The estimated price.
     */
    estimateRentalPrice(period) {
        return this.pricePerDay.multiply(period.days);
    }

    /**
     * Checks whether the vehicle belongs to a given owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {boolean}
     */
    isOwnedBy(ownerId) {
        return this.ownerId === ownerId;
    }
}
