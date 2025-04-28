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
  <!-- 
  1.Vuetify's rounded Prop: The rounded prop in Vuetify is meant to apply a pre-defined rounding style
   (like sm, md, lg, xl). It doesn't directidly accept custom pixel values or empty strings to remove rounding.

  2. Dynamic Values: Vuetify's rounded prop is evaluated only once when the component is mounted.
  It doesn't re-evaluate on every change to the hover ref. This means that even though the hover ref changes,
  the rounded prop doesn't update dynamically.

  3. Conditional Class: The solution using the conditional class :class="{ 'rounded-lg': !hover }" works because it directly controls
  the application of the rounded-lg class based on the hover state.
  Vuetify's class system is designed to handle dynamic styling changes.
  -->
  <v-card
    variant="elevated"
    :elevation="hover ? 4 : 2"
    color="surface"
    :class="[
      { 'rounded-lg': !hover },
      mobile ? 'card card-task-view ma-4' : 'card card-task-view ma-8 pa-8',
      hover ? 'card-hover' : '',
      props.completed ? 'completed-card' : ''
    ]"
    hover
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <v-card-title class="card-title card-title-task-view d-flex align-center mb-4">
      <div class="d-flex align-center">
        <span
          class="text-h5"
          :class="
            props.completed
              ? 'text-decoration-line-through text-surface-variant'
              : 'text-on-surface'
          "
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
        color="primary"
        icon
        @click="navigateToTaskDetail"
      >
        <v-icon class="icon icon-btn-task-vi">mdi-open-in-new</v-icon>
        <v-tooltip location="bottom" activator="parent"> View task details </v-tooltip>
      </v-btn>
    </v-card-title>
    <v-card-subtitle class="mb-4 text-on-surface-variant">
      <v-chip
        :color="color === 'default' ? 'primary' : color"
        variant="flat"
        size="small"
        class="font-weight-medium"
        prepend-icon="mdi-folder-outline"
      >
        {{ project.title || project }}
      </v-chip>
    </v-card-subtitle>
    <v-divider class="my-4"></v-divider>
    <v-card-text class="card-text">
      <!-- Descripción -->
      <v-row class="my-4">
        <v-col cols="12">
          <p class="text-subtitle-1 font-weight-medium mb-4 text-on-surface">Description:</p>
          <p class="text-body-1 py-2 px-4 bg-surface-variant text-on-surface-variant rounded-lg">
            {{ description }}
          </p>
        </v-col>
      </v-row>

      <!-- Metadatos con chips visuales -->
      <v-row class="mt-4 mb-4">
        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2 text-on-surface">Label:</span>
            <v-chip
              :color="color === 'default' ? 'primary' : color"
              size="small"
              class="font-weight-medium"
              variant="tonal"
            >
              <v-icon size="16" class="mr-1">{{ labelIcons[label] || 'mdi-tag' }}</v-icon>
              {{ label }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-medium mr-2 text-on-surface">Priority:</span>
            <v-chip
              :color="priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'success'"
              size="small"
              class="font-weight-medium"
              variant="tonal"
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
            <span class="text-subtitle-1 font-weight-medium mr-2 text-on-surface">Status:</span>
            <v-chip
              :color="
                status === 'Completed'
                  ? 'success'
                  : status === 'In Progress'
                    ? 'info'
                    : status === 'Pending'
                      ? 'warning'
                      : 'on-surface-variant'
              "
              size="small"
              class="font-weight-medium"
              variant="tonal"
            >
              <v-icon size="16" class="mr-1">
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
          <v-card
            variant="outlined"
            rounded="lg"
            class="pa-4"
            :color="props.completed ? 'surface-variant' : 'text-on-surface'"
            flat
          >
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-3">mdi-calendar-start</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium">Start Date</div>
                <div
                  class="text-body-2"
                >
                  <template v-if="startDate">
                    {{ formatDate(startDate) }}
                    <span v-if="props.startDateHour" class="ml-1">
                      at {{ props.startDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-on-surface-variant">Not specified</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            variant="outlined"
            rounded="lg"
            class="pa-4"
            :color="props.completed ? 'surface-variant' : 'text-on-surface'"
            flat
          >
            <div class="d-flex align-center due-date-icon">
              <v-icon :color="props.completed ? 'success' : 'error'" class="mr-3">
                {{ props.completed ? 'mdi-calendar-check' : 'mdi-calendar-end' }}
              </v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-medium">Due Date</div>
                <div
                  class="text-body-2"
                >
                  <template v-if="endDate">
                    {{ formatDate(endDate) }}
                    <span v-if="props.endDateHour" class="ml-1">
                      at {{ props.endDateHour }} h
                    </span>
                  </template>
                  <span v-else class="text-on-surface-variant">Not specified</span>
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
        >
          <!-- Icono para todos los botones -->
          <v-icon start :size="18" class="mr-1">
            {{ i !== 2 ? btn.icon : props.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
          </v-icon>

          <!-- Texto para todos los botones -->
          <span class="text-body-2 font-weight-medium">
            {{ i === 0 ? 'Edit' : i === 1 ? 'Delete' : props.completed ? 'Completed' : 'Complete' }}
          </span>

          <v-tooltip
            :location="tooltips[i].location"
            :activator="tooltips[i].activator"
            content-class="tooltip-custom"
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
</style>
