<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import L from 'leaflet';

/**
 * Presentation component that shows vehicles on an interactive map.
 *
 * @remarks
 * Integrates the external OpenStreetMap tile service through Leaflet. Markers show the
 * daily price and emit `vehicle-selected` when clicked.
 */

/** @type {{vehicles: import('@/fleet/domain/model/vehicle.entity.js').Vehicle[], height?: string, zoom?: number, interactive?: boolean}} */
const props = defineProps({
  vehicles: {type: Array, required: true},
  height: {type: String, default: '420px'},
  zoom: {type: Number, default: 12},
  interactive: {type: Boolean, default: true}
});

/** Emitted with the vehicle whose marker was clicked. */
const emit = defineEmits(['vehicle-selected']);

const {t} = useI18n();
const mapElement = ref();
const limaCenter = [-12.1, -77.03];
const tilesUrl = import.meta.env.VITE_MAP_TILES_URL;
let map = null;
let markersLayer = null;

/**
 * Draws one marker per vehicle that has coordinates and fits the map to them.
 */
const renderMarkers = () => {
  if (!map) return;
  markersLayer.clearLayers();
  const located = props.vehicles.filter(vehicle => vehicle.location.hasCoordinates());
  located.forEach(vehicle => {
    const icon = L.divIcon({
      className: '',
      html: `<span class="vehicle-marker"><i class="pi pi-car" aria-hidden="true"></i>${vehicle.pricePerDay.format()}</span>`,
      iconSize: null
    });
    L.marker([vehicle.location.latitude, vehicle.location.longitude], {icon, title: vehicle.displayName, keyboard: true})
        .on('click', () => emit('vehicle-selected', vehicle))
        .addTo(markersLayer);
  });
  if (located.length === 1) map.setView([located[0].location.latitude, located[0].location.longitude], props.zoom);
  else if (located.length > 1) {
    map.fitBounds(L.latLngBounds(located.map(v => [v.location.latitude, v.location.longitude])), {padding: [40, 40]});
  }
};

onMounted(() => {
  map = L.map(mapElement.value, {
    center: limaCenter, zoom: props.zoom, scrollWheelZoom: false,
    dragging: props.interactive, zoomControl: props.interactive
  });
  L.tileLayer(tilesUrl, {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  renderMarkers();
});

watch(() => props.vehicles, renderMarkers, {deep: false});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});
</script>

<template>
  <div ref="mapElement" class="vehicle-map" :style="{ height }" role="region" :aria-label="t('fleet.map-label')"/>
</template>

<style scoped>
.vehicle-map {
  width: 100%;
  border-radius: var(--veygo-radius);
  overflow: hidden;
  z-index: 0;
}
</style>
