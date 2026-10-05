<script setup>
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue';
import NotificationBell from '@/notification/presentation/components/notification-bell.vue';
import {notificationStore} from '@/notification/application/notification.store.js';

/**
 * Presentation component for the application top bar: menu toggle (mobile),
 * language switcher and the account menu of the signed-in user.
 */

/** Emitted when the mobile navigation must be opened. */
const emit = defineEmits(['menu-toggled']);

const {t} = useI18n();
const router = useRouter();
const accountMenu = ref();

const user = computed(() => iamStore.currentUser);

const accountItems = computed(() => [
  {label: t('navigation.profile'), icon: 'pi pi-user', command: () => router.push({name: 'profile'})},
  {
    label: t('iam.sign-out'), icon: 'pi pi-sign-out', command: () => {
      iamStore.signOut();
      engagementStore.reset();
      notificationStore.reset();
      router.push({name: 'sign-in'});
    }
  }
]);

/**
 * Opens or closes the account menu.
 *
 * @param {Event} event - The click event.
 */
const toggleAccountMenu = event => accountMenu.value.toggle(event);
</script>

<template>
  <header class="top-bar">
    <pv-button class="top-bar__menu" icon="pi pi-bars" text rounded :aria-label="t('shared.open-menu')"
               @click="emit('menu-toggled')"/>
    <div class="flex-1"/>
    <language-switcher/>
    <notification-bell v-if="user"/>
    <button v-if="user" type="button" class="account-button" aria-haspopup="true" aria-controls="account-menu"
            @click="toggleAccountMenu">
      <pv-avatar v-if="!user.photoUrl.isEmpty()" :image="user.photoUrl.toString()" shape="circle" size="large"
                 :aria-label="user.fullName"/>
      <pv-avatar v-else :label="user.initials" shape="circle" size="large" class="bg-primary text-white"/>
      <span class="account-button__text">
        <strong>{{ t('shared.greeting', {name: user.firstName}) }}</strong>
        <small>{{ t(`iam.roles.${user.role}`) }}</small>
      </span>
      <i class="pi pi-chevron-down" aria-hidden="true"/>
    </button>
    <pv-menu id="account-menu" ref="accountMenu" :model="accountItems" popup/>
  </header>
</template>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 76px;
  padding: 0 1.5rem;
  background: var(--veygo-card);
  box-shadow: 0 2px 8px rgba(15, 23, 42, .06);
}

.top-bar__menu {
  display: none;
}

.account-button {
  display: flex;
  align-items: center;
  gap: .75rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: .25rem .5rem;
  border-radius: 12px;
  font: inherit;
  color: inherit;
}

.account-button:hover {
  background: var(--veygo-surface);
}

.account-button__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.account-button__text small {
  color: var(--veygo-muted);
}

@media (max-width: 991px) {
  .top-bar__menu {
    display: inline-flex;
  }
}

@media (max-width: 575px) {
  .top-bar {
    padding: 0 .75rem;
  }

  .account-button__text, .account-button .pi-chevron-down {
    display: none;
  }
}
</style>
