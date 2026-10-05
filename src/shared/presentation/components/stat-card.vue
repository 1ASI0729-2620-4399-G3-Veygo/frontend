<script setup>
/**
 * Presentation component for a key metric (value, label and caption) with an icon.
 */

/** @type {{icon: string, value: string|number, label: string, caption?: string, tone?: string, to?: Object|null}} */
const {icon, value, label, caption, tone, to} = defineProps({
  to: {type: Object, default: null},
  icon: {type: String, required: true},
  value: {type: [String, Number], required: true},
  label: {type: String, required: true},
  caption: {type: String, default: ''},
  tone: {type: String, default: 'blue'}
});
</script>

<template>
  <component :is="to ? 'router-link' : 'article'" :to="to ?? undefined" class="stat-card"
             :class="[`stat-card--${tone}`, { 'stat-card--link': to }]">
    <span class="stat-card__icon" aria-hidden="true"><i :class="icon"/></span>
    <div>
      <strong class="stat-card__value">{{ value }}</strong>
      <span class="stat-card__label">{{ label }}</span>
      <small v-if="caption" class="stat-card__caption">{{ caption }}</small>
    </div>
    <i v-if="to" class="pi pi-chevron-right stat-card__chevron" aria-hidden="true"/>
  </component>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: var(--veygo-radius);
  height: 100%;
}

.stat-card--blue { background: var(--veygo-tint-blue); --tone: #2563eb; }
.stat-card--green { background: var(--veygo-tint-green); --tone: #16a34a; }
.stat-card--amber { background: var(--veygo-tint-amber); --tone: #b45309; }
.stat-card--violet { background: var(--veygo-tint-violet); --tone: #6d28d9; }

.stat-card--link {
  text-decoration: none;
  color: inherit;
  transition: transform .15s, box-shadow .15s;
}

.stat-card--link:hover {
  transform: translateY(-2px);
  box-shadow: var(--veygo-shadow);
}

.stat-card__chevron {
  margin-left: auto;
  color: var(--tone);
}

.stat-card__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--veygo-card);
  color: var(--tone);
  font-size: 1.4rem;
}

.stat-card__value {
  display: block;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
}

.stat-card__label {
  display: block;
  color: var(--veygo-text);
}

.stat-card__caption {
  color: var(--veygo-muted);
}
</style>
