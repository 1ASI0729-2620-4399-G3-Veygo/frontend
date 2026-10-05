<script setup>
/**
 * Presentation component for a shortcut to a frequent task.
 */

/** @type {{icon: string, title: string, description: string, to: Object, tone?: string}} */
const {icon, title, description, to, tone} = defineProps({
  icon: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String, required: true},
  to: {type: Object, required: true},
  tone: {type: String, default: 'blue'}
});
</script>

<template>
  <router-link :to="to" class="quick-action" :class="`quick-action--${tone}`">
    <span class="quick-action__icon" aria-hidden="true"><i :class="icon"/></span>
    <span>
      <strong>{{ title }}</strong>
      <small>{{ description }}</small>
    </span>
  </router-link>
</template>

<style scoped>
.quick-action {
  display: flex;
  align-items: center;
  gap: .9rem;
  padding: 1rem;
  border-radius: 14px;
  text-decoration: none;
  color: var(--veygo-text);
  height: 100%;
  transition: transform .15s;
}

.quick-action:hover {
  transform: translateY(-2px);
}

.quick-action--blue { background: var(--veygo-tint-blue); --tone: #2563eb; }
.quick-action--green { background: var(--veygo-tint-green); --tone: #16a34a; }
.quick-action--amber { background: var(--veygo-tint-amber); --tone: #b45309; }
.quick-action--violet { background: var(--veygo-tint-violet); --tone: #6d28d9; }

.quick-action__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--veygo-card);
  color: var(--tone);
}

.quick-action strong, .quick-action small {
  display: block;
}

.quick-action small {
  color: var(--veygo-muted);
}
</style>
