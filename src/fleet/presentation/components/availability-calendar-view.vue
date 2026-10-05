<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {DayStatus, toIsoDate} from '@/fleet/domain/model/availability-calendar.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Presentation component that draws a month of an {@link AvailabilityCalendar}.
 *
 * @remarks
 * Each day shows its state (available, pending, confirmed, blocked). In selectable mode
 * the owner can pick days to block or unblock; the compact mode is used as a summary.
 */

/**
 * @type {{calendar: import('@/fleet/domain/model/availability-calendar.js').AvailabilityCalendar|null,
 *   month: Date, selectedDates?: string[], selectable?: boolean, compact?: boolean, renterNames?: Map}}
 */
const props = defineProps({
  calendar: {type: Object, default: null},
  month: {type: Date, required: true},
  selectedDates: {type: Array, default: () => []},
  selectable: {type: Boolean, default: false},
  compact: {type: Boolean, default: false},
  renterNames: {type: Map, default: () => new Map()}
});

/** Emitted when a day is clicked (selectable mode) or the month changes. */
const emit = defineEmits(['day-toggled', 'month-changed']);

const {t} = useI18n();
const {intlLocale} = useFormatting();

const monthLabel = computed(() => props.month.toLocaleDateString(intlLocale.value, {month: 'long', year: 'numeric'}));

/** Week day names starting on Monday. */
const weekDays = computed(() => Array.from({length: 7}, (_, index) =>
    new Date(2024, 0, 1 + index).toLocaleDateString(intlLocale.value, {weekday: props.compact ? 'narrow' : 'short'})));

/** Six weeks of days covering the month. */
const days = computed(() => {
  const first = new Date(props.month.getFullYear(), props.month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const today = toIsoDate(new Date());
  return Array.from({length: 42}, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - offset + index);
    const iso = toIsoDate(date);
    const booking = props.calendar?.bookingOn(date);
    return {
      date, iso,
      inMonth: date.getMonth() === first.getMonth(),
      isToday: iso === today,
      status: props.calendar ? props.calendar.statusOf(date) : DayStatus.AVAILABLE,
      renterName: booking ? props.renterNames.get(booking.renterId) : '',
      selected: props.selectedDates.includes(iso)
    };
  });
});

/**
 * Moves the calendar by a number of months.
 *
 * @param {number} delta - Months to move.
 */
const moveMonth = delta => emit('month-changed', new Date(props.month.getFullYear(), props.month.getMonth() + delta, 1));

/**
 * Accessible description of a day.
 *
 * @param {Object} day - The day.
 * @returns {string}
 */
const dayLabel = day => `${day.date.toLocaleDateString(intlLocale.value, {day: 'numeric', month: 'long'})}: ${t(`fleet.day-status.${day.status}`)}`;
</script>

<template>
  <div class="calendar" :class="{ 'calendar--compact': compact }">
    <div class="calendar__toolbar">
      <pv-button icon="pi pi-chevron-left" text rounded size="small" :aria-label="t('fleet.previous-month')" @click="moveMonth(-1)"/>
      <strong class="calendar__month">{{ monthLabel }}</strong>
      <pv-button icon="pi pi-chevron-right" text rounded size="small" :aria-label="t('fleet.next-month')" @click="moveMonth(1)"/>
      <pv-button v-if="!compact" :label="t('fleet.today')" outlined size="small" class="ml-auto"
                 @click="emit('month-changed', new Date(new Date().getFullYear(), new Date().getMonth(), 1))"/>
    </div>
    <div class="calendar__grid" role="grid" :aria-label="monthLabel">
      <div v-for="weekDay in weekDays" :key="weekDay" class="calendar__weekday" role="columnheader">{{ weekDay }}</div>
      <button v-for="day in days" :key="day.iso" type="button" role="gridcell"
              class="calendar__day" :class="[`calendar__day--${day.status}`, {
                'calendar__day--outside': !day.inMonth, 'calendar__day--today': day.isToday, 'calendar__day--selected': day.selected
              }]"
              :disabled="!selectable" :aria-pressed="selectable ? day.selected : undefined" :aria-label="dayLabel(day)"
              @click="emit('day-toggled', day)">
        <span class="calendar__number">{{ day.date.getDate() }}</span>
        <span v-if="!compact && day.status !== 'available'" class="calendar__note">
          {{ day.status === 'blocked' ? t('fleet.day-status.blocked') : `${t(`fleet.day-status.${day.status}`)}${day.renterName ? ' · ' + day.renterName : ''}` }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.calendar__toolbar {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: .75rem;
}

.calendar__month {
  min-width: 150px;
  text-align: center;
  text-transform: capitalize;
  font-size: 1.1rem;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border: 1px solid var(--veygo-line);
  border-radius: 12px;
  overflow: hidden;
}

.calendar__weekday {
  padding: .6rem .25rem;
  text-align: center;
  font-size: .8rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--veygo-muted);
  background: var(--veygo-surface);
}

.calendar__day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .2rem;
  min-height: 86px;
  padding: .45rem;
  border: 0;
  border-top: 1px solid var(--veygo-line);
  border-left: 1px solid var(--veygo-line);
  background: var(--veygo-card);
  color: var(--veygo-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.calendar__day:nth-child(7n + 1) {
  border-left: 0;
}

.calendar__day:disabled {
  cursor: default;
}

.calendar__number {
  font-weight: 600;
}

.calendar__note {
  font-size: .7rem;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.calendar__day--confirmed { background: var(--veygo-tint-green); color: #15803d; }
.calendar__day--pending { background: var(--veygo-tint-amber); color: #a16207; }
.calendar__day--blocked { background: var(--veygo-tint-red); color: #b91c1c; }
.calendar__day--outside { opacity: .45; }
.calendar__day--today .calendar__number { color: var(--veygo-blue); text-decoration: underline; }

.calendar__day--selected {
  outline: 3px solid #38bdf8;
  outline-offset: -3px;
  background: #e0f2fe;
  color: #075985;
}

.calendar--compact .calendar__day {
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 0;
  font-size: .85rem;
}

.calendar--compact .calendar__grid {
  border: 0;
}

.calendar--compact .calendar__weekday {
  background: transparent;
}

@media (max-width: 767px) {
  .calendar__day {
    min-height: 52px;
  }

  .calendar__note {
    display: none;
  }
}
</style>
