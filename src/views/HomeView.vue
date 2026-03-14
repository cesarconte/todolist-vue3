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
    case 'xs': return '100%'
    case 'sm': return 600
    case 'md': return 840
    case 'lg': return 1140
    default: return 1440
  }
})

const pageTitleClass = computed(() => {
  if (xs.value) return 'text-h5 my-4 mb-2'
  if (sm.value) return 'text-h4 my-6'
  return 'text-h3 my-8'
})

const sectionColPaddingClass = computed(() => (xs.value ? 'pa-1' : sm.value ? 'pa-2' : 'pa-4'))
const mainContainerClass = computed(() => (xs.value ? 'pa-2' : 'pa-4'))
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
              <v-card rounded="xl" variant="flat" border class="h-100 d-flex align-center justify-center" :class="xs ? 'pa-4' : 'pa-6'">
                <v-card-text class="d-flex flex-column align-center justify-center pa-0">
                  <v-progress-circular
                    :model-value="taskCompletionPercentage"
                    :color="motivationalColor"
                    :width="xs ? 8 : 12"
                    :size="xs ? 90 : 130"
                    :class="xs ? 'mb-4' : 'mb-6'"
                    :rotate="-90"
                  >
                    <span :class="xs ? 'text-h5' : 'text-h4'" class="font-weight-black text-on-surface">{{ taskCompletionPercentage }}%</span>
                  </v-progress-circular>

                  <v-sheet color="transparent" class="text-center">
                    <v-sheet color="transparent" class="font-weight-black text-orange-darken-3 mb-1" :class="xs ? 'text-subtitle-2' : 'text-h6'">
                      {{ completedTasksCount }} / {{ totalTasksCount }} Tasks
                    </v-sheet>
                    <v-sheet color="transparent" class="text-caption font-weight-medium text-medium-emphasis" :class="xs ? 'mb-2' : 'mb-4'">
                      {{ pendingTasks.length }} remaining
                    </v-sheet>
                    <v-sheet color="transparent" class="d-flex align-center justify-center font-weight-black text-orange-darken-3" :class="xs ? 'text-caption' : ''">
                      <v-icon :icon="activeMotivationalInfo.icon" class="me-2" :size="xs ? 18 : 24"></v-icon>
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
      <v-row class="ma-0 mb-2">
        <v-col cols="12" :class="sectionColPaddingClass">
          <v-sheet border rounded="xl" class="bg-surface overflow-hidden">
            <!-- Row 1: Navigation Arrows and Month/Year Title -->
            <v-row no-gutters class="border-b">
              <v-col cols="12" class="d-flex align-center justify-space-between pa-4">
                <v-sheet color="transparent" class="d-flex align-center ga-1">
                  <v-btn variant="text" icon @click="navigateToPreviousYear" aria-label="Previous Year" density="comfortable">
                    <v-icon>mdi-chevron-double-left</v-icon>
                    <v-tooltip activator="parent" location="top">Previous Year</v-tooltip>
                  </v-btn>
                  <v-btn variant="text" icon @click="navigateToPreviousMonth" aria-label="Previous Month" density="comfortable">
                    <v-icon>mdi-chevron-left</v-icon>
                    <v-tooltip activator="parent" location="top">Previous Month</v-tooltip>
                  </v-btn>
                </v-sheet>
                
                <v-chip
                  variant="flat"
                  color="primary"
                  class="text-h6 font-weight-black px-6"
                  rounded="pill"
                  label
                >
                  <v-icon start icon="mdi-calendar-month" class="me-2"></v-icon>
                  {{ formattedCalendarTitle }}
                </v-chip>
                
                <v-sheet color="transparent" class="d-flex align-center ga-1">
                  <v-btn variant="text" icon @click="navigateToNextMonth" aria-label="Next Month" density="comfortable">
                    <v-icon>mdi-chevron-right</v-icon>
                    <v-tooltip activator="parent" location="top">Next Month</v-tooltip>
                  </v-btn>
                  <v-btn variant="text" icon @click="navigateToNextYear" aria-label="Next Year" density="comfortable">
                    <v-icon>mdi-chevron-double-right</v-icon>
                    <v-tooltip activator="parent" location="top">Next Year</v-tooltip>
                  </v-btn>
                </v-sheet>
              </v-col>
            </v-row>

            <!-- Row 2: Today, View Mode, and Weekdays Controls -->
            <v-row no-gutters class="pa-4 bg-grey-lighten-5">
              <v-col cols="12">
                <v-row align="center" justify="center" class="ga-4 ga-md-8">
                  <!-- 1. Today Button -->
                  <v-col cols="auto">
                    <v-btn 
                      variant="outlined" 
                      class="text-none px-6 font-weight-bold" 
                      rounded="lg"
                      @click="goToToday"
                      color="primary"
                    >
                      Today
                      <v-tooltip activator="parent" location="top">Go to today's date</v-tooltip>
                    </v-btn>
                  </v-col>

                  <!-- 2. View Mode Selector -->
                  <v-col cols="12" sm="auto">
                    <v-select
                      v-model="currentCalendarType"
                      :items="CALENDAR_VIEW_TYPES"
                      item-title="text"
                      item-value="value"
                      label="VIEW MODE"
                      hide-details
                      density="compact"
                      variant="outlined"
                      rounded="lg"
                      bg-color="surface"
                      class="font-weight-bold"
                      style="min-width: 160px;"
                    ></v-select>
                  </v-col>

                  <!-- 3. Weekdays Selector -->
                  <v-col cols="12" sm="auto">
                    <v-select
                      v-model="currentWeekdayMode"
                      :items="WEEKDAY_MODES"
                      item-title="title"
                      item-value="title"
                      label="WEEKDAYS"
                      hide-details
                      density="compact"
                      variant="outlined"
                      rounded="lg"
                      bg-color="surface"
                      class="font-weight-bold"
                      style="min-width: 160px;"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-sheet>
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
