import {Review} from '@/reputation/domain/model/review.entity.js';

/**
 * Assembler that maps Review resources to entities and back.
 */
export class ReviewAssembler {
    /**
     * @param {import('./reputation-resources.js').ReviewResource} resource - The API resource.
     * @returns {Review}
     */
    static toEntityFromResource(resource) {
        return new Review({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Review[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for review:', error.message, resource);
                return null;
            }
        }).filter(review => review !== null);
    }

    /**
     * @param {Review} review - The review entity.
     * @returns {import('./reputation-resources.js').ReviewResource}
     */
    static toResourceFromEntity(review) {
        const resource = {
            bookingId: review.bookingId, vehicleId: review.vehicleId, ownerId: review.ownerId, renterId: review.renterId,
            rating: review.rating, comment: review.comment, createdAt: review.createdAt.toISOString()
        };
        if (review.id !== null) resource.id = review.id;
        return resource;
    }
}
