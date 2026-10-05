/**
 * Reputation levels derived from the average rating.
 *
 * @readonly
 * @enum {string}
 */
export const ReputationLevel = Object.freeze({
    NONE: 'none',
    EXCELLENT: 'excellent',
    GOOD: 'good',
    NEEDS_IMPROVEMENT: 'needs-improvement'
});

/**
 * Domain service (value object) that summarizes a set of reviews: average,
 * distribution by stars, satisfaction percentage and reputation level.
 */
export class ReputationSummary {
    /**
     * @param {import('./review.entity.js').Review[]} reviews - The reviews to summarize.
     */
    constructor(reviews) {
        this.count = reviews.length;
        this.average = this.count ? reviews.reduce((sum, review) => sum + review.rating, 0) / this.count : 0;
        this.distribution = [5, 4, 3, 2, 1].map(stars => ({
            stars, count: reviews.filter(review => review.rating === stars).length
        }));
        this.satisfiedPercentage = this.count ? Math.round(reviews.filter(review => review.isPositive()).length * 100 / this.count) : 0;
        Object.freeze(this);
    }

    /** @returns {string} A {@link ReputationLevel} value. */
    get level() {
        if (this.count === 0) return ReputationLevel.NONE;
        if (this.average >= 4.5) return ReputationLevel.EXCELLENT;
        if (this.average >= 3.5) return ReputationLevel.GOOD;
        return ReputationLevel.NEEDS_IMPROVEMENT;
    }

    /** @returns {number} Average rounded to one decimal. */
    get roundedAverage() {
        return Math.round(this.average * 10) / 10;
    }
}
