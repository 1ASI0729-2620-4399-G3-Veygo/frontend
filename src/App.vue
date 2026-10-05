<script setup>
/**
 * Root component. Renders the active route, the global toast and confirmation dialog.
 */
</script>

<template>
  <router-view/>
  <pv-toast position="top-right"/>
  <pv-confirm-dialog/>
</template>
