<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import useLabelIcons from '@/composables/ui/useLabelIcons.js'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useDisplay } from 'vuetify'
import { formatDate } from '@/utils/date/dateFormat'
import { combineDateTime } from '@/utils/tasks/taskUtils'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()
const { labelIcons } = useLabelIcons()

const { xs, sm, md, lg, xl, mobile, smAndDown } = useDisplay()

// --- Dashboard statistics ---
const pendingTasks = computed(() => (taskStore.tasksData || []).filter((task) => !task.completed))
const completedTasksCount = computed(
  () => (taskStore.tasksData || []).filter((task) => task.completed).length
)
const totalTasks = computed(() => taskStore.tasksData?.length || 0)
const completionPercentage = computed(() =>
  totalTasks.value === 0 ? 0 : Math.round((completedTasksCount.value / totalTasks.value) * 100)
)

// --- Upcoming Deadlines ---
const upcomingDeadlines = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) >= now)
    .sort(
      (a, b) =>
        combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour)
    )
    .slice(0, 3)
})
const upcomingDeadlinesTotal = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter(
    (task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) >= now
  ).length
})
const isDeadlinesPanelExpanded = ref(false)

// --- Overdue Tasks ---
const overdueTasks = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) < now)
    .sort(
      (a, b) =>
        combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour)
    )
    .slice(0, 3)
})
const overdueTasksTotal = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter(
    (task) => task.endDate && combineDateTime(task.endDate, task.endDateHour) < now
  ).length
})
const isOverduePanelExpanded = ref(false)

// --- Calendar ---
const type = ref('month')
const types = ref([
  { text: 'Month View', value: 'month' },
  { text: 'Week View', value: 'week' },
  { text: 'Day View', value: 'day' }
])
const weekday = ref('Sun - Sat')
const weekdays = ref([
  { title: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
  { title: 'Mon - Fri', value: [1, 2, 3, 4, 5] }
])
const value = ref([new Date()])
const calendarEvents = computed(() => {
  return (taskStore.tasksData || [])
    .slice()
    .sort(
      (a, b) =>
        combineDateTime(a.endDate, a.endDateHour) - combineDateTime(b.endDate, b.endDateHour)
    )
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: task.startDate || null,
      end: task.endDate || null,
      allDay: false,
      color: task.color,
      label: task.label,
      completed: task.completed,
      extendedProps: {
        project: task.project,
        description: task.description
      }
    }))
})

// --- Helpers ---
const formatDisplayDate = (date) => (date ? formatDate(date, 'MMM DD, YYYY') : 'No date')
const getAccessibleColor = (color, isCompleted) => (isCompleted ? 'on-surface-variant' : color)
const getWeekdays = (title) => {
  const found = weekdays.value.find((item) => item.title === title)
  return found ? found.value : [0, 1, 2, 3, 4, 5, 6]
}

// --- Motivational (adaptado a MD3) ---
const getMotivationalMessage = (percentage) => {
  let message = ''
  if (percentage === 100) message = 'All tasks done!'
  else if (percentage >= 90) message = 'Almost there!'
  else if (percentage >= 75) message = 'Great progress!'
  else if (percentage >= 50) message = 'Halfway there!'
  else if (percentage >= 25) message = 'Good start!'
  else if (percentage > 0) message = 'Keep going!'
  else message = 'Start your first task!'
  return message
}
const getMotivationalIcon = (percentage) => {
  if (percentage === 100) return { icon: 'mdi-trophy', color: 'success', size: 28 }
  if (percentage >= 75) return { icon: 'mdi-star-circle', color: 'primary', size: 24 }
  if (percentage >= 50) return { icon: 'mdi-fire', color: 'secondary', size: 24 }
  if (percentage >= 25) return { icon: 'mdi-fire', color: 'warning', size: 24 }
  if (percentage > 0) return { icon: 'mdi-alert-circle', color: 'error', size: 24 }
  return { icon: 'mdi-flag-outline', color: 'on-surface-variant', size: 24 }
}

// Computada para la información motivacional
const motivationalInfo = computed(() => getMotivationalIcon(completionPercentage.value))

// --- Responsive text for Upcoming Deadlines ---
const getUpcomingDeadlinesText = computed(() => {
  if (upcomingDeadlinesTotal.value > 1) {
    return smAndDown.value
      ? `${upcomingDeadlinesTotal.value} tasks upcoming`
      : `${upcomingDeadlinesTotal.value} tasks with upcoming deadline`
  } else if (upcomingDeadlinesTotal.value === 1) {
    return smAndDown.value ? '1 task upcoming' : '1 task with upcoming deadline'
  } else {
    return smAndDown.value ? 'No deadlines' : 'No upcoming deadlines'
  }
})

onMounted(() => {
  // Activar suscripción en tiempo real a las tareas del usuario
  if (userStore.isLoggedIn) {
    taskStore.subscribeToTasks()
  }
})

onUnmounted(() => {
  // Limpiar la suscripción en tiempo real al salir de la vista
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
  async (newVal) => {
    if (newVal) {
      projectStore.subscribeToCollection()
    }
  },
  { immediate: true }
)

onBeforeRouteLeave((to, from, next) => {
  if (to.name === 'task-detail') {
    // Only store if going to task-detail
    localStorage.setItem('previousRoute', JSON.stringify(from))
  }
  next()
})
</script>

<template>
  <v-container class="pa-4 pa-sm-6">
    <v-responsive
      class="mx-auto"
      :max-width="xs ? '100%' : sm ? '95%' : md ? '85%' : lg ? '80%' : xl ? '75%' : '70%'"
    >
      <v-card flat elevation="0" rounded="lg" class="pa-8" color="background">
        <v-card-title class="text-center font-weight-bold mb-8">
          <span class="text-primary" :class="xs ? 'text-h4' : mobile ? 'text-h3' : 'text-h2'">
            Vuetify Todolist
          </span>
        </v-card-title>

        <v-card-text>
          <!-- Panel estadístico -->
          <v-expand-transition>
            <v-sheet
              v-if="userStore.isLoggedIn && totalTasks > 0"
              rounded="lg"
              class="mb-8 pa-4"
              color="surface-variant"
            >
              <v-row align="start" class="px-2">
                <!-- Upcoming Deadlines: izquierda -->
                <v-col :cols="xs ? 12 : sm ? 4 : 4">
                  <v-card
                    flat
                    rounded="lg"
                    :elevation="upcomingDeadlinesTotal > 0 ? 3 : 1"
                    color="surface"
                    hover
                  >
                    <v-card-item class="pa-3 pb-1">
                      <template v-slot:prepend>
                        <v-icon
                          :color="upcomingDeadlinesTotal > 0 ? 'primary' : 'on-surface'"
                          icon="mdi-clock-alert"
                        ></v-icon>
                      </template>
                      <v-card-title
                        class="text-subtitle-1 font-weight-bold pa-0"
                        :class="upcomingDeadlinesTotal > 0 ? 'text-primary' : 'text-on-surface'"
                      >
                        Upcoming Deadlines
                      </v-card-title>
                      <template v-slot:append>
                        <v-badge
                          v-if="upcomingDeadlinesTotal > 0"
                          :content="upcomingDeadlinesTotal"
                          color="primary"
                          floating
                          class="me-4"
                        ></v-badge>
                      </template>
                    </v-card-item>
                    <v-expansion-panels
                      v-model="isDeadlinesPanelExpanded"
                      variant="accordion"
                      class="mt-2 deadlines-panel"
                      bg-color="surface"
                    >
                      <v-expansion-panel value="true" class="border-0">
                        <v-expansion-panel-title class="px-3 py-2 upcoming-panel" hide-actions>
                          <v-row align="center" no-gutters class="w-100">
                            <v-col>
                              <v-sheet
                                color="transparent"
                                class="text-body-2 d-inline-flex align-center text-truncate"
                                :class="
                                  upcomingDeadlinesTotal > 0 ? 'text-primary' : 'text-on-surface'
                                "
                              >
                                <v-icon
                                  size="small"
                                  class="me-1"
                                  :color="
                                    upcomingDeadlinesTotal > 0 ? 'primary' : 'on-surface-variant'
                                  "
                                >
                                  {{
                                    upcomingDeadlinesTotal > 0
                                      ? 'mdi-calendar-clock'
                                      : 'mdi-calendar-check'
                                  }}
                                </v-icon>
                                <span class="text-truncate d-inline-block" max-width="220px">
                                  {{ getUpcomingDeadlinesText }}
                                </span>
                              </v-sheet>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col
                              cols="auto"
                              class="text-caption text-medium-emphasis me-2"
                              :class="
                                upcomingDeadlinesTotal > 0
                                  ? 'text-primary'
                                  : 'text-on-surface-variant'
                              "
                            >
                              {{ isDeadlinesPanelExpanded ? 'Hide' : 'Show all' }}
                              <v-btn
                                density="comfortable"
                                :icon="
                                  isDeadlinesPanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                                "
                                variant="text"
                                size="small"
                                :color="
                                  upcomingDeadlinesTotal > 0 ? 'primary' : 'on-surface-variant'
                                "
                                aria-label="Toggle upcoming deadlines panel"
                              >
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text eager class="px-3 pb-3 pt-0">
                          <v-list
                            v-if="upcomingDeadlines.length"
                            density="compact"
                            class="px-0"
                            color="transparent"
                          >
                            <v-list-item
                              v-for="task in upcomingDeadlines"
                              :key="task.id"
                              :to="{ name: 'task-detail', params: { taskId: task.id } }"
                              class="px-2 py-1 rounded-lg mb-1 task-item upcoming"
                              exact
                              lines="two"
                              color="surface-variant"
                              base-color="on-surface-variant"
                            >
                              <template v-slot:prepend>
                                <v-icon
                                  :color="task.color || 'primary'"
                                  size="32"
                                  class="me-2 rounded-circle pa-1"
                                  :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                                />
                              </template>
                              <v-list-item-title
                                class="text-truncate text-subtitle-2 text-on-surface-variant"
                              >
                                {{ task.title }}
                              </v-list-item-title>
                              <v-list-item-subtitle
                                class="text-caption d-flex align-center bg-primary text-on-primary rounded-lg"
                              >
                                <v-icon
                                  size="x-small"
                                  class="me-1"
                                  :color="'primary'"
                                  icon="mdi-clock-alert-outline"
                                ></v-icon>
                                Deadline: {{ formatDisplayDate(task.endDate) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                          <v-sheet
                            v-else
                            class="text-caption text-center pa-2 bg-transparent text-on-surface"
                          >
                            No upcoming deadlines
                          </v-sheet>
                          <v-row justify="end" no-gutters class="mt-2">
                            <v-col cols="auto">
                              <v-btn
                                density="comfortable"
                                variant="text"
                                :color="upcomingDeadlinesTotal > 0 ? 'primary' : 'on-surface'"
                                rounded
                                size="small"
                                :to="{ name: 'filter-and-labels' }"
                                class="d-flex align-center text-none pa-4"
                              >
                                <v-icon size="small" class="me-2">mdi-format-list-bulleted</v-icon>
                                <span>View All Tasks</span>
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </v-col>

                <!-- Porcentaje de completadas: centro -->
                <v-col
                  cols="12"
                  sm="4"
                  md="4"
                  class="d-flex flex-column align-center justify-center"
                >
                  <v-card
                    flat
                    rounded="lg"
                    :elevation="completionPercentage === 100 ? 3 : 1"
                    color="surface"
                    hover
                  >
                    <v-card-text class="d-flex flex-column align-center justify-center pa-6">
                      <v-fade-transition>
                        <v-icon
                          v-if="completionPercentage === 100"
                          size="64"
                          :color="motivationalInfo.color"
                          class="mb-2 animate__animated animate__bounceIn"
                          >mdi-check-circle</v-icon
                        >
                      </v-fade-transition>
                      <v-progress-circular
                        :model-value="completionPercentage"
                        :color="motivationalInfo.color"
                        :width="6"
                        :size="100"
                        class="mb-4"
                        bg-color="surface-variant"
                        :indeterminate="false"
                        :rotate="-90"
                        transition="scale-transition"
                      >
                        <span
                          :class="[
                            'font-weight-bold',
                            'text-h4',
                            `text-${motivationalInfo.color}`,
                            'progress-percentage-transition'
                          ]"
                        >
                          {{ completionPercentage }}%
                        </span>
                      </v-progress-circular>

                      <v-card-text class="text-center pa-0">
                        <div
                          :class="[
                            'text-body-1 mb-1 font-weight-bold',
                            `text-${motivationalInfo.color}`
                          ]"
                        >
                          <span class="font-weight-bold">{{ completedTasksCount }}</span>
                          <span class="font-weight-bold"> / </span>
                          <span class="font-weight-bold">{{ totalTasks }}</span>
                          <span class="font-weight-bold"> Tasks Completed</span>
                        </div>
                        <div
                          :class="[
                            'text-body-2 font-weight-medium mb-3',
                            `text-${motivationalInfo.color}`
                          ]"
                        >
                          {{ pendingTasks.length }} remaining
                        </div>
                        <v-fade-transition mode="out-in">
                          <div
                            key="motivational-{{ completionPercentage }}"
                            :class="[
                              'text-h6 font-weight-bold d-flex align-center justify-center mt-2',
                              `text-${motivationalInfo.color}`
                            ]"
                          >
                            <v-icon
                              :icon="motivationalInfo.icon"
                              :color="motivationalInfo.color"
                              :size="motivationalInfo.size"
                              class="me-2"
                            ></v-icon>
                            {{ getMotivationalMessage(completionPercentage) }}
                          </div>
                        </v-fade-transition>
                      </v-card-text>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Overdue Tasks: derecha -->
                <v-col cols="12" sm="4" md="4">
                  <v-card
                    flat
                    rounded="lg"
                    :elevation="overdueTasksTotal > 0 ? 3 : 1"
                    color="surface"
                    hover
                  >
                    <v-card-item class="pa-3 pb-1">
                      <template v-slot:prepend>
                        <v-icon
                          :color="overdueTasksTotal > 0 ? 'error' : 'on-surface'"
                          icon="mdi-alarm"
                        ></v-icon>
                      </template>
                      <v-card-title
                        class="text-subtitle-1 font-weight-bold pa-0"
                        :class="overdueTasksTotal > 0 ? 'text-error' : 'text-on-surface'"
                      >
                        Overdue Tasks</v-card-title
                      >
                      <template v-slot:append>
                        <v-badge
                          v-if="overdueTasksTotal > 0"
                          :content="overdueTasksTotal"
                          color="error"
                          floating
                          class="me-4"
                        ></v-badge>
                      </template>
                    </v-card-item>
                    <v-expansion-panels
                      v-model="isOverduePanelExpanded"
                      variant="accordion"
                      class="mt-2 deadlines-panel"
                      bg-color="surface"
                    >
                      <v-expansion-panel value="true" class="border-0">
                        <v-expansion-panel-title class="px-3 py-2 overdue-panel" hide-actions>
                          <v-row align="center" no-gutters class="w-100">
                            <v-col>
                              <v-sheet
                                color="transparent"
                                class="text-body-2 d-inline-flex align-center text-truncate"
                                :class="overdueTasksTotal > 0 ? 'text-error' : 'text-on-surface'"
                              >
                                <v-icon
                                  size="small"
                                  class="me-1"
                                  :color="overdueTasksTotal > 0 ? 'error' : 'on-surface'"
                                >
                                  {{
                                    overdueTasksTotal > 0 ? 'mdi-alert-circle' : 'mdi-check-circle'
                                  }}
                                </v-icon>
                                <span class="text-truncate d-inline-block" max-width="220px">
                                  {{
                                    overdueTasksTotal > 0
                                      ? `${overdueTasksTotal} task${overdueTasksTotal > 1 ? 's' : ''} past deadline`
                                      : 'All tasks are on schedule'
                                  }}
                                </span>
                              </v-sheet>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col
                              cols="auto"
                              class="text-caption text-medium-emphasis me-2"
                              :class="overdueTasksTotal > 0 ? 'text-error' : 'text-on-surface'"
                            >
                              {{ isOverduePanelExpanded ? 'Hide' : 'Show all' }}
                              <v-btn
                                density="comfortable"
                                :icon="
                                  isOverduePanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                                "
                                variant="text"
                                size="small"
                                :color="overdueTasksTotal > 0 ? 'error' : 'on-surface'"
                                aria-label="Toggle overdue tasks panel"
                              >
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text eager class="px-3 pb-3 pt-0">
                          <v-list
                            v-if="overdueTasks.length"
                            density="compact"
                            class="px-0"
                            color="transparent"
                          >
                            <v-list-item
                              v-for="task in overdueTasks"
                              :key="task.id"
                              :to="{ name: 'task-detail', params: { taskId: task.id } }"
                              class="px-2 py-1 rounded-lg mb-1 task-item overdue"
                              exact
                              lines="two"
                              color="surface-variant"
                              base-color="on-surface-variant"
                            >
                              <template v-slot:prepend>
                                <v-icon
                                  :color="task.color || 'primary'"
                                  size="32"
                                  class="me-2 rounded-circle pa-1"
                                  :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                                />
                              </template>
                              <v-list-item-title
                                class="text-truncate text-subtitle-2 text-on-surface-variant"
                              >
                                {{ task.title }}
                              </v-list-item-title>
                              <v-list-item-subtitle
                                class="text-caption d-flex align-center bg-error text-on-error rounded-lg"
                              >
                                <v-icon
                                  size="x-small"
                                  icon="mdi-clock-alert-outline"
                                  color="error"
                                ></v-icon>
                                Due: {{ formatDisplayDate(task.endDate) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                          <v-sheet
                            v-else
                            class="text-caption text-center pa-2 bg-transparent text-on-surface"
                          >
                            All tasks are on schedule!
                          </v-sheet>
                          <v-row justify="end" no-gutters class="mt-2">
                            <v-col cols="auto">
                              <v-btn
                                density="comfortable"
                                variant="text"
                                :color="overdueTasksTotal > 0 ? 'error' : 'on-surface'"
                                rounded
                                size="small"
                                :to="{ name: 'filter-and-labels' }"
                                class="d-flex align-center text-none pa-4"
                              >
                                <v-icon size="small" class="me-2">mdi-format-list-bulleted</v-icon>
                                <span>View All Tasks</span>
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </v-col>
              </v-row>
            </v-sheet>
          </v-expand-transition>

          <v-row align="center" justify="center" class="mb-8">
            <v-col :cols="xs ? 12 : 6" :sm="6" :md="5" :lg="4" :xl="3" class="mb-8">
              <v-select
                v-model="type"
                :items="types"
                label="View Mode"
                variant="outlined"
                density="comfortable"
                hide-details
                rounded
                color="primary"
                prepend-inner-icon="mdi-calendar-month"
                menu-icon="mdi-menu-down"
                class="font-weight-medium"
                item-title="text"
                item-value="value"
                :menu-props="{ contentClass: 'bg-surface-variant' }"
              ></v-select>
            </v-col>

            <v-col :cols="xs ? 12 : 6" :sm="6" :md="5" :lg="4" :xl="3" class="mb-8">
              <v-select
                v-model="weekday"
                :items="weekdays"
                item-title="title"
                item-value="title"
                label="Weekdays"
                variant="outlined"
                density="comfortable"
                hide-details
                rounded
                color="primary"
                prepend-inner-icon="mdi-calendar-week"
                menu-icon="mdi-menu-down"
                class="font-weight-medium"
                :menu-props="{ contentClass: 'bg-surface-variant' }"
              ></v-select>
            </v-col>
          </v-row>

          <v-row justify="center" class="mb-8">
            <v-col cols="12" class="mb-8">
              <Suspense>
                <template #default>
                  <v-calendar
                    ref="calendar"
                    v-model="value"
                    :events="calendarEvents"
                    :view-mode="type"
                    :weekdays="getWeekdays(weekday)"
                    color="primary"
                    class="rounded-lg elevation-1"
                    height="auto"
                    aria-label="Calendario de tareas"
                    elevation="1"
                  >
                    <template #event="{ event }">
                      <v-card
                        :key="event.id"
                        flat
                        :color="event.completed ? 'surface-variant' : 'surface'"
                        :class="[
                          'ma-1 pa-2 rounded cursor-pointer transition-swing focus-visible-outline',
                          { 'opacity-60': event.completed }
                        ]"
                        :ripple="true"
                        @click="
                          () => router.push({ name: 'task-detail', params: { taskId: event.id } })
                        "
                        @keydown.enter="
                          () => router.push({ name: 'task-detail', params: { taskId: event.id } })
                        "
                        @keydown.space="
                          () => router.push({ name: 'task-detail', params: { taskId: event.id } })
                        "
                        tabindex="0"
                        :aria-label="
                          'Task: ' + event.title + (event.completed ? ', Completed' : ', Pending')
                        "
                        role="button"
                      >
                        <v-row no-gutters align="center">
                          <v-col cols="9" class="text-truncate">
                            <span
                              :class="{
                                'text-decoration-line-through text-on-surface-variant':
                                  event.completed
                              }"
                            >
                              {{ event.title }}
                            </span>
                          </v-col>
                          <v-col cols="3" class="text-right">
                            <v-icon
                              :color="getAccessibleColor(event.color, event.completed) || 'primary'"
                              :icon="
                                event.completed
                                  ? 'mdi-check-circle'
                                  : labelIcons[event.label] || 'mdi-question'
                              "
                              size="20"
                              :aria-label="event.completed ? 'Completed' : 'Label: ' + event.label"
                            >
                            </v-icon>
                            <v-tooltip
                              activator="parent"
                              location="right"
                              content-class="text-body-2"
                            >
                              {{ event.completed ? 'Task completed' : 'Task ' + event.label }}
                            </v-tooltip>
                          </v-col>
                        </v-row>
                      </v-card>
                    </template>
                  </v-calendar>
                </template>
                <template #fallback>
                  <v-skeleton-loader type="article" class="my-2"></v-skeleton-loader>
                </template>
              </Suspense>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.progress-percentage-transition {
  transition:
    color 0.3s,
    font-size 0.3s;
}
</style>
