<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {iamStore} from '@/iam/application/iam.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {readImageAsDataUrl} from '@/shared/infrastructure/image-file-reader.js';
import {limaDistricts} from '@/shared/presentation/lima-districts.js';
import {saveLocale} from '@/i18n.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';

/**
 * Presentation view where users manage their personal information, photo, security,
 * preferences and account.
 */
const {t, locale} = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const {formatDate, translateOrKeep} = useFormatting();

const user = computed(() => iamStore.currentUser);
const photoInput = ref();
const savingProfile = ref(false);
const passwordDialogVisible = ref(false);
const passwordForm = reactive({currentPassword: '', newPassword: '', confirmPassword: ''});
const passwordError = ref('');
const changingPassword = ref(false);

/**
 * Converts "YYYY-MM-DD" into a Date for the date picker.
 *
 * @param {string} value - The ISO date.
 * @returns {Date|null}
 */
const toDate = value => value ? new Date(`${value}T00:00:00`) : null;

/**
 * Converts a Date into "YYYY-MM-DD".
 *
 * @param {Date|null} date - The date.
 * @returns {string}
 */
const toIso = date => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

const form = reactive({
  fullName: user.value.fullName, email: user.value.email, phone: user.value.phone,
  birthDate: toDate(user.value.birthDate), address: user.value.address, district: user.value.district || null, bio: user.value.bio
});

const languageOptions = [{label: 'English', value: 'en'}, {label: 'Español', value: 'es'}];

const stats = computed(() => {
  if (user.value.isRenter()) {
    const bookings = bookingStore.renterBookings;
    const finished = bookings.filter(booking => booking.isFinished()).length;
    const closed = bookings.filter(booking => !booking.isActive()).length;
    return [
      {icon: 'pi pi-calendar', value: bookings.length, label: t('iam.stats.total-bookings')},
      {icon: 'pi pi-heart', value: engagementStore.favorites.length, label: t('iam.stats.favorites')},
      {icon: 'pi pi-star', value: user.value.reviewsCount ? user.value.rating.toFixed(1) : '—', label: t('iam.stats.rating')},
      {icon: 'pi pi-thumbs-up', value: closed ? `${Math.round(finished * 100 / closed)}%` : '—', label: t('iam.stats.completed')}
    ];
  }
  return [
    {icon: 'pi pi-car', value: fleetStore.ownerVehicles.length, label: t('iam.stats.vehicles')},
    {icon: 'pi pi-calendar', value: bookingStore.ownerBookings.length, label: t('iam.stats.bookings-received')},
    {icon: 'pi pi-star', value: user.value.reviewsCount ? user.value.rating.toFixed(1) : '—', label: t('iam.stats.rating')},
    {icon: 'pi pi-comments', value: user.value.reviewsCount, label: t('iam.stats.reviews')}
  ];
});

/**
 * Shows the result of an operation.
 *
 * @param {Promise} request - The operation.
 * @param {string} successKey - i18n key of the success message.
 * @returns {Promise}
 */
const notify = (request, successKey) => request
    .then(() => toast.add({severity: 'success', summary: t(successKey), life: 2500}))
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

/**
 * Validates and saves the personal information.
 */
const saveProfile = () => {
  if (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
    toast.add({severity: 'warn', summary: t('errors.required-fields'), life: 3000});
    return;
  }
  savingProfile.value = true;
  notify(iamStore.updateProfile({...form, birthDate: toIso(form.birthDate), district: form.district ?? ''}), 'iam.profile-saved')
      .finally(() => savingProfile.value = false);
};

/**
 * Reads the chosen photo, compresses it and saves it as the profile photo.
 *
 * @param {Event} event - The change event of the file input.
 */
const changePhoto = event => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  notify(readImageAsDataUrl(file, 320, 0.85).then(dataUrl => iamStore.updatePhoto(dataUrl)), 'iam.photo-updated');
};

/**
 * Changes the password after validating the form.
 */
const changePassword = () => {
  passwordError.value = '';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('errors.password-mismatch');
    return;
  }
  changingPassword.value = true;
  iamStore.changePassword({currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword})
      .then(() => {
        passwordDialogVisible.value = false;
        Object.assign(passwordForm, {currentPassword: '', newPassword: '', confirmPassword: ''});
        toast.add({severity: 'success', summary: t('iam.password-changed'), life: 2500});
      })
      .catch(message => passwordError.value = translateOrKeep(message))
      .finally(() => changingPassword.value = false);
};

/**
 * Saves a preference.
 *
 * @param {Object} changes - The preference to change.
 */
const updatePreference = changes => notify(iamStore.updatePreferences(changes), 'iam.preferences-saved');

/**
 * Changes the interface language.
 *
 * @param {string} value - The locale.
 */
const changeLanguage = value => {
  locale.value = value;
  document.documentElement.lang = value;
  saveLocale(value);
};

/**
 * Asks for confirmation and deletes the account.
 */
const deleteAccount = () => confirm.require({
  header: t('iam.delete-account'),
  message: t('iam.delete-account-confirmation'),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: {label: t('shared.cancel'), outlined: true},
  acceptProps: {label: t('iam.delete-account'), severity: 'danger'},
  accept: () => iamStore.deleteAccount()
      .then(() => router.push({name: 'sign-in'}))
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
});

onMounted(() => {
  if (user.value.isRenter()) {
    bookingStore.loadRenterBookings(user.value.id);
    engagementStore.loadFavorites(user.value.id);
  } else {
    fleetStore.loadOwnerVehicles(user.value.id);
    bookingStore.loadOwnerBookings(user.value.id);
  }
});
</script>

<template>
  <div class="page">
    <page-header :title="t('iam.profile-title')" :subtitle="t('iam.profile-subtitle')"/>

    <div class="grid">
      <div class="col-12 xl:col-6 flex flex-column gap-3">
        <section class="veygo-card profile-card">
          <div class="profile-card__photo">
            <pv-avatar v-if="!user.photoUrl.isEmpty()" :image="user.photoUrl.toString()" shape="circle" class="profile-avatar"
                       :aria-label="user.fullName"/>
            <pv-avatar v-else :label="user.initials" shape="circle" class="profile-avatar bg-primary text-white"/>
            <pv-button icon="pi pi-camera" rounded size="small" class="profile-card__camera" :aria-label="t('iam.change-photo')"
                       @click="photoInput.click()"/>
            <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="changePhoto">
          </div>
          <div class="flex flex-column gap-1 min-w-0">
            <h2 class="text-2xl">{{ user.fullName }}</h2>
            <span class="text-muted">{{ t(`iam.roles.${user.role}`) }}</span>
            <span v-if="user.bio" class="text-muted text-sm">{{ user.bio }}</span>
            <ul class="contact-list">
              <li><i class="pi pi-envelope" aria-hidden="true"/>{{ user.email }}</li>
              <li v-if="user.phone"><i class="pi pi-phone" aria-hidden="true"/>{{ user.phone }}</li>
              <li v-if="user.district"><i class="pi pi-map-marker" aria-hidden="true"/>{{ user.district }}, Lima</li>
              <li><i class="pi pi-calendar" aria-hidden="true"/>{{ t('iam.member-since', { date: formatDate(user.createdAt) }) }}</li>
            </ul>
          </div>
        </section>

        <form class="veygo-card" novalidate @submit.prevent="saveProfile">
          <h2 class="veygo-card-title"><i class="pi pi-user" aria-hidden="true"/>{{ t('iam.personal-information') }}</h2>
          <div class="grid">
            <div class="col-12 md:col-6 field-group">
              <label for="profile-name">{{ t('iam.full-name') }}</label>
              <pv-input-text id="profile-name" v-model="form.fullName" autocomplete="name" fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="profile-email">{{ t('iam.email') }}</label>
              <pv-input-text id="profile-email" v-model="form.email" type="email" autocomplete="email" fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="profile-phone">{{ t('iam.phone') }}</label>
              <pv-input-text id="profile-phone" v-model="form.phone" type="tel" autocomplete="tel" fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="profile-birth">{{ t('iam.birth-date') }}</label>
              <pv-date-picker v-model="form.birthDate" input-id="profile-birth" :max-date="new Date()" show-icon fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="profile-address">{{ t('iam.address') }}</label>
              <pv-input-text id="profile-address" v-model="form.address" autocomplete="street-address" fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="profile-district">{{ t('iam.district') }}</label>
              <pv-select input-id="profile-district" v-model="form.district" :options="limaDistricts" filter fluid/>
            </div>
            <div class="col-12 field-group">
              <label for="profile-bio">{{ t('iam.bio') }}</label>
              <pv-input-text id="profile-bio" v-model="form.bio" maxlength="120" :placeholder="t('iam.bio-placeholder')" fluid/>
            </div>
          </div>
          <div class="flex justify-content-end">
            <pv-button type="submit" :label="t('shared.save-changes')" icon="pi pi-check" :loading="savingProfile"/>
          </div>
        </form>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-lock" aria-hidden="true"/>{{ t('iam.security') }}</h2>
          <div class="setting-row">
            <i class="pi pi-key" aria-hidden="true"/>
            <span><strong>{{ t('iam.password') }}</strong>
              <small>{{ user.passwordUpdatedAt ? t('iam.password-updated', { date: formatDate(user.passwordUpdatedAt) }) : '' }}</small></span>
            <pv-button :label="t('iam.change')" outlined size="small" @click="passwordDialogVisible = true"/>
          </div>
          <div class="setting-row">
            <i class="pi pi-id-card" aria-hidden="true"/>
            <span><strong>{{ t('iam.identity-verification') }}</strong>
              <small>{{ user.identityVerified ? t('iam.identity-verified-text') : t('iam.identity-pending-text') }}</small></span>
            <pv-tag v-if="user.identityVerified" icon="pi pi-verified" :value="t('iam.verified')" severity="success" rounded/>
            <pv-tag v-else icon="pi pi-clock" :value="t('iam.verification-pending')" severity="warn" rounded/>
          </div>
          <div class="setting-row">
            <i class="pi pi-shield" aria-hidden="true"/>
            <label for="pref-2fa"><strong>{{ t('iam.two-factor') }}</strong><small>{{ t('iam.two-factor-text') }}</small></label>
            <pv-toggle-switch input-id="pref-2fa" :model-value="user.preferences.twoFactor"
                              @update:model-value="updatePreference({ twoFactor: $event })"/>
          </div>
        </section>
      </div>

      <div class="col-12 xl:col-6 flex flex-column gap-3">
        <section class="veygo-card profile-stats" :aria-label="t('iam.activity')">
          <div v-for="stat in stats" :key="stat.label">
            <i :class="stat.icon" aria-hidden="true"/>
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.label }}</small>
          </div>
        </section>

        <section v-if="user.isRenter()" class="veygo-card">
          <div class="flex justify-content-between align-items-center mb-3">
            <h2 class="veygo-card-title m-0"><i class="pi pi-id-card" aria-hidden="true"/>{{ t('iam.driver-license') }}</h2>
            <pv-tag v-if="user.driverLicense?.verified" icon="pi pi-check" :value="t('iam.verified')" severity="success" rounded/>
            <pv-tag v-else icon="pi pi-clock" :value="t('iam.verification-pending')" severity="warn" rounded/>
          </div>
          <template v-if="user.driverLicense">
            <pv-message :severity="user.driverLicense.isValidForRenting() ? 'success' : 'warn'" class="mb-3">
              {{ user.driverLicense.isValidForRenting() ? t('iam.license-valid-text') : t('iam.license-pending-text') }}
            </pv-message>
            <dl class="facts-grid">
              <div><dt>{{ t('iam.license-number') }}</dt><dd>{{ user.driverLicense.number }}</dd></div>
              <div><dt>{{ t('iam.license-category') }}</dt><dd>{{ user.driverLicense.category }}</dd></div>
              <div><dt>{{ t('iam.license-issued') }}</dt><dd>{{ user.driverLicense.issuedAt || '—' }}</dd></div>
              <div><dt>{{ t('iam.license-expires') }}</dt><dd>{{ user.driverLicense.expiresAt || '—' }}</dd></div>
            </dl>
          </template>
          <p v-else class="text-muted">{{ t('iam.no-license') }}</p>
        </section>

        <section v-else class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-briefcase" aria-hidden="true"/>{{ t('iam.owner-information') }}</h2>
          <dl class="facts-grid">
            <div><dt>{{ t('iam.owner-type') }}</dt><dd>{{ user.ownerType ? t(`iam.owner-types.${user.ownerType}`) : '—' }}</dd></div>
            <div><dt>{{ t('iam.document-number') }}</dt><dd>{{ user.documentNumber }}</dd></div>
          </dl>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-sliders-h" aria-hidden="true"/>{{ t('iam.preferences') }}</h2>
          <div class="setting-row">
            <i class="pi pi-bell" aria-hidden="true"/>
            <label for="pref-notifications"><strong>{{ t('iam.pref-notifications') }}</strong><small>{{ t('iam.pref-notifications-text') }}</small></label>
            <pv-toggle-switch input-id="pref-notifications" :model-value="user.preferences.notifications"
                              @update:model-value="updatePreference({ notifications: $event })"/>
          </div>
          <div class="setting-row">
            <i class="pi pi-megaphone" aria-hidden="true"/>
            <label for="pref-promotions"><strong>{{ t('iam.pref-promotions') }}</strong><small>{{ t('iam.pref-promotions-text') }}</small></label>
            <pv-toggle-switch input-id="pref-promotions" :model-value="user.preferences.promotions"
                              @update:model-value="updatePreference({ promotions: $event })"/>
          </div>
          <div class="setting-row">
            <i class="pi pi-globe" aria-hidden="true"/>
            <label for="pref-language"><strong>{{ t('iam.pref-language') }}</strong></label>
            <pv-select input-id="pref-language" :model-value="locale" :options="languageOptions" option-label="label"
                       option-value="value" @update:model-value="changeLanguage"/>
          </div>
          <div class="setting-row">
            <i class="pi pi-moon" aria-hidden="true"/>
            <label for="pref-dark"><strong>{{ t('iam.pref-dark-mode') }}</strong><small>{{ t('iam.pref-dark-mode-text') }}</small></label>
            <pv-toggle-switch input-id="pref-dark" :model-value="user.preferences.darkMode"
                              @update:model-value="updatePreference({ darkMode: $event })"/>
          </div>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title danger-title"><i class="pi pi-trash" aria-hidden="true"/>{{ t('iam.delete-account') }}</h2>
          <div class="flex flex-wrap align-items-center justify-content-between gap-3">
            <p class="text-muted m-0 flex-1">{{ t('iam.delete-account-text') }}</p>
            <pv-button :label="t('iam.delete-account')" severity="danger" outlined @click="deleteAccount"/>
          </div>
        </section>
      </div>
    </div>

    <pv-dialog v-model:visible="passwordDialogVisible" modal :header="t('iam.change-password')" :style="{ width: 'min(440px, 94vw)' }">
      <form class="flex flex-column gap-3" novalidate @submit.prevent="changePassword">
        <div class="field-group">
          <label for="current-password">{{ t('iam.current-password') }}</label>
          <pv-password input-id="current-password" v-model="passwordForm.currentPassword" :feedback="false" toggle-mask fluid autocomplete="current-password"/>
        </div>
        <div class="field-group">
          <label for="new-password">{{ t('iam.new-password') }}</label>
          <pv-password input-id="new-password" v-model="passwordForm.newPassword" toggle-mask fluid autocomplete="new-password"/>
        </div>
        <div class="field-group">
          <label for="confirm-new-password">{{ t('iam.confirm-password') }}</label>
          <pv-password input-id="confirm-new-password" v-model="passwordForm.confirmPassword" :feedback="false" toggle-mask fluid autocomplete="new-password"/>
        </div>
        <pv-message v-if="passwordError" severity="error" role="alert">{{ passwordError }}</pv-message>
        <div class="flex justify-content-end gap-2">
          <pv-button :label="t('shared.cancel')" severity="secondary" text @click="passwordDialogVisible = false"/>
          <pv-button type="submit" :label="t('iam.change-password')" :loading="changingPassword"/>
        </div>
      </form>
    </pv-dialog>
  </div>
</template>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.profile-card__photo {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  font-size: 2.5rem;
}

.profile-card__camera {
  position: absolute !important;
  right: 0;
  bottom: 4px;
}

.contact-list {
  list-style: none;
  margin: .5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  font-size: .9rem;
  color: var(--veygo-muted);
}

.contact-list li {
  display: flex;
  gap: .6rem;
  align-items: center;
  overflow-wrap: anywhere;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.field-group label {
  font-weight: 600;
  font-size: .85rem;
}

.setting-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: .75rem;
  padding: .7rem 0;
}

.setting-row + .setting-row {
  border-top: 1px solid var(--veygo-line);
}

.setting-row > .pi {
  color: var(--veygo-muted);
  font-size: 1.15rem;
}

.setting-row strong, .setting-row small {
  display: block;
}

.setting-row small {
  color: var(--veygo-muted);
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .5rem;
  text-align: center;
}

.profile-stats div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
}

.profile-stats .pi {
  font-size: 1.5rem;
  color: var(--veygo-blue);
}

.profile-stats strong {
  font-size: 1.4rem;
}

.profile-stats small {
  color: var(--veygo-muted);
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.facts-grid dt {
  font-weight: 600;
  font-size: .85rem;
}

.facts-grid dd {
  margin: 0;
  color: var(--veygo-muted);
}

.danger-title, .danger-title .pi {
  color: #dc2626;
}

@media (max-width: 575px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
  }

  .contact-list li {
    justify-content: center;
  }

  .profile-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
