<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {fleetStore} from '@/fleet/application/fleet.store.js';
import {iamStore} from '@/iam/application/iam.store.js';
import {Vehicle} from '@/fleet/domain/model/vehicle.entity.js';
import {BodyType, FuelType, TransmissionType, VehicleCategory, VehicleFeature} from '@/fleet/domain/model/vehicle-enums.js';
import {limaDistrictCoordinates, limaDistricts} from '@/shared/presentation/lima-districts.js';
import {readImageAsDataUrl} from '@/shared/infrastructure/image-file-reader.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';

/**
 * Presentation view where owners publish a new vehicle or edit an existing one.
 */

/** @type {{id?: string}} */
const props = defineProps({id: {type: String, default: null}});

const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const {translateOrKeep} = useFormatting();

const isEdit = computed(() => props.id !== null);
const saving = ref(false);
const errorMessage = ref('');
const photoInput = ref();
const dragging = ref(false);
const uploading = ref(false);
const maxPhotos = 10;
const maxDescriptionLength = 500;
const currentYear = new Date().getFullYear();

/** Keeps values that are not edited in this form (rating, reviews). */
let original = null;

const form = reactive({
  brand: '', model: '', year: currentYear, bodyType: BodyType.SEDAN, category: VehicleCategory.CAR,
  transmission: TransmissionType.MANUAL, fuelType: FuelType.GASOLINE, seats: 5, doors: 4,
  features: [], pricePerDay: null, pricePerWeek: null, pricePerMonth: null, securityDeposit: null,
  address: '', district: null, city: 'Lima', description: '', photos: [], published: true,
  plate: '', color: '', mileage: 0, lastMaintenanceAt: null, insuranceProvider: '', insuranceValidUntil: null,
  technicalInspectionUntil: null
});

/**
 * @param {string} value - "YYYY-MM-DD".
 * @returns {Date|null}
 */
const toDate = value => value ? new Date(`${value}T00:00:00`) : null;

/**
 * @param {Date|null} date - The date.
 * @returns {string} "YYYY-MM-DD" or empty.
 */
const toIso = date => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

/**
 * Builds translated options for a select from an enumeration.
 *
 * @param {Object} enumeration - The enumeration.
 * @param {string} prefix - The i18n prefix.
 * @returns {Array<{label: string, value: string}>}
 */
const optionsFrom = (enumeration, prefix) => Object.values(enumeration).map(value => ({label: t(`${prefix}.${value}`), value}));

const bodyTypeOptions = computed(() => optionsFrom(BodyType, 'fleet.body-types'));
const categoryOptions = computed(() => optionsFrom(VehicleCategory, 'fleet.categories'));
const transmissionOptions = computed(() => optionsFrom(TransmissionType, 'fleet.transmissions'));
const fuelOptions = computed(() => optionsFrom(FuelType, 'fleet.fuel-types'));
const features = Object.values(VehicleFeature);

/**
 * Reads the selected image files (compressed in the browser) and adds them to the gallery.
 *
 * @param {FileList|File[]} files - The chosen files.
 */
const addPhotos = files => {
  const available = maxPhotos - form.photos.length;
  const selected = [...files].slice(0, Math.max(0, available));
  if (!selected.length) {
    toast.add({severity: 'warn', summary: t('fleet.max-photos', {count: maxPhotos}), life: 3000});
    return;
  }
  uploading.value = true;
  Promise.allSettled(selected.map(file => readImageAsDataUrl(file)))
      .then(results => {
        results.forEach(result => {
          if (result.status === 'fulfilled') form.photos.push(result.value);
          else toast.add({severity: 'error', summary: translateOrKeep(result.reason), life: 4000});
        });
      })
      .finally(() => uploading.value = false);
};

/**
 * @param {Event} event - Change event of the file input.
 */
const onFilesSelected = event => {
  addPhotos(event.target.files);
  event.target.value = '';
};

/**
 * @param {DragEvent} event - Drop event of the drop zone.
 */
const onDrop = event => {
  dragging.value = false;
  addPhotos(event.dataTransfer.files);
};

/**
 * Makes a photo the main one (first position).
 *
 * @param {number} index - Photo position.
 */
const makeMainPhoto = index => {
  const [photo] = form.photos.splice(index, 1);
  form.photos.unshift(photo);
};

/**
 * Builds the Vehicle entity from the form (domain validations apply) and saves it.
 */
const save = () => {
  errorMessage.value = '';
  let vehicle;
  try {
    if (!form.brand.trim() || !form.model.trim() || !form.pricePerDay) throw new Error(t('errors.required-fields'));
    if (!form.district) throw new Error(t('errors.district-required'));
    const [latitude, longitude] = original?.location.district === form.district && original.location.hasCoordinates()
        ? [original.location.latitude, original.location.longitude]
        : limaDistrictCoordinates[form.district];
    vehicle = new Vehicle({
      id: original?.id ?? null,
      ownerId: iamStore.currentUser.id,
      brand: form.brand, model: form.model, year: form.year, category: form.category, bodyType: form.bodyType,
      transmission: form.transmission, fuelType: form.fuelType, seats: form.seats, doors: form.doors,
      pricePerDay: form.pricePerDay ?? 0, pricePerWeek: form.pricePerWeek ?? 0, pricePerMonth: form.pricePerMonth ?? 0,
      securityDeposit: form.securityDeposit ?? 0, description: form.description.trim(), features: form.features,
      photos: form.photos,
      location: {address: form.address, district: form.district, city: form.city, latitude, longitude},
      published: form.published, rating: original?.rating ?? 0, reviewsCount: original?.reviewsCount ?? 0,
      plate: form.plate, color: form.color, mileage: form.mileage ?? 0, lastMaintenanceAt: toIso(form.lastMaintenanceAt),
      insurance: form.insuranceProvider.trim() ? {provider: form.insuranceProvider.trim(), validUntil: toIso(form.insuranceValidUntil)} : null,
      technicalInspectionUntil: toIso(form.technicalInspectionUntil)
    });
  } catch (error) {
    errorMessage.value = error.message;
    return;
  }
  saving.value = true;
  fleetStore.saveVehicle(vehicle)
      .then(() => {
        toast.add({severity: 'success', summary: t('fleet.vehicle-saved'), life: 2500});
        router.push({name: 'owner-vehicles'});
      })
      .catch(message => errorMessage.value = translateOrKeep(message))
      .finally(() => saving.value = false);
};

onMounted(() => {
  if (!isEdit.value) return;
  fleetStore.fetchVehicleById(Number(props.id)).then(vehicle => {
    if (!vehicle || !vehicle.isOwnedBy(iamStore.currentUser.id)) {
      router.replace({name: 'owner-vehicles'});
      return;
    }
    original = vehicle;
    Object.assign(form, {
      brand: vehicle.brand, model: vehicle.model, year: vehicle.year, bodyType: vehicle.bodyType,
      category: vehicle.category, transmission: vehicle.transmission, fuelType: vehicle.fuelType,
      seats: vehicle.seats, doors: vehicle.doors, features: [...vehicle.features],
      pricePerDay: vehicle.pricePerDay.amount, pricePerWeek: vehicle.pricePerWeek.amount,
      pricePerMonth: vehicle.pricePerMonth.amount, securityDeposit: vehicle.securityDeposit.amount,
      address: vehicle.location.address, district: vehicle.location.district, city: vehicle.location.city,
      description: vehicle.description, photos: vehicle.photos.map(photo => photo.toString()), published: vehicle.published,
      plate: vehicle.plate, color: vehicle.color, mileage: vehicle.mileage, lastMaintenanceAt: toDate(vehicle.lastMaintenanceAt),
      insuranceProvider: vehicle.insurance?.provider ?? '', insuranceValidUntil: toDate(vehicle.insurance?.validUntil),
      technicalInspectionUntil: toDate(vehicle.technicalInspectionUntil)
    });
  });
});
</script>

<template>
  <form class="page" novalidate @submit.prevent="save">
    <page-header :title="isEdit ? t('fleet.edit-vehicle') : t('fleet.add-vehicle')"
                 :subtitle="isEdit ? t('fleet.edit-vehicle-subtitle') : t('fleet.add-vehicle-subtitle')"
                 :back-to="{ name: 'owner-vehicles' }" :back-label="t('navigation.my-vehicles')"/>

    <div class="form-layout">
      <div class="flex flex-column gap-4">
        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-info-circle" aria-hidden="true"/>{{ t('fleet.basic-information') }}</h2>
          <div class="grid">
            <div class="col-12 md:col-6 field-group">
              <label for="brand">{{ t('fleet.brand') }} *</label>
              <pv-input-text id="brand" v-model="form.brand" placeholder="Toyota" fluid/>
            </div>
            <div class="col-12 md:col-6 field-group">
              <label for="model">{{ t('fleet.model') }} *</label>
              <pv-input-text id="model" v-model="form.model" placeholder="Yaris" fluid/>
            </div>
            <div class="col-6 md:col-4 field-group">
              <label for="year">{{ t('fleet.year') }} *</label>
              <pv-input-number input-id="year" v-model="form.year" :min="1990" :max="currentYear + 1" :use-grouping="false" fluid/>
            </div>
            <div class="col-6 md:col-4 field-group">
              <label for="bodyType">{{ t('fleet.body-type') }} *</label>
              <pv-select input-id="bodyType" v-model="form.bodyType" :options="bodyTypeOptions" option-label="label" option-value="value" fluid/>
            </div>
            <div class="col-12 md:col-4 field-group">
              <label for="category">{{ t('fleet.category') }} *</label>
              <pv-select input-id="category" v-model="form.category" :options="categoryOptions" option-label="label" option-value="value" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="transmission">{{ t('fleet.transmission') }} *</label>
              <pv-select input-id="transmission" v-model="form.transmission" :options="transmissionOptions" option-label="label" option-value="value" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="fuelType">{{ t('fleet.fuel-type') }} *</label>
              <pv-select input-id="fuelType" v-model="form.fuelType" :options="fuelOptions" option-label="label" option-value="value" fluid/>
            </div>
          </div>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-sliders-h" aria-hidden="true"/>{{ t('fleet.specifications') }}</h2>
          <div class="grid">
            <div class="col-6 field-group">
              <label for="seats">{{ t('fleet.seats') }} *</label>
              <pv-input-number input-id="seats" v-model="form.seats" :min="1" :max="15" show-buttons fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="doors">{{ t('fleet.doors') }} *</label>
              <pv-input-number input-id="doors" v-model="form.doors" :min="2" :max="6" show-buttons fluid/>
            </div>
          </div>
          <fieldset class="border-none p-0 m-0 mt-2">
            <legend class="font-semibold mb-2">{{ t('fleet.equipment') }}</legend>
            <div class="feature-grid">
              <div v-for="feature in features" :key="feature" class="flex align-items-center gap-2">
                <pv-checkbox v-model="form.features" :value="feature" :input-id="`feature-${feature}`"/>
                <label :for="`feature-${feature}`">{{ t(`fleet.features.${feature}`) }}</label>
              </div>
            </div>
          </fieldset>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-wallet" aria-hidden="true"/>{{ t('fleet.price') }}</h2>
          <div class="grid">
            <div class="col-12 sm:col-6 lg:col-3 field-group">
              <label for="pricePerDay">{{ t('fleet.price-per-day') }} *</label>
              <pv-input-number input-id="pricePerDay" v-model="form.pricePerDay" mode="currency" currency="PEN" locale="es-PE" :min="0" fluid/>
            </div>
            <div class="col-12 sm:col-6 lg:col-3 field-group">
              <label for="pricePerWeek">{{ t('fleet.price-per-week') }}</label>
              <pv-input-number input-id="pricePerWeek" v-model="form.pricePerWeek" mode="currency" currency="PEN" locale="es-PE" :min="0" fluid/>
            </div>
            <div class="col-12 sm:col-6 lg:col-3 field-group">
              <label for="pricePerMonth">{{ t('fleet.price-per-month') }}</label>
              <pv-input-number input-id="pricePerMonth" v-model="form.pricePerMonth" mode="currency" currency="PEN" locale="es-PE" :min="0" fluid/>
            </div>
            <div class="col-12 sm:col-6 lg:col-3 field-group">
              <label for="securityDeposit">{{ t('fleet.security-deposit') }}</label>
              <pv-input-number input-id="securityDeposit" v-model="form.securityDeposit" mode="currency" currency="PEN" locale="es-PE" :min="0" fluid/>
            </div>
          </div>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-map-marker" aria-hidden="true"/>{{ t('fleet.pickup-location') }}</h2>
          <div class="grid">
            <div class="col-12 field-group">
              <label for="address">{{ t('fleet.address') }}</label>
              <pv-input-text id="address" v-model="form.address" placeholder="Av. Javier Prado Este 1234" fluid/>
            </div>
            <div class="col-12 sm:col-6 field-group">
              <label for="district">{{ t('iam.district') }} *</label>
              <pv-select input-id="district" v-model="form.district" :options="limaDistricts" filter
                         :placeholder="t('iam.district-placeholder')" fluid/>
            </div>
            <div class="col-12 sm:col-6 field-group">
              <label for="city">{{ t('fleet.city') }}</label>
              <pv-input-text id="city" v-model="form.city" fluid/>
            </div>
          </div>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-align-left" aria-hidden="true"/>{{ t('fleet.description') }}</h2>
          <label for="description" class="sr-only">{{ t('fleet.description') }}</label>
          <pv-textarea id="description" v-model="form.description" rows="4" :maxlength="maxDescriptionLength" auto-resize fluid/>
          <small class="text-muted block text-right">{{ form.description.length }}/{{ maxDescriptionLength }}</small>
        </section>
      </div>

      <aside class="flex flex-column gap-4">
        <section class="veygo-card">
          <div class="flex justify-content-between align-items-center mb-3">
            <h2 class="veygo-card-title m-0"><i class="pi pi-images" aria-hidden="true"/>{{ t('fleet.photos') }}</h2>
            <small class="text-muted">{{ form.photos.length }}/{{ maxPhotos }}</small>
          </div>
          <div class="photo-grid">
            <div v-for="(photo, index) in form.photos" :key="index" class="photo-item" :class="{ 'photo-item--main': index === 0 }">
              <img :src="photo" :alt="t('fleet.photo-number', { number: index + 1 })">
              <span v-if="index === 0" class="photo-item__badge">{{ t('fleet.main-photo') }}</span>
              <pv-button v-else icon="pi pi-star" rounded text size="small" class="photo-item__main"
                         v-tooltip.top="t('fleet.make-main-photo')" :aria-label="t('fleet.make-main-photo')" @click="makeMainPhoto(index)"/>
              <pv-button icon="pi pi-times" rounded severity="secondary" size="small" class="photo-item__remove"
                         :aria-label="t('fleet.remove-photo')" @click="form.photos.splice(index, 1)"/>
            </div>
          </div>
          <button type="button" class="drop-zone" :class="{ 'drop-zone--active': dragging }" :disabled="uploading || form.photos.length >= maxPhotos"
                  @click="photoInput.click()" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
            <i :class="uploading ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'" aria-hidden="true"/>
            <strong>{{ t('fleet.upload-photos') }}</strong>
            <small>{{ t('fleet.photo-formats') }}</small>
          </button>
          <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" multiple class="hidden"
                 :aria-label="t('fleet.upload-photos')" @change="onFilesSelected">
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-file" aria-hidden="true"/>{{ t('fleet.additional-information') }}</h2>
          <div class="grid">
            <div class="col-6 field-group">
              <label for="plate">{{ t('fleet.plate') }}</label>
              <pv-input-text id="plate" v-model="form.plate" placeholder="ABC-123" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="color">{{ t('fleet.color') }}</label>
              <pv-input-text id="color" v-model="form.color" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="mileage">{{ t('fleet.mileage') }}</label>
              <pv-input-number input-id="mileage" v-model="form.mileage" :min="0" suffix=" km" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="lastMaintenance">{{ t('fleet.last-maintenance') }}</label>
              <pv-date-picker v-model="form.lastMaintenanceAt" input-id="lastMaintenance" :max-date="new Date()" fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="insuranceProvider">{{ t('fleet.insurance') }}</label>
              <pv-input-text id="insuranceProvider" v-model="form.insuranceProvider" placeholder="Rímac, Pacífico..." fluid/>
            </div>
            <div class="col-6 field-group">
              <label for="insuranceValidUntil">{{ t('fleet.insurance-valid-until') }}</label>
              <pv-date-picker v-model="form.insuranceValidUntil" input-id="insuranceValidUntil" fluid/>
            </div>
            <div class="col-12 field-group">
              <label for="technicalInspection">{{ t('fleet.technical-inspection') }}</label>
              <pv-date-picker v-model="form.technicalInspectionUntil" input-id="technicalInspection" fluid/>
            </div>
          </div>
        </section>

        <section class="veygo-card">
          <h2 class="veygo-card-title"><i class="pi pi-globe" aria-hidden="true"/>{{ t('fleet.publication-status') }}</h2>
          <div class="flex align-items-center gap-3">
            <pv-toggle-switch v-model="form.published" input-id="published"/>
            <label for="published">
              <strong class="block">{{ form.published ? t('fleet.published') : t('fleet.unpublished') }}</strong>
              <small class="text-muted">{{ form.published ? t('fleet.published-hint') : t('fleet.unpublished-hint') }}</small>
            </label>
          </div>
        </section>

        <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
        <pv-button type="submit" :label="t('shared.save-changes')" icon="pi pi-check" :loading="saving" size="large" fluid/>
        <pv-button :label="t('shared.cancel')" severity="secondary" outlined fluid @click="router.push({ name: 'owner-vehicles' })"/>
      </aside>
    </div>
  </form>
</template>

<style scoped>
.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1.5rem;
  align-items: start;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.field-group label {
  font-weight: 600;
  font-size: .9rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: .6rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .5rem;
}

.photo-item {
  position: relative;
}

.photo-item img {
  width: 100%;
  height: 90px;
  object-fit: contain;
  background: var(--veygo-surface);
  border-radius: 10px;
}

.photo-item--main img {
  outline: 2px solid var(--veygo-blue);
}

.photo-item__badge {
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: .1rem .45rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, .75);
  color: #fff;
  font-size: .7rem;
}

.photo-item .photo-item__main {
  position: absolute;
  left: 2px;
  top: 2px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3rem;
  width: 100%;
  margin-top: .75rem;
  padding: 1.25rem;
  border: 2px dashed var(--veygo-line);
  border-radius: 12px;
  background: var(--veygo-surface);
  color: var(--veygo-text);
  font: inherit;
  cursor: pointer;
}

.drop-zone .pi {
  font-size: 1.6rem;
  color: var(--veygo-blue);
}

.drop-zone small {
  color: var(--veygo-muted);
}

.drop-zone--active, .drop-zone:hover {
  border-color: var(--veygo-blue);
}

.drop-zone:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.photo-item .photo-item__remove {
  position: absolute;
  top: 4px;
  right: 4px;
}

@media (max-width: 1099px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
