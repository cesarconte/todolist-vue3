// VBaseSnackbar.vue
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'success'
  },
  timeout: {
    type: Number,
    default: 4000
  },
  rounded: {
    type: [Boolean, String],
    default: 'pill'
  },
  variant: {
    type: String,
    default: 'flat'
  },
  opacity: {
    type: [Number, String],
    default: 1
  },
  elevation: {
    type: [Number, String],
    default: 4
  },
  location: {
    type: String,
    default: 'bottom'
  },
  position: {
    type: String,
    default: 'fixed'
  },
  multiLine: {
    type: Boolean,
    default: false
  },
  vertical: {
    type: Boolean,
    default: false
  },
  absolute: {
    type: Boolean,
    default: false
  },
  top: {
    type: [Boolean, String, Number],
    default: undefined
  },
  bottom: {
    type: [Boolean, String, Number],
    default: undefined
  },
  left: {
    type: [Boolean, String, Number],
    default: undefined
  },
  right: {
    type: [Boolean, String, Number],
    default: undefined
  },
  zIndex: {
    type: [String, Number],
    default: undefined
  },
  prependIcon: {
    type: String,
    default: ''
  },
  prependIconTooltipText: {
    type: String,
    default: ''
  },
  appendIcon: {
    type: String,
    default: ''
  },
  appendIconTooltipText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'show', 'hide'])
const show = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    show.value = newValue
  }
)

watch(show, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :rounded="rounded"
    :variant="variant"
    :opacity="opacity"
    :elevation="elevation"
    :location="location"
    :position="position"
    :multi-line="multiLine"
    :vertical="vertical"
    :absolute="absolute"
    :top="top"
    :bottom="bottom"
    :left="left"
    :right="right"
    :zIndex="zIndex"
    v-bind="$attrs"
    @show="$emit('show')"
    @hide="$emit('hide')"
    class="mb-8 pa-8"
  >
    <v-icon v-if="prependIcon" class="mr-2" :icon="prependIcon"></v-icon>
    {{ message }}
    <v-tooltip v-if="appendIconTooltipText" location="bottom">
      <template v-slot:activator="{ props }">
        <v-icon v-bind="props" v-if="appendIcon" class="ml-2" :icon="appendIcon"></v-icon>
      </template>
      <span>{{ appendIconTooltipText }}</span>
    </v-tooltip>
    <v-icon v-else-if="appendIcon" class="ml-2" :icon="appendIcon"></v-icon>
    <template v-slot:actions>
      <slot name="actions"></slot>
      <v-btn
        color="white"
        variant="text"
        class="text-none"
        icon="mdi-close"
        @click="$emit('update:modelValue', false)"
      >
      </v-btn>
    </template>
  </v-snackbar>
</template>
