<script setup>
import {useI18n} from 'vue-i18n';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import VehicleSpecs from '@/fleet/presentation/components/vehicle-specs.vue';

/**
 * Presentation component for a vehicle row in the owner's fleet.
 */

/** @type {{vehicle: import('@/fleet/domain/model/vehicle.entity.js').Vehicle, compact?: boolean}} */
const {vehicle, compact} = defineProps({
  vehicle: {type: Object, required: true},
  compact: {type: Boolean, default: false}
});

/** Emitted to edit, see details or calendar, publish/unpublish or delete the vehicle. */
const emit = defineEmits(['edit-requested', 'details-requested', 'calendar-requested', 'publication-toggled', 'delete-requested']);

const {t} = useI18n();
const {formatMoney} = useFormatting();
</script>

<template>
  <article class="owner-vehicle" :class="{ 'owner-vehicle--compact': compact }">
    <img :src="vehicle.mainPhotoUrl.toString()" :alt="vehicle.displayName" class="owner-vehicle__photo" loading="lazy">
    <div class="owner-vehicle__info">
      <div class="flex flex-wrap align-items-center gap-2">
        <h3><button type="button" class="owner-vehicle__name" @click="emit('details-requested', vehicle)">{{ vehicle.displayName }}</button></h3>
        <pv-tag :value="t(`fleet.categories.${vehicle.category}`)" severity="contrast" class="text-xs"/>
      </div>
      <vehicle-specs :vehicle="vehicle" :compact="compact"/>
      <div v-if="!compact && vehicle.features.length" class="flex flex-wrap gap-2">
        <span v-for="feature in vehicle.features.slice(0, 3)" :key="feature" class="feature-chip">
          {{ t(`fleet.features.${feature}`) }}
        </span>
      </div>
    </div>
    <div class="owner-vehicle__price">
      <span class="price text-2xl">{{ formatMoney(vehicle.pricePerDay) }}</span>
      <small class="text-muted">{{ t('fleet.per-day') }}</small>
      <pv-tag :value="vehicle.published ? t('fleet.published') : t('fleet.unpublished')"
              :severity="vehicle.published ? 'success' : 'secondary'" rounded/>
    </div>
    <div v-if="compact" class="owner-vehicle__compact-actions">
      <pv-button :label="t('shared.edit')" size="small" outlined severity="secondary" @click="emit('edit-requested', vehicle)"/>
      <pv-button :label="t('fleet.view-calendar')" size="small" outlined @click="emit('calendar-requested', vehicle)"/>
    </div>
    <div v-else class="owner-vehicle__actions">
      <pv-button :label="t('shared.edit')" icon="pi pi-pencil" size="small" outlined severity="secondary"
                 @click="emit('edit-requested', vehicle)"/>
      <pv-button :label="t('fleet.view-details')" icon="pi pi-eye" size="small" outlined
                 @click="emit('details-requested', vehicle)"/>
      <div class="flex gap-2">
        <pv-button :icon="vehicle.published ? 'pi pi-eye-slash' : 'pi pi-globe'" size="small" text
                   v-tooltip.top="vehicle.published ? t('fleet.unpublish') : t('fleet.publish')"
                   :aria-label="vehicle.published ? t('fleet.unpublish') : t('fleet.publish')"
                   @click="emit('publication-toggled', vehicle)"/>
        <pv-button icon="pi pi-trash" size="small" text severity="danger" v-tooltip.top="t('fleet.delete-vehicle')"
                   :aria-label="t('fleet.delete-vehicle')" @click="emit('delete-requested', vehicle)"/>
      </div>
    </div>
  </article>
</template>

<style scoped>
.owner-vehicle {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  background: var(--veygo-card);
  border-radius: var(--veygo-radius);
  box-shadow: var(--veygo-shadow);
}

.owner-vehicle__photo {
  width: 100%;
  height: 110px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--veygo-surface);
}

.owner-vehicle__info {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  min-width: 0;
}

.owner-vehicle__info h3 {
  font-size: 1.15rem;
}

.owner-vehicle__price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .25rem;
}

.owner-vehicle__actions {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.feature-chip {
  font-size: .75rem;
  padding: .2rem .6rem;
  border-radius: 999px;
  background: var(--veygo-surface);
  color: var(--veygo-muted);
}

.owner-vehicle__name {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.owner-vehicle__name:hover {
  color: var(--veygo-blue);
}

.owner-vehicle__compact-actions {
  grid-column: 2 / -1;
  display: flex;
  gap: .5rem;
  justify-content: flex-end;
}

.owner-vehicle--compact {
  grid-template-columns: 120px minmax(0, 1fr) auto;
  row-gap: .5rem;
  box-shadow: none;
  padding: .5rem 0;
  border-bottom: 1px solid var(--veygo-line);
  border-radius: 0;
}

.owner-vehicle--compact .owner-vehicle__photo {
  height: 72px;
}


@media (max-width: 991px) {
  .owner-vehicle {
    grid-template-columns: 140px minmax(0, 1fr);
  }

  .owner-vehicle__actions {
    flex-direction: row;
    flex-wrap: wrap;
    grid-column: 1 / -1;
  }

  .owner-vehicle--compact {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .owner-vehicle--compact .owner-vehicle__price {
    grid-column: 2;
  }
}

@media (max-width: 575px) {
  .owner-vehicle {
    grid-template-columns: 1fr;
  }
}
</style>
