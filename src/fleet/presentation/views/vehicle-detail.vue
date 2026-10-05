<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import {DateRange} from '@/shared/domain/model/date-range.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import VehicleMap from '@/fleet/presentation/components/vehicle-map.vue';
import UserSummary from '@/iam/presentation/components/user-summary.vue';
import {communicationStore} from '@/communication/application/communication.store.js';

/**
 * Presentation view with the details of a vehicle, its owner and the booking panel.
 */

/** @type {{id: string}} */
const props = defineProps({id: {type: String, required: true}});

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const {formatMoney, translateOrKeep} = useFormatting();

const vehicle = ref(null);
const owner = ref(null);
const loading = ref(true);
const selectedPhoto = ref(0);
const today = new Date();
const dates = ref(route.query.start && route.query.end
    ? [new Date(`${route.query.start}T00:00:00`), new Date(`${route.query.end}T00:00:00`)] : null);

const period = computed(() => dates.value?.[0] && dates.value?.[1] ? DateRange.fromDates(dates.value[0], dates.value[1]) : null);
const estimatedPrice = computed(() => vehicle.value && period.value ? vehicle.value.estimateRentalPrice(period.value) : null);
const isFavorite = computed(() => vehicle.value ? engagementStore.isFavorite(vehicle.value.id) : false);
const photos = computed(() => vehicle.value?.photos.length ? vehicle.value.photos : [vehicle.value?.mainPhotoUrl].filter(Boolean));

/**
 * Continues to the booking confirmation with the selected dates.
 */
const bookNow = () => {
  if (!period.value) {
    toast.add({severity: 'warn', summary: t('booking.select-dates'), life: 3000});
    return;
  }
  router.push({
    name: 'booking-confirmation', params: {id: vehicle.value.id},
    query: {start: period.value.startIso(), end: period.value.endIso()}
  });
};

/**
 * Adds or removes the vehicle from the favorites.
 */
const toggleFavorite = () => {
  engagementStore.toggleFavorite(iamStore.currentUser.id, vehicle.value.id)
      .then(saved => toast.add({severity: 'success', life: 2500, summary: saved ? t('engagement.added-favorite') : t('engagement.removed-favorite')}))
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));
};

/**
 * Shares the vehicle with the Web Share API or copies its link.
 */
const shareVehicle = async () => {
  const shareData = {title: `Veygo · ${vehicle.value.displayName}`, url: window.location.href};
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(shareData.url);
      toast.add({severity: 'info', summary: t('shared.link-copied'), life: 2500});
    }
  } catch (error) {
    console.warn('Sharing was cancelled or failed:', error);
  }
};

const contacting = ref(false);

/**
 * Opens (or creates) the conversation with the owner about this vehicle.
 */
const contactOwner = () => {
  contacting.value = true;
  communicationStore.startConversation({renterId: iamStore.currentUser.id, ownerId: vehicle.value.ownerId, vehicleId: vehicle.value.id})
      .then(conversation => router.push({name: 'messages', query: {conversation: conversation.id}}))
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
      .finally(() => contacting.value = false);
};

onMounted(() => {
  if (!engagementStore.loaded) engagementStore.loadFavorites(iamStore.currentUser.id);
  fleetStore.fetchVehicleById(Number(props.id))
      .then(found => {
        vehicle.value = found?.published ? found : null;
        return vehicle.value ? iamStore.fetchUserById(vehicle.value.ownerId) : null;
      })
      .then(found => owner.value = found)
      .finally(() => loading.value = false);
});
</script>

<template>
  <div class="page">
    <div v-if="loading" class="grid">
      <div class="col-12 lg:col-8"><pv-skeleton height="420px" border-radius="16px"/></div>
      <div class="col-12 lg:col-4"><pv-skeleton height="420px" border-radius="16px"/></div>
    </div>

    <unavailable-content v-else-if="!vehicle" icon="pi pi-car" :title="t('fleet.vehicle-not-found')">
      <router-link :to="{ name: 'vehicle-search' }">{{ t('fleet.back-to-results') }}</router-link>
    </unavailable-content>

    <template v-else>
      <page-header :title="vehicle.displayName" :subtitle="vehicle.location.shortLabel"
                   :back-to="{ name: 'vehicle-search' }" :back-label="t('fleet.back-to-results')">
        <template #actions>
          <pv-button :label="t('shared.share')" icon="pi pi-share-alt" outlined size="small" @click="shareVehicle"/>
          <pv-button :label="isFavorite ? t('engagement.saved') : t('engagement.save')"
                     :icon="isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'" severity="danger" outlined size="small"
                     :aria-pressed="isFavorite" @click="toggleFavorite"/>
        </template>
      </page-header>

      <div class="detail-layout">
        <div class="flex flex-column gap-4">
          <section class="veygo-card gallery" :aria-label="t('fleet.photos')">
            <img :src="photos[selectedPhoto].toString()" :alt="vehicle.displayName" class="gallery__main">
            <div v-if="photos.length > 1" class="gallery__thumbs">
              <button v-for="(photo, index) in photos" :key="photo.toString()" type="button"
                      :aria-label="t('fleet.photo-number', { number: index + 1 })" @click="selectedPhoto = index">
                <img :src="photo.toString()" alt="">
              </button>
            </div>
          </section>

          <section class="spec-tiles" :aria-label="t('fleet.specifications')">
            <div class="veygo-card spec-tile"><i class="pi pi-cog" aria-hidden="true"/>
              <span><strong>{{ t(`fleet.transmissions.${vehicle.transmission}`) }}</strong><small>{{ t('fleet.transmission') }}</small></span></div>
            <div class="veygo-card spec-tile"><i class="pi pi-bolt" aria-hidden="true"/>
              <span><strong>{{ t(`fleet.fuel-types.${vehicle.fuelType}`) }}</strong><small>{{ t('fleet.fuel-type') }}</small></span></div>
            <div class="veygo-card spec-tile"><i class="pi pi-users" aria-hidden="true"/>
              <span><strong>{{ t('fleet.seats-count', { count: vehicle.seats }) }}</strong><small>{{ t('fleet.capacity') }}</small></span></div>
            <div class="veygo-card spec-tile"><i class="pi pi-th-large" aria-hidden="true"/>
              <span><strong>{{ vehicle.doors }}</strong><small>{{ t('fleet.doors') }}</small></span></div>
          </section>

          <div class="grid">
            <section class="col-12 md:col-7">
              <div class="veygo-card h-full">
                <h2 class="veygo-card-title"><i class="pi pi-align-left" aria-hidden="true"/>{{ t('fleet.description') }}</h2>
                <p class="text-muted">{{ vehicle.description || t('fleet.no-description') }}</p>
                <h3 class="text-base mt-4 mb-2">{{ t('fleet.equipment') }}</h3>
                <ul class="feature-list">
                  <li v-for="feature in vehicle.features" :key="feature">
                    <i class="pi pi-check-circle" aria-hidden="true"/> {{ t(`fleet.features.${feature}`) }}
                  </li>
                </ul>
              </div>
            </section>
            <section class="col-12 md:col-5">
              <div class="veygo-card h-full">
                <h2 class="veygo-card-title"><i class="pi pi-map-marker" aria-hidden="true"/>{{ t('fleet.pickup-location') }}</h2>
                <p><strong>{{ vehicle.location.shortLabel }}</strong></p>
                <p class="text-muted text-sm mb-3">{{ vehicle.location.address }}</p>
                <vehicle-map :vehicles="[vehicle]" height="180px" :zoom="14" :interactive="false"/>
              </div>
            </section>
          </div>
        </div>

        <aside class="flex flex-column gap-4">
          <section class="veygo-card booking-panel" :aria-label="t('booking.book')">
            <div class="flex justify-content-between align-items-start">
              <div>
                <span class="price text-4xl">{{ formatMoney(vehicle.pricePerDay) }}</span>
                <p class="text-muted">{{ t('fleet.per-day') }}</p>
              </div>
              <pv-tag v-if="vehicle.hasReviews()" icon="pi pi-star-fill" :value="`${vehicle.rating.toFixed(1)} (${vehicle.reviewsCount})`" severity="warn"/>
            </div>
            <label for="detail-dates" class="font-semibold">{{ t('booking.select-your-dates') }}</label>
            <pv-date-picker v-model="dates" input-id="detail-dates" selection-mode="range" :min-date="today"
                            :manual-input="false" show-icon fluid :placeholder="t('fleet.dates-placeholder')"/>
            <div v-if="estimatedPrice" class="flex justify-content-between align-items-end">
              <span>{{ t('booking.days-count', { count: period.days  }, period.days ) }}</span>
              <span class="text-right"><strong class="text-2xl">{{ formatMoney(estimatedPrice) }}</strong><br>
                <small class="text-muted">{{ t('booking.total-price') }}</small></span>
            </div>
            <pv-button :label="t('booking.book-now')" size="large" fluid @click="bookNow"/>
            <p class="text-sm text-muted flex gap-2"><i class="pi pi-shield" aria-hidden="true"/>{{ t('booking.free-cancellation') }}</p>
            <p class="text-sm text-muted">{{ t('fleet.deposit-info', { amount: formatMoney(vehicle.securityDeposit) }) }}</p>
          </section>

          <user-summary v-if="owner" :user="owner" :title="t('fleet.owner')" :vehicle-id="vehicle.id"/>

          <section class="veygo-card">
            <h2 class="veygo-card-title"><i class="pi pi-comments" aria-hidden="true"/>{{ t('communication.have-question') }}</h2>
            <p class="text-muted mb-3">{{ t('communication.have-question-text') }}</p>
            <pv-button :label="t('communication.send-message')" icon="pi pi-send" outlined fluid :loading="contacting"
                       @click="contactOwner"/>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.5rem;
  align-items: start;
}

.gallery__main {
  width: 100%;
  height: 360px;
  object-fit: contain;
  background: var(--veygo-photo-bg);
  border-radius: 12px;
}

.gallery__thumbs {
  display: flex;
  gap: .5rem;
  margin-top: .75rem;
}

.gallery__thumbs button {
  border: 0;
  padding: 0;
  cursor: pointer;
  background: none;
}

.gallery__thumbs img {
  width: 90px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.spec-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.spec-tile {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 1rem;
}

.spec-tile .pi {
  font-size: 1.4rem;
  color: var(--veygo-blue);
}

.spec-tile span {
  display: flex;
  flex-direction: column;
}

.spec-tile small {
  color: var(--veygo-muted);
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;
}

.feature-list .pi {
  color: var(--veygo-green);
}

.booking-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 1199px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .spec-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gallery__main {
    height: 240px;
  }
}
</style>
