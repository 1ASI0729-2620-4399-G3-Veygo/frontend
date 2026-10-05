<script setup>
import {useI18n} from 'vue-i18n';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation component for a review received by the owner.
 */

/**
 * @type {{review: import('@/reputation/domain/model/review.entity.js').Review,
 *   renter: import('@/iam/domain/model/user.entity.js').User|null,
 *   vehicle: import('@/fleet/domain/model/vehicle.entity.js').Vehicle|null,
 *   booking: import('@/booking/domain/model/booking.entity.js').Booking|null}}
 */
const {review, renter, vehicle, booking} = defineProps({
  review: {type: Object, required: true},
  renter: {type: Object, default: null},
  vehicle: {type: Object, default: null},
  booking: {type: Object, default: null}
});

const {t} = useI18n();
const {formatDate, formatRange} = useFormatting();
</script>

<template>
  <article class="review-item">
    <div class="review-item__author">
      <pv-avatar v-if="renter && !renter.photoUrl.isEmpty()" :image="renter.photoUrl.toString()" shape="circle" size="large"/>
      <pv-avatar v-else :label="renter?.initials ?? '?'" shape="circle" size="large" class="bg-primary text-white"/>
      <div>
        <user-name-link v-if="renter" :user-id="renter.id" :name="renter.fullName" :vehicle-id="review.vehicleId"/>
        <small class="block text-muted">{{ formatDate(review.createdAt) }}</small>
      </div>
    </div>
    <div class="review-item__body">
      <div class="flex align-items-center gap-2">
        <pv-rating :model-value="review.rating" readonly :aria-label="t('reputation.stars', { count: review.rating })"/>
        <strong>{{ review.rating.toFixed(1) }}</strong>
      </div>
      <p>{{ review.comment || t('reputation.no-comment') }}</p>
    </div>
    <div v-if="vehicle" class="review-item__vehicle">
      <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName">
      <div>
        <strong class="block">{{ vehicle.displayName }}</strong>
        <small v-if="booking" class="text-muted">{{ formatRange(booking.period) }}</small>
      </div>
    </div>
  </article>
</template>

<style scoped>
.review-item {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 220px;
  gap: 1.25rem;
  align-items: center;
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--veygo-line);
}

.review-item__author, .review-item__vehicle {
  display: flex;
  align-items: center;
  gap: .75rem;
  min-width: 0;
}

.review-item__body {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.review-item__body :deep(.p-rating-icon) {
  color: #f59e0b;
}

.review-item__vehicle img {
  width: 72px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--veygo-surface);
}

@media (max-width: 991px) {
  .review-item {
    grid-template-columns: 1fr;
    gap: .6rem;
  }
}
</style>
