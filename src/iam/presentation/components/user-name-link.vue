<script setup>
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import UserProfileDialog from '@/iam/presentation/components/user-profile-dialog.vue';

/**
 * Presentation component that shows a user's name as a link; clicking it opens the
 * public profile dialog, from which a message can be sent.
 */

/** @type {{userId: number, name: string, vehicleId?: number|null}} */
const {userId, name, vehicleId} = defineProps({
  userId: {type: Number, required: true},
  name: {type: String, required: true},
  vehicleId: {type: Number, default: null}
});

const {t} = useI18n();
const visible = ref(false);
</script>

<template>
  <button type="button" class="user-name-link" :aria-label="t('iam.view-profile-of', { name })" @click.stop="visible = true">
    {{ name }}
  </button>
  <user-profile-dialog v-model:visible="visible" :user-id="userId" :vehicle-id="vehicleId"/>
</template>

<style scoped>
.user-name-link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.user-name-link:hover, .user-name-link:focus-visible {
  color: var(--veygo-blue);
  text-decoration: underline;
}
</style>
