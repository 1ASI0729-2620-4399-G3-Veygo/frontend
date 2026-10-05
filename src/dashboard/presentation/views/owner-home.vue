<script setup>
import {computed, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {Money} from '@/shared/domain/model/money.js';
import {useBookingDetails} from '@/booking/presentation/composables/use-booking-details.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import OwnerVehicleItem from '@/fleet/presentation/components/owner-vehicle-item.vue';
import BookingItem from '@/booking/presentation/components/booking-item.vue';
import QuickAction from '@/dashboard/presentation/components/quick-action.vue';

/**
 * Presentation view (dashboard) of the Owner: fleet and booking metrics, vehicles,
 * upcoming bookings and quick actions.
 */
const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const {formatMoney, translateOrKeep} = useFormatting();
const {vehiclesById, resolveDetails} = useBookingDetails();

const user = computed(() => iamStore.currentUser);
const vehicles = computed(() => fleetStore.ownerVehicles);
const bookings = computed(() => bookingStore.ownerBookings);

const publishedCount = computed(() => vehicles.value.filter(vehicle => vehicle.published).length);
const upcomingBookings = computed(() => bookings.value
    .filter(booking => booking.isActive() && booking.period.isUpcoming())
    .sort((a, b) => a.period.start - b.period.start));
const pendingCount = computed(() => bookings.value.filter(booking => booking.isPending()).length);

/** Income of the rentals completed this month (same rule as Transactions). */
const totalIncome = computed(() => {
  const now = new Date();
  return bookings.value
      .filter(booking => booking.isFinished() && booking.period.end.getMonth() === now.getMonth()
          && booking.period.end.getFullYear() === now.getFullYear())
      .reduce((total, booking) => total.add(booking.totalPrice), Money.zero());
});

/** Average rating of the owner (all reviews received). */
const averageRating = computed(() => user.value.reviewsCount ? user.value.rating.toFixed(1) : '—');

/**
 * Publishes or unpublishes a vehicle.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const togglePublication = vehicle => fleetStore.togglePublication(vehicle)
    .then(saved => toast.add({severity: 'success', life: 2500, summary: saved.published ? t('fleet.vehicle-published') : t('fleet.vehicle-unpublished')}))
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

onMounted(() => {
  fleetStore.loadOwnerVehicles(user.value.id);
  bookingStore.loadOwnerBookings(user.value.id)
      .then(() => resolveDetails(upcomingBookings.value, booking => booking.renterId));
});
</script>

<template>
  <div class="page">
    <page-header :title="t('dashboard.owner-greeting', { name: user.firstName })" :subtitle="t('dashboard.owner-subtitle')">
      <template #actions>
        <pv-button :label="t('fleet.add-vehicle')" icon="pi pi-plus" @click="router.push({ name: 'vehicle-create' })"/>
      </template>
    </page-header>

    <section class="stats-grid" :aria-label="t('dashboard.metrics')">
      <stat-card icon="pi pi-car" :value="vehicles.length" :label="t('dashboard.vehicles')" :to="{ name: 'owner-vehicles' }"
                 :caption="t('dashboard.published-count', { count: publishedCount })"/>
      <stat-card icon="pi pi-calendar" tone="green" :value="upcomingBookings.length" :label="t('dashboard.upcoming-bookings')" :to="{ name: 'owner-bookings' }"
                 :caption="t('dashboard.pending-count', { count: pendingCount  }, pendingCount )"/>
      <stat-card icon="pi pi-wallet" tone="amber" :value="formatMoney(totalIncome)" :label="t('dashboard.income')" :to="{ name: 'owner-transactions' }"
                 :caption="t('dashboard.income-caption-month')"/>
      <stat-card icon="pi pi-star" tone="violet" :value="averageRating" :label="t('dashboard.average-rating')" :to="{ name: 'owner-ratings' }"
                 :caption="t('iam.reviews-count', { count: user.reviewsCount }, user.reviewsCount)"/>
    </section>

    <div class="grid">
      <section class="col-12 xl:col-7">
        <div class="veygo-card h-full">
          <div class="flex justify-content-between align-items-center mb-2">
            <h2 class="text-xl">{{ t('navigation.my-vehicles') }}</h2>
            <router-link :to="{ name: 'owner-vehicles' }">{{ t('shared.see-all') }}</router-link>
          </div>
          <p v-if="!fleetStore.loading && !vehicles.length" class="text-muted">{{ t('fleet.no-vehicles') }}</p>
          <owner-vehicle-item v-for="vehicle in vehicles.slice(0, 4)" :key="vehicle.id" :vehicle="vehicle" compact
                              @publication-toggled="togglePublication"
                              @edit-requested="router.push({ name: 'vehicle-edit', params: { id: $event.id } })"
                              @details-requested="router.push({ name: 'owner-vehicle-detail', params: { id: $event.id } })"
                              @calendar-requested="router.push({ name: 'vehicle-availability', query: { vehicleId: $event.id } })"/>
        </div>
      </section>

      <div class="col-12 xl:col-5 flex flex-column gap-3">
        <section class="veygo-card">
          <div class="flex justify-content-between align-items-center mb-2">
            <h2 class="text-xl">{{ t('dashboard.upcoming-bookings') }}</h2>
            <router-link :to="{ name: 'owner-bookings' }">{{ t('shared.see-all') }}</router-link>
          </div>
          <p v-if="!upcomingBookings.length" class="text-muted">{{ t('dashboard.no-upcoming-bookings') }}</p>
          <booking-item v-for="booking in upcomingBookings.slice(0, 3)" :key="booking.id" :booking="booking" compact
                        :vehicle="vehiclesById.get(booking.vehicleId) ?? null"/>
        </section>

        <section class="veygo-card">
          <h2 class="text-xl mb-3">{{ t('dashboard.quick-actions') }}</h2>
          <div class="grid">
            <div class="col-12 sm:col-6">
              <quick-action icon="pi pi-plus" :title="t('fleet.add-vehicle')" :description="t('dashboard.add-vehicle-text')"
                            :to="{ name: 'vehicle-create' }"/>
            </div>
            <div class="col-12 sm:col-6">
              <quick-action icon="pi pi-calendar-times" tone="green" :title="t('fleet.block-dates')"
                            :description="t('dashboard.availability-text')" :to="{ name: 'vehicle-availability' }"/>
            </div>
            <div class="col-12 sm:col-6">
              <quick-action icon="pi pi-inbox" tone="amber" :title="t('dashboard.review-requests')"
                            :description="t('dashboard.pending-count', { count: pendingCount }, pendingCount)" :to="{ name: 'owner-bookings' }"/>
            </div>
            <div class="col-12 sm:col-6">
              <quick-action icon="pi pi-file" tone="violet" :title="t('dashboard.income-report')"
                            :description="t('dashboard.income-report-text')" :to="{ name: 'owner-transactions' }"/>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section class="growth-banner">
      <div>
        <h2>{{ t('dashboard.banner-title') }}</h2>
        <p>{{ t('dashboard.banner-text') }}</p>
      </div>
      <pv-button :label="t('fleet.add-vehicle')" icon="pi pi-plus" @click="router.push({ name: 'vehicle-create' })"/>
    </section>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.growth-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem;
  border-radius: var(--veygo-radius);
  background: linear-gradient(90deg, var(--veygo-tint-blue) 40%, rgba(234, 241, 255, .2) 100%),
  url('/images/brand/auth-cover.jpg') right center / cover;
}

.growth-banner h2 {
  color: var(--veygo-blue-dark);
  font-size: 1.4rem;
}

.growth-banner p {
  color: var(--veygo-muted);
  font-size: 1.1rem;
}

@media (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
