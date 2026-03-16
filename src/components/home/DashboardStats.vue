<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  labelIcons: {
    type: Object,
    required: true
  }
})

const { xs } = useDisplay()

// Computed properties for task data
const allTasks = computed(() => props.tasks || [])
const pendingTasks = computed(() => allTasks.value.filter((task) => !task.completed))
const completedTasksCount = computed(() => allTasks.value.filter((task) => task.completed).length)
const totalTasksCount = computed(() => allTasks.value.length)

const taskCompletionPercentage = computed(() =>
  totalTasksCount.value === 0
    ? 0
    : Math.round((completedTasksCount.value / totalTasksCount.value) * 100)
)

// Deadlines logic
const upcomingDeadlinesList = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && new Date(task.endDate) >= now)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 3)
})

const upcomingDeadlinesCount = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter((task) => task.endDate && new Date(task.endDate) >= now).length
})

// Overdue logic
const overdueTasksList = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && new Date(task.endDate) < now)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 3)
})

const overdueTasksCount = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter((task) => task.endDate && new Date(task.endDate) < now).length
})

// UI State
const isDeadlinesPanelExpanded = ref(false)
const isOverduePanelExpanded = ref(false)

const upcomingCardClass = computed(() =>
  upcomingDeadlinesCount.value > 0 ? 'bg-warning-container' : ''
)
const upcomingIconColor = computed(() =>
  upcomingDeadlinesCount.value > 0 ? 'warning' : 'on-surface-variant'
)
const overdueCardClass = computed(() => (overdueTasksCount.value > 0 ? 'bg-error-container' : ''))
const overdueIconColor = computed(() =>
  overdueTasksCount.value > 0 ? 'error' : 'on-surface-variant'
)

const deadlinesActionLabel = computed(() => (isDeadlinesPanelExpanded.value ? 'Hide' : 'Show all'))
const overdueActionLabel = computed(() => (isOverduePanelExpanded.value ? 'Hide' : 'Show all'))

// Motivational logic
const motivationalColor = computed(() => {
  const pct = taskCompletionPercentage.value
  if (pct === 100) return 'success'
  if (pct >= 75) return 'primary'
  if (pct >= 50) return 'info'
  return 'warning'
})

const getMotivationalFeedback = (percentage) => {
  if (percentage === 100) return { label: 'All tasks done!', icon: 'mdi-trophy', size: 28 }
  if (percentage >= 90) return { label: 'Almost there!', icon: 'mdi-star-circle', size: 24 }
  if (percentage >= 75) return { label: 'Great progress!', icon: 'mdi-star-circle', size: 24 }
  if (percentage >= 50) return { label: 'Halfway there!', icon: 'mdi-fire', size: 24 }
  if (percentage >= 25) return { label: 'Good start!', icon: 'mdi-fire', size: 24 }
  if (percentage > 0) return { label: 'Keep going!', icon: 'mdi-fire', size: 24 }
  return { label: 'Start your first task!', icon: 'mdi-flag-outline', size: 24 }
}

const activeMotivationalInfo = computed(() =>
  getMotivationalFeedback(taskCompletionPercentage.value)
)
</script>

<template>
  <v-expand-transition>
    <v-sheet v-if="totalTasksCount" color="transparent" class="mb-4">
      <v-row class="ma-0 ga-4 ga-md-0" align="stretch">
        <!-- Upcoming Deadlines Card -->
        <v-col cols="12" md="4" :class="xs ? 'pa-1' : 'pa-4'">
          <v-card
            rounded="xl"
            variant="flat"
            border
            class="h-100 d-flex flex-column pa-4"
            :class="upcomingCardClass"
          >
            <v-card-item class="pa-0">
              <v-card-title class="d-flex align-center justify-space-between pb-4">
                <v-sheet color="transparent" class="d-flex align-center">
                  <v-icon :color="upcomingIconColor" icon="mdi-clock-outline" class="me-2" />
                  <span class="text-subtitle-1 font-weight-black text-warning">
                    Upcoming Deadlines
                  </span>
                </v-sheet>
                <v-badge
                  v-if="upcomingDeadlinesCount > 0"
                  :content="upcomingDeadlinesCount"
                  color="warning"
                  inline
                />
              </v-card-title>
            </v-card-item>
            <v-spacer />
            <v-expand-transition>
              <v-list
                v-if="isDeadlinesPanelExpanded && upcomingDeadlinesList.length"
                bg-color="transparent"
                class="px-0 py-2"
              >
                <v-list-item
                  v-for="task in upcomingDeadlinesList"
                  :key="task.id"
                  :to="{ name: 'task-detail', params: { taskId: task.id } }"
                  rounded="lg"
                  class="mb-2 surface-variant"
                  density="compact"
                  lines="one"
                >
                  <template #prepend>
                    <v-icon :color="task.color || 'primary'" size="small">
                      {{ labelIcons[task.label] || 'mdi-circle-medium' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-caption font-weight-bold text-on-surface">
                    {{ task.title }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-expand-transition>
            <v-card-actions class="pa-0 pt-auto">
              <v-sheet
                color="transparent"
                class="d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between w-100"
              >
                <v-sheet
                  color="transparent"
                  class="d-flex align-center text-caption font-weight-medium text-warning mb-1 mb-lg-0"
                >
                  <v-icon size="small" class="me-2">mdi-calendar-clock</v-icon>
                  {{ upcomingDeadlinesCount }} task{{ upcomingDeadlinesCount !== 1 ? 's' : '' }}
                  with upcoming deadline
                </v-sheet>
                <v-btn
                  v-if="upcomingDeadlinesCount > 0"
                  variant="text"
                  size="small"
                  class="text-none font-weight-bold"
                  :append-icon="isDeadlinesPanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click="isDeadlinesPanelExpanded = !isDeadlinesPanelExpanded"
                >
                  {{ deadlinesActionLabel }}
                </v-btn>
              </v-sheet>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Progress Circular Card -->
        <v-col cols="12" md="4" :class="xs ? 'pa-1' : 'pa-4'">
          <v-card
            rounded="xl"
            variant="flat"
            border
            class="h-100 d-flex align-center justify-center"
            :class="xs ? 'pa-4' : 'pa-6'"
          >
            <v-card-text class="d-flex flex-column align-center justify-center pa-0">
              <v-progress-circular
                :model-value="taskCompletionPercentage"
                :color="motivationalColor"
                :width="xs ? 8 : 12"
                :size="xs ? 90 : 130"
                :class="xs ? 'mb-4' : 'mb-6'"
                :rotate="-90"
              >
                <span :class="xs ? 'text-h5' : 'text-h4'" class="font-weight-black text-on-surface">
                  {{ taskCompletionPercentage }}%
                </span>
              </v-progress-circular>
              <v-sheet color="transparent" class="text-center">
                <v-sheet
                  color="transparent"
                  class="font-weight-black text-warning mb-1"
                  :class="xs ? 'text-subtitle-2' : 'text-h6'"
                >
                  {{ completedTasksCount }} / {{ totalTasksCount }} Tasks
                </v-sheet>
                <v-sheet
                  color="transparent"
                  class="text-caption font-weight-medium text-medium-emphasis"
                  :class="xs ? 'mb-2' : 'mb-4'"
                >
                  {{ pendingTasks.length }} remaining
                </v-sheet>
                <v-sheet
                  color="transparent"
                  class="d-flex align-center justify-center font-weight-black text-warning"
                  :class="xs ? 'text-caption' : ''"
                >
                  <v-icon :icon="activeMotivationalInfo.icon" class="me-2" :size="xs ? 18 : 24" />
                  {{ activeMotivationalInfo.label }}
                </v-sheet>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Overdue Tasks Card -->
        <v-col cols="12" md="4" :class="xs ? 'pa-1' : 'pa-4'">
          <v-card
            rounded="xl"
            variant="flat"
            border
            class="h-100 d-flex flex-column pa-4"
            :class="overdueCardClass"
          >
            <v-card-item class="pa-0">
              <v-card-title class="d-flex align-center justify-space-between pb-4">
                <v-sheet color="transparent" class="d-flex align-center">
                  <v-icon :color="overdueIconColor" icon="mdi-alert-circle-outline" class="me-2" />
                  <span class="text-subtitle-1 font-weight-black text-error"> Overdue Tasks </span>
                </v-sheet>
                <v-badge
                  v-if="overdueTasksCount > 0"
                  :content="overdueTasksCount"
                  color="error"
                  inline
                />
              </v-card-title>
            </v-card-item>
            <v-spacer />
            <v-expand-transition>
              <v-list
                v-if="isOverduePanelExpanded && overdueTasksList.length"
                bg-color="transparent"
                class="px-0 py-2"
              >
                <v-list-item
                  v-for="task in overdueTasksList"
                  :key="task.id"
                  :to="{ name: 'task-detail', params: { taskId: task.id } }"
                  rounded="lg"
                  class="mb-2 surface-variant"
                  density="compact"
                  lines="one"
                >
                  <template #prepend>
                    <v-icon :color="task.color || 'primary'" size="small">
                      {{ labelIcons[task.label] || 'mdi-circle-medium' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-caption font-weight-bold text-on-surface">
                    {{ task.title }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-expand-transition>
            <v-card-actions class="pa-0 pt-auto">
              <v-sheet
                color="transparent"
                class="d-flex flex-column flex-lg-row align-start align-lg-center justify-space-between w-100"
              >
                <v-sheet
                  color="transparent"
                  class="d-flex align-center text-caption font-weight-medium text-error mb-1 mb-lg-0"
                >
                  <v-icon :color="overdueIconColor" size="small" class="me-2"
                    >mdi-alert-outline</v-icon
                  >
                  {{ overdueTasksCount }} task{{ overdueTasksCount !== 1 ? 's' : '' }} past deadline
                </v-sheet>
                <v-btn
                  v-if="overdueTasksCount > 0"
                  variant="text"
                  size="small"
                  class="text-none font-weight-bold"
                  :append-icon="isOverduePanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click="isOverduePanelExpanded = !isOverduePanelExpanded"
                >
                  {{ overdueActionLabel }}
                </v-btn>
              </v-sheet>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </v-expand-transition>
</template>

<style scoped></style>
