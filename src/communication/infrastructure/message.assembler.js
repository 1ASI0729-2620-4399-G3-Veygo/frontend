import {Message} from '@/communication/domain/model/message.entity.js';

/**
 * Assembler that maps Message resources to entities and back.
 */
export class MessageAssembler {
    /**
     * @param {import('./communication-resources.js').MessageResource} resource - The API resource.
     * @returns {Message}
     */
    static toEntityFromResource(resource) {
        return new Message({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Message[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for message:', error.message, resource);
                return null;
            }
        }).filter(message => message !== null);
    }

    /**
     * @param {Message} message - The message entity.
     * @returns {import('./communication-resources.js').MessageResource}
     */
    static toResourceFromEntity(message) {
        const resource = {
            conversationId: message.conversationId, senderId: message.senderId, content: message.content,
            sentAt: message.sentAt.toISOString(), read: message.read
        };
        if (message.id !== null) resource.id = message.id;
        return resource;
    }
}
