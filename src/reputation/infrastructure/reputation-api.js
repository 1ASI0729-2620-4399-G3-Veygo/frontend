import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const reviewsEndpointPath = import.meta.env.VITE_REVIEWS_ENDPOINT_PATH;

/**
 * RESTful API client for the Reputation bounded context (reviews).
 */
export class ReputationApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #reviewsEndpoint;

    constructor() {
        super();
        this.#reviewsEndpoint = new BaseEndpoint(this, reviewsEndpointPath);
    }

    /**
     * Retrieves reviews filtered by a field (ownerId, renterId or vehicleId).
     *
     * @param {Object} filter - e.g. {ownerId: 2}.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getReviews(filter) {
        return this.#reviewsEndpoint.getAll({...filter, _sort: 'createdAt', _order: 'desc'});
    }

    /**
     * Publishes a review.
     *
     * @param {import('./reputation-resources.js').ReviewResource} resource - The review.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createReview(resource) {
        return this.#reviewsEndpoint.create(resource);
    }
}
