import {DateTime} from '@/shared/domain/model/date-time.js';

/**
 * Domain entity representing a conversation between a Renter and an Owner,
 * optionally about a specific vehicle.
 */
export class Conversation {
    /**
     * Creates a new Conversation.
     *
     * @param {Object} props - The conversation properties.
     * @param {number} [props.id] - Unique identifier.
     * @param {number} props.renterId - The renter.
     * @param {number} props.ownerId - The owner.
     * @param {number|null} [props.vehicleId] - The vehicle the conversation is about.
     * @param {string|Date|DateTime} [props.createdAt] - Creation date.
     * @param {string|Date|DateTime} [props.lastMessageAt] - Date of the last message.
     * @param {string} [props.lastMessagePreview] - Text of the last message.
     * @throws {Error} If a participant is missing or both are the same person.
     */
    constructor({id = null, renterId, ownerId, vehicleId = null, createdAt = new Date(), lastMessageAt = null, lastMessagePreview = ''}) {
        if (!renterId || !ownerId) throw new Error('Conversation must have a renter and an owner');
        if (renterId === ownerId) throw new Error('Conversation participants must be different users');
        this.id = id;
        this.renterId = renterId;
        this.ownerId = ownerId;
        this.vehicleId = vehicleId;
        this.createdAt = createdAt instanceof DateTime ? createdAt : new DateTime(createdAt);
        this.lastMessageAt = lastMessageAt ? (lastMessageAt instanceof DateTime ? lastMessageAt : new DateTime(lastMessageAt)) : this.createdAt;
        this.lastMessagePreview = lastMessagePreview;
    }

    /**
     * Returns the identifier of the other participant.
     *
     * @param {number} userId - One participant.
     * @returns {number}
     */
    counterpartOf(userId) {
        return userId === this.renterId ? this.ownerId : this.renterId;
    }

    /**
     * Checks whether a user takes part in the conversation.
     *
     * @param {number} userId - The user.
     * @returns {boolean}
     */
    involves(userId) {
        return userId === this.renterId || userId === this.ownerId;
    }
}
