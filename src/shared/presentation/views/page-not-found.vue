<script setup>
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';

/**
 * Presentation view shown when a route does not exist.
 */
const {t} = useI18n();
const route = useRoute();
</script>

<template>
  <main class="not-found">
    <img src="/images/brand/veygo-logo.png" alt="Veygo" width="160">
    <h1>404</h1>
    <p>{{ t('not-found.message', {path: route.fullPath}) }}</p>
    <router-link :to="{ name: 'home' }" class="p-button">{{ t('shared.back-to-veygo') }}</router-link>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  text-align: center;
}

.not-found h1 {
  font-size: 4rem;
  color: var(--veygo-blue);
}

.not-found a {
  text-decoration: none;
}
</style>
