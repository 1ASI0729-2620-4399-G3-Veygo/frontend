<script setup>
import {computed, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {engagementStore} from '@/engagement/application/engagement.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {VehicleCategory} from '@/fleet/domain/model/vehicle-enums.js';
import {useBookingDetails} from '@/booking/presentation/composables/use-booking-details.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import VehicleCard from '@/fleet/presentation/components/vehicle-card.vue';
import VehicleMap from '@/fleet/presentation/components/vehicle-map.vue';
import BookingItem from '@/booking/presentation/components/booking-item.vue';
import VehicleSearchBar from '@/fleet/presentation/components/vehicle-search-bar.vue';

/**
 * Presentation view (dashboard) of the Renter: quick search, recommended vehicles,
 * vehicles near them on the map and upcoming bookings.
 */
const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const {translateOrKeep} = useFormatting();
const {vehiclesById, resolveDetails} = useBookingDetails();


const categories = [
  {value: '', icon: 'pi pi-th-large'}, {value: VehicleCategory.CAR, icon: 'pi pi-car'},
  {value: VehicleCategory.SUV, icon: 'pi pi-truck'}, {value: VehicleCategory.PICKUP, icon: 'pi pi-box'},
  {value: VehicleCategory.ELECTRIC, icon: 'pi pi-bolt'}, {value: VehicleCategory.ECONOMY, icon: 'pi pi-wallet'},
  {value: VehicleCategory.LUXURY, icon: 'pi pi-star'}
];

const user = computed(() => iamStore.currentUser);
const userDistrict = computed(() => user.value.district?.toLowerCase() ?? '');

/** Vehicles in the renter's district first, then the best rated ones. */
const recommendedVehicles = computed(() => [...fleetStore.vehicles]
    .sort((a, b) => (Number(b.location.district.toLowerCase() === userDistrict.value) - Number(a.location.district.toLowerCase() === userDistrict.value))
        || b.rating - a.rating)
    .slice(0, 3));

const upcomingBookings = computed(() => bookingStore.renterBookings
    .filter(booking => booking.isActive() && booking.period.isUpcoming())
    .sort((a, b) => a.period.start - b.period.start)
    .slice(0, 3));

/**
 * Opens the search view with the location, dates and vehicle type.
 *
 * @param {{district?: string, startDate?: string, endDate?: string, category?: string}} search - The search values.
 */
const search = (search = {}) => router.push({
  name: 'vehicle-search',
  query: {
    district: search.district || undefined, start: search.startDate || undefined,
    end: search.endDate || undefined, category: search.category || undefined
  }
});

/**
 * Adds or removes a vehicle from the favorites.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const toggleFavorite = vehicle => engagementStore.toggleFavorite(user.value.id, vehicle.id)
    .then(saved => toast.add({severity: 'success', life: 2500, summary: saved ? t('engagement.added-favorite') : t('engagement.removed-favorite')}))
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

const openDetails = vehicle => router.push({name: 'vehicle-detail', params: {id: vehicle.id}});

onMounted(() => {
  fleetStore.loadPublishedVehicles();
  if (!engagementStore.loaded) engagementStore.loadFavorites(user.value.id);
  bookingStore.loadRenterBookings(user.value.id)
      .then(() => resolveDetails(upcomingBookings.value, booking => booking.ownerId));
});
</script>

<template>
  <div class="page">
    <div class="home-layout">
      <div class="flex flex-column gap-4 min-w-0">
        <section class="hero">
          <h1>{{ t('dashboard.renter-hero-title') }} <span>{{ t('dashboard.renter-hero-highlight') }}</span></h1>
          <p>{{ t('dashboard.renter-hero-subtitle') }}</p>
          <div class="hero__search">
            <vehicle-search-bar @search-requested="search"/>
          </div>
        </section>

        <section class="veygo-card">
          <nav class="category-list" :aria-label="t('fleet.vehicle-type')">
            <button v-for="category in categories" :key="category.value" type="button" class="category-button"
                    @click="search({ category: category.value })">
              <i :class="category.icon" aria-hidden="true"/>
              <span>{{ category.value ? t(`fleet.categories.${category.value}`) : t('fleet.all-categories') }}</span>
            </button>
          </nav>
          <h2 class="text-xl mt-4 mb-3">{{ t('dashboard.recommended-near-you') }}</h2>
          <div v-if="fleetStore.loading" class="responsive-grid">
            <pv-skeleton v-for="index in 3" :key="index" height="300px" border-radius="16px"/>
          </div>
          <unavailable-content v-else-if="fleetStore.errors.length" icon="pi pi-exclamation-circle"
                               :title="t('errors.service-unavailable')" :errors="fleetStore.errors"/>
          <div v-else class="responsive-grid">
            <vehicle-card v-for="vehicle in recommendedVehicles" :key="vehicle.id" :vehicle="vehicle"
                          :favorite="engagementStore.isFavorite(vehicle.id)"
                          @favorite-toggled="toggleFavorite" @details-requested="openDetails"/>
          </div>
        </section>
      </div>

      <aside class="flex flex-column gap-4">
        <section class="veygo-card">
          <div class="flex justify-content-between align-items-center mb-3">
            <h2 class="text-lg">{{ t('dashboard.vehicles-near-you') }}</h2>
            <router-link :to="{ name: 'vehicle-search' }">{{ t('dashboard.see-map') }}</router-link>
          </div>
          <vehicle-map :vehicles="fleetStore.vehicles" height="240px" @vehicle-selected="openDetails"/>
        </section>

        <section class="veygo-card">
          <div class="flex justify-content-between align-items-center mb-2">
            <h2 class="text-lg">{{ t('dashboard.upcoming-bookings') }}</h2>
            <router-link :to="{ name: 'renter-bookings' }">{{ t('shared.see-all') }}</router-link>
          </div>
          <p v-if="!upcomingBookings.length" class="text-muted">{{ t('dashboard.no-upcoming-bookings') }}</p>
          <booking-item v-for="booking in upcomingBookings" :key="booking.id" :booking="booking" compact
                        :vehicle="vehiclesById.get(booking.vehicleId) ?? null"/>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 1.5rem;
  align-items: start;
}

.hero {
  padding: 2rem;
  border-radius: var(--veygo-radius);
  color: #fff;
  background: linear-gradient(100deg, rgba(11, 27, 63, .96) 0%, rgba(23, 37, 84, .85) 55%, rgba(37, 99, 235, .55) 100%),
  url('/images/brand/auth-cover.jpg') center / cover;
}

.hero h1 {
  color: #fff;
  font-size: clamp(1.7rem, 3.2vw, 2.6rem);
  font-weight: 800;
  line-height: 1.1;
}

.hero h1 span {
  color: #60a5fa;
}

.hero > p {
  margin: .5rem 0 1.5rem;
  color: #e2e8f0;
}

.hero__search {
  padding: 1rem;
  border-radius: 14px;
  background: var(--veygo-card);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
}

.category-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  min-width: 96px;
  padding: .8rem 1rem;
  border: 0;
  border-radius: 12px;
  background: var(--veygo-tint-blue);
  color: var(--veygo-blue-dark);
  font: inherit;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}

.category-button:hover {
  background: var(--veygo-tint-blue-strong);
}

.category-button .pi {
  font-size: 1.2rem;
}

@media (max-width: 1199px) {
  .home-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .hero {
    padding: 1.25rem;
  }

}
</style>
