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

const { settings, displaySettings } = useSettings()
const { xs } = useDisplay()

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tempSettings = reactive({
  defaultView: displaySettings.defaultView,
  defaultOrder: displaySettings.defaultOrder,
  showCompletedTasks: displaySettings.showCompletedTasks,
  tasksPerPage: displaySettings.tasksPerPage
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      tempSettings.defaultView = displaySettings.defaultView
      tempSettings.defaultOrder = displaySettings.defaultOrder
      tempSettings.showCompletedTasks = displaySettings.showCompletedTasks
      tempSettings.tasksPerPage = displaySettings.tasksPerPage
    }
  }
)

const viewOptions = [
  { title: 'List', value: 'list', icon: 'mdi-view-list' },
  { title: 'Calendar', value: 'calendar', icon: 'mdi-calendar' }
]

const orderOptions = [
  { title: 'Due Date', value: 'date', icon: 'mdi-calendar-clock' },
  { title: 'Priority', value: 'priority', icon: 'mdi-flag' },
  { title: 'Project', value: 'project', icon: 'mdi-folder' },
  { title: 'Title', value: 'title', icon: 'mdi-format-letter-starts-with' }
]

const tasksPerPageOptions = [10, 20, 30, 50]

const closeDialog = () => {
  settings.display.defaultView = tempSettings.defaultView
  settings.display.defaultOrder = tempSettings.defaultOrder
  settings.display.showCompletedTasks = tempSettings.showCompletedTasks
  settings.display.tasksPerPage = tempSettings.tasksPerPage
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
        <span class="text-h6 text-on-surface font-weight-medium">Display Settings</span>
        <v-btn icon @click="cancelDialog" variant="text" color="on-surface-variant">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle :class="xs ? 'px-2 py-3' : 'px-6 py-4'">
        <v-icon icon="mdi-tune-variant" size="small" class="mr-1"></v-icon>
        Customize how tasks are displayed
      </v-card-subtitle>

      <v-divider class="my-4" />

      <v-card-text :class="xs ? 'px-2 pt-0 pb-2' : 'px-6 pt-0 pb-2'">
        <v-select
          v-model="tempSettings.defaultView"
          :items="viewOptions"
          item-value="value"
          item-title="title"
          label="Default View"
          variant="outlined"
          bg-color="surface-container"
          density="comfortable"
          class="mb-4"
        >
          <template v-slot:prepend-inner>
            <v-icon
              :icon="
                viewOptions.find((v) => v.value === tempSettings.defaultView)?.icon ||
                'mdi-view-list'
              "
            />
          </template>
        </v-select>

        <v-select
          v-model="tempSettings.defaultOrder"
          :items="orderOptions"
          item-value="value"
          item-title="title"
          label="Default Order"
          variant="outlined"
          bg-color="surface-container"
          density="comfortable"
          class="mb-4"
        >
          <template v-slot:prepend-inner>
            <v-icon
              :icon="
                orderOptions.find((o) => o.value === tempSettings.defaultOrder)?.icon || 'mdi-sort'
              "
            />
          </template>
        </v-select>

        <v-select
          v-model="tempSettings.tasksPerPage"
          :items="tasksPerPageOptions"
          label="Tasks per Page"
          variant="outlined"
          bg-color="surface-container"
          density="comfortable"
          class="mb-4"
        >
          <template v-slot:append-inner>
            <span class="text-caption text-on-surface-variant">tasks</span>
          </template>
        </v-select>

        <v-switch
          v-model="tempSettings.showCompletedTasks"
          label="Show completed tasks"
          color="primary"
          inset
          hide-details
          density="comfortable"
        />
      </v-card-text>

      <v-divider class="my-4" />

      <v-card-actions :class="xs ? 'justify-end px-2 pb-3' : 'justify-end px-6 pb-4'">
        <v-btn
          variant="text"
          class="text-none text-button"
          rounded="xl"
          size="large"
          @click="cancelDialog"
        >
          cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          size="large"
          class="text-none text-button"
          rounded="xl"
          @click="closeDialog"
        >
          done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
