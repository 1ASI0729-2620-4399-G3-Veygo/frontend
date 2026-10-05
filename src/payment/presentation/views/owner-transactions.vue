<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {paymentStore} from '@/payment/application/payment.store.js';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {IncomeSummary} from '@/payment/domain/model/income-summary.js';
import {TransactionStatus} from '@/payment/domain/model/transaction.entity.js';
import {downloadCsvReport} from '@/payment/infrastructure/transaction-report.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import StatCard from '@/shared/presentation/components/stat-card.vue';
import BarChart from '@/shared/presentation/components/bar-chart.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import IncomeDonutChart from '@/payment/presentation/components/income-donut-chart.vue';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation view where owners review their income: summary for a date range,
 * income by month and by vehicle, transaction history and a downloadable report.
 */
const {t} = useI18n();
const {intlLocale, formatMoney, formatRange, formatDate} = useFormatting();

const now = new Date();
const range = ref([new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)]);
const searchText = ref('');
const statusFilter = ref('all');
const first = ref(0);
const rowsPerPage = 5;
const vehiclesById = ref(new Map());
const usersById = ref(new Map());

const rangeStart = computed(() => range.value?.[0] ?? null);
const rangeEnd = computed(() => {
  const end = range.value?.[1] ?? range.value?.[0];
  return end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59) : null;
});

/**
 * Transactions whose date is inside an interval.
 *
 * @param {Date} start - Start.
 * @param {Date} end - End.
 * @returns {import('@/payment/domain/model/transaction.entity.js').Transaction[]}
 */
const transactionsBetween = (start, end) => paymentStore.transactions.filter(transaction => {
  const date = transaction.date.toDate();
  return date >= start && date <= end;
});

const inRange = computed(() => rangeStart.value ? transactionsBetween(rangeStart.value, rangeEnd.value) : paymentStore.transactions);
const summary = computed(() => new IncomeSummary(inRange.value));

/** Income variation against the previous period of the same length. */
const incomeVariation = computed(() => {
  if (!rangeStart.value) return null;
  const length = rangeEnd.value - rangeStart.value;
  const previous = new IncomeSummary(transactionsBetween(new Date(rangeStart.value - length - 1000), new Date(rangeStart.value - 1000)));
  if (!previous.income.amount) return null;
  return Math.round((summary.value.income.amount - previous.income.amount) * 100 / previous.income.amount);
});

const monthlyItems = computed(() => IncomeSummary.incomeByMonth(paymentStore.transactions, rangeEnd.value ?? now)
    .map(item => ({
      label: new Date(item.year, item.month, 1).toLocaleDateString(intlLocale.value, {month: 'short', year: 'numeric'}),
      value: item.amount.amount,
      formatted: formatMoney(item.amount)
    })));

const vehicleItems = computed(() => summary.value.incomeByVehicle().map(item => ({
  label: vehiclesById.value.get(item.vehicleId)?.displayName ?? t('booking.vehicle-number', {id: item.vehicleId}),
  value: item.amount.amount,
  formatted: formatMoney(item.amount)
})));

const statusOptions = computed(() => [{label: t('payment.all-statuses'), value: 'all'},
  ...Object.values(TransactionStatus).map(value => ({label: t(`payment.statuses.${value}`), value}))]);

const filteredTransactions = computed(() => {
  const text = searchText.value.trim().toLowerCase();
  return inRange.value
      .filter(transaction => statusFilter.value === 'all' || transaction.status === statusFilter.value)
      .filter(transaction => !text || [transaction.code, usersById.value.get(transaction.renterId)?.fullName,
        vehiclesById.value.get(transaction.vehicleId)?.displayName].some(value => value?.toLowerCase().includes(text)));
});

const pageTransactions = computed(() => filteredTransactions.value.slice(first.value, first.value + rowsPerPage));

const statusSeverity = {completed: 'success', pending: 'warn', refunded: 'danger'};

/**
 * Downloads the filtered transactions as a CSV report.
 */
const downloadReport = () => {
  const headers = [t('payment.date'), t('payment.code'), t('payment.client'), t('payment.vehicle'),
    t('payment.rental-period'), t('payment.amount'), t('payment.status'), t('booking.payment-method')];
  const rows = filteredTransactions.value.map(transaction => [
    formatDate(transaction.date), transaction.code, usersById.value.get(transaction.renterId)?.fullName ?? transaction.renterId,
    vehiclesById.value.get(transaction.vehicleId)?.displayName ?? transaction.vehicleId, formatRange(transaction.period),
    transaction.amount.amount.toFixed(2), t(`payment.statuses.${transaction.status}`), t(`booking.payment-methods.${transaction.paymentMethod}`)
  ]);
  const suffix = rangeStart.value ? `${rangeStart.value.toISOString().slice(0, 10)}_${(range.value[1] ?? range.value[0]).toISOString().slice(0, 10)}` : 'all';
  downloadCsvReport(rows, headers, `veygo-transactions-${suffix}.csv`);
};

watch([searchText, statusFilter, range], () => first.value = 0);

onMounted(() => {
  const owner = iamStore.currentUser;
  Promise.all([paymentStore.loadOwnerTransactions(owner.id), fleetStore.loadOwnerVehicles(owner.id)]).then(() => {
    vehiclesById.value = new Map(fleetStore.ownerVehicles.map(vehicle => [vehicle.id, vehicle]));
    const renterIds = [...new Set(paymentStore.transactions.map(transaction => transaction.renterId))];
    return Promise.all(renterIds.map(id => iamStore.fetchUserById(id)));
  }).then(users => usersById.value = new Map((users ?? []).filter(Boolean).map(user => [user.id, user])));
});
</script>

<template>
  <div class="page">
    <page-header :title="t('payment.title')" :subtitle="t('payment.subtitle')">
      <template #actions>
        <label for="transactions-range" class="sr-only">{{ t('payment.date-range') }}</label>
        <pv-date-picker v-model="range" input-id="transactions-range" selection-mode="range" :manual-input="false"
                        show-icon date-format="dd/mm/yy" style="min-width: 250px"/>
        <pv-button :label="t('payment.download-report')" icon="pi pi-download" outlined
                   :disabled="!filteredTransactions.length" @click="downloadReport"/>
      </template>
    </page-header>

    <unavailable-content v-if="paymentStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="paymentStore.errors"/>

    <template v-else>
      <section class="stats-grid" :aria-label="t('dashboard.metrics')" :class="{ 'is-loading': paymentStore.loading }">
        <stat-card icon="pi pi-wallet" :value="formatMoney(summary.income)" :label="t('payment.total-income')"
                   :caption="incomeVariation === null ? t('payment.no-previous') : t('payment.vs-previous', { value: `${incomeVariation > 0 ? '+' : ''}${incomeVariation}%` })"/>
        <stat-card icon="pi pi-check" tone="green" :value="summary.completed.length" :label="t('payment.completed-transactions')"
                   :caption="t('payment.of-total', { value: summary.percentage(summary.completed) })"/>
        <stat-card icon="pi pi-clock" tone="amber" :value="summary.pending.length" :label="t('payment.pending-transactions')"
                   :caption="`${formatMoney(summary.pendingAmount)} · ${t('payment.of-total', { value: summary.percentage(summary.pending) })}`"/>
        <stat-card icon="pi pi-replay" tone="violet" :value="formatMoney(summary.refundedAmount)" :label="t('payment.refunds')"
                   :caption="t('payment.of-total', { value: summary.percentage(summary.refunded) })"/>
      </section>

      <div class="grid">
        <section class="col-12 lg:col-7">
          <div class="veygo-card h-full">
            <h2 class="text-lg mb-3">{{ t('payment.income-by-month') }}</h2>
            <bar-chart :items="monthlyItems" :highlight-index="monthlyItems.length - 1" :aria-label="t('payment.income-by-month')"/>
          </div>
        </section>
        <section class="col-12 lg:col-5">
          <div class="veygo-card h-full">
            <h2 class="text-lg mb-3">{{ t('payment.income-by-vehicle') }}</h2>
            <income-donut-chart v-if="vehicleItems.length" :items="vehicleItems" :total-label="t('payment.total')"
                                :total-formatted="formatMoney(summary.income)" :other-label="t('payment.other-vehicles')"
                                :aria-label="t('payment.income-by-vehicle')"/>
            <p v-else class="text-muted">{{ t('payment.no-income-in-range') }}</p>
          </div>
        </section>
      </div>

      <section class="veygo-card">
        <div class="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <h2 class="text-lg">{{ t('payment.history') }}</h2>
          <div class="flex flex-wrap gap-2">
            <pv-icon-field>
              <pv-input-icon class="pi pi-search"/>
              <pv-input-text v-model="searchText" :placeholder="t('payment.search-placeholder')" :aria-label="t('payment.search-placeholder')"/>
            </pv-icon-field>
            <pv-select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
                       :aria-label="t('payment.status')"/>
          </div>
        </div>
        <div class="table-scroll">
          <table class="transactions-table">
            <caption class="sr-only">{{ t('payment.history') }}</caption>
            <thead>
            <tr>
              <th scope="col">{{ t('payment.date') }}</th>
              <th scope="col">{{ t('payment.code') }}</th>
              <th scope="col">{{ t('payment.client') }}</th>
              <th scope="col">{{ t('payment.vehicle') }}</th>
              <th scope="col">{{ t('payment.rental-period') }}</th>
              <th scope="col">{{ t('payment.amount') }}</th>
              <th scope="col">{{ t('payment.status') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="!pageTransactions.length">
              <td colspan="7" class="text-center text-muted">{{ t('payment.no-transactions') }}</td>
            </tr>
            <tr v-for="transaction in pageTransactions" :key="transaction.code">
              <td>{{ formatDate(transaction.date) }}</td>
              <td class="text-muted">{{ transaction.code }}</td>
              <td>
                <template v-for="client in [usersById.get(transaction.renterId)]" :key="transaction.code">
                  <user-name-link v-if="client" :user-id="client.id" :name="client.fullName" :vehicle-id="transaction.vehicleId"/>
                  <small v-if="client" class="block text-muted">{{ client.email }}</small>
                </template>
              </td>
              <td>{{ vehiclesById.get(transaction.vehicleId)?.displayName ?? '—' }}</td>
              <td>{{ formatRange(transaction.period) }}<small class="block text-muted">{{ t('booking.days-count', { count: transaction.period.days }, transaction.period.days) }}</small></td>
              <td><strong>{{ formatMoney(transaction.amount) }}</strong></td>
              <td><pv-tag :value="t(`payment.statuses.${transaction.status}`)" :severity="statusSeverity[transaction.status]" rounded/></td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
          <small class="text-muted">{{ t('payment.showing', { shown: pageTransactions.length, total: filteredTransactions.length }) }}</small>
          <pv-paginator v-if="filteredTransactions.length > rowsPerPage" v-model:first="first" :rows="rowsPerPage"
                        :total-records="filteredTransactions.length" template="PrevPageLink PageLinks NextPageLink"/>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  transition: opacity .2s;
}

.is-loading {
  opacity: .5;
}

.table-scroll {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: .9rem;
}

.transactions-table th {
  padding: .75rem;
  text-align: left;
  font-weight: 600;
  color: var(--veygo-muted);
  background: var(--veygo-surface);
}

.transactions-table th:first-child {
  border-radius: 10px 0 0 10px;
}

.transactions-table th:last-child {
  border-radius: 0 10px 10px 0;
}

.transactions-table td {
  padding: .8rem .75rem;
  border-bottom: 1px solid var(--veygo-line);
  vertical-align: middle;
}

@media (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
