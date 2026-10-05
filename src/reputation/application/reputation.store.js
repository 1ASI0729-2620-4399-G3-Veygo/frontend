import {reactive} from 'vue';
import {ReputationApi} from '@/reputation/infrastructure/reputation-api.js';
import {ReviewAssembler} from '@/reputation/infrastructure/review.assembler.js';
import {Review} from '@/reputation/domain/model/review.entity.js';
import {ReputationSummary} from '@/reputation/domain/model/reputation-summary.js';
import {FleetApi} from '@/fleet/infrastructure/fleet-api.js';
import {IamApi} from '@/iam/infrastructure/iam-api.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const reputationApi = new ReputationApi();
const fleetApi = new FleetApi();
const iamApi = new IamApi();

/**
 * Application service (store) for the Reputation bounded context.
 *
 * @remarks
 * Loads the reviews received by an owner or written by a renter, publishes new reviews
 * and keeps the denormalized rating of the vehicle and the owner up to date.
 */
export const reputationStore = reactive({
    /** @type {Review[]} Reviews received by the signed-in owner. */
    ownerReviews: [],
    /** @type {Review[]} Reviews written by the signed-in renter. */
    renterReviews: [],
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /** @returns {ReputationSummary} Summary of the owner's reviews. */
    get ownerSummary() {
        return new ReputationSummary(this.ownerReviews);
    },

    /**
     * Summary of the reviews of one vehicle.
     *
     * @param {number} vehicleId - The vehicle identifier.
     * @returns {ReputationSummary}
     */
    summaryForVehicle(vehicleId) {
        return new ReputationSummary(this.ownerReviews.filter(review => review.vehicleId === vehicleId));
    },

    /**
     * Loads the reviews received by an owner.
     *
     * @param {number} ownerId - The owner identifier.
     * @returns {Promise<void>}
     */
    loadOwnerReviews(ownerId) {
        this.errors = [];
        this.loading = true;
        return reputationApi.getReviews({ownerId})
            .then(response => this.ownerReviews = ReviewAssembler.toEntitiesFromResponse(response))
            .catch(message => this.errors.push(message))
            .finally(() => this.loading = false);
    },

    /**
     * Loads the reviews written by a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @returns {Promise<void>}
     */
    loadRenterReviews(renterId) {
        return reputationApi.getReviews({renterId})
            .then(response => this.renterReviews = ReviewAssembler.toEntitiesFromResponse(response))
            .catch(message => this.errors.push(message));
    },

    /**
     * Checks whether a booking was already reviewed by its renter.
     *
     * @param {number} bookingId - The booking identifier.
     * @returns {boolean}
     */
    isBookingReviewed(bookingId) {
        return this.renterReviews.some(review => review.bookingId === bookingId);
    },

    /**
     * Publishes the review of a completed booking and refreshes vehicle and owner ratings.
     *
     * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
     * @param {number} rating - Stars.
     * @param {string} comment - Comment.
     * @returns {Promise<Review>}
     */
    publishReview(booking, rating, comment) {
        let review;
        try {
            if (this.isBookingReviewed(booking.id)) throw new Error('This rental was already reviewed');
            review = Review.forBooking(booking, rating, comment);
        } catch (error) {
            return Promise.reject(error.message);
        }
        return reputationApi.createReview(ReviewAssembler.toResourceFromEntity(review))
            .then(response => {
                const created = ReviewAssembler.toEntityFromResource(response.data);
                this.renterReviews.unshift(created);
                return Promise.all([reputationApi.getReviews({vehicleId: created.vehicleId}), reputationApi.getReviews({ownerId: created.ownerId})])
                    .then(([vehicleResponse, ownerResponse]) => {
                        const vehicleSummary = new ReputationSummary(ReviewAssembler.toEntitiesFromResponse(vehicleResponse));
                        const ownerSummary = new ReputationSummary(ReviewAssembler.toEntitiesFromResponse(ownerResponse));
                        return Promise.all([
                            fleetApi.patchVehicle(created.vehicleId, {rating: vehicleSummary.roundedAverage, reviewsCount: vehicleSummary.count}),
                            iamApi.updateUser(created.ownerId, {rating: ownerSummary.roundedAverage, reviewsCount: ownerSummary.count})
                        ]);
                    })
                    .then(() => {
                        domainEventBus.publish(DomainEvents.REVIEW_PUBLISHED, {review: created});
                        return created;
                    });
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    }
});
