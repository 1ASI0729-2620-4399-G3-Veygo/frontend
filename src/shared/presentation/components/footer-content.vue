<script setup>
import {useI18n} from 'vue-i18n';

/**
 * Presentation component for the application footer: copyright, terms and attributions.
 */
const {t} = useI18n();
</script>

<template>
  <footer class="app-footer">
    <span>© 2026 Zyntra · Veygo. {{ t('shared.rights-reserved') }}</span>
    <nav class="app-footer__links" :aria-label="t('shared.footer-navigation')">
      <router-link :to="{ name: 'terms' }">{{ t('shared.terms') }}</router-link>
      <span>{{ t('shared.maps-by') }} <a href="https://www.openstreetmap.org/copyright" target="_blank"
                                         rel="noopener">OpenStreetMap</a></span>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: .5rem 1.5rem;
  padding: 1.25rem 2rem;
  color: var(--veygo-muted);
  font-size: .875rem;
  border-top: 1px solid var(--veygo-line);
}

.app-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

@media (max-width: 575px) {
  .app-footer {
    padding: 1rem;
  }
}
</style>
