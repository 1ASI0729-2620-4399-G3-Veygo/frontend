/**
 * Value object representing an instant (date and time) within the domain.
 *
 * @remarks
 * Ensures that date-time values are valid and provides consistent formatting
 * and comparison logic. It is immutable.
 */
export class DateTime {
    /** @type {Date} */
    #date;

    /**
     * Creates a new DateTime instance.
     *
     * @param {string|Date|number} value - The value to initialize the date with.
     * @throws {Error} If the provided value results in an invalid date.
     */
    constructor(value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error('Invalid date-time value');
        this.#date = date;
        Object.freeze(this);
    }

    /**
     * Formats the date-time for display.
     *
     * @param {string} [locale='en-US'] - The locale to use for formatting.
     * @param {Intl.DateTimeFormatOptions} [options] - Formatting options.
     * @returns {string} The formatted date-time.
     */
    format(locale = 'en-US', options = {day: '2-digit', month: 'short', year: 'numeric'}) {
        return this.#date.toLocaleDateString(locale, options);
    }

    /** @returns {Date} A copy of the underlying Date object. */
    toDate() {
        return new Date(this.#date.getTime());
    }

    /** @returns {string} The ISO-8601 representation. */
    toISOString() {
        return this.#date.toISOString();
    }

    /** @returns {number} The timestamp in milliseconds. */
    valueOf() {
        return this.#date.getTime();
    }

    /** @returns {DateTime} The current instant. */
    static now() {
        return new DateTime(new Date());
    }
}
