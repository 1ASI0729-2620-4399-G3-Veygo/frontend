<script setup>
import {useI18n} from 'vue-i18n';
import {useFormatting} from '@/shared/presentation/composables/use-formatting.js';
import UserNameLink from '@/iam/presentation/components/user-name-link.vue';

/**
 * Presentation component that summarizes the public profile of a user
 * (identity verification, reputation and seniority) to build trust between both parties.
 */

/** @type {{user: import('@/iam/domain/model/user.entity.js').User, title: string, vehicleId?: number|null}} */
const {user, title, vehicleId} = defineProps({
  user: {type: Object, required: true},
  title: {type: String, required: true},
  vehicleId: {type: Number, default: null}
});

const {t} = useI18n();
const {formatDate} = useFormatting();
</script>

<template>
  <section class="veygo-card">
    <h2 class="veygo-card-title"><i class="pi pi-user" aria-hidden="true"/>{{ title }}</h2>
    <div class="flex align-items-center gap-3">
      <pv-avatar v-if="!user.photoUrl.isEmpty()" :image="user.photoUrl.toString()" shape="circle" size="xlarge"
                 :aria-label="user.fullName"/>
      <pv-avatar v-else :label="user.initials" shape="circle" size="xlarge" class="bg-primary text-white"/>
      <div class="flex flex-column gap-1">
        <div class="flex flex-wrap align-items-center gap-2">
          <user-name-link :user-id="user.id" :name="user.fullName" :vehicle-id="vehicleId"/>
          <pv-tag v-if="user.identityVerified" icon="pi pi-verified" :value="t('iam.verified')" severity="success" rounded/>
          <pv-tag v-else icon="pi pi-clock" :value="t('iam.verification-pending')" severity="warn" rounded/>
        </div>
        <span v-if="user.reviewsCount" class="text-sm">
          <i class="pi pi-star-fill text-yellow-500" aria-hidden="true"/>
          {{ user.rating.toFixed(1) }} <span class="text-muted">({{ t('iam.reviews-count', { count: user.reviewsCount  }, user.reviewsCount ) }})</span>
        </span>
        <span class="text-sm text-muted"><i class="pi pi-calendar" aria-hidden="true"/> {{ t('iam.member-since', { date: formatDate(user.createdAt) }) }}</span>
      </div>
    </div>
    <slot/>
  </section>
</template>
