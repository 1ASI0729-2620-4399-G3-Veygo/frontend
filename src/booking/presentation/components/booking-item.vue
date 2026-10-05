<script setup>
import {useI18n} from 'vue-i18n';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import BookingStatusTag from '@/booking/presentation/components/booking-status-tag.vue';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation component for a booking row (renter or owner perspective).
 */

/**
 * @type {{booking: import('@/booking/domain/model/booking.entity.js').Booking,
 *   vehicle: import('@/fleet/domain/model/vehicle.entity.js').Vehicle|null,
 *   counterpart?: import('@/iam/domain/model/user.entity.js').User|null, compact?: boolean}}
 */
const {booking, vehicle, counterpart, compact} = defineProps({
  booking: {type: Object, required: true},
  vehicle: {type: Object, default: null},
  counterpart: {type: Object, default: null},
  compact: {type: Boolean, default: false}
});

const {t} = useI18n();
const {formatMoney, formatRange} = useFormatting();
</script>

<template>
  <article class="booking-item" :class="{ 'booking-item--compact': compact }">
    <img :src="vehicle ? vehicle.mainPhotoUrl.toString() : '/images/vehicles/placeholder.svg'"
         :alt="vehicle?.displayName ?? ''" class="booking-item__photo" loading="lazy">
    <div class="booking-item__info">
      <h3>{{ vehicle?.displayName ?? t('booking.vehicle-number', { id: booking.vehicleId }) }}</h3>
      <span><i class="pi pi-calendar" aria-hidden="true"/> {{ formatRange(booking.period) }}
        <span class="text-muted">({{ t('booking.days-count', { count: booking.period.days  }, booking.period.days ) }})</span></span>
      <span v-if="vehicle" class="text-muted"><i class="pi pi-map-marker" aria-hidden="true"/> {{ vehicle.location.shortLabel }}</span>
      <span v-if="counterpart && !compact" class="flex align-items-center gap-2">
        <pv-avatar v-if="!counterpart.photoUrl.isEmpty()" :image="counterpart.photoUrl.toString()" shape="circle"/>
        <pv-avatar v-else :label="counterpart.initials" shape="circle" class="bg-primary text-white"/>
        <span><user-name-link :user-id="counterpart.id" :name="counterpart.fullName" :vehicle-id="booking.vehicleId"/>
          <small v-if="counterpart.reviewsCount" class="text-muted">
            <i class="pi pi-star-fill text-yellow-500" aria-hidden="true"/> {{ counterpart.rating.toFixed(1) }}
          </small>
        </span>
        <i v-if="counterpart.identityVerified" class="pi pi-verified text-green-600" v-tooltip="t('iam.verified')" :aria-label="t('iam.verified')"/>
      </span>
    </div>
    <div class="booking-item__summary">
      <booking-status-tag :status="booking.displayStatus"/>
      <strong class="text-2xl">{{ formatMoney(booking.totalPrice) }}</strong>
      <small class="text-muted">{{ t('booking.total') }}</small>
    </div>
    <div v-if="$slots.actions && !compact" class="booking-item__actions">
      <slot name="actions"/>
    </div>
  </article>
</template>

<style scoped>
.booking-item {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  background: var(--veygo-card);
  border-radius: var(--veygo-radius);
  box-shadow: var(--veygo-shadow);
}

.booking-item__photo {
  width: 100%;
  height: 110px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--veygo-surface);
}

.booking-item__info {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  min-width: 0;
}

.booking-item__info h3 {
  font-size: 1.15rem;
}

.booking-item__summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .25rem;
  min-width: 120px;
}

.booking-item__actions {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.booking-item.booking-item--compact {
  grid-template-columns: 88px minmax(0, 1fr);
  gap: .25rem .9rem;
  box-shadow: none;
  padding: .75rem 0;
  border-radius: 0;
  border-bottom: 1px solid var(--veygo-line);
}

.booking-item--compact .booking-item__photo {
  grid-row: span 2;
  height: 64px;
}

.booking-item--compact .booking-item__info {
  gap: .15rem;
  font-size: .85rem;
}

.booking-item--compact h3 {
  font-size: 1rem;
}

.booking-item--compact .booking-item__summary {
  grid-column: 2;
  flex-direction: row;
  align-items: center;
  gap: .6rem;
  min-width: 0;
}

.booking-item--compact .booking-item__summary strong {
  font-size: 1rem !important;
}

.booking-item--compact .booking-item__summary small {
  display: none;
}

@media (max-width: 991px) {
  .booking-item {
    grid-template-columns: 140px minmax(0, 1fr);
  }

  .booking-item__summary {
    grid-column: 2;
  }

  .booking-item__actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 575px) {
  .booking-item {
    grid-template-columns: 1fr;
  }

  .booking-item__summary {
    grid-column: auto;
  }

  .booking-item--compact {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .booking-item--compact .booking-item__summary {
    grid-column: 2;
  }
}
</style>