<script setup>
import {useI18n} from 'vue-i18n';
import {FuelType, TransmissionType} from '@/fleet/domain/model/vehicle-enums.js';

/**
 * Presentation component with the search filters of the vehicle catalog.
 *
 * @remarks
 * Works with a {@link VehicleSearchCriteria}; every change emits `criteria-changed`
 * with the updated properties so the store can rebuild the criteria.
 */

/** @type {{criteria: import('@/fleet/domain/model/vehicle-search-criteria.js').VehicleSearchCriteria}} */
const {criteria} = defineProps({criteria: {type: Object, required: true}});

/** Emitted with the changed criteria properties, or when filters are cleared. */
const emit = defineEmits(['criteria-changed', 'criteria-cleared']);

const {t} = useI18n();

const transmissions = Object.values(TransmissionType);
const fuelTypes = Object.values(FuelType);

/**
 * Adds or removes a value from a multi-choice filter.
 *
 * @param {string} field - "transmissions" or "fuelTypes".
 * @param {string} value - The toggled value.
 */
const toggleValue = (field, value) => {
  const values = criteria[field].includes(value)
      ? criteria[field].filter(item => item !== value)
      : [...criteria[field], value];
  emit('criteria-changed', {[field]: values});
};
</script>

<template>
  <aside class="veygo-card filters" :aria-label="t('fleet.filters')">
    <div class="flex justify-content-between align-items-center mb-3">
      <h2 class="text-xl">{{ t('fleet.filters') }}</h2>
      <pv-button :label="t('fleet.clear-all')" link size="small" @click="emit('criteria-cleared')"/>
    </div>

    <section>
      <h3 id="price-label">{{ t('fleet.price-per-day') }}</h3>
      <pv-slider :model-value="criteria.priceRange" range :min="0" :max="1000" :step="10" class="mx-2 my-3"
                 aria-labelledby="price-label" @update:model-value="emit('criteria-changed', { priceRange: $event })"/>
      <div class="flex justify-content-between text-sm text-muted">
        <span>S/ {{ criteria.priceRange[0] }}</span><span>S/ {{ criteria.priceRange[1] }}</span>
      </div>
    </section>

    <section>
      <h3>{{ t('fleet.transmission') }}</h3>
      <div v-for="value in transmissions" :key="value" class="flex align-items-center gap-2 mb-2">
        <pv-checkbox :model-value="criteria.transmissions.includes(value)" binary :input-id="`transmission-${value}`"
                     @update:model-value="toggleValue('transmissions', value)"/>
        <label :for="`transmission-${value}`">{{ t(`fleet.transmissions.${value}`) }}</label>
      </div>
    </section>

    <section>
      <h3>{{ t('fleet.fuel-type') }}</h3>
      <div v-for="value in fuelTypes" :key="value" class="flex align-items-center gap-2 mb-2">
        <pv-checkbox :model-value="criteria.fuelTypes.includes(value)" binary :input-id="`fuel-${value}`"
                     @update:model-value="toggleValue('fuelTypes', value)"/>
        <label :for="`fuel-${value}`">{{ t(`fleet.fuel-types.${value}`) }}</label>
      </div>
    </section>

    <section>
      <h3 id="rating-label">{{ t('fleet.minimum-rating') }}</h3>
      <pv-rating :model-value="criteria.minRating" aria-labelledby="rating-label"
                 @update:model-value="emit('criteria-changed', { minRating: $event ?? 0 })"/>
    </section>
  </aside>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filters h3 {
  font-size: .95rem;
  font-weight: 600;
  margin-bottom: .6rem;
}
</style>
