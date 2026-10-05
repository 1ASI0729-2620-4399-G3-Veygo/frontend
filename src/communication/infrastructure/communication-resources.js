/**
 * Conversation data structure as returned by the Veygo API.
 *
 * @typedef {Object} ConversationResource
 * @property {number} id - Unique identifier.
 * @property {number} renterId - Renter identifier.
 * @property {number} ownerId - Owner identifier.
 * @property {number|null} vehicleId - Vehicle identifier.
 * @property {string} createdAt - ISO-8601 creation date.
 * @property {string} lastMessageAt - ISO-8601 date of the last message.
 * @property {string} lastMessagePreview - Text of the last message.
 */

/**
 * Message data structure as returned by the Veygo API.
 *
 * @typedef {Object} MessageResource
 * @property {number} id - Unique identifier.
 * @property {number} conversationId - Conversation identifier.
 * @property {number} senderId - Sender identifier.
 * @property {string} content - Text.
 * @property {string} sentAt - ISO-8601 date.
 * @property {boolean} read - Read flag.
 */

export {};
