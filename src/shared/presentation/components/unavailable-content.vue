<script setup>
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Presentation component for empty states and error messages.
 */

/** @type {{icon?: string, title: string, errors?: string[]}} */
const {icon, title, errors} = defineProps({
  icon: {type: String, default: 'pi pi-inbox'},
  title: {type: String, required: true},
  errors: {type: Array, default: () => []}
});

const {translateOrKeep} = useFormatting();
</script>

<template>
  <div class="unavailable" role="status">
    <i :class="icon" aria-hidden="true"/>
    <h2>{{ title }}</h2>
    <p v-for="error in errors" :key="error" class="text-muted">{{ translateOrKeep(error) }}</p>
    <slot/>
  </div>
</template>

<style scoped>
.unavailable {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--veygo-muted);
}

.unavailable .pi {
  font-size: 3rem;
  color: #94a3b8;
}

.unavailable h2 {
  font-size: 1.2rem;
  color: var(--veygo-text);
}
</style>
