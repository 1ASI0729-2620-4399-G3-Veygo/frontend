import {Favorite} from '@/engagement/domain/model/favorite.entity.js';

/**
 * Assembler that maps Favorite resources to entities and back.
 */
export class FavoriteAssembler {
    /**
     * Converts a resource into a Favorite entity.
     *
     * @param {import('./engagement-resources.js').FavoriteResource} resource - The API resource.
     * @returns {Favorite}
     */
    static toEntityFromResource(resource) {
        return new Favorite({...resource});
    }

    /**
     * Converts a list response into Favorite entities, skipping invalid records.
     *
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Favorite[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for favorite:', error.message, resource);
                return null;
            }
        }).filter(favorite => favorite !== null);
    }

    /**
     * Converts a Favorite entity into the resource expected by the API.
     *
     * @param {Favorite} favorite - The favorite entity.
     * @returns {import('./engagement-resources.js').FavoriteResource}
     */
    static toResourceFromEntity(favorite) {
        return {renterId: favorite.renterId, vehicleId: favorite.vehicleId, createdAt: favorite.createdAt.toISOString()};
    }
}
