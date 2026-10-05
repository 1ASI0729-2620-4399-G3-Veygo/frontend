<script setup>
import {useI18n} from 'vue-i18n';
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue';

/**
 * Presentation view with the Terms and Conditions of Veygo.
 *
 * @remarks
 * Written following the ACM/IEEE Software Engineering Code of Ethics: transparency,
 * data protection and responsibility towards owners and renters.
 */
const {t, tm} = useI18n();
const sectionKeys = ['scope', 'accounts', 'bookings', 'owners', 'data', 'liability'];
</script>

<template>
  <div class="terms">
    <header class="terms__header">
      <router-link :to="{ name: 'home' }"><img src="/images/brand/veygo-logo.png" alt="Veygo" width="140"></router-link>
      <language-switcher/>
    </header>
    <main class="terms__content veygo-card">
      <h1>{{ t('terms.title') }}</h1>
      <p class="text-muted">{{ t('terms.updated') }}</p>
      <section v-for="key in sectionKeys" :key="key">
        <h2>{{ t(`terms.sections.${key}.title`) }}</h2>
        <p>{{ t(`terms.sections.${key}.body`) }}</p>
      </section>
      <router-link :to="{ name: 'home' }">{{ t('shared.back-to-veygo') }}</router-link>
    </main>
  </div>
</template>

<style scoped>
.terms {
  max-width: 860px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.terms__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.terms__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
}

.terms__content h2 {
  font-size: 1.15rem;
  margin-bottom: .35rem;
}
</style>
