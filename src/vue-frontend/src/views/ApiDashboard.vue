<script setup>
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <div class="api-dashboard">
    <ApiReference 
      :configuration="{ 
        url: '/api.yaml',
        theme: 'default' 
      }" 
    />
  </div>
</template>

<style scoped>
.api-dashboard {
  width: 100%;
  min-height: 100vh;
}
</style>
