<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import useLabelIcons from '@/composables/ui/useLabelIcons'
import { formatDate } from '@/utils/date/dateFormat'

/************************************
 * Composables
 ************************************/
const { labelIcons } = useLabelIcons() // Accesses label icons from the composable

/************************************
 * Props
 ************************************/
// Define the props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  project: {
    type: [String, Object],
    required: true
  },
  priority: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  startDate: {
    type: [Date, String, Object],
    required: true
  },
  endDate: {
    type: [Date, String, Object],
    required: true
  },
  createdAt: {
    type: [Date, String, Object],
    required: true
  },
  completed: {
    type: Boolean,
    required: true,
    default: false
  },
  color: {
    type: String,
    required: true
  },
  startDateHour: {
    type: String,
    required: false
  },
  endDateHour: {
    type: String,
    required: false
  },
  showViewButton: {
    type: Boolean,
    default: true
  }
})

/************************************
 * Emits
 ************************************/
const emit = defineEmits(['deleteTask', 'editTask', 'completeTask'])

/************************************
 * Router
 ************************************/
const router = useRouter() // Accesses the Vue Router

/************************************
 * Computed Properties
 ************************************/
const cardDynamicClasses = computed(() => {
  const classes = []
  if (mobile.value) {
    classes.push('ma-4')
  } else {
    classes.push('ma-8', 'pa-8')
  }
  return classes
})

const completedTextClass = computed(() => {
  return props.completed ? 'text-decoration-line-through text-medium-emphasis' : 'text-on-surface'
})

const completedEmphasisColor = computed(() => (props.completed ? 'medium-emphasis' : 'on-surface'))

const completedEmphasisClass = computed(() =>
  props.completed ? 'text-medium-emphasis' : 'text-on-surface'
)

const priorityChipColor = computed(() => {
  if (props.completed) return 'default'
  switch (props.priority) {
    case 'High':
      return 'error'
    case 'Medium':
      return 'warning'
    default:
      return 'success'
  }
})

const statusChipColor = computed(() => {
  if (props.completed) return 'default'
  switch (props.status) {
    case 'Done':
      return 'success'
    case 'In Progress':
      return 'info'
    case 'Pending':
      return 'warning'
    default:
      return 'on-surface-variant'
  }
})

const completedButton = computed(() => {
  return {
    icon: props.completed ? 'mdi-check-circle' : `mdi-circle-outline`,
    label: props.completed ? 'Completed' : 'Complete',
    tooltipText: props.completed ? 'Task completed' : 'Not completed task',
    function: completeTask
  }
})

const btnsTasks = computed(() => {
  return [
    {
      icon: 'mdi-pencil',
      label: 'Edit',
      function: editTask,
      color: 'primary',
      variant: props.completed ? 'outlined' : 'flat'
    },
    {
      icon: 'mdi-delete',
      label: 'Delete',
      function: deleteTask,
      variant: props.completed ? 'outlined' : 'tonal'
    },
    {
      icon: completedButton.value.icon,
      label: completedButton.value.label,
      function: completedButton.value.function,
      variant: 'outlined'
    }
  ]
})

const tooltips = computed(() => [
  {
    text: 'Edit task',
    location: 'bottom',
    activator: 'parent'
  },
  {
    text: 'Delete task',
    location: 'bottom',
    activator: 'parent'
  },
  {
    text: completedButton.value.tooltipText,
    location: 'bottom',
    activator: 'parent'
  }
])

const cardColor = computed(() =>
  props.completed ? 'surface-container-highest opacity-50' : 'surface'
)

const dateCardColor = computed(() => (props.completed ? 'surface-container-highest' : 'on-surface'))

const dateIconColor = (baseColor) => (props.completed ? 'medium-emphasis' : baseColor)

/************************************
 * Methods / Functions
 ************************************/
const deleteTask = () => {
  emit('deleteTask', props.project.id, props.id)
}

const editTask = () => {
  emit('editTask', props.project.id, props.id)
}

const completeTask = () => {
  emit('completeTask', props.project.id, props.id)
}

const navigateToTaskDetail = () => {
  router.push({ name: 'task-detail', params: { taskId: props.id } })
}

/************************************
 * Vuetify Display
 ************************************/
const { mobile } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-card
    :variant="props.completed ? 'flat' : 'elevated'"
    :color="cardColor"
    :class="['card card-task-view', 'rounded-lg', ...cardDynamicClasses]"
  >
    <v-card-title
      class="card-title card-title-task-view mb-4"
      :class="mobile ? '' : 'd-flex align-center'"
    >
      <template v-if="mobile">
        <div class="d-flex flex-row align-center justify-space-between w-100">
          <span class="text-h5 text-truncate" :class="completedTextClass">
            {{ title }}
          </span>
          <v-btn
            v-if="props.showViewButton && $route.name !== 'task-detail' && $route.name !== 'search'"
            aria-label="View task details"
            variant="text"
            class="btn btn-task-view ml-2"
            icon
            @click="navigateToTaskDetail"
            :disabled="props.completed"
          >
            <v-icon class="icon icon-btn-task-vi">mdi-open-in-new</v-icon>
            <v-tooltip location="bottom" activator="parent"> View task details </v-tooltip>
          </v-btn>
        </div>
        <div>
          <v-chip
            v-if="props.completed"
            color="success"
            size="small"
            label
            variant="tonal"
            rounded="pill"
            class="font-weight-medium"
          >
            Completed
          </v-chip>
        </div>
      </template>
      <template v-else>
        <div class="d-flex align-center text-truncate w-100">
          <span class="text-h5" :class="completedTextClass">
            {{ title }}
          </span>
          <v-chip
            v-if="props.completed"
            color="success"
            size="small"
            label
            variant="tonal"
            rounded="pill"
            class="ml-3 font-weight-medium"
          >
            Completed
          </v-chip>
        </div>
        <v-btn
          v-if="props.showViewButton && $route.name !== 'task-detail' && $route.name !== 'search'"
          aria-label="View task details"
          variant="text"
          class="btn btn-task-view"
          icon
          @click="navigateToTaskDetail"
          :disabled="props.completed"
        >
          <v-icon class="icon icon-btn-task-vi">mdi-open-in-new</v-icon>
          <v-tooltip location="bottom" activator="parent"> View task details </v-tooltip>
        </v-btn>
      </template>
    </v-card-title>
    <v-card-subtitle class="mb-4" :class="completedEmphasisClass">
      <v-chip
        :color="color === 'default' ? 'primary' : color"
        :variant="props.completed ? 'outlined' : 'flat'"
        size="small"
        class="font-weight-medium"
        prepend-icon="mdi-folder-outline"
        :class="completedEmphasisClass"
      >
        <template v-slot:prepend>
          <v-icon :color="completedEmphasisColor"></v-icon>
        </template>
        {{ project.title || project }}
      </v-chip>
    </v-card-subtitle>
    <v-divider class="my-4"></v-divider>
    <v-card-text class="card-text">
      <!-- Descripción -->
      <v-row class="my-4">
        <v-col cols="12">
          <p class="text-subtitle-1 font-weight-medium mb-4" :class="completedEmphasisClass">
            Description:
          </p>
          <p class="text-body-1 py-2 px-4 rounded-lg" :class="completedTextClass">
            {{ description }}
          </p>
        </v-col>
      </v-row>

      <!-- Metadatos con chips visuales -->
      <v-row class="mt-4 mb-4">
        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="completedEmphasisClass"
              >Label:</span
            >
            <v-chip
              :color="color === 'default' ? 'primary' : color"
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="completedEmphasisClass"
            >
              <v-icon size="16" class="mr-1" :color="completedEmphasisColor">{{
                labelIcons[label] || 'mdi-tag'
              }}</v-icon>
              {{ label }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="completedEmphasisClass"
              >Priority:</span
            >
            <v-chip
              :color="priorityChipColor"
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="completedEmphasisClass"
            >
              <v-icon size="16" class="mr-1">
                {{
                  priority === 'High'
                    ? 'mdi-flag'
                    : priority === 'Medium'
                      ? 'mdi-flag-outline'
                      : 'mdi-flag-variant-outline'
                }}
              </v-icon>
              {{ priority }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="completedEmphasisClass"
              >Status:</span
            >
            <v-chip
              :color="statusChipColor"
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="completedEmphasisClass"
            >
              <v-icon size="16" class="mr-1">
                {{
                  status === 'Done'
                    ? 'mdi-check-circle'
                    : status === 'In Progress'
                      ? 'mdi-clock-outline'
                      : status === 'Pending'
                        ? 'mdi-clock-alert-outline'
                        : 'mdi-help-circle-outline'
                }}
              </v-icon>
              {{ status }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Fechas con mejor visualización -->
      <v-row class="mt-4 mb-4">
        <v-col cols="12" sm="6">
          <v-card
            variant="flat"
            rounded="lg"
            class="pa-4 bg-surface-container"
            :color="dateCardColor"
            flat
          >
            <div class="d-flex align-center">
              <v-icon :color="dateIconColor('primary')" class="mr-3">mdi-calendar-start</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium" :class="completedEmphasisClass">
                  Start Date
                </div>
                <div class="text-body-2" :class="completedTextClass">
                  <template v-if="startDate">
                    {{ formatDate(startDate) }}
                    <span v-if="props.startDateHour" class="ml-1">
                      at {{ props.startDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-medium-emphasis">Not specified</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            variant="flat"
            rounded="lg"
            class="pa-4 bg-surface-container"
            :color="dateCardColor"
            flat
          >
            <div class="d-flex align-center due-date-icon">
              <v-icon :color="dateIconColor(props.completed ? 'success' : 'error')" class="mr-3">
                {{ props.completed ? 'mdi-calendar-check' : 'mdi-calendar-end' }}
              </v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium" :class="completedEmphasisClass">
                  Due Date
                </div>
                <div class="text-body-2" :class="completedTextClass">
                  <template v-if="endDate">
                    {{ formatDate(endDate) }}
                    <span v-if="props.endDateHour" class="ml-1">
                      at {{ props.endDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-medium-emphasis">Not specified</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider class="my-4"></v-divider>
    <v-card-actions class="card-actions py-4">
      <v-spacer v-if="!mobile"></v-spacer>
      <div
        class="button-container"
        :class="
          mobile ? 'd-flex flex-column align-stretch w-100 ga-4' : 'd-flex flex-wrap justify-end'
        "
      >
        <v-btn
          v-for="(btn, i) in btnsTasks"
          :key="i"
          @click="btn.function"
          :aria-label="btn.label"
          :class="[mobile ? 'w-100' : 'mx-2 mb-2']"
          :color="btn.color"
          :variant="btn.variant"
          density="comfortable"
          size="small"
          rounded
          :height="40"
          :min-width="96"
          :disabled="props.completed && i !== 2"
        >
          <v-icon
            start
            :size="18"
            class="mr-1"
            :color="
              props.completed && i === 2
                ? completedEmphasisColor
                : props.completed && i !== 2
                  ? 'medium-emphasis'
                  : btn.iconColor || ''
            "
          >
            {{ btn.icon }}
          </v-icon>
          <span
            class="text-body-2 font-weight-medium"
            :class="
              props.completed && i === 2
                ? completedEmphasisClass
                : props.completed && i !== 2
                  ? 'text-medium-emphasis'
                  : btn.labelClass || ''
            "
          >
            {{ btn.label }}
          </span>
          <v-tooltip
            :location="tooltips[i].location"
            :activator="tooltips[i].activator"
            content-class="tooltip-custom"
            :disabled="props.completed && i !== 2"
          >
            {{ i === 2 ? completedButton.tooltipText : tooltips[i].text }}
          </v-tooltip>
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>
