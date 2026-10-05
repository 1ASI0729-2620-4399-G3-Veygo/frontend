import {DateTime} from '@/shared/domain/model/date-time.js';

/**
 * Notification types (each one has its own translated message).
 *
 * @readonly
 * @enum {string}
 */
export const NotificationType = Object.freeze({
    BOOKING_REQUESTED: 'booking-requested',
    BOOKING_CONFIRMED: 'booking-confirmed',
    BOOKING_REJECTED: 'booking-rejected',
    BOOKING_CANCELLED: 'booking-cancelled',
    MESSAGE_RECEIVED: 'message-received',
    REVIEW_RECEIVED: 'review-received'
});

/**
 * Domain entity representing an in-app notification for a user.
 */
export class Notification {
    /**
     * Creates a new Notification.
     *
     * @param {Object} props - The notification properties.
     * @param {number} [props.id] - Unique identifier.
     * @param {number} props.userId - The recipient.
     * @param {string} props.type - One of {@link NotificationType}.
     * @param {Object} [props.params] - Values for the translated message (user, vehicle...).
     * @param {Object} [props.link] - Route location to open (name, params, query).
     * @param {boolean} [props.read] - Whether it was read.
     * @param {string|Date|DateTime} [props.createdAt] - Creation date.
     * @throws {Error} If the recipient is missing or the type is unsupported.
     */
    constructor({id = null, userId, type, params = {}, link = null, read = false, createdAt = new Date()}) {
        if (!userId) throw new Error('Notification must have a recipient');
        if (!Object.values(NotificationType).includes(type)) throw new Error(`Unsupported notification type: ${type}`);
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.params = params;
        this.link = link;
        this.read = Boolean(read);
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
    }

    /** Marks the notification as read. */
    markAsRead() {
        this.read = true;
    }

    /** @returns {string} PrimeIcons class for the notification type. */
    get icon() {
        return {
            'booking-requested': 'pi pi-calendar-plus', 'booking-confirmed': 'pi pi-check-circle',
            'booking-rejected': 'pi pi-times-circle', 'booking-cancelled': 'pi pi-ban',
            'message-received': 'pi pi-comment', 'review-received': 'pi pi-star'
        }[this.type];
    }
}
