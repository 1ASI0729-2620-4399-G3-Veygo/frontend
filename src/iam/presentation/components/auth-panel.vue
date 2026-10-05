<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue';
import AuthScene from '@/iam/presentation/components/auth-scene.vue';

/**
 * Presentation component for the authentication screens: a glass card with the form over
 * a night road scene, and one short message for Renters or Owners.
 */
const {t} = useI18n();

/** @type {{title: string, highlight: string, subtitle: string, wide: boolean, audience: string}} */
const props = defineProps({
  title: {type: String, required: true},
  highlight: {type: String, required: true},
  subtitle: {type: String, required: true},
  wide: {type: Boolean, default: false},
  audience: {type: String, default: 'renter'}
});

const message = computed(() => props.audience === 'owner' ? t('iam.showcase.owner-title') : t('iam.showcase.renter-title'));
</script>

<template>
  <div class="auth">
    <auth-scene/>

    <header class="auth__top">
      <router-link to="/" class="auth__logo">
        <img src="/images/brand/veygo-logo-light.png" alt="Veygo" width="128">
      </router-link>
      <language-switcher/>
    </header>

    <main class="auth__main">
      <section class="auth__card" :class="{ 'auth__card--wide': props.wide }">
        <h1>{{ props.title }} <span>{{ props.highlight }}</span></h1>
        <p class="auth__subtitle">{{ props.subtitle }}</p>
        <slot/>
      </section>

      <p class="auth__message" aria-hidden="true">
        <span class="auth__eyebrow"><i class="pi pi-map-marker"/> Lima, Perú</span>
        {{ message }}
      </p>
    </main>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  min-height: 100vh;
  color: #fff;
  background: #02040a;
}

.auth__top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem clamp(1.25rem, 5vw, 4rem);
}

.auth__logo {
  display: inline-flex;
}

.auth__main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  min-height: calc(100vh - 92px);
  padding: 0 clamp(1.25rem, 5vw, 4rem) 2.5rem;
}

.auth__card {
  width: 100%;
  max-width: 440px;
  padding: 2.25rem;
  border: 1px solid rgba(255, 255, 255, .09);
  border-radius: 24px;
  background: rgba(8, 11, 20, .72);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, .55);
}

.auth__card--wide {
  max-width: 640px;
}

.auth__card h1 {
  color: #fff;
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.1;
}

.auth__card h1 span {
  color: #3b82f6;
}

.auth__subtitle {
  margin: .5rem 0 1.5rem;
  color: #cbd5e1;
}

.auth__message {
  position: sticky;
  bottom: 2.5rem;
  align-self: flex-end;
  max-width: 16ch;
  margin: 0 0 1rem;
  color: #fff;
  font-size: clamp(1.6rem, 2.6vw, 2.5rem);
  font-weight: 800;
  line-height: 1.12;
  text-align: right;
  text-shadow: 0 4px 24px rgba(0, 0, 0, .6);
}

.auth__eyebrow {
  display: block;
  margin-bottom: .6rem;
  color: #93c5fd;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.auth__eyebrow .pi {
  font-size: .75rem;
}

@media (max-width: 991px) {
  .auth__message {
    display: none;
  }

  .auth__main {
    justify-content: center;
    align-items: flex-start;
    min-height: auto;
  }
}

@media (max-width: 575px) {
  .auth__top {
    padding: 1rem;
  }

  .auth__main {
    padding: 0 .75rem 1.5rem;
  }

  .auth__card {
    padding: 1.5rem 1.25rem;
    border-radius: 20px;
  }

  .auth__card h1 {
    font-size: 1.8rem;
  }
}
</style>

<style>
/* Dark inputs on the authentication panel */
.auth .p-inputtext, .auth .p-select, .auth .p-password-input {
  background: rgba(255, 255, 255, .04);
  color: #fff;
  border-color: rgba(255, 255, 255, .14);
}

.auth .p-select-label, .auth .p-select-dropdown {
  color: #e5e7eb;
}

.auth label {
  color: #e5e7eb;
  font-weight: 600;
  font-size: .9rem;
}

.auth a {
  color: #60a5fa;
}
</style>
