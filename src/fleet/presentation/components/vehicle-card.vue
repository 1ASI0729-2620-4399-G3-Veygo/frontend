<script setup>
import {useI18n} from 'vue-i18n';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import VehicleSpecs from '@/fleet/presentation/components/vehicle-specs.vue';

/**
 * Presentation component for a vehicle card in the catalog (search, favorites, recommendations).
 */

/** @type {{vehicle: import('@/fleet/domain/model/vehicle.entity.js').Vehicle, favorite?: boolean, showFavorite?: boolean, showBook?: boolean, unavailable?: boolean}} */
const {vehicle, favorite, showFavorite, showBook, unavailable} = defineProps({
  vehicle: {type: Object, required: true},
  unavailable: {type: Boolean, default: false},
  favorite: {type: Boolean, default: false},
  showFavorite: {type: Boolean, default: true},
  showBook: {type: Boolean, default: false}
});

/** Emitted when the favorite (heart) button is pressed. */
const emit = defineEmits(['favorite-toggled', 'details-requested', 'booking-requested']);

const {t} = useI18n();
const {formatMoney} = useFormatting();
</script>

<template>
  <article class="vehicle-card">
    <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName" class="vehicle-card__photo" loading="lazy">
    <div class="vehicle-card__body">
      <div class="flex align-items-center gap-2">
        <pv-tag v-if="unavailable" icon="pi pi-times-circle" :value="t('fleet.not-available')" severity="danger" class="text-xs"/>
        <pv-tag v-else icon="pi pi-circle-fill" :value="t('fleet.available')" severity="success" class="text-xs available-tag"/>
        <span v-if="vehicle.hasReviews()" class="vehicle-card__rating">
          <i class="pi pi-star-fill" aria-hidden="true"/> {{ vehicle.rating.toFixed(1) }}
          <small>({{ vehicle.reviewsCount }})</small>
        </span>
        <pv-button v-if="showFavorite" class="ml-auto" :icon="favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                   :severity="favorite ? 'danger' : 'secondary'" text rounded
                   :aria-label="favorite ? t('engagement.remove-favorite') : t('engagement.add-favorite')"
                   :aria-pressed="favorite" @click="emit('favorite-toggled', vehicle)"/>
      </div>
      <h3>{{ vehicle.displayName }}</h3>
      <small class="text-muted">{{ t(`fleet.categories.${vehicle.category}`) }}</small>
      <vehicle-specs :vehicle="vehicle" compact/>
      <div class="vehicle-card__footer">
        <div>
          <small class="text-muted">{{ t('fleet.rental') }}</small>
          <div class="price text-xl">{{ formatMoney(vehicle.pricePerDay) }} <span class="text-sm">/ {{ t('fleet.day') }}</span></div>
        </div>
        <div class="flex gap-2">
          <pv-button :label="t('fleet.view-details')" size="small" outlined @click="emit('details-requested', vehicle)"/>
          <pv-button v-if="showBook" :label="t('booking.book')" size="small" @click="emit('booking-requested', vehicle)"/>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.vehicle-card {
  display: flex;
  flex-direction: column;
  background: var(--veygo-card);
  border-radius: var(--veygo-radius);
  box-shadow: var(--veygo-shadow);
  overflow: hidden;
  height: 100%;
}

.vehicle-card__photo {
  width: 100%;
  height: 170px;
  object-fit: contain;
  background: var(--veygo-photo-bg);
  padding: .5rem;
}

.vehicle-card__body {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  padding: 1rem 1.1rem 1.1rem;
  flex: 1;
}

.available-tag :deep(.p-tag-icon) {
  font-size: .45rem;
}

.vehicle-card__body h3 {
  font-size: 1.15rem;
  font-weight: 700;
}

.vehicle-card__rating {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  font-size: .85rem;
  font-weight: 600;
}

.vehicle-card__rating .pi {
  color: #f59e0b;
}

.vehicle-card__rating small {
  color: var(--veygo-muted);
  font-weight: 400;
}

.vehicle-card__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: .75rem;
  margin-top: auto;
  padding-top: .75rem;
  border-top: 1px solid var(--veygo-line);
}
</style>
