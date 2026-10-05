import {Conversation} from '@/communication/domain/model/conversation.entity.js';

/**
 * Assembler that maps Conversation resources to entities and back.
 */
export class ConversationAssembler {
    /**
     * @param {import('./communication-resources.js').ConversationResource} resource - The API resource.
     * @returns {Conversation}
     */
    static toEntityFromResource(resource) {
        return new Conversation({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Conversation[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for conversation:', error.message, resource);
                return null;
            }
        }).filter(conversation => conversation !== null);
    }

    /**
     * @param {Conversation} conversation - The conversation entity.
     * @returns {import('./communication-resources.js').ConversationResource}
     */
    static toResourceFromEntity(conversation) {
        const resource = {
            renterId: conversation.renterId, ownerId: conversation.ownerId, vehicleId: conversation.vehicleId,
            createdAt: conversation.createdAt.toISOString(), lastMessageAt: conversation.lastMessageAt.toISOString(),
            lastMessagePreview: conversation.lastMessagePreview
        };
        if (conversation.id !== null) resource.id = conversation.id;
        return resource;
    }
}
