<script setup>
import {computed, reactive, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {VehicleCategory} from '@/fleet/domain/model/vehicle-enums.js';
import {limaDistricts} from '@/shared/presentation/lima-districts.js';

/**
 * Presentation component: search bar with location, pickup date, return date and vehicle type.
 *
 * @remarks
 * Emits `search-requested` with {district, startDate, endDate, category}; dates are "YYYY-MM-DD".
 */

/** @type {{initial?: {district?: string, startDate?: string, endDate?: string, category?: string}}} */
const props = defineProps({initial: {type: Object, default: () => ({})}});

/** Emitted with the search values. */
const emit = defineEmits(['search-requested']);

const {t} = useI18n();
const today = new Date();

const toDate = value => value ? new Date(`${value}T00:00:00`) : null;
const toIso = date => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

const form = reactive({
  district: props.initial.district ?? '', startDate: toDate(props.initial.startDate), endDate: toDate(props.initial.endDate),
  category: props.initial.category ?? ''
});

const districtOptions = computed(() => [{label: t('fleet.all-lima'), value: ''}, ...limaDistricts.map(value => ({label: value, value}))]);
const categoryOptions = computed(() => [{label: t('fleet.all-categories'), value: ''},
  ...Object.values(VehicleCategory).map(value => ({label: t(`fleet.categories.${value}`), value}))]);
const minEndDate = computed(() => form.startDate ?? today);

watch(() => form.startDate, start => {
  if (start && form.endDate && form.endDate < start) form.endDate = null;
});

const submit = () => emit('search-requested', {
  district: form.district, startDate: toIso(form.startDate), endDate: toIso(form.endDate), category: form.category
});
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="submit">
    <div class="search-bar__field">
      <label for="search-district"><i class="pi pi-map-marker" aria-hidden="true"/> {{ t('fleet.location') }}</label>
      <pv-select v-model="form.district" input-id="search-district" :options="districtOptions" option-label="label"
                 option-value="value" filter fluid/>
    </div>
    <div class="search-bar__field">
      <label for="search-start"><i class="pi pi-calendar" aria-hidden="true"/> {{ t('fleet.start-date') }}</label>
      <pv-date-picker v-model="form.startDate" input-id="search-start" :min-date="today" :manual-input="false"
                      :placeholder="t('fleet.select-date')" fluid/>
    </div>
    <div class="search-bar__field">
      <label for="search-end"><i class="pi pi-calendar" aria-hidden="true"/> {{ t('fleet.end-date') }}</label>
      <pv-date-picker v-model="form.endDate" input-id="search-end" :min-date="minEndDate" :manual-input="false"
                      :placeholder="t('fleet.select-date')" fluid/>
    </div>
    <div class="search-bar__field">
      <label for="search-category"><i class="pi pi-car" aria-hidden="true"/> {{ t('fleet.vehicle-type') }}</label>
      <pv-select v-model="form.category" input-id="search-category" :options="categoryOptions" option-label="label"
                 option-value="value" fluid/>
    </div>
    <pv-button type="submit" icon="pi pi-search" :label="t('fleet.search')" class="search-bar__button"/>
  </form>
</template>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 1rem;
}

.search-bar__field {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  min-width: 0;
}

.search-bar__field label {
  font-weight: 600;
  font-size: .85rem;
  color: var(--veygo-text);
}

.search-bar__field label .pi {
  color: var(--veygo-blue);
}

@media (max-width: 1099px) {
  .search-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-bar__button {
    grid-column: 1 / -1;
  }
}

@media (max-width: 575px) {
  .search-bar {
    grid-template-columns: 1fr;
  }
}
</style>
