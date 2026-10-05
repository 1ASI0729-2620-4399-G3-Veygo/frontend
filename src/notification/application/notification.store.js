import {reactive} from 'vue';
import {NotificationApi} from '@/notification/infrastructure/notification-api.js';
import {NotificationAssembler} from '@/notification/infrastructure/notification.assembler.js';
import {Notification} from '@/notification/domain/model/notification.entity.js';

const notificationApi = new NotificationApi();

/**
 * Application service (store) for the Notification bounded context.
 */
export const notificationStore = reactive({
    /** @type {Notification[]} */
    notifications: [],
    /** @type {string[]} */
    errors: [],

    /** @returns {number} Number of unread notifications. */
    get unreadCount() {
        return this.notifications.filter(notification => !notification.read).length;
    },

    /**
     * Loads the notifications of a user.
     *
     * @param {number} userId - The recipient.
     * @returns {Promise<void>}
     */
    loadNotifications(userId) {
        return notificationApi.getNotificationsByUserId(userId)
            .then(response => this.notifications = NotificationAssembler.toEntitiesFromResponse(response))
            .catch(message => this.errors.push(message));
    },

    /**
     * Marks a notification as read.
     *
     * @param {Notification} notification - The notification.
     * @returns {Promise<void>}
     */
    markAsRead(notification) {
        if (notification.read) return Promise.resolve();
        return notificationApi.markAsRead(notification.id)
            .then(() => notification.markAsRead())
            .catch(message => this.errors.push(message));
    },

    /**
     * Marks every loaded notification as read.
     *
     * @returns {Promise<void>}
     */
    markAllAsRead() {
        return Promise.all(this.notifications.filter(notification => !notification.read)
            .map(notification => this.markAsRead(notification))).then(() => undefined);
    },

    /**
     * Creates a notification for a user.
     *
     * @param {Object} props - See {@link Notification}.
     * @returns {Promise<void>}
     */
    notify(props) {
        const notification = new Notification(props);
        return notificationApi.createNotification(NotificationAssembler.toResourceFromEntity(notification))
            .then(() => undefined)
            .catch(message => this.errors.push(message));
    },

    /** Clears the loaded notifications (e.g. on sign-out). */
    reset() {
        this.notifications = [];
    }
});
