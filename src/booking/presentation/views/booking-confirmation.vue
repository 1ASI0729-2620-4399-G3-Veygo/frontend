<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {bookingStore} from '@/booking/application/booking.store.js';
import {PaymentMethod} from '@/booking/domain/model/booking-status.js';
import {DateRange} from '@/shared/domain/model/date-range.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import UserSummary from '@/iam/presentation/components/user-summary.vue';
import VehicleSpecs from '@/fleet/presentation/components/vehicle-specs.vue';

/**
 * Presentation view where renters review the rental details and confirm the booking request.
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
const submitting = ref(false);
const errorMessage = ref('');
const paymentMethod = ref(PaymentMethod.CARD);
const today = new Date();
const dates = ref(route.query.start && route.query.end
    ? [new Date(`${route.query.start}T00:00:00`), new Date(`${route.query.end}T00:00:00`)] : null);

const period = computed(() => dates.value?.[0] && dates.value?.[1] ? DateRange.fromDates(dates.value[0], dates.value[1]) : null);
const totalPrice = computed(() => vehicle.value && period.value ? vehicle.value.estimateRentalPrice(period.value) : null);

/**
 * Sends the booking request; the store checks availability before creating it.
 */
const confirmBooking = () => {
  errorMessage.value = '';
  if (!period.value) {
    errorMessage.value = t('booking.select-dates');
    return;
  }
  submitting.value = true;
  bookingStore.requestBooking({
    vehicle: vehicle.value, renterId: iamStore.currentUser.id, period: period.value, paymentMethod: paymentMethod.value
  })
      .then(() => {
        toast.add({severity: 'success', summary: t('booking.request-sent'), detail: t('booking.request-sent-detail'), life: 4000});
        router.push({name: 'renter-bookings'});
      })
      .catch(message => errorMessage.value = translateOrKeep(message))
      .finally(() => submitting.value = false);
};

onMounted(() => {
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
    <pv-skeleton v-if="loading" height="480px" border-radius="16px"/>
    <unavailable-content v-else-if="!vehicle" icon="pi pi-car" :title="t('fleet.vehicle-not-found')"/>

    <template v-else>
      <page-header :title="t('booking.confirm-title')" :subtitle="t('booking.confirm-subtitle')"
                   :back-to="{ name: 'vehicle-detail', params: { id: vehicle.id } }" :back-label="t('booking.back-to-vehicle')"/>

      <div class="confirmation-layout">
        <div class="flex flex-column gap-4">
          <section class="veygo-card">
            <h2 class="veygo-card-title"><i class="pi pi-car" aria-hidden="true"/>{{ t('booking.selected-vehicle') }}</h2>
            <div class="selected-vehicle">
              <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName">
              <div class="flex flex-column gap-2">
                <h3 class="text-xl">{{ vehicle.displayName }}</h3>
                <vehicle-specs :vehicle="vehicle"/>
              </div>
            </div>
          </section>

          <section class="veygo-card">
            <h2 class="veygo-card-title"><i class="pi pi-calendar" aria-hidden="true"/>{{ t('booking.rental-dates') }}</h2>
            <label for="booking-dates" class="sr-only">{{ t('booking.rental-dates') }}</label>
            <pv-date-picker v-model="dates" input-id="booking-dates" selection-mode="range" :min-date="today"
                            :manual-input="false" show-icon fluid :placeholder="t('fleet.dates-placeholder')"/>
            <pv-message v-if="period" severity="info" class="mt-3">
              {{ t('booking.days-count', { count: period.days  }, period.days ) }} · {{ t('booking.can-modify-dates') }}
            </pv-message>
          </section>

          <section class="veygo-card">
            <h2 class="veygo-card-title"><i class="pi pi-map-marker" aria-hidden="true"/>{{ t('fleet.pickup-location') }}</h2>
            <p><strong>{{ vehicle.location.shortLabel }}</strong></p>
            <p class="text-muted">{{ vehicle.location.address }}</p>
          </section>

          <user-summary v-if="owner" :user="owner" :title="t('fleet.owner')"/>

          <section class="veygo-card">
            <fieldset class="border-none p-0 m-0">
              <legend class="veygo-card-title"><i class="pi pi-credit-card" aria-hidden="true"/>{{ t('booking.payment-method') }}</legend>
              <div class="flex flex-column gap-3">
                <div class="flex align-items-center gap-2">
                  <pv-radio-button v-model="paymentMethod" input-id="payment-card" value="card"/>
                  <label for="payment-card"><strong>{{ t('booking.payment-methods.card') }}</strong>
                    <small class="block text-muted">Visa, Mastercard, American Express</small></label>
                </div>
                <div class="flex align-items-center gap-2">
                  <pv-radio-button v-model="paymentMethod" input-id="payment-yape" value="yape"/>
                  <label for="payment-yape"><strong>{{ t('booking.payment-methods.yape') }}</strong>
                    <small class="block text-muted">{{ t('booking.yape-hint') }}</small></label>
                </div>
              </div>
            </fieldset>
            <p class="text-sm text-muted mt-3">{{ t('booking.payment-note') }}</p>
          </section>
        </div>

        <aside class="veygo-card summary">
          <h2 class="veygo-card-title"><i class="pi pi-receipt" aria-hidden="true"/>{{ t('booking.summary') }}</h2>
          <div class="summary__row"><span>{{ t('fleet.price-per-day') }}</span><span>{{ formatMoney(vehicle.pricePerDay) }}</span></div>
          <div class="summary__row"><span>{{ t('booking.rental-days') }}</span><span>{{ period ? period.days : '—' }}</span></div>
          <div class="summary__row"><span>{{ t('fleet.security-deposit') }}</span><span>{{ formatMoney(vehicle.securityDeposit) }}</span></div>
          <div class="summary__total">
            <span>{{ t('booking.total-to-pay') }}</span>
            <strong>{{ totalPrice ? formatMoney(totalPrice) : '—' }}</strong>
          </div>
          <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
          <pv-button :label="t('booking.confirm-booking')" icon="pi pi-lock" size="large" fluid :loading="submitting"
                     :disabled="!period" @click="confirmBooking"/>
          <pv-message severity="success" icon="pi pi-check-circle">
            <strong class="block">{{ t('booking.free-cancellation-title') }}</strong>
            <span class="text-sm">{{ t('booking.free-cancellation') }}</span>
          </pv-message>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.confirmation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 1.5rem;
  align-items: start;
}

.selected-vehicle {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
}

.selected-vehicle img {
  width: 100%;
  height: 130px;
  object-fit: contain;
  background: var(--veygo-surface);
  border-radius: 12px;
}

.summary {
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.summary__row {
  display: flex;
  justify-content: space-between;
  color: var(--veygo-muted);
}

.summary__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: var(--veygo-tint-blue);
  font-weight: 600;
}

.summary__total strong {
  font-size: 1.5rem;
  color: var(--veygo-blue-dark);
}

@media (max-width: 1099px) {
  .confirmation-layout {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }
}

@media (max-width: 575px) {
  .selected-vehicle {
    grid-template-columns: 1fr;
  }
}
</style>