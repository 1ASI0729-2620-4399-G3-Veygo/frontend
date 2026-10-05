/**
 * User data structure as returned by the Veygo API.
 *
 * @typedef {Object} UserResource
 * @property {number} id - Unique identifier.
 * @property {string} fullName - Full name.
 * @property {string} email - Email.
 * @property {string} role - "renter" or "owner".
 * @property {string} [phone] - Contact phone.
 * @property {string} [documentNumber] - DNI.
 * @property {{number: string, category: string, issuedAt: string, expiresAt: string, verified: boolean}|null} [driverLicense] - Driver's license.
 * @property {string} [birthDate] - Birth date.
 * @property {string} [address] - Address.
 * @property {string} [bio] - Short presentation.
 * @property {string} [passwordUpdatedAt] - Last password change.
 * @property {{notifications: boolean, promotions: boolean, twoFactor: boolean, darkMode: boolean}} [preferences] - Preferences.
 * @property {string} [district] - District of residence.
 * @property {string} [ownerType] - "individual" or "small-agency".
 * @property {string} [photoUrl] - Profile photo URL.
 * @property {boolean} [identityVerified] - Identity verification flag.
 * @property {number} [rating] - Average rating.
 * @property {number} [reviewsCount] - Number of reviews.
 * @property {string} [createdAt] - ISO-8601 registration date.
 */

/**
 * Request to sign in.
 *
 * @typedef {Object} SignInRequest
 * @property {string} email - The user email.
 * @property {string} password - The user password.
 */

/**
 * Request to create a new account.
 *
 * @typedef {Object} SignUpRequest
 * @property {string} role - "renter" or "owner".
 * @property {string} fullName - Full name.
 * @property {string} email - Email.
 * @property {string} password - Password.
 * @property {string} documentNumber - DNI.
 * @property {string} [driverLicenseNumber] - Driver's license (renters).
 * @property {string} [phone] - Contact phone (owners).
 * @property {string} district - District of residence.
 * @property {string} [ownerType] - Owner type (owners).
 */

/**
 * Request to update the personal information of the signed-in user.
 *
 * @typedef {Object} UpdateProfileRequest
 * @property {string} fullName - Full name.
 * @property {string} email - Email.
 * @property {string} phone - Phone.
 * @property {string} birthDate - Birth date.
 * @property {string} address - Address.
 * @property {string} district - District.
 * @property {string} bio - Short presentation.
 */

/**
 * Request to change the password.
 *
 * @typedef {Object} ChangePasswordRequest
 * @property {string} currentPassword - Current password.
 * @property {string} newPassword - New password.
 */

export {};
