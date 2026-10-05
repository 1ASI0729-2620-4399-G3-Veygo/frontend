<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';

/**
 * Presentation component with status tabs (and counters) to filter a list of bookings.
 */

/** @type {{bookings: import('@/booking/domain/model/booking.entity.js').Booking[], modelValue: string}} */
const props = defineProps({
  bookings: {type: Array, required: true},
  modelValue: {type: String, required: true}
});

/** Emitted with the selected status ("all" or a display status). */
const emit = defineEmits(['update:modelValue']);

const {t} = useI18n();
const statuses = ['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected'];

const options = computed(() => statuses
    .map(status => ({
      value: status,
      count: status === 'all' ? props.bookings.length : props.bookings.filter(b => b.displayStatus === status).length
    }))
    .filter(option => option.value === 'all' || option.count > 0)
    .map(option => ({...option, label: `${t(`booking.statuses.${option.value}`)} (${option.count})`})));
</script>

<template>
  <pv-select-button :model-value="modelValue" :options="options" option-label="label" option-value="value"
                    :allow-empty="false" class="flex-wrap" :aria-label="t('booking.filter-by-status')"
                    @update:model-value="emit('update:modelValue', $event)"/>
</template>