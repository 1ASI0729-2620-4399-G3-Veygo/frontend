<script setup>
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';

/**
 * Presentation component that renders the main navigation links of the signed-in role.
 */

/**
 * @typedef {Object} NavigationItem
 * @property {string} label - i18n key of the label.
 * @property {string} icon - PrimeIcons class.
 * @property {string} to - Route name.
 */

/** @type {{items: NavigationItem[]}} */
const {items} = defineProps({items: {type: Array, required: true}});

/** Emitted when a link is chosen (used to close the mobile drawer). */
const emit = defineEmits(['navigated']);

const {t} = useI18n();
const route = useRoute();

/**
 * An item is active on its own route and on the detail routes of its section (meta.section).
 *
 * @param {NavigationItem} item - The item.
 * @returns {boolean}
 */
const isActive = item => route.name === item.to || route.meta.section === item.to;
</script>

<template>
  <nav :aria-label="t('shared.main-navigation')">
    <ul class="navigation-list">
      <li v-for="item in items" :key="item.to">
        <router-link :to="{ name: item.to }" class="navigation-link" :class="{ 'navigation-link--active': isActive(item) }"
                     :aria-current="isActive(item) ? 'page' : undefined" @click="emit('navigated')">
          <i :class="item.icon" aria-hidden="true"/>
          <span>{{ t(item.label) }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navigation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.navigation-link {
  display: flex;
  align-items: center;
  gap: .85rem;
  padding: .8rem 1rem;
  border-radius: 12px;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
  transition: background-color .15s;
}

.navigation-link .pi {
  font-size: 1.1rem;
}

.navigation-link:hover {
  background: rgba(255, 255, 255, .08);
}

.navigation-link--active {
  background: #1d3a8a;
  color: #fff;
}
</style>
