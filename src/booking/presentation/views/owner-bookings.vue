<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {bookingStore} from '@/booking/application/booking.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useBookingDetails} from '@/booking/presentation/composables/use-booking-details.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import BookingItem from '@/booking/presentation/components/booking-item.vue';
import BookingStatusFilter from '@/booking/presentation/components/booking-status-filter.vue';

/**
 * Presentation view where owners review booking requests for their vehicles and accept or reject them.
 */
const {t} = useI18n();
const toast = useToast();
const confirm = useConfirm();
const {translateOrKeep} = useFormatting();
const {vehiclesById, usersById, resolveDetails} = useBookingDetails();

const route = useRoute();
const statusFilter = ref('all');
const vehicleFilter = ref(route.query.vehicleId ? Number(route.query.vehicleId) : null);

const vehicleOptions = computed(() => [{label: t('booking.all-vehicles'), value: null},
  ...[...new Set(bookingStore.ownerBookings.map(booking => booking.vehicleId))]
      .map(id => ({label: vehiclesById.value.get(id)?.displayName ?? t('booking.vehicle-number', {id}), value: id}))]);

const vehicleBookings = computed(() => bookingStore.ownerBookings
    .filter(booking => vehicleFilter.value === null || booking.vehicleId === vehicleFilter.value));

const bookings = computed(() => vehicleBookings.value
    .filter(booking => statusFilter.value === 'all' || booking.displayStatus === statusFilter.value));

/**
 * Runs a status change and informs the result.
 *
 * @param {Promise} request - The store request.
 * @param {string} successKey - i18n key of the success message.
 */
const notify = (request, successKey) => request
    .then(() => toast.add({severity: 'success', summary: t(successKey), life: 2500}))
    .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));

/**
 * Accepts a pending booking.
 *
 * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
 */
const confirmBooking = booking => notify(bookingStore.confirmBooking(booking), 'booking.booking-confirmed');

/**
 * Asks for confirmation and rejects a pending booking.
 *
 * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
 */
const rejectBooking = booking => confirm.require({
  header: t('booking.reject'),
  message: t('booking.reject-confirmation'),
  icon: 'pi pi-exclamation-triangle',
  rejectProps: {label: t('shared.back'), outlined: true},
  acceptProps: {label: t('booking.reject'), severity: 'danger'},
  accept: () => notify(bookingStore.rejectBooking(booking), 'booking.booking-rejected')
});

onMounted(() => bookingStore.loadOwnerBookings(iamStore.currentUser.id)
    .then(() => resolveDetails(bookingStore.ownerBookings, booking => booking.renterId)));
</script>

<template>
  <div class="page">
    <page-header :title="t('booking.owner-bookings-title')" :subtitle="t('booking.owner-bookings-subtitle')"/>
    <div class="flex flex-wrap align-items-center gap-3">
      <booking-status-filter v-model="statusFilter" :bookings="vehicleBookings"/>
      <pv-select v-model="vehicleFilter" :options="vehicleOptions" option-label="label" option-value="value"
                 :aria-label="t('booking.filter-by-vehicle')" class="ml-auto" style="min-width: 220px"/>
    </div>

    <div v-if="bookingStore.loading" class="flex flex-column gap-3">
      <pv-skeleton v-for="index in 3" :key="index" height="140px" border-radius="16px"/>
    </div>
    <unavailable-content v-else-if="bookingStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="bookingStore.errors"/>
    <unavailable-content v-else-if="!bookings.length" icon="pi pi-calendar" :title="t('booking.no-bookings')"/>
    <div v-else class="flex flex-column gap-3">
      <booking-item v-for="booking in bookings" :key="booking.id" :booking="booking"
                    :vehicle="vehiclesById.get(booking.vehicleId) ?? null" :counterpart="usersById.get(booking.renterId) ?? null">
        <template v-if="booking.isPending()" #actions>
          <pv-button :label="t('booking.accept')" icon="pi pi-check" size="small" @click="confirmBooking(booking)"/>
          <pv-button :label="t('booking.reject')" icon="pi pi-times" size="small" severity="danger" outlined
                     @click="rejectBooking(booking)"/>
        </template>
      </booking-item>
    </div>
  </div>
</template>