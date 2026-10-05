<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import VehicleCard from '@/fleet/presentation/components/vehicle-card.vue';

/**
 * Presentation view with the vehicles a renter saved to review later.
 */
const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const {translateOrKeep} = useFormatting();

const vehiclesById = ref(new Map());
const loading = ref(true);

const favoriteVehicles = computed(() => engagementStore.favorites
    .map(favorite => vehiclesById.value.get(favorite.vehicleId))
    .filter(Boolean));

/**
 * Removes a vehicle from the favorites.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const removeFavorite = vehicle => engagementStore.toggleFavorite(iamStore.currentUser.id, vehicle.id)
    .then(() => toast.add({severity: 'success', summary: t('engagement.removed-favorite'), life: 2500}))
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

onMounted(() => engagementStore.loadFavorites(iamStore.currentUser.id)
    .then(() => fleetStore.fetchVehiclesByIds(engagementStore.favorites.map(favorite => favorite.vehicleId)))
    .then(vehicles => vehiclesById.value = vehicles)
    .finally(() => loading.value = false));
</script>

<template>
  <div class="page">
    <page-header :title="t('engagement.favorites-title')" :subtitle="t('engagement.favorites-subtitle')"/>
    <div v-if="loading" class="responsive-grid">
      <pv-skeleton v-for="index in 4" :key="index" height="320px" border-radius="16px"/>
    </div>
    <unavailable-content v-else-if="engagementStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="engagementStore.errors"/>
    <unavailable-content v-else-if="!favoriteVehicles.length" icon="pi pi-heart" :title="t('engagement.no-favorites')">
      <pv-button :label="t('fleet.search-vehicles')" icon="pi pi-search" @click="router.push({ name: 'vehicle-search' })"/>
    </unavailable-content>
    <div v-else class="responsive-grid">
      <vehicle-card v-for="vehicle in favoriteVehicles" :key="vehicle.id" :vehicle="vehicle" favorite show-book
                    @favorite-toggled="removeFavorite"
                    @details-requested="router.push({ name: 'vehicle-detail', params: { id: $event.id } })"
                    @booking-requested="router.push({ name: 'vehicle-detail', params: { id: $event.id } })"/>
    </div>
  </div>
</template>
