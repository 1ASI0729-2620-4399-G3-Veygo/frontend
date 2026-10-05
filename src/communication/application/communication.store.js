import {reactive} from 'vue';
import {CommunicationApi} from '@/communication/infrastructure/communication-api.js';
import {ConversationAssembler} from '@/communication/infrastructure/conversation.assembler.js';
import {MessageAssembler} from '@/communication/infrastructure/message.assembler.js';
import {Conversation} from '@/communication/domain/model/conversation.entity.js';
import {Message} from '@/communication/domain/model/message.entity.js';
import {domainEventBus, DomainEvents} from '@/shared/application/domain-event-bus.js';

const communicationApi = new CommunicationApi();

/**
 * Application service (store) for the Communication bounded context.
 *
 * @remarks
 * Loads the conversations of the signed-in user, sends messages, marks them as read and
 * starts new conversations between a Renter and an Owner. Publishes "MessageSent".
 */
export const communicationStore = reactive({
    /** @type {Conversation[]} */
    conversations: [],
    /** @type {Object<number, Message[]>} Messages indexed by conversation identifier. */
    messagesByConversation: {},
    /** @type {boolean} */
    loading: false,
    /** @type {string[]} */
    errors: [],

    /**
     * Number of unread messages in a conversation for a user.
     *
     * @param {number} conversationId - The conversation.
     * @param {number} userId - The reader.
     * @returns {number}
     */
    unreadCount(conversationId, userId) {
        return (this.messagesByConversation[conversationId] ?? []).filter(message => message.isUnreadBy(userId)).length;
    },

    /**
     * Total unread messages of a user.
     *
     * @param {number} userId - The reader.
     * @returns {number}
     */
    totalUnread(userId) {
        return this.conversations.reduce((total, conversation) => total + this.unreadCount(conversation.id, userId), 0);
    },

    /**
     * Loads the conversations of a user and their messages.
     *
     * @param {import('@/iam/domain/model/user.entity.js').User} user - The signed-in user.
     * @param {boolean} [silent=false] - Refresh without showing the loading state.
     * @returns {Promise<void>}
     */
    loadConversations(user, silent = false) {
        this.errors = [];
        if (!silent) this.loading = true;
        return communicationApi.getConversationsByUser(user.id, user.role)
            .then(response => {
                const conversations = ConversationAssembler.toEntitiesFromResponse(response);
                return Promise.all(conversations.map(conversation => communicationApi.getMessagesByConversationId(conversation.id)))
                    .then(responses => {
                        const messages = {};
                        conversations.forEach((conversation, index) => {
                            messages[conversation.id] = MessageAssembler.toEntitiesFromResponse(responses[index]);
                        });
                        this.conversations = conversations;
                        this.messagesByConversation = messages;
                    });
            })
            .catch(message => this.errors.push(message))
            .finally(() => this.loading = false);
    },

    /**
     * Marks as read every message received by the user in a conversation.
     *
     * @param {number} conversationId - The conversation.
     * @param {number} userId - The reader.
     * @returns {Promise<void>}
     */
    markConversationAsRead(conversationId, userId) {
        const unread = (this.messagesByConversation[conversationId] ?? []).filter(message => message.isUnreadBy(userId));
        return Promise.all(unread.map(message => communicationApi.markMessageAsRead(message.id)
            .then(() => message.read = true)))
            .catch(message => this.errors.push(message));
    },

    /**
     * Sends a message in a conversation and publishes the "MessageSent" event.
     *
     * @param {number} conversationId - The conversation.
     * @param {import('@/iam/domain/model/user.entity.js').User} sender - The author.
     * @param {string} content - The text.
     * @returns {Promise<Message>}
     */
    sendMessage(conversationId, sender, content) {
        let message;
        try {
            message = new Message({conversationId, senderId: sender.id, content});
        } catch (error) {
            return Promise.reject(error.message);
        }
        const conversation = this.conversations.find(item => item.id === conversationId);
        return communicationApi.createMessage(MessageAssembler.toResourceFromEntity(message))
            .then(response => {
                const created = MessageAssembler.toEntityFromResource(response.data);
                this.messagesByConversation[conversationId] = [...(this.messagesByConversation[conversationId] ?? []), created];
                const changes = {lastMessageAt: created.sentAt.toISOString(), lastMessagePreview: created.content.slice(0, 120)};
                return communicationApi.updateConversation(conversationId, changes).then(() => {
                    if (conversation) {
                        Object.assign(conversation, ConversationAssembler.toEntityFromResource({
                            ...ConversationAssembler.toResourceFromEntity(conversation), ...changes
                        }));
                        this.conversations = [conversation, ...this.conversations.filter(item => item.id !== conversationId)];
                        domainEventBus.publish(DomainEvents.MESSAGE_SENT, {
                            senderName: sender.fullName, recipientId: conversation.counterpartOf(sender.id), conversationId
                        });
                    }
                    return created;
                });
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    },

    /**
     * Returns the existing conversation between two users (about a vehicle) or creates it.
     *
     * @param {Object} params - The participants.
     * @param {number} params.renterId - The renter.
     * @param {number} params.ownerId - The owner.
     * @param {number|null} [params.vehicleId] - The vehicle the conversation is about.
     * @returns {Promise<Conversation>}
     */
    startConversation({renterId, ownerId, vehicleId = null}) {
        return communicationApi.getConversationsByUser(renterId, 'renter')
            .then(response => {
                const existing = ConversationAssembler.toEntitiesFromResponse(response)
                    .find(conversation => conversation.ownerId === ownerId && (vehicleId === null || conversation.vehicleId === vehicleId));
                if (existing) return existing;
                const conversation = new Conversation({renterId, ownerId, vehicleId});
                return communicationApi.createConversation(ConversationAssembler.toResourceFromEntity(conversation))
                    .then(created => ConversationAssembler.toEntityFromResource(created.data));
            })
            .catch(message => {
                this.errors.push(message);
                throw message;
            });
    }
});
