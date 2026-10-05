<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import UnavailableContent from '@/shared/presentation/components/unavailable-content.vue';
import OwnerVehicleItem from '@/fleet/presentation/components/owner-vehicle-item.vue';

/**
 * Presentation view where owners manage the vehicles they publish on Veygo.
 */
const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const {translateOrKeep} = useFormatting();

const statusFilter = ref('all');
const searchText = ref('');
const sortOrder = ref('recent');

const sortOptions = computed(() => [
  {label: t('fleet.sort.recent'), value: 'recent'},
  {label: t('fleet.sort.price-high'), value: 'price-high'},
  {label: t('fleet.sort.price-low'), value: 'price-low'},
  {label: t('fleet.sort.name'), value: 'name'}
]);

const sorters = {
  recent: (a, b) => b.id - a.id,
  'price-high': (a, b) => b.pricePerDay.amount - a.pricePerDay.amount,
  'price-low': (a, b) => a.pricePerDay.amount - b.pricePerDay.amount,
  name: (a, b) => a.displayName.localeCompare(b.displayName)
};

const publishedCount = computed(() => fleetStore.ownerVehicles.filter(vehicle => vehicle.published).length);
const statusOptions = computed(() => [
  {label: `${t('shared.all')} (${fleetStore.ownerVehicles.length})`, value: 'all'},
  {label: `${t('fleet.published')} (${publishedCount.value})`, value: 'published'},
  {label: `${t('fleet.unpublished')} (${fleetStore.ownerVehicles.length - publishedCount.value})`, value: 'unpublished'}
]);

const visibleVehicles = computed(() => {
  const text = searchText.value.trim().toLowerCase();
  return fleetStore.ownerVehicles
      .filter(vehicle => statusFilter.value === 'all' || vehicle.published === (statusFilter.value === 'published'))
      .filter(vehicle => !text || vehicle.displayName.toLowerCase().includes(text))
      .sort(sorters[sortOrder.value]);
});

/**
 * Publishes or unpublishes a vehicle.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const togglePublication = vehicle => {
  fleetStore.togglePublication(vehicle)
      .then(saved => toast.add({severity: 'success', life: 2500,
        summary: saved.published ? t('fleet.vehicle-published') : t('fleet.vehicle-unpublished')}))
      .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}));
};

/**
 * Asks for confirmation and deletes a vehicle.
 *
 * @param {import('@/fleet/domain/model/vehicle.entity.js').Vehicle} vehicle - The vehicle.
 */
const deleteVehicle = vehicle => {
  confirm.require({
    header: t('fleet.delete-vehicle'),
    message: t('fleet.delete-confirmation', {name: vehicle.displayName}),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {label: t('shared.cancel'), outlined: true},
    acceptProps: {label: t('shared.delete'), severity: 'danger'},
    accept: () => fleetStore.deleteVehicle(vehicle)
        .then(() => toast.add({severity: 'success', summary: t('fleet.vehicle-deleted'), life: 2500}))
        .catch(message => toast.add({severity: 'error', summary: translateOrKeep(message), life: 4000}))
  });
};

onMounted(() => fleetStore.loadOwnerVehicles(iamStore.currentUser.id));
</script>

<template>
  <div class="page">
    <page-header :title="t('fleet.my-vehicles-title')" :subtitle="t('fleet.my-vehicles-subtitle')">
      <template #actions>
        <pv-button :label="t('fleet.add-vehicle')" icon="pi pi-plus" @click="router.push({ name: 'vehicle-create' })"/>
      </template>
    </page-header>

    <div class="flex flex-wrap gap-3 align-items-center">
      <pv-select-button v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
                        :allow-empty="false" :aria-label="t('fleet.filter-by-status')"/>
      <pv-icon-field class="flex-1" style="min-width: 220px">
        <pv-input-icon class="pi pi-search"/>
        <pv-input-text v-model="searchText" :placeholder="t('fleet.search-vehicle')" :aria-label="t('fleet.search-vehicle')" fluid/>
      </pv-icon-field>
      <pv-select v-model="sortOrder" :options="sortOptions" option-label="label" option-value="value" :aria-label="t('fleet.sort-by')"/>
    </div>

    <div v-if="fleetStore.loading" class="flex flex-column gap-3">
      <pv-skeleton v-for="index in 3" :key="index" height="140px" border-radius="16px"/>
    </div>
    <unavailable-content v-else-if="fleetStore.errors.length" icon="pi pi-exclamation-circle"
                         :title="t('errors.service-unavailable')" :errors="fleetStore.errors"/>
    <unavailable-content v-else-if="!visibleVehicles.length" icon="pi pi-car" :title="t('fleet.no-vehicles')">
      <pv-button :label="t('fleet.add-vehicle')" icon="pi pi-plus" @click="router.push({ name: 'vehicle-create' })"/>
    </unavailable-content>
    <div v-else class="flex flex-column gap-3">
      <owner-vehicle-item v-for="vehicle in visibleVehicles" :key="vehicle.id" :vehicle="vehicle"
                          @edit-requested="router.push({ name: 'vehicle-edit', params: { id: $event.id } })"
                          @details-requested="router.push({ name: 'owner-vehicle-detail', params: { id: $event.id } })"
                          @publication-toggled="togglePublication" @delete-requested="deleteVehicle"/>
      <small class="text-muted">{{ t('fleet.showing', { shown: visibleVehicles.length, total: fleetStore.ownerVehicles.length }) }}</small>
    </div>
  </div>
</template>
