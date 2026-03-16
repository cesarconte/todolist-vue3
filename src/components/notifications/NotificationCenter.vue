<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'
import BaseSnackbar from './BaseSnackbar.vue'
import NotificationDialog from './NotificationDialog.vue'

const notificationsStore = useNotificationsStore()

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <BaseSnackbar
    v-model="notificationsStore.showSnackbar.show"
    :message="notificationsStore.showSnackbar.message"
    :color="notificationsStore.showSnackbar.color"
    :prepend-icon="notificationsStore.showSnackbar.prependIcon"
    :append-icon="notificationsStore.showSnackbar.appendIcon"
  />
  <NotificationDialog
    :model-value="modelValue"
    @update:model-value="(val) => $emit('update:modelValue', val)"
  />
</template>
