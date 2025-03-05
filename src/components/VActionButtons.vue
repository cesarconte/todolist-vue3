<script setup>
import { useDisplay } from 'vuetify'

defineProps({
  buttons: {
    type: Array,
    required: true
  }
})

const { xs, mobile, sm } = useDisplay()
</script>

<template>
  <div
    class="action-buttons"
    :class="
      mobile ? 'd-flex flex-column align-center w-100 ga-4' : 'd-flex flex-wrap justify-space-between ga-4'
    "
  >
    <v-btn
      v-for="(button, index) in buttons"
      :key="index"
      :type="button.type"
      :text="button.text"
      
      :style="{ marginInlineStart: '0' }"
      :width="sm ? '66%' : '10rem'"
      :height="button.height"
      :block="xs"
      :prepend-icon="button.icon"
      :variant="button.variant || 'tonal'"
      :rounded="button.rounded || true"
      :size="button.size || 'large'"
      :color="button.color || 'red-darken-2'"
      :disabled="button.disabled"
      class="text-none"
      @click="button.function"
    >
      {{ button.text }}
    </v-btn>
  </div>
</template>

<!-- :class="[button.class, mobile ? 'mb-3' : 'mb-3', { 'mr-3': index < buttons.length - 1 }]" -->