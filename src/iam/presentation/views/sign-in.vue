<script setup>
import {reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {homeRouteFor} from '@/router/index.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import AuthPanel from '@/iam/presentation/components/auth-panel.vue';

/**
 * Presentation view for signing in to Veygo.
 */
const {t} = useI18n();
const router = useRouter();
const route = useRoute();
const {translateOrKeep} = useFormatting();

const form = reactive({email: '', password: ''});
const submitting = ref(false);
const errorMessage = ref('');

/**
 * Validates the form and signs in; redirects to the requested page or the role home.
 */
const signIn = () => {
  errorMessage.value = '';
  if (!form.email || !form.password) {
    errorMessage.value = t('errors.required-credentials');
    return;
  }
  submitting.value = true;
  iamStore.signIn({...form})
      .then(user => router.push(route.query.redirect || homeRouteFor(user)))
      .catch(message => errorMessage.value = translateOrKeep(message))
      .finally(() => submitting.value = false);
};
</script>

<template>
  <auth-panel :title="t('iam.sign-in-title')" :highlight="t('iam.sign-in-highlight')" :subtitle="t('iam.sign-in-subtitle')">
    <form class="flex flex-column gap-3" novalidate @submit.prevent="signIn">
      <div class="flex flex-column gap-2">
        <label for="email">{{ t('iam.email') }}</label>
        <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email"
                       :placeholder="t('iam.email-placeholder')" fluid/>
      </div>
      <div class="flex flex-column gap-2">
        <label for="password">{{ t('iam.password') }}</label>
        <pv-password input-id="password" v-model="form.password" :feedback="false" toggle-mask fluid
                     autocomplete="current-password" :placeholder="t('iam.password-placeholder')"/>
      </div>
      <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
      <pv-button type="submit" :label="t('iam.sign-in')" :loading="submitting" size="large" fluid/>
      <p class="text-center text-sm">
        {{ t('iam.no-account') }}
        <router-link :to="{ name: 'sign-up' }">{{ t('iam.sign-up-here') }}</router-link>
      </p>
      <p class="demo-hint"><i class="pi pi-info-circle" aria-hidden="true"/> {{ t('iam.demo-accounts') }}</p>
    </form>
  </auth-panel>
</template>

<style scoped>
.demo-hint {
  margin: .5rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, .08);
  color: #94a3b8;
  font-size: .78rem;
  line-height: 1.5;
}
</style>
