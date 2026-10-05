import {createApp} from 'vue';
import './style.css';
import App from './App.vue';
import i18n from '@/i18n.js';
import router from '@/router/index.js';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Material from '@primeuix/themes/material';
import {definePreset} from '@primeuix/themes';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'leaflet/dist/leaflet.css';
import {
    Avatar, Badge, Button, Card, Checkbox, ConfirmDialog, DatePicker, Dialog, Divider, Drawer, IconField, InputIcon,
    InputNumber, InputText, Menu, Message, Paginator, Password, Popover, RadioButton, Rating, Select, SelectButton,
    Skeleton, Slider, Tag, Textarea, Toast, ToggleSwitch, Tooltip
} from 'primevue';
import {iamStore} from '@/iam/application/iam.store.js';
import {registerNotificationEventHandlers} from '@/notification/application/notification-event-handlers.js';

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

/**
 * Veygo theme: Material Design preset with the Veygo blue (#2563EB) as primary color.
 */
const VeygoPreset = definePreset(Material, {
    semantic: {
        primary: {
            50: '{blue.50}', 100: '{blue.100}', 200: '{blue.200}', 300: '{blue.300}', 400: '{blue.400}',
            500: '{blue.500}', 600: '{blue.600}', 700: '{blue.700}', 800: '{blue.800}', 900: '{blue.900}',
            950: '{blue.950}'
        }
    }
});

iamStore.restoreSession();
registerNotificationEventHandlers();

createApp(App)
    .use(i18n)
    .use(router)
    .use(PrimeVue, {
        ripple: true,
        theme: {preset: VeygoPreset, options: {darkModeSelector: '.veygo-dark'}},
        license: primeUiLicenseKey
    })
    .use(ToastService)
    .use(ConfirmationService)
    .component('pv-avatar', Avatar)
    .component('pv-badge', Badge)
    .component('pv-button', Button)
    .component('pv-card', Card)
    .component('pv-checkbox', Checkbox)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-date-picker', DatePicker)
    .component('pv-dialog', Dialog)
    .component('pv-divider', Divider)
    .component('pv-drawer', Drawer)
    .component('pv-icon-field', IconField)
    .component('pv-input-icon', InputIcon)
    .component('pv-input-number', InputNumber)
    .component('pv-input-text', InputText)
    .component('pv-menu', Menu)
    .component('pv-message', Message)
    .component('pv-paginator', Paginator)
    .component('pv-password', Password)
    .component('pv-popover', Popover)
    .component('pv-radio-button', RadioButton)
    .component('pv-rating', Rating)
    .component('pv-select', Select)
    .component('pv-select-button', SelectButton)
    .component('pv-skeleton', Skeleton)
    .component('pv-slider', Slider)
    .component('pv-tag', Tag)
    .component('pv-textarea', Textarea)
    .component('pv-toast', Toast)
    .component('pv-toggle-switch', ToggleSwitch)
    .directive('tooltip', Tooltip)
    .mount('#app');
