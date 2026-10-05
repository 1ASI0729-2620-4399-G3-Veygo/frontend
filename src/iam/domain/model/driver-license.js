import {StringValidator} from '@/shared/domain/model/string-validator.js';

/**
 * Value object representing the Driver's License of a Renter.
 *
 * @remarks
 * A renter can only book vehicles while the license is verified and not expired. It is immutable.
 */
export class DriverLicense {
    /**
     * Creates a new DriverLicense.
     *
     * @param {Object} props - The license properties.
     * @param {string} props.number - License number.
     * @param {string} [props.category='A-I'] - License category (e.g. "A-I").
     * @param {string} [props.issuedAt] - Issue date "YYYY-MM-DD".
     * @param {string} [props.expiresAt] - Expiration date "YYYY-MM-DD".
     * @param {boolean} [props.verified=false] - Whether Veygo verified the license.
     * @throws {Error} If the number is empty.
     */
    constructor({number = '', category = 'A-I', issuedAt = '', expiresAt = '', verified = false}) {
        if (!StringValidator.isNotEmptyString(number)) throw new Error("Driver's license number must be a non-empty string");
        this.number = number;
        this.category = category;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
        this.verified = Boolean(verified);
        Object.freeze(this);
    }

    /** @returns {boolean} True when the license has an expiration date in the past. */
    isExpired() {
        return Boolean(this.expiresAt) && new Date(`${this.expiresAt}T23:59:59`) < new Date();
    }

    /** @returns {boolean} True when the renter may book vehicles with this license. */
    isValidForRenting() {
        return this.verified && !this.isExpired();
    }
}
