<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import useLabelIcons from '@/composables/ui/useLabelIcons.js'
import { useDisplay } from 'vuetify'
import { combineDateTime } from '@/utils/tasks/taskUtils'
import { useMotivationalProgress } from '@/composables/ui/useMotivationalProgress.js'

/**
 * @file HomeView.vue
 * @description Main dashboard view with statistics and calendar integration.
 * Adheres to Vue 3 Composition API best practices and semantic architectural patterns.
 */

// --- Stores and Router ---
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()

// --- UI Composables ---
const { labelIcons } = useLabelIcons()
const { xs, sm, name } = useDisplay()

// --- State Management ---
const isDeadlinesPanelExpanded = ref(false)
const isOverduePanelExpanded = ref(false)
const currentCalendarType = ref('month')
const currentWeekdayMode = ref('Sun - Sat')
const currentCalendarDate = ref(new Date())
const calendarRef = ref(null)

// --- Constants & Options ---
const CALENDAR_VIEW_TYPES = [
  { text: 'Month View', value: 'month' },
  { text: 'Week View', value: 'week' },
  { text: 'Day View', value: 'day' }
]

const WEEKDAY_MODES = [
  { title: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
  { title: 'Mon - Fri', value: [1, 2, 3, 4, 5] }
]

// --- Responsive Layout Computed Properties ---
const responsiveContainerWidth = computed(() => {
  switch (name.value) {
    case 'xs': return '100vw'
    case 'sm': return 600
    case 'md': return 840
    case 'lg': return 1140
    default: return 1440
  }
})

const pageTitleClass = computed(() => {
  if (xs.value) return 'text-h5 my-4'
  if (sm.value) return 'text-h4 my-8'
  return 'text-h3 my-8'
})

const sectionColPaddingClass = computed(() => (xs.value || sm.value ? '' : 'pa-4'))
const mainContainerClass = computed(() => (xs.value ? '' : 'pa-4'))
const calendarCssClass = computed(() => (xs.value ? 'calendar-xs' : ''))

// --- Task Data Computed Properties ---
const allTasks = computed(() => taskStore.tasksData || [])
const pendingTasks = computed(() => allTasks.value.filter((task) => !task.completed))
const completedTasksCount = computed(() => allTasks.value.filter((task) => task.completed).length)
const totalTasksCount = computed(() => allTasks.value.length)

const taskCompletionPercentage = computed(() =>
  totalTasksCount.value === 0 
    ? 0 
    : Math.round((completedTasksCount.value / totalTasksCount.value) * 100)
)

// --- Dashboard Statistics Logic ---

// Upcoming Deadlines
const upcomingDeadlinesList = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) >= now)
    .sort((a, b) => combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour))
    .slice(0, 3)
})

const upcomingDeadlinesCount = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter(
    (task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) >= now
  ).length
})

// Overdue Tasks
const overdueTasksList = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) < now)
    .sort((a, b) => combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour))
    .slice(0, 3)
})

const overdueTasksCount = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter(
    (task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) < now
  ).length
})

// --- Appearance Computed Properties (UI State Logic) ---

const upcomingCardClass = computed(() => 
  upcomingDeadlinesCount.value > 0 ? 'bg-orange-lighten-5' : 'bg-green-lighten-5'
)

const upcomingIconColor = computed(() => 
  upcomingDeadlinesCount.value > 0 ? 'orange-darken-2' : 'success'
)

const overdueCardClass = computed(() => 
  overdueTasksCount.value > 0 ? 'bg-red-lighten-5' : 'bg-green-lighten-5'
)

const overdueIconColor = computed(() => 
  overdueTasksCount.value > 0 ? 'red-darken-2' : 'success'
)

const deadlinesActionLabel = computed(() => 
  isDeadlinesPanelExpanded.value ? 'Hide' : 'Show all'
)

const overdueActionLabel = computed(() => 
  isOverduePanelExpanded.value ? 'Hide' : 'Show all'
)

const activeWeekdayValues = computed(() => {
  const mode = WEEKDAY_MODES.find((m) => m.title === currentWeekdayMode.value)
  return mode ? mode.value : [0, 1, 2, 3, 4, 5, 6]
})

// --- Calendar Logic ---

const formattedCalendarTitle = computed(() => {
  if (!currentCalendarDate.value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarDate.value)
})

const mappedCalendarEvents = computed(() => {
  return allTasks.value
    .slice()
    .sort((a, b) => combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour))
    .map((task) => {
      const start = combineDateTime(task.startDate, task.startDateHour) || task.startDate || null
      const end = combineDateTime(task.endDate, task.endDateHour) || task.endDate || null
      return {
        id: task.id,
        name: task.title,
        start,
        end,
        allDay: !task.startDateHour && !task.endDateHour,
        color: task.color,
        completed: task.completed,
      }
    })
})

// --- Calendar Navigation Actions ---
const navigateToPreviousMonth = () => calendarRef.value?.prev()
const navigateToNextMonth = () => calendarRef.value?.next()

const navigateToPreviousYear = () => {
  const date = new Date(currentCalendarDate.value)
  date.setFullYear(date.getFullYear() - 1)
  currentCalendarDate.value = date
}

const navigateToNextYear = () => {
  const date = new Date(currentCalendarDate.value)
  date.setFullYear(date.getFullYear() + 1)
  currentCalendarDate.value = date
}

const goToToday = () => {
  currentCalendarDate.value = new Date()
}

// --- Interaction Handlers ---
const handleEventClick = (payload) => {
  const task = payload.event || payload
  if (task && task.id) {
    router.push({ name: 'task-detail', params: { taskId: task.id } })
  }
}

// --- Motivational Progress Logic ---
const { color: motivationalColor } = useMotivationalProgress(taskCompletionPercentage)

const getMotivationalFeedback = (percentage) => {
  if (percentage === 100) return { label: 'All tasks done!', icon: 'mdi-trophy', size: 28 }
  if (percentage >= 90) return { label: 'Almost there!', icon: 'mdi-star-circle', size: 24 }
  if (percentage >= 75) return { label: 'Great progress!', icon: 'mdi-star-circle', size: 24 }
  if (percentage >= 50) return { label: 'Halfway there!', icon: 'mdi-fire', size: 24 }
  if (percentage >= 25) return { label: 'Good start!', icon: 'mdi-fire', size: 24 }
  if (percentage > 0) return { label: 'Keep going!', icon: 'mdi-fire', size: 24 }
  return { label: 'Start your first task!', icon: 'mdi-flag-outline', size: 24 }
}

const activeMotivationalInfo = computed(() => getMotivationalFeedback(taskCompletionPercentage.value))

// --- Lifecycle & Side Effects ---

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  if (userStore.isLoggedIn) {
    taskStore.subscribeToTasks()
  }
})

onUnmounted(() => {
  taskStore.unsubscribeAll()
})

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      taskStore.loadAllUserTasks()
      notificationsStore.scheduleNotifications(taskStore.tasksData)
    } else {
      taskStore.clearTaskStore()
    }
  },
  { immediate: true }
)

watch(
  () => userStore.userId,
  async (newId) => {
    if (newId) {
      projectStore.subscribeToCollection()
    }
  },
  { immediate: true }
)
</script>

<template>
  <v-container :class="mainContainerClass" fluid>
    <v-responsive class="homeView-container mx-auto" :max-width="responsiveContainerWidth">
      <!-- Dashboard Title -->
      <v-row>
        <v-col cols="12">
          <h2 class="text-center text-on-surface font-weight-bold" :class="pageTitleClass">
            Vuetify Todolist
          </h2>
        </v-col>
      </v-row>

      <!-- Statistics Row -->
      <v-expand-transition>
        <v-sheet color="transparent" class="mb-4">
          <v-row v-if="userStore.isLoggedIn && totalTasksCount" class="ma-0 ga-4 ga-md-0" align="stretch">
            <!-- Upcoming Deadlines Card -->
            <v-col cols="12" md="4" :class="sectionColPaddingClass">
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
                      <v-icon 
                        :color="upcomingIconColor" 
                        icon="mdi-clock-outline"
                        class="me-2"
                      ></v-icon>
                      <span class="text-subtitle-1 font-weight-black text-orange-darken-4">Upcoming Deadlines</span>
                    </v-sheet>
                    <v-badge
                      v-if="upcomingDeadlinesCount > 0"
                      :content="upcomingDeadlinesCount"
                      color="warning"
                      inline
                    ></v-badge>
                  </v-card-title>
                </v-card-item>

                <v-spacer></v-spacer>

                <!-- Tasks List (Expandable) -->
                <v-expand-transition>
                  <v-list v-if="isDeadlinesPanelExpanded && upcomingDeadlinesList.length" bg-color="transparent" class="px-0 py-2">
                    <v-list-item
                      v-for="task in upcomingDeadlinesList"
                      :key="task.id"
                      :to="{ name: 'task-detail', params: { taskId: task.id } }"
                      rounded="lg"
                      class="mb-2 bg-white-opacity-50"
                      density="compact"
                      lines="one"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="task.color || 'primary'" size="small">{{ labelIcons[task.label] || 'mdi-circle-medium' }}</v-icon>
                      </template>
                      <v-list-item-title class="text-caption font-weight-bold text-on-surface">{{ task.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expand-transition>

                <v-card-actions class="pa-0 pt-auto">
                  <v-sheet color="transparent" class="d-flex align-center justify-space-between w-100">
                    <v-sheet color="transparent" class="d-flex align-center text-caption font-weight-medium text-orange-darken-3">
                      <v-icon size="small" class="me-2">mdi-calendar-clock</v-icon>
                      {{ upcomingDeadlinesCount }} tasks with upcoming deadline
                    </v-sheet>
                    <v-btn
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
            <v-col cols="12" md="4" :class="sectionColPaddingClass">
              <v-card rounded="xl" variant="flat" border class="h-100 d-flex align-center justify-center pa-6">
                <v-card-text class="d-flex flex-column align-center justify-center pa-0">
                  <v-progress-circular
                    :model-value="taskCompletionPercentage"
                    :color="motivationalColor"
                    :width="12"
                    :size="130"
                    class="mb-6"
                    :rotate="-90"
                  >
                    <span class="text-h4 font-weight-black text-on-surface">{{ taskCompletionPercentage }}%</span>
                  </v-progress-circular>

                  <v-sheet color="transparent" class="text-center">
                    <v-sheet color="transparent" class="text-h6 font-weight-black text-orange-darken-3 mb-1">
                      {{ completedTasksCount }} / {{ totalTasksCount }} Tasks Completed
                    </v-sheet>
                    <v-sheet color="transparent" class="text-body-2 font-weight-medium text-medium-emphasis mb-4">
                      {{ pendingTasks.length }} remaining
                    </v-sheet>
                    <v-sheet color="transparent" class="d-flex align-center justify-center font-weight-black text-orange-darken-3">
                      <v-icon :icon="activeMotivationalInfo.icon" class="me-2" size="24"></v-icon>
                      {{ activeMotivationalInfo.label }}
                    </v-sheet>
                  </v-sheet>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Overdue Tasks Card -->
            <v-col cols="12" md="4" :class="sectionColPaddingClass">
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
                      <v-icon 
                        :color="overdueIconColor" 
                        icon="mdi-alert-circle-outline"
                        class="me-2"
                      ></v-icon>
                      <span class="text-subtitle-1 font-weight-black text-red-darken-4">Overdue Tasks</span>
                    </v-sheet>
                    <v-badge
                      v-if="overdueTasksCount > 0"
                      :content="overdueTasksCount"
                      color="error"
                      inline
                    ></v-badge>
                  </v-card-title>
                </v-card-item>

                <v-spacer></v-spacer>

                <v-expand-transition>
                  <v-list v-if="isOverduePanelExpanded && overdueTasksList.length" bg-color="transparent" class="px-0 py-2">
                    <v-list-item
                      v-for="task in overdueTasksList"
                      :key="task.id"
                      :to="{ name: 'task-detail', params: { taskId: task.id } }"
                      rounded="lg"
                      class="mb-2 bg-white-opacity-50"
                      density="compact"
                      lines="one"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="task.color || 'primary'" size="small">{{ labelIcons[task.label] || 'mdi-circle-medium' }}</v-icon>
                      </template>
                      <v-list-item-title class="text-caption font-weight-bold text-on-surface">{{ task.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expand-transition>

                <v-card-actions class="pa-0 pt-auto">
                  <v-sheet color="transparent" class="d-flex align-center justify-space-between w-100">
                    <v-sheet color="transparent" class="d-flex align-center text-caption font-weight-medium text-red-darken-3">
                      <v-icon size="small" class="me-2">mdi-alert-outline</v-icon>
                      {{ overdueTasksCount }} tasks past deadline
                    </v-sheet>
                    <v-btn
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

      <!-- Calendar Header (Navigation & Controls) -->
      <v-row align="center" class="ma-0 mb-6 bg-surface px-4 py-2 rounded-lg border ga-4 ga-md-0">
        <!-- Navigation Buttons -->
        <v-col cols="12" md="4" class="d-flex justify-center justify-md-start">
          <v-sheet border rounded="lg" class="d-flex align-center overflow-hidden">
            <v-btn variant="text" size="small" icon="mdi-chevron-double-left" @click="navigateToPreviousYear" aria-label="Previous Year"></v-btn>
            <v-divider vertical></v-divider>
            <v-btn variant="text" size="small" icon="mdi-chevron-left" @click="navigateToPreviousMonth" aria-label="Previous Month"></v-btn>
            <v-divider vertical></v-divider>
            <v-btn variant="text" size="small" class="text-none px-4 font-weight-bold" @click="goToToday">Today</v-btn>
            <v-divider vertical></v-divider>
            <v-btn variant="text" size="small" icon="mdi-chevron-right" @click="navigateToNextMonth" aria-label="Next Month"></v-btn>
            <v-divider vertical></v-divider>
            <v-btn variant="text" size="small" icon="mdi-chevron-double-right" @click="navigateToNextYear" aria-label="Next Year"></v-btn>
          </v-sheet>
        </v-col>

        <!-- Current Calendar Title -->
        <v-col cols="12" md="4" class="d-flex justify-center">
          <v-sheet border rounded="pill" class="d-inline-flex align-center px-8 py-2 bg-surface-container-low shadow-sm">
            <v-icon color="primary" class="me-2">mdi-calendar-month</v-icon>
            <h3 class="text-h6 font-weight-black text-on-surface">
              {{ formattedCalendarTitle }}
            </h3>
          </v-sheet>
        </v-col>

        <!-- View Controls (Selectors) -->
        <v-col cols="12" md="4" class="d-flex justify-center justify-md-end align-center ga-4">
          <v-select
            v-model="currentCalendarType"
            :items="CALENDAR_VIEW_TYPES"
            label="VIEW MODE"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="font-weight-bold custom-select"
            item-title="text"
            item-value="value"
            style="max-width: 160px;"
          ></v-select>
          <v-select
            v-model="currentWeekdayMode"
            :items="WEEKDAY_MODES"
            item-title="title"
            item-value="title"
            label="WEEKDAYS"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="font-weight-bold custom-select"
            style="max-width: 160px;"
          ></v-select>
        </v-col>
      </v-row>

      <!-- Main Calendar Grid -->
      <v-row justify="center" class="ma-0">
        <v-col cols="12" :class="sectionColPaddingClass">
          <Suspense>
            <template #default>
              <v-calendar
                ref="calendarRef"
                v-model="currentCalendarDate"
                :events="mappedCalendarEvents"
                :type="currentCalendarType"
                :weekdays="activeWeekdayValues"
                :class="calendarCssClass"
                style="height: 600px;"
                aria-label="Tasks Calendar"
                @click:event="handleEventClick"
              >
                <template #event="{ event }">
                  <v-sheet 
                    color="transparent"
                    class="px-1 text-white font-weight-bold w-100 h-100 d-flex align-center" 
                    :class="{ 
                      'text-decoration-line-through opacity-60 font-weight-regular': event.completed 
                    }"
                    style="font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;"
                    @click.stop="handleEventClick(event)"
                  >
                    <v-icon v-if="event.completed" size="x-small" class="me-1">mdi-check-circle</v-icon>
                    {{ event.name }}
                  </v-sheet>
                </template>
              </v-calendar>
            </template>
            <template #fallback>
              <v-skeleton-loader type="article" class="my-2"></v-skeleton-loader>
            </template>
          </Suspense>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.bg-white-opacity-50 {
  background-color: rgba(255, 255, 255, 0.4) !important;
}
.custom-select :deep(.v-label) {
  font-size: 0.7rem !important;
  letter-spacing: 0.05rem;
  opacity: 1 !important;
  color: inherit !important;
}
</style>
