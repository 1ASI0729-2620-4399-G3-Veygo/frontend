<script setup>
import {computed, ref, watchEffect} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import NavigationMenu from '@/shared/presentation/components/navigation-menu.vue';
import TopBar from '@/shared/presentation/components/top-bar.vue';
import FooterContent from '@/shared/presentation/components/footer-content.vue';

/**
 * Presentation component for the authenticated application shell: sidebar navigation
 * (drawer on small screens), top bar, content area and footer.
 */
const {t} = useI18n();
const route = useRoute();
const drawerVisible = ref(false);

const renterItems = [
  {label: 'navigation.home', icon: 'pi pi-home', to: 'renter-home'},
  {label: 'navigation.search', icon: 'pi pi-search', to: 'vehicle-search'},
  {label: 'navigation.my-bookings', icon: 'pi pi-calendar', to: 'renter-bookings'},
  {label: 'navigation.favorites', icon: 'pi pi-heart', to: 'favorite-vehicles'},
  {label: 'navigation.messages', icon: 'pi pi-comments', to: 'messages'},
  {label: 'navigation.profile', icon: 'pi pi-user', to: 'profile'}
];

const ownerItems = [
  {label: 'navigation.home', icon: 'pi pi-home', to: 'owner-home'},
  {label: 'navigation.my-vehicles', icon: 'pi pi-car', to: 'owner-vehicles'},
  {label: 'navigation.my-bookings', icon: 'pi pi-calendar', to: 'owner-bookings'},
  {label: 'navigation.availability', icon: 'pi pi-calendar-times', to: 'vehicle-availability'},
  {label: 'navigation.transactions', icon: 'pi pi-wallet', to: 'owner-transactions'},
  {label: 'navigation.ratings', icon: 'pi pi-star', to: 'owner-ratings'},
  {label: 'navigation.messages', icon: 'pi pi-comments', to: 'messages'},
  {label: 'navigation.profile', icon: 'pi pi-user', to: 'profile'}
];

const navigationItems = computed(() => iamStore.currentUser?.isOwner() ? ownerItems : renterItems);

watchEffect(() => {
  const title = route.meta.title ? t(`routes.${route.meta.title}`) : '';
  document.title = title ? `${title} | Veygo` : 'Veygo';
});
</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">{{ t('shared.skip-to-content') }}</a>
    <aside class="sidebar">
      <router-link :to="{ name: 'home' }" class="sidebar__brand" :aria-label="t('shared.go-home')">
        <img src="/images/brand/veygo-logo-light.png" alt="Veygo" width="150" height="50">
      </router-link>
      <navigation-menu :items="navigationItems"/>
    </aside>

    <pv-drawer v-model:visible="drawerVisible" class="mobile-drawer" :header="t('shared.menu')">
      <navigation-menu :items="navigationItems" @navigated="drawerVisible = false"/>
    </pv-drawer>

    <div class="app-main">
      <top-bar @menu-toggled="drawerVisible = true"/>
      <main id="main-content" class="app-content" tabindex="-1">
        <router-view/>
      </main>
      <footer-content/>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.skip-link {
  position: absolute;
  left: -999px;
  top: 0;
  z-index: 100;
  background: var(--veygo-card);
  padding: .5rem 1rem;
}

.skip-link:focus {
  left: 1rem;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width);
  flex-shrink: 0;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  background: linear-gradient(180deg, #0b1b3f 0%, #0f2350 60%, #1b2a4a 100%);
}

.sidebar__brand {
  display: block;
  padding: 0 .5rem;
}

.sidebar__brand img {
  width: 150px;
  height: auto;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  padding: 2rem;
  outline: none;
}

@media (max-width: 991px) {
  .sidebar {
    display: none;
  }

  .app-content {
    padding: 1.25rem;
  }
}

@media (max-width: 575px) {
  .app-content {
    padding: 1rem;
  }
}
</style>

<style>
.mobile-drawer.p-drawer {
  background: #0b1b3f;
  color: #fff;
}

.mobile-drawer .p-drawer-header {
  color: #fff;
}
</style>
