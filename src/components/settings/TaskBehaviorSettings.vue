<script setup>
import { computed, reactive, watch } from 'vue'
import { useSettings } from '@/composables/settings/useSettings.js'
import { useDisplay } from 'vuetify'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { settings, taskBehavior } = useSettings()
const { xs } = useDisplay()

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tempSettings = reactive({
  confirmOnDelete: taskBehavior.confirmOnDelete,
  showReminderOnComplete: taskBehavior.showReminderOnComplete,
  autoArchiveDays: taskBehavior.autoArchiveDays
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      tempSettings.confirmOnDelete = taskBehavior.confirmOnDelete
      tempSettings.showReminderOnComplete = taskBehavior.showReminderOnComplete
      tempSettings.autoArchiveDays = taskBehavior.autoArchiveDays
    }
  }
)

const autoArchiveOptions = [
  { title: 'Never', value: 0 },
  { title: '1 day', value: 1 },
  { title: '3 days', value: 3 },
  { title: '7 days', value: 7 },
  { title: '14 days', value: 14 },
  { title: '30 days', value: 30 }
]

const closeDialog = () => {
  settings.taskBehavior.confirmOnDelete = tempSettings.confirmOnDelete
  settings.taskBehavior.showReminderOnComplete = tempSettings.showReminderOnComplete
  settings.taskBehavior.autoArchiveDays = tempSettings.autoArchiveDays
  emit('update:modelValue', false)
}

const cancelDialog = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    v-model="showDialog"
    :max-width="xs ? 'calc(100vw - 32px)' : '37.5rem'"
    :width="xs ? undefined : undefined"
    @click:outside="cancelDialog"
  >
    <v-card
      class="settings-card rounded-lg elevation-2 d-flex flex-column"
      color="surface"
      density="comfortable"
    >
      <v-card-title
        :class="
          xs
            ? 'd-flex align-center justify-space-between px-2 py-3'
            : 'd-flex align-center justify-space-between px-6 py-4'
        "
      >
        <span class="text-h6 text-on-surface font-weight-medium">Task Behavior</span>
        <v-btn icon @click="cancelDialog" variant="text" color="on-surface-variant">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle :class="xs ? 'px-2 py-3' : 'px-6 py-4'">
        <v-icon icon="mdi-hand-back-right-outline" size="small" class="mr-1"></v-icon>
        Configure how the app handles tasks
      </v-card-subtitle>

      <v-divider class="my-4" />

      <v-card-text :class="xs ? 'px-2 pt-0 pb-2' : 'px-6 pt-0 pb-2'">
        <v-switch
          v-model="tempSettings.confirmOnDelete"
          label="Confirm before deleting tasks"
          color="primary"
          inset
          hide-details
          density="comfortable"
          class="mb-4"
        />

        <v-switch
          v-model="tempSettings.showReminderOnComplete"
          label="Show reminder when completing tasks"
          color="primary"
          inset
          hide-details
          density="comfortable"
          class="mb-4"
        />

        <v-select
          v-model="tempSettings.autoArchiveDays"
          :items="autoArchiveOptions"
          item-value="value"
          item-title="title"
          label="Auto-archive completed tasks after"
          variant="outlined"
          bg-color="surface-container"
          density="comfortable"
          class="mt-4"
        >
          <template v-slot:prepend-inner>
            <v-icon icon="mdi-archive-outline" />
          </template>
        </v-select>
      </v-card-text>

      <v-divider class="my-4" />

      <v-card-actions :class="xs ? 'justify-end px-2 pb-3' : 'justify-end px-6 pb-4'">
        <v-btn variant="text" @click="cancelDialog"> Cancel </v-btn>
        <v-btn color="primary" variant="tonal" rounded size="large" @click="closeDialog">
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
