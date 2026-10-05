/**
 * Location data structure as returned by the Veygo API.
 *
 * @typedef {Object} VehicleLocationResource
 * @property {string} address - Street address.
 * @property {string} district - District.
 * @property {string} city - City.
 * @property {number} latitude - Latitude.
 * @property {number} longitude - Longitude.
 */

/**
 * Vehicle data structure as returned by the Veygo API.
 *
 * @typedef {Object} VehicleResource
 * @property {number} id - Unique identifier.
 * @property {number} ownerId - Owner identifier.
 * @property {string} brand - Brand.
 * @property {string} model - Model.
 * @property {number} year - Year.
 * @property {string} category - Category.
 * @property {string} bodyType - Body type.
 * @property {string} transmission - Transmission.
 * @property {string} fuelType - Fuel type.
 * @property {number} seats - Seats.
 * @property {number} doors - Doors.
 * @property {number} pricePerDay - Daily price in PEN.
 * @property {number} pricePerWeek - Weekly price in PEN.
 * @property {number} pricePerMonth - Monthly price in PEN.
 * @property {number} securityDeposit - Deposit in PEN.
 * @property {string} description - Description.
 * @property {string[]} features - Equipment identifiers.
 * @property {string[]} photos - Photo URLs.
 * @property {VehicleLocationResource} location - Pickup location.
 * @property {boolean} published - Publication status.
 * @property {number} rating - Average rating.
 * @property {number} reviewsCount - Number of reviews.
 * @property {string} plate - License plate.
 * @property {string} color - Color.
 * @property {number} mileage - Mileage (km).
 * @property {string} lastMaintenanceAt - Last maintenance date.
 * @property {{provider: string, validUntil: string}|null} insurance - Insurance policy.
 * @property {string} technicalInspectionUntil - Technical inspection expiration.
 */

/**
 * Day blocked by the owner, as returned by the Veygo API.
 *
 * @typedef {Object} BlockedDateResource
 * @property {number} id - Unique identifier.
 * @property {number} vehicleId - Vehicle identifier.
 * @property {string} date - Day "YYYY-MM-DD".
 */

export {};
