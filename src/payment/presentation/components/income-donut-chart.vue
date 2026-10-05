<script setup>
import {computed, ref} from 'vue';

/**
 * Presentation component: donut chart of income by vehicle (part-to-whole).
 *
 * @remarks
 * Uses four validated categorical slots in a fixed order; a fifth or later vehicle folds
 * into "Other". Segments are separated by a 2px gap and every value is listed in the
 * legend, so identity never depends on color alone.
 */

/**
 * @typedef {Object} DonutItem
 * @property {string} label - Series label (vehicle).
 * @property {number} value - Amount.
 * @property {string} formatted - Formatted amount.
 */

/** @type {{items: DonutItem[], totalLabel: string, totalFormatted: string, otherLabel: string, ariaLabel: string}} */
const props = defineProps({
  items: {type: Array, required: true},
  totalLabel: {type: String, required: true},
  totalFormatted: {type: String, required: true},
  otherLabel: {type: String, required: true},
  ariaLabel: {type: String, required: true}
});

const palette = ['series-1', 'series-2', 'series-3', 'series-4'];
const radius = 60;
const circumference = 2 * Math.PI * radius;
const gap = 2;
const hovered = ref(-1);

/** Items with more than four vehicles fold into "Other". */
const slices = computed(() => {
  const head = props.items.slice(0, 4);
  const rest = props.items.slice(4);
  const list = rest.length
      ? [...head.slice(0, 3), {label: props.otherLabel, value: [head[3], ...rest].reduce((sum, item) => sum + item.value, 0), formatted: '', other: true}]
      : head;
  const total = list.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  return list.map((item, index) => {
    const length = item.value / total * circumference;
    const slice = {
      ...item, colorClass: item.other ? 'series-other' : palette[index],
      share: Math.round(item.value * 100 / total),
      dash: `${Math.max(0, length - gap)} ${circumference}`, offset: -offset
    };
    offset += length;
    return slice;
  });
});
</script>

<template>
  <figure class="donut" role="group" :aria-label="ariaLabel">
    <svg viewBox="0 0 160 160" class="donut__svg" aria-hidden="true">
      <circle cx="80" cy="80" :r="radius" class="donut__track"/>
      <circle v-for="(slice, index) in slices" :key="slice.label" cx="80" cy="80" :r="radius"
              class="donut__slice" :class="[slice.colorClass, { 'donut__slice--hover': hovered === index }]"
              :stroke-dasharray="slice.dash" :stroke-dashoffset="slice.offset" transform="rotate(-90 80 80)"
              @pointerenter="hovered = index" @pointerleave="hovered = -1"/>
      <text x="80" y="78" text-anchor="middle" class="donut__total">{{ totalFormatted }}</text>
      <text x="80" y="96" text-anchor="middle" class="donut__caption">{{ totalLabel }}</text>
    </svg>
    <ul class="donut__legend">
      <li v-for="(slice, index) in slices" :key="slice.label" tabindex="0" :class="{ 'donut__legend--hover': hovered === index }"
          @pointerenter="hovered = index" @pointerleave="hovered = -1" @focus="hovered = index" @blur="hovered = -1">
        <span class="donut__key" :class="slice.colorClass" aria-hidden="true"/>
        <span class="flex-1">{{ slice.label }}</span>
        <strong>{{ slice.formatted || `${slice.share}%` }}</strong>
        <small>{{ slice.share }}%</small>
      </li>
    </ul>
  </figure>
</template>

<style scoped>
.donut {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;
  --series-other: #8a8f98;
}

:global(.veygo-dark) .donut {
  --series-1: #3987e5;
  --series-2: #d95926;
  --series-3: #199e70;
  --series-4: #c98500;
}

.donut__svg {
  width: 170px;
  height: 170px;
  flex-shrink: 0;
}

.donut__track {
  fill: none;
  stroke: var(--veygo-line);
  stroke-width: 20;
}

.donut__slice {
  fill: none;
  stroke-width: 20;
  transition: stroke-width .15s;
}

.donut__slice--hover {
  stroke-width: 24;
}

.donut__slice.series-1 { stroke: var(--series-1); }
.donut__slice.series-2 { stroke: var(--series-2); }
.donut__slice.series-3 { stroke: var(--series-3); }
.donut__slice.series-4 { stroke: var(--series-4); }
.donut__slice.series-other { stroke: var(--series-other); }

.donut__total {
  font-size: 17px;
  font-weight: 800;
  fill: var(--veygo-text);
}

.donut__caption {
  font-size: 11px;
  fill: var(--veygo-muted);
}

.donut__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .55rem;
  min-width: 0;
}

.donut__legend li {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .25rem .4rem;
  border-radius: 8px;
  font-size: .9rem;
  outline: none;
}

.donut__legend li small {
  width: 38px;
  text-align: right;
  color: var(--veygo-muted);
}

.donut__legend--hover, .donut__legend li:focus-visible {
  background: var(--veygo-surface);
}

.donut__key {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.donut__key.series-1 { background: var(--series-1); }
.donut__key.series-2 { background: var(--series-2); }
.donut__key.series-3 { background: var(--series-3); }
.donut__key.series-4 { background: var(--series-4); }
.donut__key.series-other { background: var(--series-other); }

@media (max-width: 575px) {
  .donut {
    flex-direction: column;
    align-items: stretch;
  }

  .donut__svg {
    align-self: center;
  }
}
</style>
