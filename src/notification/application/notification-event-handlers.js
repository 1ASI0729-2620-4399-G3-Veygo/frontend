import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';
import {notificationStore} from '@/notification/application/notification.store.js';
import {NotificationType} from '@/notification/domain/model/notification.entity.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';

/**
 * Creates a notification only when the recipient keeps notifications enabled in the profile.
 *
 * @param {number} userId - The recipient.
 * @param {Object} props - The notification properties.
 * @returns {Promise<void>}
 */
const notifyIfEnabled = (userId, props) => iamStore.fetchUserById(userId).then(user => {
    if (user && !user.preferences.notifications) return;
    return notificationStore.notify({userId, ...props});
});

/**
 * Resolves the display names used in booking notifications.
 *
 * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
 * @param {number} actorId - The user who performed the action.
 * @returns {Promise<{vehicle: string, user: string}>}
 */
const bookingParams = (booking, actorId) => Promise.all([
    fleetStore.fetchVehicleById(booking.vehicleId), iamStore.fetchUserById(actorId)
]).then(([vehicle, actor]) => ({vehicle: vehicle?.displayName ?? '', user: actor?.fullName ?? ''}));

/**
 * Registers the handlers that turn domain events into notifications.
 *
 * @remarks
 * Called once at start-up (main.js). Each handler decides the recipient and the view the
 * notification opens.
 */
export const registerNotificationEventHandlers = () => {
    domainEventBus.subscribe(DomainEvents.BOOKING_REQUESTED, ({booking, actorId}) =>
        bookingParams(booking, actorId).then(params => notifyIfEnabled(booking.ownerId, {
            type: NotificationType.BOOKING_REQUESTED, params, link: {name: 'owner-bookings'}
        })));

    domainEventBus.subscribe(DomainEvents.BOOKING_CONFIRMED, ({booking, actorId}) =>
        bookingParams(booking, actorId).then(params => notifyIfEnabled(booking.renterId, {
            type: NotificationType.BOOKING_CONFIRMED, params, link: {name: 'renter-bookings'}
        })));

    domainEventBus.subscribe(DomainEvents.BOOKING_REJECTED, ({booking, actorId}) =>
        bookingParams(booking, actorId).then(params => notifyIfEnabled(booking.renterId, {
            type: NotificationType.BOOKING_REJECTED, params, link: {name: 'renter-bookings'}
        })));

    domainEventBus.subscribe(DomainEvents.BOOKING_CANCELLED, ({booking, actorId}) => {
        const recipientId = actorId === booking.renterId ? booking.ownerId : booking.renterId;
        const link = {name: recipientId === booking.ownerId ? 'owner-bookings' : 'renter-bookings'};
        return bookingParams(booking, actorId).then(params => notifyIfEnabled(recipientId, {
            type: NotificationType.BOOKING_CANCELLED, params, link
        }));
    });

    domainEventBus.subscribe(DomainEvents.MESSAGE_SENT, ({senderName, recipientId, conversationId}) =>
        notifyIfEnabled(recipientId, {
            type: NotificationType.MESSAGE_RECEIVED, params: {user: senderName},
            link: {name: 'messages', query: {conversation: conversationId}}
        }));

    domainEventBus.subscribe(DomainEvents.REVIEW_PUBLISHED, ({review}) =>
        Promise.all([fleetStore.fetchVehicleById(review.vehicleId), iamStore.fetchUserById(review.renterId)])
            .then(([vehicle, renter]) => notifyIfEnabled(review.ownerId, {
                type: NotificationType.REVIEW_RECEIVED,
                params: {vehicle: vehicle?.displayName ?? '', user: renter?.fullName ?? ''},
                link: {name: 'owner-ratings'}
            })));
};
