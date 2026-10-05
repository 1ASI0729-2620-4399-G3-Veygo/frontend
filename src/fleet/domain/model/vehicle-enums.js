/**
 * Vehicle categories used to explore the catalog by purpose.
 *
 * @readonly
 * @enum {string}
 */
export const VehicleCategory = Object.freeze({
    CAR: 'car',
    SUV: 'suv',
    PICKUP: 'pickup',
    ELECTRIC: 'electric',
    ECONOMY: 'economy',
    LUXURY: 'luxury'
});

/**
 * Transmission types.
 *
 * @readonly
 * @enum {string}
 */
export const TransmissionType = Object.freeze({
    MANUAL: 'manual',
    AUTOMATIC: 'automatic'
});

/**
 * Fuel (energy) types.
 *
 * @readonly
 * @enum {string}
 */
export const FuelType = Object.freeze({
    GASOLINE: 'gasoline',
    DIESEL: 'diesel',
    HYBRID: 'hybrid',
    ELECTRIC: 'electric'
});

/**
 * Body types.
 *
 * @readonly
 * @enum {string}
 */
export const BodyType = Object.freeze({
    SEDAN: 'sedan',
    HATCHBACK: 'hatchback',
    SUV: 'suv',
    PICKUP: 'pickup',
    VAN: 'van'
});

/**
 * Optional equipment a vehicle can offer.
 *
 * @readonly
 * @enum {string}
 */
export const VehicleFeature = Object.freeze({
    AIR_CONDITIONING: 'air-conditioning',
    BLUETOOTH: 'bluetooth',
    USB: 'usb',
    APPLE_CARPLAY: 'apple-carplay',
    ANDROID_AUTO: 'android-auto',
    REAR_CAMERA: 'rear-camera',
    GPS: 'gps',
    SUNROOF: 'sunroof',
    CHILD_SEAT: 'child-seat',
    CRUISE_CONTROL: 'cruise-control',
    PARKING_SENSOR: 'parking-sensor'
});
