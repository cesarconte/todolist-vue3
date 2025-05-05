<template>
  <v-btn
    :to="to"
    variant="tonal"
    color="primary"
    class="v-back-btn d-inline-flex align-center"
    rounded
    size="large"
    prepend-icon="mdi-chevron-left"
    v-bind="$attrs"
  >
    <slot>{{ label }}</slot>
  </v-btn>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  label: {
    type: String,
    default: 'Back'
  },
  to: {
    type: String,
    default: undefined
  }
})
</script>

<style scoped>
.v-back-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  min-width: 96px;
  text-transform: none;
}
</style>
