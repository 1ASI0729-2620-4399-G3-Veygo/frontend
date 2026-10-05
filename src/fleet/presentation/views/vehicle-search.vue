<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {DateRange} from '@/shared/domain/model/date-range.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import VehicleCard from '@/fleet/presentation/components/vehicle-card.vue';
import VehicleFilters from '@/fleet/presentation/components/vehicle-filters.vue';
import VehicleMap from '@/fleet/presentation/components/vehicle-map.vue';
import VehicleSearchBar from '@/fleet/presentation/components/vehicle-search-bar.vue';

/**
 * Presentation view where renters search vehicles by location, dates, type and filters,
 * with results shown as cards and on a map.
 *
 * @remarks
 * When pickup and return dates are given, the availability of every result is checked so
 * the renter can hide vehicles already booked or blocked on those days.
 */
const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const {formatRange, translateOrKeep} = useFormatting();

const initialSearch = {
  district: route.query.district ?? '', startDate: route.query.start ?? '', endDate: route.query.end ?? '',
  category: route.query.category ?? ''
};
const period = ref(null);
const availability = ref(new Map());
const onlyAvailable = ref(true);
const checkingAvailability = ref(false);

const vehicles = computed(() => fleetStore.filteredVehicles
    .filter(vehicle => !period.value || !onlyAvailable.value || availability.value.get(vehicle.id) !== false));

/**
 * Builds the rental period from "YYYY-MM-DD" values (the return date defaults to the next day).
 *
 * @param {string} start - Pickup date.
 * @param {string} end - Return date.
 * @returns {DateRange|null}
 */
const buildPeriod = (start, end) => {
  if (!start) return null;
  if (end) return new DateRange(start, end);
  const next = new Date(`${start}T00:00:00`);
  next.setDate(next.getDate() + 1);
  return DateRange.fromDates(new Date(`${start}T00:00:00`), next);
};

/**
 * Checks the availability of the published vehicles for the selected period.
 */
const checkAvailability = () => {
  availability.value = new Map();
  if (!period.value) return;
  checkingAvailability.value = true;
  Promise.all(fleetStore.vehicles.map(vehicle => bookingStore.isVehicleAvailable(vehicle.id, period.value)
      .then(available => [vehicle.id, available])
      .catch(() => [vehicle.id, true])))
      .then(entries => availability.value = new Map(entries))
      .finally(() => checkingAvailability.value = false);
};

/**
 * Applies the values of the search bar.
 *
 * @param {{district: string, startDate: string, endDate: string, category: string}} search - The search.
 */
const applySearch = search => {
  fleetStore.setCriteria({district: search.district, category: search.category});
  period.value = buildPeriod(search.startDate, search.endDate);
  router.replace({query: {
    district: search.district || undefined, category: search.category || undefined,
    start: period.value?.startIso(), end: period.value?.endIso()
  }});
  checkAvailability();
};

/**
 * Opens the detail of a vehicle, carrying the selected dates.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const openDetails = vehicle => router.push({
  name: 'vehicle-detail', params: {id: vehicle.id},
  query: period.value ? {start: period.value.startIso(), end: period.value.endIso()} : {}
});

/**
 * Adds or removes a vehicle from the favorites.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const toggleFavorite = vehicle => {
  engagementStore.toggleFavorite(iamStore.currentUser.id, vehicle.id)
      .then(isFavorite => toast.add({
        severity: 'success', life: 2500,
        summary: isFavorite ? t('engagement.added-favorite') : t('engagement.removed-favorite')
      }))
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));
};

const clearFilters = () => fleetStore.setCriteria({transmissions: [], fuelTypes: [], priceRange: [0, 1000], minRating: 0});

watch(() => fleetStore.vehicles, checkAvailability);

onMounted(() => {
  fleetStore.clearCriteria();
  fleetStore.setCriteria({district: initialSearch.district, category: initialSearch.category});
  period.value = buildPeriod(initialSearch.startDate, initialSearch.endDate);
  fleetStore.loadPublishedVehicles();
  if (!engagementStore.loaded) engagementStore.loadFavorites(iamStore.currentUser.id);
});
</script>

<template>
  <div class="page">
    <page-header :title="t('fleet.search-title')" :subtitle="t('fleet.search-subtitle')"/>

    <section class="veygo-card">
      <vehicle-search-bar :initial="initialSearch" @search-requested="applySearch"/>
    </section>

    <div class="search-layout">
      <div class="flex flex-column gap-3">
        <vehicle-filters :criteria="fleetStore.criteria" @criteria-changed="fleetStore.setCriteria($event)"
                         @criteria-cleared="clearFilters"/>
        <section v-if="period" class="veygo-card">
          <h3 class="text-base mb-2">{{ t('fleet.availability-filter') }}</h3>
          <div class="flex align-items-center gap-2">
            <pv-toggle-switch v-model="onlyAvailable" input-id="only-available"/>
            <label for="only-available">{{ t('fleet.only-available') }}</label>
          </div>
          <small class="text-muted block mt-2">{{ formatRange(period) }}</small>
        </section>
      </div>

      <section class="veygo-card" aria-live="polite">
        <h2 class="text-xl mb-3">
          {{ t('fleet.vehicles-available', { count: vehicles.length }, vehicles.length) }}
          <i v-if="checkingAvailability" class="pi pi-spin pi-spinner text-base" :aria-label="t('fleet.checking-availability')"/>
        </h2>
        <div v-if="fleetStore.loading" class="results-grid">
          <pv-skeleton v-for="index in 4" :key="index" height="320px" border-radius="16px"/>
        </div>
        <unavailable-content v-else-if="fleetStore.errors.length" icon="pi pi-exclamation-circle"
                             :title="t('errors.service-unavailable')" :errors="fleetStore.errors"/>
        <unavailable-content v-else-if="!vehicles.length" icon="pi pi-search" :title="t('fleet.no-results')">
          <pv-button :label="t('fleet.clear-all')" outlined @click="clearFilters"/>
        </unavailable-content>
        <div v-else class="results-grid">
          <vehicle-card v-for="vehicle in vehicles" :key="vehicle.id" :vehicle="vehicle"
                        :favorite="engagementStore.isFavorite(vehicle.id)"
                        :unavailable="period !== null && availability.get(vehicle.id) === false"
                        @favorite-toggled="toggleFavorite" @details-requested="openDetails"/>
        </div>
      </section>

      <section class="search-map">
        <vehicle-map :vehicles="vehicles" height="100%" @vehicle-selected="openDetails"/>
      </section>
    </div>
  </div>
</template>

<style scoped>
.search-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) minmax(260px, 340px);
  gap: 1.25rem;
  align-items: start;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.search-map {
  position: sticky;
  top: 96px;
  height: calc(100vh - 128px);
  min-height: 360px;
}

@media (max-width: 1279px) {
  .search-layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .search-map {
    grid-column: 1 / -1;
    position: static;
    height: 380px;
  }
}

@media (max-width: 767px) {
  .search-layout {
    grid-template-columns: 1fr;
  }
}
</style>
