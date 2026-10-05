<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';

/**
 * Presentation component that shows the status of a booking with its semantic color.
 */

/** @type {{status: string}} */
const props = defineProps({status: {type: String, required: true}});

const {t} = useI18n();

const severities = {
  pending: 'warn', confirmed: 'success', 'in-progress': 'info', completed: 'secondary',
  cancelled: 'danger', rejected: 'danger'
};

const severity = computed(() => severities[props.status] ?? 'secondary');
</script>

<template>
  <pv-tag :value="t(`booking.statuses.${status}`)" :severity="severity" rounded/>
</template>
