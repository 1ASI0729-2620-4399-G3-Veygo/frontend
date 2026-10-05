/**
 * Enumeration of the roles a user can play in Veygo.
 *
 * @remarks
 * A Renter looks for and books vehicles; an Owner publishes vehicles and manages bookings.
 *
 * @readonly
 * @enum {string}
 */
export const UserRole = Object.freeze({
    RENTER: 'renter',
    OWNER: 'owner'
});

/**
 * Checks whether a value is a supported user role.
 *
 * @param {string} value - The value to check.
 * @returns {boolean}
 */
export const isValidUserRole = value => Object.values(UserRole).includes(value);
