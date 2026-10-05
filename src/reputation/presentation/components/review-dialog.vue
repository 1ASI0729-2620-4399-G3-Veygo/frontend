<script setup>
import {ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import {reputationStore} from '@/reputation/application/reputation.store.js';
import {MAX_COMMENT_LENGTH} from '@/reputation/domain/model/review.entity.js';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';

/**
 * Presentation component (dialog) where a renter rates a completed rental.
 */

/**
 * @type {{visible: boolean, booking: import('@/booking/domain/model/booking.entity.js').Booking|null, vehicleName?: string}}
 */
const props = defineProps({
  visible: {type: Boolean, default: false},
  booking: {type: Object, default: null},
  vehicleName: {type: String, default: ''}
});

/** Emitted to close the dialog, and after publishing the review. */
const emit = defineEmits(['update:visible', 'review-published']);

const {t} = useI18n();
const toast = useToast();
const {translateOrKeep} = useFormatting();
const rating = ref(5);
const comment = ref('');
const saving = ref(false);
const errorMessage = ref('');

watch(() => props.visible, visible => {
  if (!visible) return;
  rating.value = 5;
  comment.value = '';
  errorMessage.value = '';
});

/**
 * Publishes the review.
 */
const publish = () => {
  if (!rating.value) {
    errorMessage.value = t('reputation.select-stars');
    return;
  }
  saving.value = true;
  reputationStore.publishReview(props.booking, rating.value, comment.value)
      .then(review => {
        toast.add({severity: 'success', summary: t('reputation.review-published'), life: 3000});
        emit('review-published', review);
        emit('update:visible', false);
      })
      .catch(message => errorMessage.value = translateOrKeep(message))
      .finally(() => saving.value = false);
};
</script>

<template>
  <pv-dialog :visible="visible" modal :header="t('reputation.rate-rental')" :style="{ width: 'min(460px, 94vw)' }"
             @update:visible="emit('update:visible', $event)">
    <form class="flex flex-column gap-3" @submit.prevent="publish">
      <p class="m-0">{{ t('reputation.rate-question', { vehicle: vehicleName }) }}</p>
      <div class="flex align-items-center gap-3">
        <pv-rating v-model="rating" :cancel="false" :aria-label="t('reputation.your-rating')"/>
        <strong>{{ rating }}/5</strong>
      </div>
      <label for="review-comment" class="font-semibold">{{ t('reputation.comment') }}</label>
      <pv-textarea id="review-comment" v-model="comment" rows="4" :maxlength="MAX_COMMENT_LENGTH" auto-resize
                   :placeholder="t('reputation.comment-placeholder')" fluid/>
      <small class="text-muted text-right">{{ comment.length }}/{{ MAX_COMMENT_LENGTH }}</small>
      <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
      <div class="flex justify-content-end gap-2">
        <pv-button :label="t('shared.cancel')" severity="secondary" text @click="emit('update:visible', false)"/>
        <pv-button type="submit" :label="t('reputation.publish-review')" icon="pi pi-star" :loading="saving"/>
      </div>
    </form>
  </pv-dialog>
</template>
