<script setup>
import {computed, ref} from 'vue';

/**
 * Presentation component: single-series vertical bar chart (e.g. income per month).
 *
 * @remarks
 * One hue; the highlighted bar (current period) uses the strong step. Values are
 * direct-labeled above each bar and every bar has a hover/focus tooltip.
 */

/**
 * @typedef {Object} BarChartItem
 * @property {string} label - Category label (e.g. month).
 * @property {number} value - Numeric value.
 * @property {string} formatted - Value formatted for display.
 */

/** @type {{items: BarChartItem[], ariaLabel: string, highlightIndex?: number, height?: number}} */
const props = defineProps({
  items: {type: Array, required: true},
  ariaLabel: {type: String, required: true},
  highlightIndex: {type: Number, default: -1},
  height: {type: Number, default: 180}
});

const hovered = ref(-1);
const maxValue = computed(() => Math.max(1, ...props.items.map(item => item.value)));
const barHeight = value => `${Math.max(4, Math.round(value / maxValue.value * props.height))}px`;
</script>

<template>
  <figure class="bar-chart" role="group" :aria-label="ariaLabel">
    <div class="bar-chart__plot" :style="{ height: `${height + 28}px` }">
      <div v-for="(item, index) in items" :key="item.label" class="bar-chart__column"
           tabindex="0" :aria-label="`${item.label}: ${item.formatted}`"
           @pointerenter="hovered = index" @pointerleave="hovered = -1" @focus="hovered = index" @blur="hovered = -1">
        <span class="bar-chart__value" :class="{ 'bar-chart__value--strong': index === highlightIndex }">{{ item.formatted }}</span>
        <span class="bar-chart__bar" :class="{ 'bar-chart__bar--highlight': index === highlightIndex, 'bar-chart__bar--hover': index === hovered }"
              :style="{ height: barHeight(item.value) }"/>
        <span v-if="hovered === index" class="bar-chart__tooltip" role="tooltip">
          <strong>{{ item.formatted }}</strong>
          <small>{{ item.label }}</small>
        </span>
      </div>
    </div>
    <div class="bar-chart__axis" aria-hidden="true">
      <span v-for="(item, index) in items" :key="item.label" :class="{ 'bar-chart__label--strong': index === highlightIndex }">{{ item.label }}</span>
    </div>
  </figure>
</template>

<style scoped>
.bar-chart {
  margin: 0;
  --bar: #bfd3f5;
  --bar-strong: #2a78d6;
}

:global(.veygo-dark) .bar-chart {
  --bar: #28446f;
  --bar-strong: #3987e5;
}

.bar-chart__plot {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  border-bottom: 1px solid var(--veygo-line);
}

.bar-chart__column {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
  outline: none;
  cursor: default;
}

.bar-chart__column:focus-visible .bar-chart__bar {
  outline: 2px solid var(--bar-strong);
  outline-offset: 2px;
}

.bar-chart__value {
  font-size: .75rem;
  color: var(--veygo-muted);
  white-space: nowrap;
}

.bar-chart__value--strong {
  color: var(--veygo-text);
  font-weight: 700;
}

.bar-chart__bar {
  width: min(44px, 70%);
  border-radius: 4px 4px 0 0;
  background: var(--bar);
  transition: filter .15s;
}

.bar-chart__bar--highlight {
  background: var(--bar-strong);
}

.bar-chart__bar--hover {
  filter: brightness(1.08);
}

.bar-chart__tooltip {
  position: absolute;
  bottom: calc(100% - 20px);
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: .4rem .6rem;
  border-radius: 8px;
  background: var(--veygo-card);
  box-shadow: var(--veygo-shadow);
  border: 1px solid var(--veygo-line);
  white-space: nowrap;
  pointer-events: none;
}

.bar-chart__tooltip small {
  color: var(--veygo-muted);
}

.bar-chart__axis {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 6px;
  text-align: center;
  font-size: .75rem;
  color: var(--veygo-muted);
  text-transform: capitalize;
}

.bar-chart__label--strong {
  color: var(--bar-strong);
  font-weight: 700;
}
</style>
