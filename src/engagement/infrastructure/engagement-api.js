import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const favoritesEndpointPath = import.meta.env.VITE_FAVORITES_ENDPOINT_PATH;

/**
 * RESTful API client for the Engagement bounded context (favorites).
 */
export class EngagementApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #favoritesEndpoint;

    constructor() {
        super();
        this.#favoritesEndpoint = new BaseEndpoint(this, favoritesEndpointPath);
    }

    /**
     * Retrieves the favorites of a renter.
     *
     * @param {number} renterId - The renter identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getFavoritesByRenterId(renterId) {
        return this.#favoritesEndpoint.getAll({renterId, _sort: 'createdAt', _order: 'desc'});
    }

    /**
     * Saves a favorite.
     *
     * @param {import('./engagement-resources.js').FavoriteResource} resource - The favorite resource.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createFavorite(resource) {
        return this.#favoritesEndpoint.create(resource);
    }

    /**
     * Removes a favorite.
     *
     * @param {number} id - The favorite identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    deleteFavorite(id) {
        return this.#favoritesEndpoint.delete(id);
    }
}
