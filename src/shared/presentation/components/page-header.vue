<script setup>
/**
 * Presentation component for the title area of a view, with an optional back link and actions.
 */

/** @type {{title: string, subtitle?: string, backTo?: Object, backLabel?: string}} */
const {title, subtitle, backTo, backLabel} = defineProps({
  title: {type: String, required: true},
  subtitle: {type: String, default: ''},
  backTo: {type: Object, default: null},
  backLabel: {type: String, default: ''}
});
</script>

<template>
  <div class="page-header">
    <div>
      <router-link v-if="backTo" :to="backTo" class="page-header__back">
        <i class="pi pi-arrow-left" aria-hidden="true"/> {{ backLabel }}
      </router-link>
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="text-muted">{{ subtitle }}</p>
    </div>
    <div class="page-header__actions">
      <slot name="actions"/>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 800;
}

.page-header p {
  margin-top: .25rem;
  font-size: 1.05rem;
}

.page-header__back {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .5rem;
  color: var(--veygo-muted);
  text-decoration: none;
  font-weight: 500;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
}
</style>
