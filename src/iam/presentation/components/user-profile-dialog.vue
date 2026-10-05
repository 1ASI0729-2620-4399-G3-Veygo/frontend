<script setup>
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {iamStore} from '@/iam/application/iam.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {communicationStore} from '@/communication/application/communication.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Presentation component (dialog) with the public profile of a user: identity verification,
 * reputation, seniority, published vehicles (owners) and a shortcut to send a message.
 */

/** @type {{visible: boolean, userId: number|null, vehicleId?: number|null}} */
const props = defineProps({
  visible: {type: Boolean, default: false},
  userId: {type: Number, default: null},
  vehicleId: {type: Number, default: null}
});

/** Emitted to open or close the dialog (v-model:visible). */
const emit = defineEmits(['update:visible']);

const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const {formatDate, formatMoney, translateOrKeep} = useFormatting();

const user = ref(null);
const vehicles = ref([]);
const loading = ref(false);
const starting = ref(false);

const currentUser = computed(() => iamStore.currentUser);
const canSendMessage = computed(() => currentUser.value?.canContact(user.value));

watch(() => [props.visible, props.userId], ([visible, userId]) => {
  if (!visible || !userId) return;
  loading.value = true;
  vehicles.value = [];
  iamStore.fetchUserById(userId)
      .then(found => {
        user.value = found;
        return found?.isOwner() ? fleetStore.fetchPublishedVehiclesByOwner(found.id) : [];
      })
      .then(found => vehicles.value = found)
      .finally(() => loading.value = false);
}, {immediate: true});

/**
 * Opens (or creates) the conversation with this user and goes to Messages.
 */
const sendMessage = () => {
  const renterId = currentUser.value.isRenter() ? currentUser.value.id : user.value.id;
  const ownerId = currentUser.value.isOwner() ? currentUser.value.id : user.value.id;
  starting.value = true;
  communicationStore.startConversation({renterId, ownerId, vehicleId: props.vehicleId})
      .then(conversation => {
        emit('update:visible', false);
        router.push({name: 'messages', query: {conversation: conversation.id}});
      })
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
      .finally(() => starting.value = false);
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="t('iam.public-profile')" :style="{ width: 'min(520px, 94vw)' }"
             :dismissable-mask="true" @update:visible="emit('update:visible', $event)">
    <div v-if="loading" class="flex flex-column gap-3">
      <pv-skeleton height="80px"/>
      <pv-skeleton height="120px"/>
    </div>
    <p v-else-if="!user" class="text-muted">{{ t('iam.user-not-found') }}</p>
    <div v-else class="flex flex-column gap-3">
      <div class="flex align-items-center gap-3">
        <pv-avatar v-if="!user.photoUrl.isEmpty()" :image="user.photoUrl.toString()" shape="circle" size="xlarge" :aria-label="user.fullName"/>
        <pv-avatar v-else :label="user.initials" shape="circle" size="xlarge" class="bg-primary text-white"/>
        <div class="flex flex-column gap-1">
          <strong class="text-xl">{{ user.fullName }}</strong>
          <span class="text-muted">{{ t(`iam.roles.${user.role}`) }}<template v-if="user.district"> · {{ user.district }}</template></span>
          <div class="flex flex-wrap gap-2">
            <pv-tag v-if="user.identityVerified" icon="pi pi-verified" :value="t('iam.verified')" severity="success" rounded/>
            <pv-tag v-else icon="pi pi-clock" :value="t('iam.verification-pending')" severity="warn" rounded/>
            <pv-tag v-if="user.isRenter() && user.driverLicense?.isValidForRenting()" icon="pi pi-id-card"
                    :value="t('iam.license-verified')" severity="info" rounded/>
          </div>
        </div>
      </div>
      <p v-if="user.bio" class="m-0">“{{ user.bio }}”</p>
      <div class="profile-facts">
        <div>
          <strong>{{ user.reviewsCount ? user.rating.toFixed(1) : '—' }}</strong>
          <small>{{ t('iam.reviews-count', { count: user.reviewsCount }, user.reviewsCount) }}</small>
        </div>
        <div>
          <strong>{{ formatDate(user.createdAt) }}</strong>
          <small>{{ t('iam.member-since-label') }}</small>
        </div>
        <div v-if="user.isOwner()">
          <strong>{{ vehicles.length }}</strong>
          <small>{{ t('iam.published-vehicles') }}</small>
        </div>
      </div>
      <div v-if="vehicles.length" class="flex flex-column gap-2">
        <strong>{{ t('iam.published-vehicles') }}</strong>
        <div v-for="vehicle in vehicles.slice(0, 4)" :key="vehicle.id" class="flex align-items-center gap-3">
          <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName" class="profile-vehicle">
          <span class="flex-1">{{ vehicle.displayName }}<br><small class="text-muted">{{ vehicle.location.shortLabel }}</small></span>
          <span class="price">{{ formatMoney(vehicle.pricePerDay) }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <pv-button :label="t('shared.close')" severity="secondary" text @click="emit('update:visible', false)"/>
      <pv-button v-if="canSendMessage" :label="t('communication.send-message')" icon="pi pi-send" :loading="starting"
                 @click="sendMessage"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.profile-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: .75rem;
}

.profile-facts div {
  display: flex;
  flex-direction: column;
  padding: .75rem;
  border-radius: 12px;
  background: var(--veygo-surface);
}

.profile-facts small {
  color: var(--veygo-muted);
}

.profile-vehicle {
  width: 72px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--veygo-surface);
}
</style>
