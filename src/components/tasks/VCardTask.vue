<script setup>
import { computed, ref } from 'vue'
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
 * Refs
 ************************************/
const hover = ref(false) // Tracks the hover state of the card

/************************************
 * Computed Properties
 ************************************/
const completedButton = computed(() => {
  // Defines the completed button's icon, label, and function
  return {
    icon: props.completed
      ? `mdi-check-circle text-${props.color}`
      : `mdi-circle-outline text-${props.color}`,
    label: props.completed ? 'Task completed' : 'Not completed task',
    tooltipText: props.completed ? 'Task completed' : 'Not completed task',
    function: completeTask
  }
})

const btnsTasks = computed(() => {
  // Defines the array of task buttons
  return [
    {
      icon: 'mdi-pencil',
      label: 'Edit task',
      function: editTask
    },
    {
      icon: 'mdi-delete',
      label: 'Delete task',
      function: deleteTask
    },
    {
      icon: completedButton.value.icon,
      label: completedButton.value.label,
      function: completedButton.value.function
    }
  ]
})

const tooltips = computed(() => [
  // Defines the tooltips for the task buttons
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

const cardColor = computed(() => (props.completed ? 'surfaceDim' : 'surface'))
const textColorClass = computed(() => (props.completed ? 'text-medium-emphasis' : 'text-onSurface'))
const dateCardColor = computed(() => (props.completed ? 'surfaceContainerHighest' : 'surface'))
const dateTextColorClass = computed(() =>
  props.completed ? 'text-medium-emphasis' : 'text-onSurface'
)
const dateIconColor = (baseColor) => (props.completed ? 'medium-emphasis' : baseColor)

/************************************
 * Methods / Functions
 ************************************/
const deleteTask = () => {
  // Emits the deleteTask event with the task's ID
  emit('deleteTask', props.project.id, props.id)
}

// Define the editTask function
const editTask = () => {
  // Emits the editTask event with the task's ID
  emit('editTask', props.project.id, props.id)
}

// Define the completedTask function
const completeTask = () => {
  // Emits the completeTask event with the task's ID
  emit('completeTask', props.project.id, props.id)
}

const navigateToTaskDetail = () => {
  // Navigates to the task detail page
  router.push({ name: 'task-detail', params: { taskId: props.id } })
}

/************************************
 * Vuetify Display
 ************************************/
const { mobile } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-card
    :variant="props.completed ? 'outlined' : 'elevated'"
    :elevation="hover && !props.completed ? 4 : props.completed ? 0 : 2"
    :color="cardColor"
    :class="[
      { 'rounded-lg': !hover },
      mobile ? 'card card-task-view ma-4' : 'card card-task-view ma-8 pa-8',
      hover && !props.completed ? 'card-hover' : '',
      props.completed ? 'completed-card' : '',
      props.completed ? 'bg-surfaceContainerHighest' : '',
    ]"
    :hover="!props.completed"
    @mouseover="hover = !props.completed && true"
    @mouseleave="hover = false"
  >
    <v-card-title class="card-title card-title-task-view d-flex align-center mb-4">
      <div class="d-flex align-center">
        <span
          class="text-h5"
          :class="[
            props.completed ? 'text-decoration-line-through text-medium-emphasis' : 'text-onSurface'
          ]"
        >
          {{ title }}
        </span>
        <v-chip
          v-if="props.completed"
          color="success"
          size="small"
          label
          variant="tonal"
          class="ml-3 font-weight-medium"
        >
          Completed
        </v-chip>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        v-if="props.showViewButton && $route.name !== 'task-detail' && $route.name !== 'search'"
        aria-label="View task details"
        variant="text"
        class="btn btn-task-view"
        :color="props.completed ? 'medium-emphasis' : 'primary'"
        icon
        @click="navigateToTaskDetail"
        :disabled="props.completed"
      >
        <v-icon class="icon icon-btn-task-vi">mdi-open-in-new</v-icon>
        <v-tooltip location="bottom" activator="parent"> View task details </v-tooltip>
      </v-btn>
    </v-card-title>
    <v-card-subtitle
      class="mb-4"
      :class="props.completed ? 'text-medium-emphasis' : 'text-onSurfaceVariant'"
    >
      <v-chip
        :color="color === 'default' ? 'primary' : color"
        :variant="props.completed ? 'outlined' : 'flat'"
        size="small"
        class="font-weight-medium"
        prepend-icon="mdi-folder-outline"
        :class="props.completed ? 'text-medium-emphasis' : ''"
      >
        <template v-slot:prepend>
          <v-icon :color="props.completed ? 'medium-emphasis' : ''"></v-icon>
        </template>
        {{ project.title || project }}
      </v-chip>
    </v-card-subtitle>
    <v-divider class="my-4"></v-divider>
    <v-card-text class="card-text">
      <!-- Descripción -->
      <v-row class="my-4">
        <v-col cols="12">
          <p class="text-subtitle-1 font-weight-medium mb-4" :class="textColorClass">
            Description:
          </p>
          <p
            class="text-body-1 py-2 px-4 rounded-lg"
            :class="[
              textColorClass,
              props.completed ? 'bg-surfaceContainerHighest' : 'bg-surfaceContainer'
            ]"
          >
            {{ description }}
          </p>
        </v-col>
      </v-row>

      <!-- Metadatos con chips visuales -->
      <v-row class="mt-4 mb-4">
        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="textColorClass"
              >Label:</span
            >
            <v-chip
              :color="color === 'default' ? 'primary' : color"
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="props.completed ? 'text-medium-emphasis' : ''"
            >
              <v-icon size="16" class="mr-1" :color="props.completed ? 'medium-emphasis' : ''">{{
                labelIcons[label] || 'mdi-tag'
              }}</v-icon>
              {{ label }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="textColorClass"
              >Priority:</span
            >
            <v-chip
              :color="priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'success'"
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="props.completed ? 'text-medium-emphasis' : ''"
            >
              <v-icon size="16" class="mr-1" :color="props.completed ? 'medium-emphasis' : ''">
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
            <span class="text-subtitle-1 font-weight-medium mr-2" :class="textColorClass"
              >Status:</span
            >
            <v-chip
              :color="
                status === 'Completed'
                  ? 'success'
                  : status === 'In Progress'
                    ? 'info'
                    : status === 'Pending'
                      ? 'warning'
                      : 'onSurfaceVariant'
              "
              size="small"
              class="font-weight-medium"
              :variant="props.completed ? 'outlined' : 'tonal'"
              :class="props.completed ? 'text-medium-emphasis' : ''"
            >
              <v-icon size="16" class="mr-1" :color="props.completed ? 'medium-emphasis' : ''">
                {{
                  status === 'Completed'
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
          <v-card variant="outlined" rounded="lg" class="pa-4" :color="dateCardColor" flat>
            <div class="d-flex align-center">
              <v-icon :color="dateIconColor('primary')" class="mr-3">mdi-calendar-start</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium" :class="dateTextColorClass">
                  Start Date
                </div>
                <div class="text-body-2" :class="dateTextColorClass">
                  <template v-if="startDate">
                    {{ formatDate(startDate) }}
                    <span v-if="props.startDateHour" class="ml-1">
                      at {{ props.startDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-medium-emphasis">Not specified</span>
                  <!-- Keep emphasis low -->
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card variant="outlined" rounded="lg" class="pa-4" :color="dateCardColor" flat>
            <div class="d-flex align-center due-date-icon">
              <v-icon :color="dateIconColor(props.completed ? 'success' : 'error')" class="mr-3">
                {{ props.completed ? 'mdi-calendar-check' : 'mdi-calendar-end' }}
              </v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium" :class="dateTextColorClass">
                  Due Date
                </div>
                <div class="text-body-2" :class="dateTextColorClass">
                  <template v-if="endDate">
                    {{ formatDate(endDate) }}
                    <span v-if="props.endDateHour" class="ml-1">
                      at {{ props.endDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-medium-emphasis">Not specified</span>
                  <!-- Keep emphasis low -->
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider class="my-4"></v-divider>
    <v-card-actions class="card-actions py-4">
      <v-spacer></v-spacer>
      <div class="d-flex flex-wrap justify-end button-container">
        <!-- Botones de acción según Material Design 3 -->
        <v-btn
          v-for="(btn, i) in btnsTasks"
          :key="i"
          @click="btn.function"
          :aria-label="btn.label"
          class="action-btn mx-2 mb-2"
          :color="i === 0 ? 'primary' : i === 1 ? 'error' : props.completed ? 'success' : 'primary'"
          :variant="i === 0 ? 'elevated' : i === 1 ? 'tonal' : 'tonal'"
          density="comfortable"
          size="small"
          rounded="lg"
          :height="40"
          :min-width="96"
          :disabled="props.completed && i !== 2"
        >
          <!-- Icono para todos los botones -->
          <v-icon
            start
            :size="18"
            class="mr-1"
            :color="props.completed && i !== 2 ? 'medium-emphasis' : ''"
          >
            {{ i !== 2 ? btn.icon : props.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
          </v-icon>

          <!-- Texto para todos los botones -->
          <span
            class="text-body-2 font-weight-medium"
            :class="props.completed && i !== 2 ? 'text-medium-emphasis' : ''"
          >
            {{ i === 0 ? 'Edit' : i === 1 ? 'Delete' : props.completed ? 'Completed' : 'Complete' }}
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

<style scoped>
.scale-out {
  animation: scale-out 0.3s ease-in-out;
}

.scale-in {
  animation: scale-in 0.3s ease-in-out;
}

@keyframes scale-out {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes scale-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

/* Estilos adicionales para las tarjetas */
.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.completed-card {
  /* Add specific styles for completed cards if needed, e.g., border */
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Ensure disabled buttons look appropriately dimmed */
.v-btn--disabled {
  opacity: 0.5; /* Adjust opacity as needed */
}
</style>
