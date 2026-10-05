<script setup>
import {useI18n} from 'vue-i18n';

/**
 * Presentation component that lists the main specifications of a vehicle.
 */

/** @type {{vehicle: import('@/fleet/domain/model/vehicle.entity.js').Vehicle, compact?: boolean}} */
const {vehicle, compact} = defineProps({
  vehicle: {type: Object, required: true},
  compact: {type: Boolean, default: false}
});

const {t} = useI18n();
</script>

<template>
  <ul class="specs" :class="{ 'specs--compact': compact }">
    <li><i class="pi pi-map-marker" aria-hidden="true"/>{{ vehicle.location.shortLabel }}</li>
    <li><i class="pi pi-cog" aria-hidden="true"/>{{ t(`fleet.transmissions.${vehicle.transmission}`) }}</li>
    <li><i class="pi pi-users" aria-hidden="true"/>{{ t('fleet.seats-count', {count: vehicle.seats}) }}</li>
    <li><i class="pi pi-bolt" aria-hidden="true"/>{{ t(`fleet.fuel-types.${vehicle.fuelType}`) }}</li>
  </ul>
</template>

<style scoped>
.specs {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .45rem .75rem;
  color: var(--veygo-muted);
  font-size: .9rem;
}

.specs li {
  display: flex;
  align-items: center;
  gap: .4rem;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.specs .pi {
  color: #94a3b8;
}

.specs--compact {
  font-size: .82rem;
}
</style>
