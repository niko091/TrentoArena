<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<template>
  <div class="default-layout">
    <Navbar />
    <main>
      <slot />
    </main>
  </div>
</template>