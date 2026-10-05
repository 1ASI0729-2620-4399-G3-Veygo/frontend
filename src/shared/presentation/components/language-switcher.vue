<script setup>
import {useI18n} from 'vue-i18n';
import {saveLocale} from '@/i18n.js';

/**
 * Presentation component for switching the interface language (EN / ES).
 *
 * @remarks
 * Updates the vue-i18n locale, the lang attribute of the document and remembers the choice.
 */
const {locale, availableLocales, t} = useI18n();

/**
 * Applies and persists the selected locale.
 *
 * @param {string} value - The locale code.
 */
const changeLocale = value => {
  if (!value) return;
  locale.value = value;
  document.documentElement.lang = value;
  saveLocale(value);
};
</script>

<template>
  <pv-select-button :model-value="locale" :options="availableLocales" :allow-empty="false"
                    :aria-label="t('shared.language')" size="small" @update:model-value="changeLocale">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
