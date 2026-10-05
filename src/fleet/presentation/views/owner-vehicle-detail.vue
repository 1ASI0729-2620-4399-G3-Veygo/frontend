<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {availabilityStore} from '@/fleet/application/availability.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import {Money} from '@/shared/domain/model/money.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import BarChart from '@/shared/presentation/components/bar-chart.vue';
import AvailabilityCalendarView from '@/fleet/presentation/components/availability-calendar-view.vue';
import VehicleMap from '@/fleet/presentation/components/vehicle-map.vue';

/**
 * Presentation view with the summary of one of the owner's vehicles: gallery, specifications,
 * availability, booking statistics, prices, documents and quick actions.
 */

/** @type {{id: string}} */
const props = defineProps({id: {type: String, required: true}});

const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const {intlLocale, formatMoney, translateOrKeep} = useFormatting();

const vehicle = ref(null);
const loading = ref(true);
const photoIndex = ref(0);
const mapVisible = ref(false);
const month = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

const photos = computed(() => vehicle.value?.photos.length ? vehicle.value.photos : [vehicle.value?.mainPhotoUrl].filter(Boolean));
const allBookings = computed(() => availabilityStore.calendar?.vehicleId === vehicle.value?.id ? availabilityStore.vehicleBookings : []);
const activeBookingsCount = computed(() => allBookings.value.filter(booking => booking.status !== 'rejected').length);

/** Bookings per month (last 6 months, by pickup date). */
const bookingsByMonth = computed(() => Array.from({length: 6}, (_, index) => {
  const date = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + index, 1);
  const value = allBookings.value.filter(booking => booking.period.start.getFullYear() === date.getFullYear()
      && booking.period.start.getMonth() === date.getMonth() && booking.status !== 'rejected').length;
  return {label: date.toLocaleDateString(intlLocale.value, {month: 'short'}), value, formatted: String(value)};
}));

const totalIncome = computed(() => allBookings.value.filter(booking => booking.isFinished())
    .reduce((total, booking) => total.add(booking.totalPrice), Money.zero()));

const specs = computed(() => vehicle.value ? [
  {icon: 'pi pi-car', label: t(`fleet.body-types.${vehicle.value.bodyType}`)},
  {icon: 'pi pi-cog', label: t(`fleet.transmissions.${vehicle.value.transmission}`)},
  {icon: 'pi pi-bolt', label: t(`fleet.fuel-types.${vehicle.value.fuelType}`)},
  {icon: 'pi pi-gauge', label: `${vehicle.value.mileage.toLocaleString(intlLocale.value)} km`},
  {icon: 'pi pi-users', label: t('fleet.seats-count', {count: vehicle.value.seats})},
  {icon: 'pi pi-th-large', label: t('fleet.doors-count', {count: vehicle.value.doors})}
] : []);

/**
 * Shows the previous or next photo.
 *
 * @param {number} delta - -1 or 1.
 */
const movePhoto = delta => photoIndex.value = (photoIndex.value + delta + photos.value.length) % photos.value.length;

/**
 * Publishes or unpublishes the vehicle.
 */
const togglePublication = () => fleetStore.togglePublication(vehicle.value)
    .then(saved => {
      vehicle.value = saved;
      toast.add({severity: 'success', life: 2500, summary: saved.published ? t('fleet.vehicle-published') : t('fleet.vehicle-unpublished')});
    })
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

/**
 * Asks for confirmation and deletes the vehicle.
 */
const deleteVehicle = () => confirm.require({
  header: t('fleet.delete-vehicle'),
  message: t('fleet.delete-confirmation', {name: vehicle.value.displayName}),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: {label: t('shared.cancel'), outlined: true},
  acceptProps: {label: t('shared.delete'), severity: 'danger'},
  accept: () => fleetStore.deleteVehicle(vehicle.value)
      .then(() => {
        toast.add({severity: 'success', summary: t('fleet.vehicle-deleted'), life: 2500});
        router.push({name: 'owner-vehicles'});
      })
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
});

onMounted(() => {
  fleetStore.fetchVehicleById(Number(props.id))
      .then(found => {
        if (!found || !found.isOwnedBy(iamStore.currentUser.id)) return;
        vehicle.value = found;
        return availabilityStore.loadCalendar(found.id);
      })
      .finally(() => loading.value = false);
});
</script>

<template>
  <div class="page">
    <pv-skeleton v-if="loading" height="480px" border-radius="16px"/>
    <unavailable-content v-else-if="!vehicle" icon="pi pi-car" :title="t('fleet.vehicle-not-found')">
      <router-link :to="{ name: 'owner-vehicles' }">{{ t('navigation.my-vehicles') }}</router-link>
    </unavailable-content>

    <template v-else>
      <page-header :title="t('fleet.vehicle-detail-title')" :subtitle="t('fleet.vehicle-detail-subtitle')"
                   :back-to="{ name: 'owner-vehicles' }" :back-label="t('navigation.my-vehicles')">
        <template #actions>
          <div class="flex align-items-center gap-2">
            <pv-toggle-switch :model-value="vehicle.published" input-id="detail-published" @update:model-value="togglePublication"/>
            <label for="detail-published">{{ vehicle.published ? t('fleet.published') : t('fleet.unpublished') }}</label>
          </div>
          <pv-button :label="t('fleet.edit-vehicle')" icon="pi pi-pencil" outlined
                     @click="router.push({ name: 'vehicle-edit', params: { id: vehicle.id } })"/>
        </template>
      </page-header>

      <div class="detail-layout">
        <div class="flex flex-column gap-3 min-w-0">
          <section class="veygo-card overview">
            <div class="gallery">
              <div class="gallery__main">
                <img :src="photos[photoIndex].toString()" :alt="`${vehicle.displayName} – ${t('fleet.photo-number', { number: photoIndex + 1 })}`">
                <span class="gallery__counter">{{ photoIndex + 1 }} / {{ photos.length }}</span>
                <template v-if="photos.length > 1">
                  <pv-button icon="pi pi-chevron-left" rounded severity="secondary" class="gallery__nav gallery__nav--prev"
                             :aria-label="t('fleet.previous-photo')" @click="movePhoto(-1)"/>
                  <pv-button icon="pi pi-chevron-right" rounded severity="secondary" class="gallery__nav gallery__nav--next"
                             :aria-label="t('fleet.next-photo')" @click="movePhoto(1)"/>
                </template>
              </div>
              <div v-if="photos.length > 1" class="gallery__thumbs">
                <button v-for="(photo, index) in photos.slice(0, 4)" :key="index" type="button"
                        :class="{ 'gallery__thumb--active': index === photoIndex }"
                        :aria-label="t('fleet.photo-number', { number: index + 1 })" @click="photoIndex = index">
                  <img :src="photo.toString()" alt="">
                </button>
                <button v-if="photos.length > 4" type="button" class="gallery__more" @click="photoIndex = 4">+{{ photos.length - 4 }}</button>
              </div>
            </div>
            <div class="flex flex-column gap-3 min-w-0">
              <h2 class="text-2xl">{{ vehicle.displayName }}</h2>
              <div class="flex flex-wrap gap-2">
                <pv-tag :value="vehicle.published ? t('fleet.published') : t('fleet.unpublished')" :severity="vehicle.published ? 'success' : 'secondary'"/>
                <pv-tag :value="t(`fleet.categories.${vehicle.category}`)" severity="info"/>
                <pv-tag :value="t(`fleet.transmissions.${vehicle.transmission}`)" severity="secondary"/>
              </div>
              <p class="text-muted">{{ vehicle.description || t('fleet.no-description') }}</p>
              <ul class="spec-grid">
                <li v-for="spec in specs" :key="spec.icon"><i :class="spec.icon" aria-hidden="true"/>{{ spec.label }}</li>
              </ul>
              <div class="flex justify-content-between align-items-center pt-2 location-row">
                <span><i class="pi pi-map-marker text-primary" aria-hidden="true"/> {{ vehicle.location.shortLabel }}</span>
                <pv-button :label="t('fleet.view-on-map')" link size="small" @click="mapVisible = true"/>
              </div>
            </div>
          </section>

          <div class="grid">
            <section class="col-12 md:col-6">
              <div class="veygo-card h-full">
                <div class="flex justify-content-between align-items-center mb-2">
                  <h2 class="veygo-card-title m-0"><i class="pi pi-calendar" aria-hidden="true"/>{{ t('navigation.availability') }}</h2>
                  <router-link :to="{ name: 'vehicle-availability', query: { vehicleId: vehicle.id } }">{{ t('fleet.view-calendar') }}</router-link>
                </div>
                <availability-calendar-view :calendar="availabilityStore.calendar" :month="month" compact
                                            @month-changed="month = $event"/>
              </div>
            </section>
            <section class="col-12 md:col-6">
              <div class="veygo-card h-full">
                <h2 class="veygo-card-title"><i class="pi pi-chart-bar" aria-hidden="true"/>{{ t('fleet.vehicle-statistics') }}</h2>
                <div class="grid mb-2">
                  <div class="col-6"><div class="mini-stat"><strong>{{ activeBookingsCount }}</strong><small>{{ t('fleet.total-bookings') }}</small></div></div>
                  <div class="col-6"><div class="mini-stat"><strong>{{ formatMoney(totalIncome) }}</strong><small>{{ t('payment.total-income') }}</small></div></div>
                </div>
                <h3 class="text-sm text-muted mb-2">{{ t('fleet.bookings-last-months') }}</h3>
                <bar-chart :items="bookingsByMonth" :highlight-index="bookingsByMonth.length - 1" :height="110"
                           :aria-label="t('fleet.bookings-last-months')"/>
              </div>
            </section>
          </div>
        </div>

        <aside class="flex flex-column gap-3">
          <section class="veygo-card">
            <div class="flex justify-content-between align-items-center mb-3">
              <h2 class="text-lg">{{ t('fleet.prices-and-options') }}</h2>
              <router-link :to="{ name: 'vehicle-edit', params: { id: vehicle.id } }"><i class="pi pi-pencil" aria-hidden="true"/> {{ t('shared.edit') }}</router-link>
            </div>
            <dl class="info-list">
              <div><dt>{{ t('fleet.price-per-day') }}</dt><dd>{{ formatMoney(vehicle.pricePerDay) }}</dd></div>
              <div><dt>{{ t('fleet.price-per-week') }}</dt><dd>{{ vehicle.pricePerWeek.amount ? formatMoney(vehicle.pricePerWeek) : '—' }}</dd></div>
              <div><dt>{{ t('fleet.price-per-month') }}</dt><dd>{{ vehicle.pricePerMonth.amount ? formatMoney(vehicle.pricePerMonth) : '—' }}</dd></div>
              <div><dt>{{ t('fleet.security-deposit') }}</dt><dd>{{ formatMoney(vehicle.securityDeposit) }}</dd></div>
            </dl>
            <pv-message severity="info" class="mt-3"><span class="text-sm">{{ t('fleet.prices-hint') }}</span></pv-message>
          </section>

          <section class="veygo-card">
            <div class="flex justify-content-between align-items-center mb-3">
              <h2 class="text-lg">{{ t('fleet.additional-information') }}</h2>
              <router-link :to="{ name: 'vehicle-edit', params: { id: vehicle.id } }"><i class="pi pi-pencil" aria-hidden="true"/> {{ t('shared.edit') }}</router-link>
            </div>
            <dl class="info-list">
              <div><dt>{{ t('fleet.plate') }}</dt><dd>{{ vehicle.plate || '—' }}</dd></div>
              <div><dt>{{ t('fleet.color') }}</dt><dd>{{ vehicle.color || '—' }}</dd></div>
              <div><dt>{{ t('fleet.last-maintenance') }}</dt><dd>{{ vehicle.lastMaintenanceAt || '—' }}</dd></div>
              <div><dt>{{ t('fleet.insurance') }}</dt>
                <dd>{{ vehicle.insurance ? `${vehicle.insurance.provider} · ${vehicle.hasValidInsurance() ? t('fleet.valid') : t('fleet.expired')}` : '—' }}</dd></div>
              <div><dt>{{ t('fleet.technical-inspection') }}</dt>
                <dd>{{ vehicle.technicalInspectionUntil ? t('fleet.valid-until', { date: vehicle.technicalInspectionUntil }) : '—' }}</dd></div>
            </dl>
          </section>

          <section class="veygo-card flex flex-column gap-2">
            <h2 class="text-lg mb-1">{{ t('dashboard.quick-actions') }}</h2>
            <pv-button :label="t('fleet.view-vehicle-bookings')" icon="pi pi-calendar" outlined fluid
                       @click="router.push({ name: 'owner-bookings', query: { vehicleId: vehicle.id } })"/>
            <pv-button :label="t('fleet.delete-vehicle')" icon="pi pi-trash" severity="danger" outlined fluid @click="deleteVehicle"/>
          </section>
        </aside>
      </div>

      <pv-dialog v-model:visible="mapVisible" modal :header="vehicle.location.shortLabel" :style="{ width: 'min(720px, 94vw)' }">
        <p class="text-muted mb-3">{{ vehicle.location.address }}</p>
        <vehicle-map :vehicles="[vehicle]" height="380px" :zoom="15"/>
      </pv-dialog>
    </template>
  </div>
</template>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.25rem;
  align-items: start;
}

.overview {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 1.5rem;
}

.gallery__main {
  position: relative;
}

.gallery__main img {
  width: 100%;
  height: 260px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--veygo-photo-bg);
}

.gallery__counter {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: .15rem .55rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, .7);
  color: #fff;
  font-size: .8rem;
}

.gallery__nav {
  position: absolute !important;
  top: 50%;
  transform: translateY(-50%);
}

.gallery__nav--prev { left: 10px; }
.gallery__nav--next { right: 10px; }

.gallery__thumbs {
  display: flex;
  gap: .5rem;
  margin-top: .6rem;
}

.gallery__thumbs button {
  width: 64px;
  height: 46px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  background: var(--veygo-surface);
  cursor: pointer;
}

.gallery__thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery__thumbs .gallery__thumb--active {
  border-color: var(--veygo-blue);
}

.gallery__thumbs .gallery__more {
  color: var(--veygo-muted);
  font-weight: 600;
}

.spec-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .6rem;
}

.spec-grid li {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.spec-grid .pi {
  color: var(--veygo-muted);
}

.location-row {
  border-top: 1px solid var(--veygo-line);
}

.mini-stat {
  display: flex;
  flex-direction: column;
  padding: .7rem .9rem;
  border-radius: 12px;
  background: var(--veygo-tint-blue);
}

.mini-stat small {
  color: var(--veygo-muted);
}

.info-list {
  margin: 0;
}

.info-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: .55rem 0;
  border-bottom: 1px solid var(--veygo-line);
}

.info-list dt {
  color: var(--veygo-muted);
}

.info-list dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

@media (max-width: 1199px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .overview {
    grid-template-columns: 1fr;
  }
}
</style>
