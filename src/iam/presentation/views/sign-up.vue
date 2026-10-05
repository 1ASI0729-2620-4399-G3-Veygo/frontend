<script setup>
import {computed, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {iamStore} from '@/iam/application/iam.store.js';
import {UserRole} from '@/iam/domain/model/user-role.js';
import {homeRouteFor} from '@/router/index.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import {limaDistricts} from '@/shared/presentation/lima-districts.js';
import AuthPanel from '@/iam/presentation/components/auth-panel.vue';
import RoleOption from '@/iam/presentation/components/role-option.vue';

/**
 * Presentation view for creating a Veygo account as Renter or Owner.
 *
 * @remarks
 * The Landing Page call-to-actions open this view with `?role=renter` or `?role=owner`.
 */
const {t} = useI18n();
const router = useRouter();
const route = useRoute();
const {translateOrKeep} = useFormatting();

const initialRole = Object.values(UserRole).includes(route.query.role) ? route.query.role : UserRole.RENTER;

const form = reactive({
  role: initialRole, fullName: '', email: '', password: '', confirmPassword: '', documentNumber: '',
  driverLicenseNumber: '', phone: '', district: null, ownerType: null, acceptedTerms: false
});
const submitting = ref(false);
const errorMessage = ref('');

const isOwner = computed(() => form.role === UserRole.OWNER);
const ownerTypes = computed(() => [
  {label: t('iam.owner-types.individual'), value: 'individual'},
  {label: t('iam.owner-types.small-agency'), value: 'small-agency'}
]);

/**
 * Validates the form fields.
 *
 * @returns {string} The first validation error key, or an empty string.
 */
const validate = () => {
  if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.documentNumber || !form.district) return 'errors.required-fields';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'errors.invalid-email';
  if (form.password.length < 8) return 'errors.password-length';
  if (form.password !== form.confirmPassword) return 'errors.password-mismatch';
  if (!/^\d{8}$/.test(form.documentNumber)) return 'errors.invalid-dni';
  if (!isOwner.value && !form.driverLicenseNumber.trim()) return 'errors.license-required';
  if (isOwner.value && (!form.phone.trim() || !form.ownerType)) return 'errors.required-fields';
  if (!form.acceptedTerms) return 'errors.accept-terms';
  return '';
};

/**
 * Creates the account and redirects to the home of the selected role.
 */
const signUp = () => {
  errorMessage.value = '';
  const error = validate();
  if (error) {
    errorMessage.value = t(error);
    return;
  }
  submitting.value = true;
  iamStore.signUp({...form})
      .then(user => router.push(homeRouteFor(user)))
      .catch(message => errorMessage.value = translateOrKeep(message))
      .finally(() => submitting.value = false);
};
</script>

<template>
  <auth-panel :title="t('iam.sign-up-title')" :highlight="t('iam.sign-up-highlight')" :subtitle="t('iam.sign-up-subtitle')"
              wide :audience="form.role">
    <form class="flex flex-column gap-3" novalidate @submit.prevent="signUp">
      <fieldset class="p-0 m-0 border-none">
        <legend class="font-semibold mb-2">{{ t('iam.how-use-veygo') }}</legend>
        <div class="grid" role="radiogroup">
          <div class="col-12 sm:col-6">
            <role-option value="renter" :selected="form.role === 'renter'" icon="pi pi-car"
                         :title="t('iam.renter-option')" :description="t('iam.renter-option-text')"
                         @selected="form.role = $event"/>
          </div>
          <div class="col-12 sm:col-6">
            <role-option value="owner" :selected="form.role === 'owner'" icon="pi pi-key"
                         :title="t('iam.owner-option')" :description="t('iam.owner-option-text')"
                         @selected="form.role = $event"/>
          </div>
        </div>
      </fieldset>

      <h2 class="text-base text-white m-0">{{ t('iam.personal-information') }}</h2>
      <div class="grid">
        <div class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="fullName">{{ t('iam.full-name') }}</label>
          <pv-input-text id="fullName" v-model="form.fullName" autocomplete="name" :placeholder="t('iam.full-name-placeholder')" fluid/>
        </div>
        <div class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="email">{{ t('iam.email') }}</label>
          <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email" :placeholder="t('iam.email-placeholder')" fluid/>
        </div>
        <div class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="password">{{ t('iam.password') }}</label>
          <pv-password input-id="password" v-model="form.password" toggle-mask fluid autocomplete="new-password"
                       :feedback="false" :placeholder="t('iam.password-placeholder')"/>
        </div>
        <div class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="confirmPassword">{{ t('iam.confirm-password') }}</label>
          <pv-password input-id="confirmPassword" v-model="form.confirmPassword" toggle-mask fluid
                       autocomplete="new-password" :feedback="false" :placeholder="t('iam.password-placeholder')"/>
        </div>
      </div>

      <h2 class="text-base text-white m-0">{{ isOwner ? t('iam.owner-information') : t('iam.renter-information') }}</h2>
      <div class="grid">
        <div class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="documentNumber">{{ t('iam.document-number') }}</label>
          <pv-input-text id="documentNumber" v-model="form.documentNumber" inputmode="numeric" maxlength="8"
                         :placeholder="t('iam.document-placeholder')" fluid/>
        </div>
        <div v-if="!isOwner" class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="driverLicenseNumber">{{ t('iam.driver-license') }}</label>
          <pv-input-text id="driverLicenseNumber" v-model="form.driverLicenseNumber" :placeholder="t('iam.license-placeholder')" fluid/>
        </div>
        <div v-else class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="phone">{{ t('iam.phone') }}</label>
          <pv-input-text id="phone" v-model="form.phone" type="tel" autocomplete="tel" :placeholder="t('iam.phone-placeholder')" fluid/>
        </div>
        <div class="col-12 flex flex-column gap-2" :class="{ 'sm:col-6': isOwner }">
          <label for="district">{{ t('iam.district') }}</label>
          <pv-select input-id="district" v-model="form.district" :options="limaDistricts" filter
                     :placeholder="t('iam.district-placeholder')" fluid/>
        </div>
        <div v-if="isOwner" class="col-12 sm:col-6 flex flex-column gap-2">
          <label for="ownerType">{{ t('iam.owner-type') }}</label>
          <pv-select input-id="ownerType" v-model="form.ownerType" :options="ownerTypes" option-label="label"
                     option-value="value" :placeholder="t('iam.owner-type-placeholder')" fluid/>
        </div>
      </div>

      <div class="flex align-items-center gap-2">
        <pv-checkbox v-model="form.acceptedTerms" input-id="acceptedTerms" binary/>
        <label for="acceptedTerms" class="font-normal">
          {{ t('iam.accept') }} <router-link :to="{ name: 'terms' }" target="_blank">{{ t('shared.terms') }}</router-link>
        </label>
      </div>
      <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
      <pv-button type="submit" :label="t('iam.create-account')" :loading="submitting" size="large" fluid/>
      <p class="text-center text-sm">
        {{ t('iam.have-account') }}
        <router-link :to="{ name: 'sign-in' }">{{ t('iam.sign-in') }}</router-link>
      </p>
    </form>
  </auth-panel>
</template>
