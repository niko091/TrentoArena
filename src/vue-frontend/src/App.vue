
<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { computed } from 'vue'

const route = useRoute();
const showNavbar = computed(() => {
  return route.name !== 'login' && !route.meta.hideNavbar;
});
</script>

<template>
  <Navbar v-if="showNavbar" />
  <RouterView />
</template>

<style>
/* Global styles can go here */
</style>
