import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const notificationsEndpointPath = import.meta.env.VITE_NOTIFICATIONS_ENDPOINT_PATH;

/**
 * RESTful API client for the Notification bounded context.
 */
export class NotificationApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #notificationsEndpoint;

    constructor() {
        super();
        this.#notificationsEndpoint = new BaseEndpoint(this, notificationsEndpointPath);
    }

    /**
     * Retrieves the latest notifications of a user.
     *
     * @param {number} userId - The recipient.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getNotificationsByUserId(userId) {
        return this.#notificationsEndpoint.getAll({userId, _sort: 'createdAt', _order: 'desc', _limit: 30});
    }

    /**
     * Creates a notification.
     *
     * @param {import('./notification-resources.js').NotificationResource} resource - The notification.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createNotification(resource) {
        return this.#notificationsEndpoint.create(resource);
    }

    /**
     * Marks a notification as read.
     *
     * @param {number} id - The notification identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    markAsRead(id) {
        return this.#notificationsEndpoint.patch(id, {read: true});
    }
}
