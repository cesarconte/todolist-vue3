<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'confirm'
  },
  message: {
    type: String,
    default: 'Are you sure?'
  },
  confirmText: {
    type: String,
    default: 'confirm'
  },
  cancelText: {
    type: String,
    default: 'cancel'
  },
  confirmColor: {
    type: String,
    default: 'error'
  },
  icon: {
    type: String,
    default: 'mdi-alert-circle'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleConfirm = () => {
  emit('confirm')
  showDialog.value = false
}

const handleCancel = () => {
  showDialog.value = false
}
</script>

<template>
  <v-dialog v-model="showDialog" max-width="400" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center py-4 px-4">
        <v-icon :icon="icon" :color="confirmColor" class="mr-3" />
        <span class="text-h6">{{ title }}</span>
      </v-card-title>

      <v-card-text class="px-4 pb-4">
        {{ message }}
      </v-card-text>

      <v-card-actions class="px-4 pb-4 pt-0">
        <v-spacer />
        <v-btn variant="text" class="text-none text-button" rounded="xl" @click="handleCancel">
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="tonal"
          rounded="xl"
          class="text-none text-button"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
