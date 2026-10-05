<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {communicationStore} from '@/communication/application/communication.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {MAX_MESSAGE_LENGTH} from '@/communication/domain/model/message.entity.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation view where renters and owners chat about vehicles and bookings.
 *
 * @remarks
 * The list of conversations is on the left and the selected chat on the right (one panel
 * at a time on small screens). New messages are fetched periodically.
 */
const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const {intlLocale, translateOrKeep} = useFormatting();

const me = computed(() => iamStore.currentUser);
const searchText = ref('');
const draft = ref('');
const sending = ref(false);
const usersById = ref(new Map());
const vehiclesById = ref(new Map());
const messagesPanel = ref();
const activeId = ref(route.query.conversation ? Number(route.query.conversation) : null);
const refreshIntervalMs = 10000;
let timer = null;

const conversations = computed(() => {
  const text = searchText.value.trim().toLowerCase();
  return communicationStore.conversations.filter(conversation => {
    if (!text) return true;
    const counterpart = usersById.value.get(conversation.counterpartOf(me.value.id));
    const vehicle = vehiclesById.value.get(conversation.vehicleId);
    return [counterpart?.fullName, vehicle?.displayName, conversation.lastMessagePreview]
        .some(value => value?.toLowerCase().includes(text));
  });
});

const activeConversation = computed(() => communicationStore.conversations.find(conversation => conversation.id === activeId.value) ?? null);
const activeCounterpart = computed(() => activeConversation.value ? usersById.value.get(activeConversation.value.counterpartOf(me.value.id)) : null);
const activeVehicle = computed(() => activeConversation.value ? vehiclesById.value.get(activeConversation.value.vehicleId) : null);
const activeMessages = computed(() => communicationStore.messagesByConversation[activeId.value] ?? []);

/**
 * Messages grouped by day to show date separators.
 */
const messageGroups = computed(() => {
  const groups = [];
  activeMessages.value.forEach(message => {
    const day = message.sentAt.toDate().toDateString();
    const last = groups[groups.length - 1];
    if (last?.day === day) last.messages.push(message);
    else groups.push({day, label: message.sentAt.format(intlLocale.value, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}), messages: [message]});
  });
  return groups;
});

/**
 * Short time label for the conversation list.
 *
 * @param {import('@/shared/domain/model/date-time.js').DateTime} dateTime - The instant.
 * @returns {string}
 */
const listTime = dateTime => {
  const date = dateTime.toDate();
  return date.toDateString() === new Date().toDateString()
      ? date.toLocaleTimeString(intlLocale.value, {hour: '2-digit', minute: '2-digit'})
      : dateTime.format(intlLocale.value, {day: 'numeric', month: 'short'});
};

const messageTime = message => message.sentAt.toDate().toLocaleTimeString(intlLocale.value, {hour: '2-digit', minute: '2-digit'});

/**
 * Loads participants and vehicles referenced by the conversations.
 */
const resolveDetails = () => {
  const list = communicationStore.conversations;
  return Promise.all([
    Promise.all([...new Set(list.map(conversation => conversation.counterpartOf(me.value.id)))].map(id => iamStore.fetchUserById(id))),
    fleetStore.fetchVehiclesByIds(list.map(conversation => conversation.vehicleId).filter(Boolean))
  ]).then(([users, vehicles]) => {
    usersById.value = new Map(users.filter(Boolean).map(user => [user.id, user]));
    vehiclesById.value = vehicles;
  });
};

const scrollToBottom = () => nextTick(() => {
  if (messagesPanel.value) messagesPanel.value.scrollTop = messagesPanel.value.scrollHeight;
});

/**
 * Selects a conversation and marks its messages as read.
 *
 * @param {number} conversationId - The conversation.
 */
const openConversation = conversationId => {
  activeId.value = conversationId;
  router.replace({query: {conversation: conversationId}});
  communicationStore.markConversationAsRead(conversationId, me.value.id);
  scrollToBottom();
};

/**
 * Sends the written message.
 */
const send = () => {
  if (!draft.value.trim() || !activeConversation.value) return;
  sending.value = true;
  communicationStore.sendMessage(activeId.value, me.value, draft.value)
      .then(() => {
        draft.value = '';
        scrollToBottom();
      })
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
      .finally(() => sending.value = false);
};

/**
 * Reloads conversations; used on mount and periodically.
 *
 * @param {boolean} silent - Refresh without loading state.
 */
const refresh = silent => communicationStore.loadConversations(me.value, silent)
    .then(resolveDetails)
    .then(() => {
      if (activeId.value && activeConversation.value) {
        communicationStore.markConversationAsRead(activeId.value, me.value.id);
      }
    });

watch(() => activeMessages.value.length, scrollToBottom);

onMounted(() => {
  refresh(false).then(() => {
    if (activeId.value && activeConversation.value) openConversation(activeId.value);
    else if (window.innerWidth >= 992 && communicationStore.conversations.length) openConversation(communicationStore.conversations[0].id);
  });
  timer = setInterval(() => refresh(true), refreshIntervalMs);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="page">
    <page-header :title="t('communication.title')"
                 :subtitle="me.isRenter() ? t('communication.subtitle-renter') : t('communication.subtitle-owner')"/>

    <unavailable-content v-if="communicationStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="communicationStore.errors"/>

    <div v-else class="chat-layout" :class="{ 'chat-layout--open': activeConversation }">
      <aside class="veygo-card conversation-panel" :aria-label="t('communication.conversations')">
        <pv-icon-field class="mb-3">
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="searchText" :placeholder="t('communication.search-conversations')"
                         :aria-label="t('communication.search-conversations')" fluid/>
        </pv-icon-field>
        <div v-if="communicationStore.loading" class="flex flex-column gap-2">
          <pv-skeleton v-for="index in 3" :key="index" height="72px"/>
        </div>
        <p v-else-if="!conversations.length" class="text-muted p-2">{{ t('communication.no-conversations') }}</p>
        <ul class="conversation-list">
          <li v-for="conversation in conversations" :key="conversation.id">
            <button type="button" class="conversation-item" :class="{ 'conversation-item--active': conversation.id === activeId }"
                    :aria-current="conversation.id === activeId ? 'true' : undefined" @click="openConversation(conversation.id)">
              <template v-for="counterpart in [usersById.get(conversation.counterpartOf(me.id))]" :key="conversation.id">
                <pv-avatar v-if="counterpart && !counterpart.photoUrl.isEmpty()" :image="counterpart.photoUrl.toString()" shape="circle" size="large"/>
                <pv-avatar v-else :label="counterpart?.initials ?? '?'" shape="circle" size="large" class="bg-primary text-white"/>
                <span class="conversation-item__text">
                  <strong>{{ counterpart?.fullName ?? '…' }}</strong>
                  <small class="text-muted">{{ vehiclesById.get(conversation.vehicleId)?.displayName ?? t('communication.general') }}</small>
                  <span class="conversation-item__preview">{{ conversation.lastMessagePreview || t('communication.no-messages') }}</span>
                </span>
                <span class="conversation-item__meta">
                  <small class="text-muted">{{ listTime(conversation.lastMessageAt) }}</small>
                  <pv-badge v-if="communicationStore.unreadCount(conversation.id, me.id)"
                            :value="communicationStore.unreadCount(conversation.id, me.id)"/>
                </span>
              </template>
            </button>
          </li>
        </ul>
      </aside>

      <section class="veygo-card chat-panel" :aria-label="t('communication.chat')">
        <template v-if="activeConversation">
          <header class="chat-header">
            <pv-button class="chat-header__back" icon="pi pi-arrow-left" text rounded :aria-label="t('shared.back')"
                       @click="activeId = null"/>
            <img v-if="activeVehicle" :src="activeVehicle.mainPhotoUrl.toString()" :alt="activeVehicle.displayName" class="chat-header__photo">
            <div>
              <user-name-link v-if="activeCounterpart" :user-id="activeCounterpart.id" :name="activeCounterpart.fullName"
                              :vehicle-id="activeConversation.vehicleId"/>
              <div class="text-sm">{{ activeVehicle?.displayName ?? t('communication.general') }}</div>
              <small v-if="activeVehicle" class="text-muted">{{ activeVehicle.location.shortLabel }}</small>
            </div>
          </header>

          <div ref="messagesPanel" class="messages" aria-live="polite">
            <p v-if="!activeMessages.length" class="text-center text-muted">{{ t('communication.start-conversation') }}</p>
            <template v-for="group in messageGroups" :key="group.day">
              <p class="messages__day">{{ group.label }}</p>
              <div v-for="message in group.messages" :key="message.id" class="message"
                   :class="{ 'message--mine': message.isFrom(me.id) }">
                <div class="message__bubble">
                  <p>{{ message.content }}</p>
                  <small>
                    {{ messageTime(message) }}
                    <i v-if="message.isFrom(me.id)" :class="message.read ? 'pi pi-check-circle' : 'pi pi-check'"
                       :aria-label="message.read ? t('communication.read') : t('communication.sent')"/>
                  </small>
                </div>
              </div>
            </template>
          </div>

          <form class="composer" @submit.prevent="send">
            <label for="message-draft" class="sr-only">{{ t('communication.write-message') }}</label>
            <pv-textarea id="message-draft" v-model="draft" rows="1" auto-resize :maxlength="MAX_MESSAGE_LENGTH"
                         :placeholder="t('communication.write-message')" class="flex-1"
                         @keydown.enter.exact.prevent="send"/>
            <pv-button type="submit" icon="pi pi-send" :loading="sending" :disabled="!draft.trim()"
                       :aria-label="t('communication.send')"/>
          </form>
        </template>
        <unavailable-content v-else icon="pi pi-comments" :title="t('communication.select-conversation')"/>
      </section>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 1.25rem;
  height: calc(100vh - 250px);
  min-height: 480px;
}

.conversation-panel, .chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  width: 100%;
  padding: .85rem .6rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.conversation-item:hover {
  background: var(--veygo-surface);
}

.conversation-item--active {
  background: var(--veygo-tint-blue);
}

.conversation-item__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.conversation-item__preview {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: .85rem;
  color: var(--veygo-muted);
}

.conversation-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .35rem;
}

.chat-panel {
  padding: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--veygo-line);
}

.chat-header__back {
  display: none;
}

.chat-header__photo {
  width: 88px;
  height: 58px;
  object-fit: contain;
  border-radius: 10px;
  background: var(--veygo-surface);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  background: var(--veygo-surface);
}

.messages__day {
  align-self: center;
  font-size: .8rem;
  color: var(--veygo-muted);
  text-transform: capitalize;
}

.message {
  display: flex;
}

.message--mine {
  justify-content: flex-end;
}

.message__bubble {
  max-width: min(520px, 80%);
  padding: .65rem .9rem;
  border-radius: 14px 14px 14px 4px;
  background: var(--veygo-card);
  box-shadow: 0 1px 2px rgba(15, 23, 42, .06);
}

.message--mine .message__bubble {
  border-radius: 14px 14px 4px 14px;
  background: var(--veygo-tint-blue);
}

.message__bubble p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message__bubble small {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: .3rem;
  margin-top: .25rem;
  color: var(--veygo-muted);
  font-size: .72rem;
}

.message__bubble .pi {
  font-size: .75rem;
  color: var(--veygo-blue);
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: .75rem;
  padding: .9rem 1.25rem;
  border-top: 1px solid var(--veygo-line);
}

@media (max-width: 991px) {
  .chat-layout {
    grid-template-columns: 1fr;
    height: calc(100vh - 210px);
  }

  .chat-layout .chat-panel {
    display: none;
  }

  .chat-layout--open .conversation-panel {
    display: none;
  }

  .chat-layout--open .chat-panel {
    display: flex;
  }

  .chat-header__back {
    display: inline-flex;
  }
}
</style>
