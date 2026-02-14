<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import LayoutWithNavbar from "@/layouts/WithNavbar.vue";
import LayoutWithoutNavbar from "@/layouts/WithOutNavbar.vue";

const route = useRoute();

const layouts = {
  default: LayoutWithNavbar,
  noNavbar: LayoutWithoutNavbar,
};

const currentLayout = computed(() => {
  if (!route.name) return null;

  const layoutName = (route.meta.layout as string) || "default";

  return layouts[layoutName as keyof typeof layouts] || layouts.default;
});
</script>

<template>
  <component :is="currentLayout" v-if="currentLayout">
    <RouterView />
  </component>

  <div v-else class="loading-state"></div>
</template>
