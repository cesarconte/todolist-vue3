<script setup>
import { useDisplay } from 'vuetify'

/************************************
 * Props
 ************************************/
defineProps({
  buttons: {
    type: Array,
    required: true
  }
})

/************************************
 * Vuetify Display
 ************************************/
const { mobile, xs, sm, md } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <div
    class="action-buttons"
    :class="
      mobile
        ? 'd-flex flex-column align-center w-100 ga-4'
        : 'd-flex flex-wrap justify-space-between ga-4'
    "
  >
    <v-btn
      v-for="(button, index) in buttons"
      :key="index"
      :type="button.type"
      :text="button.text"
      :aria-label="button.text || button.ariaLabel || 'Action'"
      :style="{ marginInlineStart: '0' }"
      :width="xs ? '100%' : sm ? '66%' : md ? '49%' : '10rem'"
      :height="button.height"
      :prepend-icon="button.icon"
      :variant="button.variant || 'tonal'"
      :rounded="button.rounded || true"
      :size="button.size || 'large'"
      :color="button.color || 'red-accent-2'"
      :disabled="button.disabled"
      class="text-none text-button"
      @click="button.function"
    >
      {{ button.text }}
      <v-tooltip v-if="!button.text && (button.ariaLabel || button.icon)" activator="parent" location="bottom">
        {{ button.ariaLabel || button.text || 'Action' }}
      </v-tooltip>
    </v-btn>
  </div>
</template>
