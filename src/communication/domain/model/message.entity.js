import {DateTime} from '@/shared/domain/model/date-time.js';
import {StringValidator} from '@/shared/domain/model/string-validator.js';

/** Maximum length of a message. */
export const MAX_MESSAGE_LENGTH = 1000;

/**
 * Domain entity representing a message inside a conversation.
 */
export class Message {
    /**
     * Creates a new Message.
     *
     * @param {Object} props - The message properties.
     * @param {number} [props.id] - Unique identifier.
     * @param {number} props.conversationId - The conversation.
     * @param {number} props.senderId - The author.
     * @param {string} props.content - The text.
     * @param {string|Date|DateTime} [props.sentAt] - When it was sent.
     * @param {boolean} [props.read] - Whether the recipient read it.
     * @throws {Error} If the content is empty or too long.
     */
    constructor({id = null, conversationId, senderId, content = '', sentAt = new Date(), read = false}) {
        if (!conversationId) throw new Error('Message must belong to a conversation');
        if (!senderId) throw new Error('Message must have a sender');
        if (!StringValidator.isNotEmptyString(content)) throw new Error('Message content must be a non-empty string');
        if (content.length > MAX_MESSAGE_LENGTH) throw new Error(`Message content must have at most ${MAX_MESSAGE_LENGTH} characters`);
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content.trim();
        this.sentAt = sentAt instanceof DateTime ? sentAt : new DateTime(sentAt);
        this.read = Boolean(read);
    }

    /**
     * @param {number} userId - The user.
     * @returns {boolean} True if the user wrote the message.
     */
    isFrom(userId) {
        return this.senderId === userId;
    }

    /**
     * @param {number} userId - The user.
     * @returns {boolean} True if the message is unread by that user (sent by the other participant).
     */
    isUnreadBy(userId) {
        return !this.read && !this.isFrom(userId);
    }
}
