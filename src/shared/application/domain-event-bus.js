/**
 * Minimal in-memory publish/subscribe bus for domain events.
 *
 * @remarks
 * Implements the Observer pattern so bounded contexts stay decoupled: Booking,
 * Communication and Reputation publish events (e.g. "BookingRequested") and the
 * Notification context subscribes to them to inform the affected users.
 */
const handlers = new Map();

export const domainEventBus = {

    /**
     * Registers a handler for an event type.
     *
     * @param {string} eventType - The event name, e.g. "BookingConfirmed".
     * @param {(event: Object) => void} handler - The handler.
     * @returns {() => void} Function that removes the subscription.
     */
    subscribe(eventType, handler) {
        if (!handlers.has(eventType)) handlers.set(eventType, new Set());
        handlers.get(eventType).add(handler);
        return () => handlers.get(eventType).delete(handler);
    },

    /**
     * Publishes an event to every subscribed handler.
     *
     * @param {string} eventType - The event name.
     * @param {Object} payload - The event data.
     */
    publish(eventType, payload) {
        (handlers.get(eventType) ?? []).forEach(handler => {
            try {
                handler({type: eventType, occurredAt: new Date(), ...payload});
            } catch (error) {
                console.error(`Handler for ${eventType} failed:`, error);
            }
        });
    }
};

/**
 * Names of the domain events published in Veygo.
 *
 * @readonly
 * @enum {string}
 */
export const DomainEvents = Object.freeze({
    BOOKING_REQUESTED: 'BookingRequested',
    BOOKING_CONFIRMED: 'BookingConfirmed',
    BOOKING_REJECTED: 'BookingRejected',
    BOOKING_CANCELLED: 'BookingCancelled',
    MESSAGE_SENT: 'MessageSent',
    REVIEW_PUBLISHED: 'ReviewPublished'
});
