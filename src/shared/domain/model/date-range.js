const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a calendar date ("YYYY-MM-DD" or Date) as a local date at midnight.
 *
 * @param {string|Date} value - The value to parse.
 * @returns {Date} The local date at 00:00.
 */
const toLocalDate = value => {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const [year, month, day] = String(value).substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Formats a Date as "YYYY-MM-DD" using local time.
 *
 * @param {Date} date - The date to format.
 * @returns {string} The ISO calendar date.
 */
const toIsoDate = date => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
].join('-');

/**
 * Value object representing a Rental Period: a closed range of calendar days.
 *
 * @remarks
 * A rental period starts on the pickup day and ends on the return day. Rental days are
 * counted as nights between both dates (minimum one day). It is immutable and
 * encapsulates the overlapping rule used to prevent double bookings.
 */
export class DateRange {
    /** @type {Date} */
    #start;
    /** @type {Date} */
    #end;

    /**
     * Creates a new DateRange.
     *
     * @param {string|Date} start - The pickup date.
     * @param {string|Date} end - The return date.
     * @throws {Error} If a date is invalid or the end date is before the start date.
     */
    constructor(start, end) {
        const startDate = toLocalDate(start);
        const endDate = toLocalDate(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) throw new Error('Rental period dates must be valid');
        if (endDate < startDate) throw new Error('Return date must be on or after the pickup date');
        this.#start = startDate;
        this.#end = endDate;
        Object.freeze(this);
    }

    /** @returns {Date} A copy of the start date. */
    get start() {
        return new Date(this.#start.getTime());
    }

    /** @returns {Date} A copy of the end date. */
    get end() {
        return new Date(this.#end.getTime());
    }

    /**
     * Number of rental days (at least one).
     *
     * @returns {number}
     */
    get days() {
        return Math.max(1, Math.round((this.#end - this.#start) / MILLISECONDS_PER_DAY));
    }

    /**
     * Checks whether this range shares at least one day with another range.
     *
     * @param {DateRange} other - The other range.
     * @returns {boolean}
     */
    overlaps(other) {
        return this.#start < other.end && other.start < this.#end;
    }

    /**
     * Checks whether the whole range is before today.
     *
     * @returns {boolean}
     */
    isPast() {
        return this.#end < toLocalDate(new Date());
    }

    /**
     * Checks whether the range starts today or later.
     *
     * @returns {boolean}
     */
    isUpcoming() {
        return this.#start >= toLocalDate(new Date());
    }

    /**
     * Formats the range for display, e.g. "Oct 5, 2026 – Oct 8, 2026".
     *
     * @param {string} [locale='en-US'] - The locale to use.
     * @returns {string}
     */
    format(locale = 'en-US') {
        const options = {day: 'numeric', month: 'short', year: 'numeric'};
        return `${this.#start.toLocaleDateString(locale, options)} – ${this.#end.toLocaleDateString(locale, options)}`;
    }

    /** @returns {string} The start date as "YYYY-MM-DD". */
    startIso() {
        return toIsoDate(this.#start);
    }

    /** @returns {string} The end date as "YYYY-MM-DD". */
    endIso() {
        return toIsoDate(this.#end);
    }

    /**
     * Builds a DateRange from two Date objects, e.g. from a date picker.
     *
     * @param {Date} start - The start date.
     * @param {Date} end - The end date.
     * @returns {DateRange}
     */
    static fromDates(start, end) {
        return new DateRange(toIsoDate(start), toIsoDate(end));
    }
}
