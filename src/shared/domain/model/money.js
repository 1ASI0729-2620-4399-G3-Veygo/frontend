/**
 * Value object representing an amount of money in a given currency.
 *
 * @remarks
 * Amounts are stored in cents to avoid floating point errors. Veygo operates in
 * Peruvian soles (PEN) by default. It is immutable.
 */
export class Money {
    /** @type {number} */
    #cents;
    /** @type {string} */
    #currency;

    /**
     * Creates a new Money instance.
     *
     * @param {number} amount - The amount in currency units (e.g. 150.50).
     * @param {string} [currency='PEN'] - The ISO-4217 currency code.
     * @throws {Error} If the amount is not a finite, non-negative number.
     */
    constructor(amount = 0, currency = 'PEN') {
        const value = Number(amount);
        if (!Number.isFinite(value) || value < 0) throw new Error('Money amount must be a non-negative number');
        this.#cents = Math.round(value * 100);
        this.#currency = currency;
        Object.freeze(this);
    }

    /** @returns {number} The amount in currency units. */
    get amount() {
        return this.#cents / 100;
    }

    /** @returns {string} The currency code. */
    get currency() {
        return this.#currency;
    }

    /**
     * Multiplies the amount by a factor (e.g. rental days).
     *
     * @param {number} factor - The multiplier.
     * @returns {Money} A new Money instance.
     */
    multiply(factor) {
        return new Money((this.#cents * factor) / 100, this.#currency);
    }

    /**
     * Adds another amount of the same currency.
     *
     * @param {Money} other - The amount to add.
     * @returns {Money} A new Money instance.
     * @throws {Error} If currencies differ.
     */
    add(other) {
        if (other.currency !== this.#currency) throw new Error('Cannot add money with different currencies');
        return new Money((this.#cents + Math.round(other.amount * 100)) / 100, this.#currency);
    }

    /**
     * Formats the amount, e.g. "S/ 1,250".
     *
     * @param {string} [locale='en-US'] - The locale to use.
     * @returns {string}
     */
    format(locale = 'en-US') {
        const number = this.amount.toLocaleString(locale, {minimumFractionDigits: 0, maximumFractionDigits: 2});
        return this.#currency === 'PEN' ? `S/ ${number}` : `${this.#currency} ${number}`;
    }

    /** @returns {number} The primitive amount. */
    valueOf() {
        return this.amount;
    }

    /** @returns {Money} A zero amount in soles. */
    static zero() {
        return new Money(0);
    }
}
