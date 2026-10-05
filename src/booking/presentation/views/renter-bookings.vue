<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
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
import ReviewDialog from '@/reputation/presentation/components/review-dialog.vue';
import {reputationStore} from '@/reputation/application/reputation.store.js';

/**
 * Presentation view where renters follow and cancel their bookings.
 */
const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const {translateOrKeep} = useFormatting();
const {vehiclesById, usersById, resolveDetails} = useBookingDetails();

const statusFilter = ref('all');
const bookings = computed(() => bookingStore.renterBookings
    .filter(booking => statusFilter.value === 'all' || booking.displayStatus === statusFilter.value));

/**
 * Asks for confirmation and cancels a booking.
 *
 * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
 */
const cancelBooking = booking => {
  confirm.require({
    header: t('booking.cancel-booking'),
    message: t('booking.cancel-confirmation'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {label: t('shared.back'), outlined: true},
    acceptProps: {label: t('booking.cancel-booking'), severity: 'danger'},
    accept: () => bookingStore.cancelBooking(booking, iamStore.currentUser.id)
        .then(() => toast.add({severity: 'success', summary: t('booking.booking-cancelled'), life: 2500}))
        .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
  });
};

const reviewDialogVisible = ref(false);
const bookingToReview = ref(null);

/**
 * Opens the review dialog for a finished booking.
 *
 * @param {import('@/booking/domain/model/booking.entity.js').Booking} booking - The booking.
 */
const rateBooking = booking => {
  bookingToReview.value = booking;
  reviewDialogVisible.value = true;
};

onMounted(() => reputationStore.loadRenterReviews(iamStore.currentUser.id));

onMounted(() => bookingStore.loadRenterBookings(iamStore.currentUser.id)
    .then(() => resolveDetails(bookingStore.renterBookings, booking => booking.ownerId)));
</script>

<template>
  <div class="page">
    <page-header :title="t('booking.my-bookings-title')" :subtitle="t('booking.my-bookings-subtitle')"/>
    <booking-status-filter v-model="statusFilter" :bookings="bookingStore.renterBookings"/>

    <div v-if="bookingStore.loading" class="flex flex-column gap-3">
      <pv-skeleton v-for="index in 3" :key="index" height="140px" border-radius="16px"/>
    </div>
    <unavailable-content v-else-if="bookingStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="bookingStore.errors"/>
    <unavailable-content v-else-if="!bookings.length" icon="pi pi-calendar" :title="t('booking.no-bookings')">
      <pv-button :label="t('fleet.search-vehicles')" icon="pi pi-search" @click="router.push({ name: 'vehicle-search' })"/>
    </unavailable-content>
    <div v-else class="flex flex-column gap-3">
      <booking-item v-for="booking in bookings" :key="booking.id" :booking="booking"
                    :vehicle="vehiclesById.get(booking.vehicleId) ?? null" :counterpart="usersById.get(booking.ownerId) ?? null">
        <template #actions>
          <pv-button :label="t('fleet.view-vehicle')" size="small" outlined
                     @click="router.push({ name: 'vehicle-detail', params: { id: booking.vehicleId } })"/>
          <pv-button v-if="booking.isFinished() && !reputationStore.isBookingReviewed(booking.id)" :label="t('reputation.rate')"
                     icon="pi pi-star" size="small" @click="rateBooking(booking)"/>
          <pv-tag v-else-if="booking.isFinished()" icon="pi pi-check" :value="t('reputation.reviewed')" severity="success"/>
          <pv-button v-if="booking.canBeCancelled()" :label="t('booking.cancel-booking')" size="small" severity="danger"
                     outlined @click="cancelBooking(booking)"/>
        </template>
      </booking-item>
    </div>

    <review-dialog v-model:visible="reviewDialogVisible" :booking="bookingToReview"
                   :vehicle-name="bookingToReview ? (vehiclesById.get(bookingToReview.vehicleId)?.displayName ?? '') : ''"/>
  </div>
</template>