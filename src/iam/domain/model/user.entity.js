import {StringValidator} from '@/shared/domain/model/string-validator.js';
import {Url} from '@/shared/domain/model/url.js';
import {DateTime} from '@/shared/domain/model/date-time.js';
import {isValidUserRole, UserRole} from '@/iam/domain/model/user-role.js';
import {DriverLicense} from '@/iam/domain/model/driver-license.js';
import {UserPreferences} from '@/iam/domain/model/user-preferences.js';

/**
 * Properties for creating a User entity.
 *
 * @typedef {Object} UserProps
 * @property {number} id - Unique identifier.
 * @property {string} fullName - Full name of the user.
 * @property {string} email - Email used to sign in.
 * @property {string} role - One of {@link UserRole}.
 * @property {string} [phone] - Contact phone.
 * @property {string} [documentNumber] - National identity document (DNI).
 * @property {Object|DriverLicense|null} [driverLicense] - Driver's license (renters).
 * @property {string} [birthDate] - Birth date "YYYY-MM-DD".
 * @property {string} [address] - Address.
 * @property {string} [bio] - Short presentation shown in the public profile.
 * @property {string} [passwordUpdatedAt] - Last password change.
 * @property {Object|UserPreferences} [preferences] - Profile preferences.
 * @property {string} [district] - District of residence.
 * @property {string} [ownerType] - "individual" or "small-agency" (owners).
 * @property {string|Url} [photoUrl] - Profile photo.
 * @property {boolean} [identityVerified] - Whether the identity was verified.
 * @property {number} [rating] - Average reputation rating (0-5).
 * @property {number} [reviewsCount] - Number of reviews received.
 * @property {string|Date|DateTime} [createdAt] - Registration date.
 */

/**
 * Domain entity representing a Veygo user (Renter or Owner).
 */
export class User {
    /**
     * Creates a new User.
     *
     * @param {UserProps} props - The user properties.
     * @throws {Error} If the full name or email are empty, or the role is invalid.
     */
    constructor({
                    id, fullName = '', email = '', role = UserRole.RENTER, phone = '', documentNumber = '',
                    driverLicense = null, district = '', ownerType = '', photoUrl = '', identityVerified = false,
                    rating = 0, reviewsCount = 0, createdAt = new Date(), birthDate = '', address = '', bio = '',
                    passwordUpdatedAt = null, preferences = {}
                }) {
        if (!StringValidator.isNotEmptyString(fullName)) throw new Error('User full name must be a non-empty string');
        if (!StringValidator.isNotEmptyString(email)) throw new Error('User email must be a non-empty string');
        if (!isValidUserRole(role)) throw new Error(`Unsupported user role: ${role}`);

        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.documentNumber = documentNumber;
        this.driverLicense = driverLicense instanceof DriverLicense ? driverLicense
            : (driverLicense?.number ? new DriverLicense(driverLicense) : null);
        this.birthDate = birthDate;
        this.address = address;
        this.bio = bio;
        this.passwordUpdatedAt = passwordUpdatedAt ? new DateTime(passwordUpdatedAt) : null;
        this.preferences = preferences instanceof UserPreferences ? preferences : new UserPreferences(preferences ?? {});
        this.district = district;
        this.ownerType = ownerType;
        this.photoUrl = photoUrl instanceof Url ? photoUrl : new Url(photoUrl);
        this.identityVerified = Boolean(identityVerified);
        this.rating = Number(rating) || 0;
        this.reviewsCount = Number(reviewsCount) || 0;
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
    }

    /** @returns {boolean} True if the user publishes vehicles. */
    isOwner() {
        return this.role === UserRole.OWNER;
    }

    /** @returns {boolean} True if the user rents vehicles. */
    isRenter() {
        return this.role === UserRole.RENTER;
    }

    /**
     * Checks whether the user may interact (e.g. chat) with another user: only a Renter
     * and an Owner can talk to each other.
     *
     * @param {User} other - The other user.
     * @returns {boolean}
     */
    canContact(other) {
        return Boolean(other) && other.id !== this.id && other.role !== this.role;
    }

    /** @returns {string} The first name of the user. */
    get firstName() {
        return this.fullName.trim().split(' ')[0];
    }

    /** @returns {string} Up to two initials, e.g. "LR". */
    get initials() {
        return this.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0].toUpperCase()).join('');
    }
}
