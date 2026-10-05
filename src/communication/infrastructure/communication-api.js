import {BaseApi} from '@/shared/infrastructure/base-api.js';
import {BaseEndpoint} from '@/shared/infrastructure/base-endpoint.js';

const conversationsEndpointPath = import.meta.env.VITE_CONVERSATIONS_ENDPOINT_PATH;
const messagesEndpointPath = import.meta.env.VITE_MESSAGES_ENDPOINT_PATH;

/**
 * RESTful API client for the Communication bounded context (conversations and messages).
 */
export class CommunicationApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #conversationsEndpoint;
    /** @type {BaseEndpoint} */
    #messagesEndpoint;

    constructor() {
        super();
        this.#conversationsEndpoint = new BaseEndpoint(this, conversationsEndpointPath);
        this.#messagesEndpoint = new BaseEndpoint(this, messagesEndpointPath);
    }

    /**
     * Retrieves the conversations of a user according to the role.
     *
     * @param {number} userId - The user identifier.
     * @param {string} role - "renter" or "owner".
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getConversationsByUser(userId, role) {
        return this.#conversationsEndpoint.getAll({[`${role}Id`]: userId, _sort: 'lastMessageAt', _order: 'desc'});
    }

    /**
     * Creates a conversation.
     *
     * @param {import('./communication-resources.js').ConversationResource} resource - The conversation.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createConversation(resource) {
        return this.#conversationsEndpoint.create(resource);
    }

    /**
     * Updates the last message data of a conversation.
     *
     * @param {number} id - The conversation identifier.
     * @param {Object} changes - lastMessageAt and lastMessagePreview.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    updateConversation(id, changes) {
        return this.#conversationsEndpoint.patch(id, changes);
    }

    /**
     * Retrieves the messages of a conversation in chronological order.
     *
     * @param {number} conversationId - The conversation identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getMessagesByConversationId(conversationId) {
        return this.#messagesEndpoint.getAll({conversationId, _sort: 'sentAt', _order: 'asc'});
    }

    /**
     * Sends a message.
     *
     * @param {import('./communication-resources.js').MessageResource} resource - The message.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    createMessage(resource) {
        return this.#messagesEndpoint.create(resource);
    }

    /**
     * Marks a message as read.
     *
     * @param {number} id - The message identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    markMessageAsRead(id) {
        return this.#messagesEndpoint.patch(id, {read: true});
    }
}
