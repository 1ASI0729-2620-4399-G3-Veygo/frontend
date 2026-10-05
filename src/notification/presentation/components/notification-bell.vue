<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {notificationStore} from '@/notification/application/notification.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Presentation component: bell with the number of unread notifications and a panel
 * with the latest ones (booking changes, new messages, new reviews).
 *
 * @remarks
 * Refreshes periodically and on every navigation to simulate real-time updates.
 */
const {t} = useI18n();
const router = useRouter();
const route = useRoute();
const {formatDate} = useFormatting();
const panel = ref();
const refreshIntervalMs = 20000;
let timer = null;

const refresh = () => {
  if (iamStore.currentUser) notificationStore.loadNotifications(iamStore.currentUser.id);
};

/**
 * Opens the view related to a notification and marks it as read.
 *
 * @param {import('@/notification/domain/model/notification.entity.js').Notification} notification - The notification.
 */
const openNotification = notification => {
  notificationStore.markAsRead(notification);
  panel.value.hide();
  if (notification.link) router.push(notification.link);
};

/**
 * Time label: hour for today, date otherwise.
 *
 * @param {import('@/shared/domain/model/date-time.js').DateTime} dateTime - The instant.
 * @returns {string}
 */
const timeLabel = dateTime => {
  const date = dateTime.toDate();
  const today = new Date();
  return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      : formatDate(dateTime);
};

onMounted(() => {
  refresh();
  timer = setInterval(refresh, refreshIntervalMs);
});
watch(() => route.fullPath, refresh);
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <button type="button" class="bell" :aria-label="t('notification.title-count', { count: notificationStore.unreadCount })"
          aria-haspopup="true" @click="panel.toggle($event)">
    <i class="pi pi-bell" aria-hidden="true"/>
    <span v-if="notificationStore.unreadCount" class="bell__badge">{{ notificationStore.unreadCount }}</span>
  </button>
  <pv-popover ref="panel">
    <div class="notification-panel">
      <div class="flex justify-content-between align-items-center mb-2">
        <strong>{{ t('notification.title') }}</strong>
        <pv-button v-if="notificationStore.unreadCount" :label="t('notification.mark-all-read')" link size="small"
                   @click="notificationStore.markAllAsRead()"/>
      </div>
      <p v-if="!notificationStore.notifications.length" class="text-muted text-sm p-2">{{ t('notification.empty') }}</p>
      <ul class="notification-list">
        <li v-for="notification in notificationStore.notifications.slice(0, 8)" :key="notification.id">
          <button type="button" class="notification-item" :class="{ 'notification-item--unread': !notification.read }"
                  @click="openNotification(notification)">
            <i :class="notification.icon" aria-hidden="true"/>
            <span class="flex-1">
              <span class="block">{{ t(`notification.types.${notification.type}`, notification.params) }}</span>
              <small class="text-muted">{{ timeLabel(notification.createdAt) }}</small>
            </span>
            <span v-if="!notification.read" class="notification-item__dot" :aria-label="t('notification.unread')"/>
          </button>
        </li>
      </ul>
    </div>
  </pv-popover>
</template>

<style scoped>
.bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--veygo-text);
  cursor: pointer;
}

.bell:hover {
  background: var(--veygo-surface);
}

.bell .pi {
  font-size: 1.35rem;
}

.bell__badge {
  position: absolute;
  top: 4px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: .7rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.notification-panel {
  width: min(360px, 86vw);
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 380px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  width: 100%;
  padding: .7rem .5rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: .9rem;
  text-align: left;
  cursor: pointer;
}

.notification-item:hover {
  background: var(--veygo-surface);
}

.notification-item > .pi {
  margin-top: .2rem;
  color: var(--veygo-blue);
}

.notification-item--unread {
  background: var(--veygo-tint-blue);
}

.notification-item__dot {
  width: 8px;
  height: 8px;
  margin-top: .45rem;
  border-radius: 50%;
  background: var(--veygo-blue);
}
</style>
