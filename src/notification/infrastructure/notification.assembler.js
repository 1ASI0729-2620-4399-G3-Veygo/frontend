import {Notification} from '@/notification/domain/model/notification.entity.js';

/**
 * Assembler that maps Notification resources to entities and back.
 */
export class NotificationAssembler {
    /**
     * @param {import('./notification-resources.js').NotificationResource} resource - The API resource.
     * @returns {Notification}
     */
    static toEntityFromResource(resource) {
        return new Notification({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Notification[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for notification:', error.message, resource);
                return null;
            }
        }).filter(notification => notification !== null);
    }

    /**
     * @param {Notification} notification - The notification entity.
     * @returns {import('./notification-resources.js').NotificationResource}
     */
    static toResourceFromEntity(notification) {
        return {
            userId: notification.userId, type: notification.type, params: notification.params, link: notification.link,
            read: notification.read, createdAt: notification.createdAt.toISOString()
        };
    }
}
