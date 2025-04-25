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
    :class="[
      { 'rounded-xl': !hover },
      mobile ? 'card card-task-view my-4' : 'card card-task-view ma-8 pa-8'
    ]"
    hover
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <v-card-title class="card-title card-title-task-view d-flex align-center mb-4">
      <span class="text-h5">{{ title }}</span>
      <v-spacer></v-spacer>
      <v-btn
        v-if="$route.name !== 'task-detail' && $route.name !== 'search'"
        aria-label="View task details"
        variant="flat"
        class="btn btn-task-view"
        icon
        @click="navigateToTaskDetail"
      >
        <v-icon class="icon icon-btn-task-vi">mdi-open-in-new</v-icon>
        <v-tooltip location="bottom" activator="parent"> View task details </v-tooltip>
      </v-btn>
    </v-card-title>
    <v-card-subtitle class="mb-4">
      <span class="text-subtitle1">Project: {{ project.title || project }}</span>
    </v-card-subtitle>
    <v-divider class="mt-2 mb-4"></v-divider>
    <v-card-text class="card-text">
      <v-list>
        <v-list-item>
          <v-list-item-title class="font-weight-medium my-4">Description:</v-list-item-title>
          <v-list-item-subtitle class="my-4">{{ description }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title class="font-weight-medium my-4">
            Label:
            <v-icon
              v-bind="props"
              :color="color"
              size="24"
              :style="{ verticalAlign: 'baseline' }"
              class="icon"
              >{{ labelIcons[label] || 'mdi-question' }}</v-icon
            >
          </v-list-item-title>
          <v-list-item-subtitle class="my-4">{{ label }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title class="font-weight-medium my-4">Priority:</v-list-item-title>
          <v-list-item-subtitle class="my-4">{{ priority }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title class="font-weight-medium my-4">Status:</v-list-item-title>
          <v-list-item-subtitle class="my-4">{{ status }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-row class="d-flex justify-space-between mt-4 mb-4">
            <v-col cols="auto">
              <v-row>
                <v-col cols="auto">
                  <span class="font-weight-medium">Start Date:</span>
                </v-col>
                <v-col>
                  <span
                    v-if="createdAt"
                    :class="
                      props.completed
                        ? 'text-decoration-line-through text-grey-lighten-1'
                        : 'font-weight-light'
                    "
                    >{{ formatDate(startDate) }}</span
                  >
                  <span v-else class="font-weight-light">No start date</span>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="auto">
              <v-row>
                <v-col cols="auto">
                  <span class="font-weight-medium">Start Time:</span>
                </v-col>
                <v-col>
                  <span
                    v-if="props.startDateHour"
                    :class="
                      props.completed
                        ? 'text-decoration-line-through text-grey-lighten-1'
                        : 'font-weight-light'
                    "
                    >{{ props.startDateHour }} h.</span
                  >
                  <span v-else class="font-weight-light">No start time</span>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-list-item>

        <v-list-item>
          <v-row class="d-flex justify-space-between mt-4 mb-4">
            <v-col cols="auto">
              <v-row>
                <v-col cols="auto">
                  <span class="font-weight-medium">Due Date:</span>
                </v-col>
                <v-col>
                  <span
                    v-if="endDate"
                    :class="
                      props.completed
                        ? 'text-decoration-line-through text-grey-lighten-1'
                        : 'font-weight-light'
                    "
                  >
                    {{ formatDate(endDate) }}
                  </span>
                  <span v-else class="font-weight-light"> No due date </span>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="auto" class="text-right">
              <v-row>
                <v-col cols="auto">
                  <span class="font-weight-medium">Due Time:</span>
                </v-col>
                <v-col>
                  <span
                    v-if="props.endDateHour"
                    :class="
                      props.completed
                        ? 'text-decoration-line-through text-grey-lighten-1'
                        : 'font-weight-light'
                    "
                    >{{ props.endDateHour }} h.</span
                  >
                  <span v-else class="font-weight-light">No due time</span>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-divider class="my-4"></v-divider>
    <v-card-actions class="card-actions card-actions-task-view pb-0 pr-0">
      <v-spacer></v-spacer>
      <v-btn
        v-for="(btn, i) in btnsTasks"
        :key="i"
        @click="btn.function"
        :aria-label="btn.label"
        class="btn btn-task-view mx-2"
        icon
      >
        <template v-if="i === 2">
          <v-scale-transition
            :origin="props.completed ? 'bottom right' : 'top left'"
            mode="out-in"
            :key="props.id"
          >
            <v-icon
              class="icon icon-btn-task-view"
              :class="props.completed ? 'scale-out' : 'scale-in'"
            >
              {{ completedButton.icon }}
            </v-icon>
          </v-scale-transition>
        </template>
        <template v-else>
          <v-icon class="icon icon-btn-task-view">
            {{ btn.icon }}
          </v-icon>
        </template>
        <v-tooltip :location="tooltips[i].location" :activator="tooltips[i].activator">
          {{ i === 2 ? completedButton.tooltipText : tooltips[i].text }}
        </v-tooltip>
      </v-btn>
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
</style>
