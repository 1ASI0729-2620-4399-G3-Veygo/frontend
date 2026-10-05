<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {reputationStore} from '@/reputation/application/reputation.store.js';
import {ReputationLevel} from '@/reputation/domain/model/reputation-summary.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import ReviewItem from '@/reputation/presentation/components/review-item.vue';

/**
 * Presentation view where owners read the reviews of their vehicles, see the rating
 * distribution and get feedback about their reputation.
 */
const {t} = useI18n();

const searchText = ref('');
const sortOrder = ref('recent');
const first = ref(0);
const rowsPerPage = 5;
const usersById = ref(new Map());

const summary = computed(() => reputationStore.ownerSummary);
const vehiclesById = computed(() => new Map(fleetStore.ownerVehicles.map(vehicle => [vehicle.id, vehicle])));
const bookingsById = computed(() => new Map(bookingStore.ownerBookings.map(booking => [booking.id, booking])));

const reviewsThisMonth = computed(() => {
  const now = new Date();
  return reputationStore.ownerReviews.filter(review => {
    const date = review.createdAt.toDate();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
});

/** Average of the vehicles' ratings (only rated vehicles). */
const vehicleAverage = computed(() => {
  const rated = fleetStore.ownerVehicles.map(vehicle => reputationStore.summaryForVehicle(vehicle.id)).filter(item => item.count);
  return rated.length ? (rated.reduce((sum, item) => sum + item.average, 0) / rated.length).toFixed(1) : '—';
});

const sortOptions = computed(() => [
  {label: t('reputation.sort.recent'), value: 'recent'},
  {label: t('reputation.sort.highest'), value: 'highest'},
  {label: t('reputation.sort.lowest'), value: 'lowest'}
]);

const filteredReviews = computed(() => {
  const text = searchText.value.trim().toLowerCase();
  const list = reputationStore.ownerReviews.filter(review => !text || [
    usersById.value.get(review.renterId)?.fullName, vehiclesById.value.get(review.vehicleId)?.displayName, review.comment
  ].some(value => value?.toLowerCase().includes(text)));
  const sorters = {
    recent: (a, b) => b.createdAt.valueOf() - a.createdAt.valueOf(),
    highest: (a, b) => b.rating - a.rating || b.createdAt.valueOf() - a.createdAt.valueOf(),
    lowest: (a, b) => a.rating - b.rating || b.createdAt.valueOf() - a.createdAt.valueOf()
  };
  return [...list].sort(sorters[sortOrder.value]);
});

const pageReviews = computed(() => filteredReviews.value.slice(first.value, first.value + rowsPerPage));

const vehicleSummaries = computed(() => fleetStore.ownerVehicles
    .map(vehicle => ({vehicle, summary: reputationStore.summaryForVehicle(vehicle.id)}))
    .sort((a, b) => b.summary.count - a.summary.count));

const maxDistribution = computed(() => Math.max(1, ...summary.value.distribution.map(item => item.count)));

const reputationTone = computed(() => ({
  [ReputationLevel.EXCELLENT]: 'success', [ReputationLevel.GOOD]: 'info',
  [ReputationLevel.NEEDS_IMPROVEMENT]: 'warn', [ReputationLevel.NONE]: 'secondary'
})[summary.value.level]);

watch([searchText, sortOrder], () => first.value = 0);

onMounted(() => {
  const owner = iamStore.currentUser;
  Promise.all([reputationStore.loadOwnerReviews(owner.id), fleetStore.loadOwnerVehicles(owner.id), bookingStore.loadOwnerBookings(owner.id)])
      .then(() => {
        const renterIds = [...new Set(reputationStore.ownerReviews.map(review => review.renterId))];
        return Promise.all(renterIds.map(id => iamStore.fetchUserById(id)));
      })
      .then(users => usersById.value = new Map((users ?? []).filter(Boolean).map(user => [user.id, user])));
});

</script>

<template>
  <div class="page">
    <page-header :title="t('reputation.title')" :subtitle="t('reputation.subtitle')"/>

    <unavailable-content v-if="reputationStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="reputationStore.errors"/>

    <template v-else>
      <section class="stats-grid" :aria-label="t('dashboard.metrics')">
        <stat-card icon="pi pi-star" tone="violet" :value="summary.count ? summary.roundedAverage.toFixed(1) : '—'"
                   :label="t('reputation.average-rating')" :caption="t('reputation.based-on', { count: summary.count }, summary.count)"/>
        <stat-card icon="pi pi-comments" tone="green" :value="summary.count" :label="t('reputation.total-reviews')"
                   :caption="t('reputation.this-month', { count: reviewsThisMonth }, reviewsThisMonth)"/>
        <stat-card icon="pi pi-thumbs-up" :value="`${summary.satisfiedPercentage}%`" :label="t('reputation.satisfied-clients')"
                   :caption="t('reputation.four-or-five')"/>
        <stat-card icon="pi pi-car" tone="amber" :value="vehicleAverage" :label="t('reputation.vehicle-average')"
                   :caption="t('dashboard.of-your-vehicles')"/>
      </section>

      <div class="ratings-layout">
        <section class="veygo-card">
          <div class="flex flex-wrap justify-content-between align-items-center gap-3">
            <h2 class="text-lg">{{ t('reputation.client-reviews') }}</h2>
            <div class="flex flex-wrap gap-2">
              <pv-icon-field>
                <pv-input-icon class="pi pi-search"/>
                <pv-input-text v-model="searchText" :placeholder="t('reputation.search-placeholder')" :aria-label="t('reputation.search-placeholder')"/>
              </pv-icon-field>
              <pv-select v-model="sortOrder" :options="sortOptions" option-label="label" option-value="value" :aria-label="t('reputation.sort-by')"/>
            </div>
          </div>
          <p v-if="!reputationStore.loading && !pageReviews.length" class="text-muted mt-3">{{ t('reputation.no-reviews') }}</p>
          <review-item v-for="review in pageReviews" :key="review.id" :review="review"
                       :renter="usersById.get(review.renterId) ?? null" :vehicle="vehiclesById.get(review.vehicleId) ?? null"
                       :booking="bookingsById.get(review.bookingId) ?? null"/>
          <div class="flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <small class="text-muted">{{ t('reputation.showing', { shown: pageReviews.length, total: filteredReviews.length }) }}</small>
            <pv-paginator v-if="filteredReviews.length > rowsPerPage" v-model:first="first" :rows="rowsPerPage"
                          :total-records="filteredReviews.length" template="PrevPageLink PageLinks NextPageLink"/>
          </div>
        </section>

        <aside class="flex flex-column gap-3">
          <section class="veygo-card">
            <h2 class="text-lg mb-3">{{ t('reputation.distribution') }}</h2>
            <ul class="distribution" role="list">
              <li v-for="item in summary.distribution" :key="item.stars"
                  :aria-label="t('reputation.distribution-row', { stars: item.stars, count: item.count })">
                <span>{{ t('reputation.stars', { count: item.stars }, item.stars) }}</span>
                <span class="distribution__track"><span class="distribution__bar" :style="{ width: `${item.count * 100 / maxDistribution}%` }"/></span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>

          <section class="veygo-card">
            <h2 class="text-lg mb-3">{{ t('reputation.by-vehicle') }}</h2>
            <div v-for="item in vehicleSummaries" :key="item.vehicle.id" class="vehicle-rating">
              <img :src="item.vehicle.mainPhotoUrl.toString()" :alt="item.vehicle.displayName">
              <div class="min-w-0">
                <strong class="block">{{ item.vehicle.displayName }}</strong>
                <small class="text-muted"><i class="pi pi-star-fill rating-star" aria-hidden="true"/>
                  {{ item.summary.count ? item.summary.roundedAverage.toFixed(1) : '—' }}
                  ({{ t('iam.reviews-count', { count: item.summary.count }, item.summary.count) }})</small>
              </div>
            </div>
          </section>

          <pv-message :severity="reputationTone" icon="pi pi-shield">
            <strong class="block">{{ t(`reputation.levels.${summary.level}.title`) }}</strong>
            <span class="text-sm">{{ t(`reputation.levels.${summary.level}.text`) }}</span>
          </pv-message>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.ratings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1.25rem;
  align-items: start;
}

.distribution {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.distribution li {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 24px;
  align-items: center;
  gap: .75rem;
  font-size: .9rem;
}

.distribution__track {
  height: 8px;
  border-radius: 4px;
  background: var(--veygo-surface);
  overflow: hidden;
}

.distribution__bar {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: #2a78d6;
}

.vehicle-rating {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .5rem 0;
}

.vehicle-rating img {
  width: 64px;
  height: 42px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--veygo-surface);
}

.rating-star {
  color: #f59e0b;
  font-size: .8rem;
}

@media (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ratings-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 575px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
