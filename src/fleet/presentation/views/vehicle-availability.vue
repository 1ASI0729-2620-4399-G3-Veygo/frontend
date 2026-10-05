<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {availabilityStore} from '@/fleet/application/availability.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import AvailabilityCalendarView from '@/fleet/presentation/components/availability-calendar-view.vue';
import VehicleSpecs from '@/fleet/presentation/components/vehicle-specs.vue';
import BookingStatusTag from '@/booking/presentation/components/booking-status-tag.vue';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation view where owners see, per vehicle, the days taken by bookings and
 * block or unblock days when they want to use the vehicle themselves.
 */
const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const {formatMoney, formatRange, translateOrKeep} = useFormatting();

const vehicleId = ref(route.query.vehicleId ? Number(route.query.vehicleId) : null);
const month = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const selectedDates = ref([]);
const renterNames = ref(new Map());
const working = ref(false);

const vehicle = computed(() => fleetStore.ownerVehicles.find(item => item.id === vehicleId.value) ?? null);
const vehicleOptions = computed(() => fleetStore.ownerVehicles.map(item => ({label: item.displayName, value: item.id})));
const upcomingBookings = computed(() => (availabilityStore.calendar?.bookings ?? [])
    .filter(booking => !booking.period.isPast())
    .sort((a, b) => a.period.start - b.period.start)
    .slice(0, 4));

/**
 * Loads the calendar of the selected vehicle and the names of its renters.
 */
const loadCalendar = () => {
  selectedDates.value = [];
  if (!vehicleId.value) return;
  router.replace({query: {vehicleId: vehicleId.value}});
  availabilityStore.loadCalendar(vehicleId.value).then(() => {
    const renterIds = [...new Set((availabilityStore.calendar?.bookings ?? []).map(booking => booking.renterId))];
    return Promise.all(renterIds.map(id => iamStore.fetchUserById(id)));
  }).then(users => {
    renterNames.value = new Map((users ?? []).filter(Boolean).map(user => [user.id, user.fullName]));
  });
};

/**
 * Selects or unselects a day.
 *
 * @param {{iso: string, date: Date}} day - The day.
 */
const toggleDay = day => {
  selectedDates.value = selectedDates.value.includes(day.iso)
      ? selectedDates.value.filter(iso => iso !== day.iso)
      : [...selectedDates.value, day.iso];
};

const selectedAsDates = () => selectedDates.value.map(iso => new Date(`${iso}T00:00:00`));

/**
 * Blocks or unblocks the selected days.
 *
 * @param {boolean} block - True to block, false to unblock.
 */
const applySelection = block => {
  if (!selectedDates.value.length) {
    toast.add({severity: 'info', summary: t('fleet.select-days-first'), life: 3000});
    return;
  }
  working.value = true;
  const request = block
      ? availabilityStore.blockDates(vehicleId.value, selectedAsDates())
      : availabilityStore.unblockDates(vehicleId.value, selectedAsDates());
  request
      .then(count => {
        toast.add({severity: count ? 'success' : 'info', life: 3000,
          summary: t(block ? 'fleet.days-blocked' : 'fleet.days-unblocked', {count}, count)});
        selectedDates.value = [];
      })
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
      .finally(() => working.value = false);
};

watch(vehicleId, loadCalendar);

onMounted(() => fleetStore.loadOwnerVehicles(iamStore.currentUser.id).then(() => {
  if (!vehicleId.value && fleetStore.ownerVehicles.length) vehicleId.value = fleetStore.ownerVehicles[0].id;
  else loadCalendar();
}));
</script>

<template>
  <div class="page">
    <page-header :title="t('fleet.availability-title')" :subtitle="t('fleet.availability-subtitle')">
      <template #actions>
        <label for="availability-vehicle" class="sr-only">{{ t('fleet.select-vehicle') }}</label>
        <pv-select v-model="vehicleId" input-id="availability-vehicle" :options="vehicleOptions" option-label="label"
                   option-value="value" :placeholder="t('fleet.select-vehicle')" style="min-width: 240px"/>
      </template>
    </page-header>

    <unavailable-content v-if="!fleetStore.loading && !fleetStore.ownerVehicles.length" icon="pi pi-car" :title="t('fleet.no-vehicles')"/>

    <template v-else-if="vehicle">
      <section class="veygo-card vehicle-summary">
        <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl mb-2">{{ vehicle.displayName }}</h2>
          <vehicle-specs :vehicle="vehicle" compact/>
        </div>
        <div class="text-right">
          <span class="price text-2xl">{{ formatMoney(vehicle.pricePerDay) }}</span>
          <small class="block text-muted mb-2">{{ t('fleet.per-day') }}</small>
          <pv-tag :value="vehicle.published ? t('fleet.published') : t('fleet.unpublished')"
                  :severity="vehicle.published ? 'success' : 'secondary'" rounded/>
        </div>
      </section>

      <div class="availability-layout">
        <section class="veygo-card" :aria-busy="availabilityStore.loading">
          <availability-calendar-view :calendar="availabilityStore.calendar" :month="month" :selected-dates="selectedDates"
                                      :renter-names="renterNames" selectable
                                      @day-toggled="toggleDay" @month-changed="month = $event"/>
          <p class="text-sm text-muted mt-2">{{ t('fleet.calendar-hint') }}</p>
        </section>

        <aside class="flex flex-column gap-3">
          <section class="veygo-card">
            <h2 class="text-lg mb-3">{{ t('dashboard.quick-actions') }}</h2>
            <p class="text-sm mb-3">{{ t('fleet.days-selected', { count: selectedDates.length }, selectedDates.length) }}</p>
            <div class="flex flex-column gap-2">
              <button type="button" class="action-button action-button--block" :disabled="working" @click="applySelection(true)">
                <i class="pi pi-lock" aria-hidden="true"/>
                <span><strong>{{ t('fleet.block-dates') }}</strong><small>{{ t('fleet.block-dates-text') }}</small></span>
              </button>
              <button type="button" class="action-button action-button--unblock" :disabled="working" @click="applySelection(false)">
                <i class="pi pi-lock-open" aria-hidden="true"/>
                <span><strong>{{ t('fleet.unblock-dates') }}</strong><small>{{ t('fleet.unblock-dates-text') }}</small></span>
              </button>
              <pv-button v-if="selectedDates.length" :label="t('fleet.clear-selection')" text size="small" @click="selectedDates = []"/>
            </div>
          </section>

          <section class="veygo-card">
            <h2 class="text-lg mb-3">{{ t('fleet.legend') }}</h2>
            <ul class="legend">
              <li><span class="legend__swatch legend__swatch--confirmed"/>{{ t('fleet.legend-confirmed') }}</li>
              <li><span class="legend__swatch legend__swatch--pending"/>{{ t('fleet.legend-pending') }}</li>
              <li><span class="legend__swatch legend__swatch--blocked"/>{{ t('fleet.legend-blocked') }}</li>
              <li><span class="legend__swatch legend__swatch--selected"/>{{ t('fleet.legend-selected') }}</li>
            </ul>
          </section>

          <section class="veygo-card">
            <div class="flex justify-content-between align-items-center mb-2">
              <h2 class="text-lg">{{ t('dashboard.upcoming-bookings') }}</h2>
              <router-link :to="{ name: 'owner-bookings', query: { vehicleId } }">{{ t('shared.see-all') }}</router-link>
            </div>
            <p v-if="!upcomingBookings.length" class="text-muted text-sm">{{ t('dashboard.no-upcoming-bookings') }}</p>
            <div v-for="booking in upcomingBookings" :key="booking.id" class="upcoming">
              <div class="min-w-0">
                <user-name-link v-if="renterNames.get(booking.renterId)" :user-id="booking.renterId"
                                :name="renterNames.get(booking.renterId)" :vehicle-id="booking.vehicleId"/>
                <small class="block text-muted">{{ formatRange(booking.period) }}</small>
              </div>
              <booking-status-tag :status="booking.displayStatus"/>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vehicle-summary {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.vehicle-summary img {
  width: 140px;
  height: 84px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--veygo-surface);
}

.availability-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.25rem;
  align-items: start;
}

.action-button {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .9rem 1rem;
  border: 0;
  border-radius: 12px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.action-button:disabled {
  opacity: .6;
  cursor: progress;
}

.action-button strong, .action-button small {
  display: block;
}

.action-button small {
  color: var(--veygo-muted);
}

.action-button--block {
  background: var(--veygo-tint-blue);
  color: var(--veygo-blue);
}

.action-button--unblock {
  background: var(--veygo-tint-green);
  color: #15803d;
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.legend li {
  display: flex;
  align-items: center;
  gap: .6rem;
}

.legend__swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend__swatch--confirmed { background: #22c55e; }
.legend__swatch--pending { background: #f59e0b; }
.legend__swatch--blocked { background: #ef4444; }
.legend__swatch--selected { background: #38bdf8; }

.upcoming {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  padding: .6rem 0;
  border-bottom: 1px solid var(--veygo-line);
}

@media (max-width: 1099px) {
  .availability-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 575px) {
  .vehicle-summary {
    flex-wrap: wrap;
  }
}
</style>
