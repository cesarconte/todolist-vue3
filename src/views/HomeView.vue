<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import useLabelIcons from '@/composables/ui/useLabelIcons.js'
import { useDisplay } from 'vuetify'
import { formatDate } from '@/utils/date/dateFormat'
import { combineDateTime } from '@/utils/tasks/taskUtils'

// const router = useRouter()
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
// const getAccessibleColor = (color, isCompleted) => (isCompleted ? 'primary' : color)
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
  return { icon: 'mdi-flag-outline', color: 'grey', size: 24 }
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
</script>

<template>
  <!-- Contenedor principal: fondo blanco como YouTube -->
  <v-container :class="xs ? 'pa-2' : 'pa-4'" fluid>
    <v-responsive
      class="mx-auto"
      :max-width="xs ? '100%' : sm ? '95%' : md ? '85%' : lg ? '80%' : xl ? '75%' : '70%'"
    >
      <!-- v-sheet principal con fondo blanco y sombra sutil -->
      <v-sheet :class="xs || sm ? 'py-4 px-0' : 'pa-4'" rounded="lg" color="surface">
        <h2
          class="text-center mb-4 text-primary"
          :class="xs ? 'text-h5' : mobile ? 'text-h4' : 'text-h3'"
        >
          Vuetify Todolist
        </h2>
        
        <!-- Panel estadístico -->
        <v-expand-transition>
          <v-sheet 
            v-if="userStore.isLoggedIn && totalTasks > 0" 
            rounded="lg" 
            :class="xs || sm ? 'mb-4 mx-0' : 'mb-8 mx-0'"
            color="surface-container"
            elevation="0"
          >
            <!-- Row sin padding adicional -->
            <v-row align="start" class="ma-0">
              <!-- Upcoming Deadlines -->
              <v-col cols="12" md="4" :class="xs || sm ? 'pa-2' : 'pa-4'">
                <v-card
                  rounded="lg"
                  variant="tonal"
                  class="upcoming-panel"
                  :color="upcomingDeadlinesTotal > 0 ? 'warning' : 'secondary'"
                >
                  <v-card-item :class="xs ? 'pa-4 pb-2' : 'pa-8 pb-4'">
                    <template v-slot:prepend>
                      <v-icon color="on-surface" icon="mdi-clock-alert"></v-icon>
                    </template>
                    <v-card-title class="text-subtitle-1 font-weight-bold pa-0 text-on-surface">
                      Upcoming Deadlines
                    </v-card-title>
                    <template v-slot:append>
                      <v-badge
                        v-if="upcomingDeadlinesTotal > 0"
                        :content="upcomingDeadlinesTotal"
                        color="warning"
                        floating
                        :class="xs ? 'me-2' : 'me-4'"
                      ></v-badge>
                    </template>
                  </v-card-item>
                  <v-expansion-panels
                    v-model="isDeadlinesPanelExpanded"
                    tile
                    flat
                    elevation="0"
                    color="transparent"
                    class="deadlines-panel"
                  >
                    <v-expansion-panel value="true">
                      <v-expansion-panel-title class="px-2 py-4 upcoming-panel" hide-actions>
                        <v-row align="center" no-gutters class="w-100">
                          <v-col>
                            <v-sheet
                              color="transparent"
                              class="text-body-2 d-inline-flex align-center text-truncate text-on-surface"
                            >
                              <v-icon size="small" class="me-1" color="on-surface">
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
                            class="text-caption text-medium-emphasis me-2 text-on-surface"
                          >
                            {{ isDeadlinesPanelExpanded ? 'Hide' : 'Show all' }}
                            <v-btn
                              density="comfortable"
                              :icon="
                                isDeadlinesPanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                              "
                              variant="text"
                              size="small"
                              aria-label="Toggle upcoming deadlines panel"
                            >
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text eager class="px-2 pb-4 pt-0">
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
                            class="px-2 py-2 rounded-lg mb-2 task-item upcoming"
                            exact
                            lines="two"
                            color="surface-variant"
                            base-color="on-surface"
                          >
                            <template v-slot:prepend>
                              <v-icon
                                :color="task.color || 'primary'"
                                size="32"
                                :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                              />
                            </template>
                            <v-list-item-title
                              class="text-truncate text-subtitle-2 text-on-surface"
                            >
                              {{ task.title }}
                            </v-list-item-title>
                            <v-list-item-subtitle
                              class="text-caption d-flex align-center rounded-lg bg-warning text-on-surface pl-2"
                            >
                              <v-icon
                                size="x-small"
                                class="me-1"
                                color="on-surface"
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
                              color="on-surface"
                              rounded
                              size="small"
                              :to="{ name: 'filter-and-labels' }"
                              class="d-flex align-center text-none pa-8"
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
              
              <!-- Porcentaje de completadas -->
              <v-col cols="12" md="4" :class="xs || sm ? 'pa-2' : 'pa-4'" class="d-flex flex-column align-center justify-center">
                <v-card 
                  rounded="lg"
                  variant="flat"
                  class="progress-panel"
                  color="surface"
                >
                  <v-card-text class="d-flex flex-column align-center justify-center pa-8">
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
                      class="mb-8"
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
                          'text-body-1 mb-2 font-weight-bold',
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
                          'text-body-2 font-weight-medium mb-4',
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
              
              <!-- Overdue Tasks -->
              <v-col cols="12" md="4" :class="xs || sm ? 'pa-2' : 'pa-4'">
                <v-card
                  variant="tonal"
                  rounded="lg"  
                  class="overdue-panel" 
                  :color="overdueTasksTotal > 0 ? 'error' : 'surface'"
                >
                  <v-card-item :class="xs ? 'pa-4 pb-2' : 'pa-8 pb-4'">
                    <template v-slot:prepend>
                      <v-icon color="on-surface" icon="mdi-alarm"></v-icon>
                    </template>
                    <v-card-title class="text-subtitle-1 font-weight-bold pa-0 text-on-surface">
                      Overdue Tasks</v-card-title
                    >
                    <template v-slot:append>
                      <v-badge
                        v-if="overdueTasksTotal > 0"
                        :content="overdueTasksTotal"
                        color="error"
                        floating
                        :class="xs ? 'me-2' : 'me-4'"
                      ></v-badge>
                    </template>
                  </v-card-item>
                  <v-expansion-panels
                    v-model="isOverduePanelExpanded"
                    class="mt-2 deadlines-panel"
                    tile
                    flat
                    elevation="0"
                    color="transparent"
                  >
                    <v-expansion-panel value="true">
                      <v-expansion-panel-title class="px-2 py-4 overdue-panel" hide-actions>
                        <v-row align="center" no-gutters class="w-100">
                          <v-col>
                            <v-sheet
                              color="transparent"
                              class="text-body-2 d-inline-flex align-center text-truncate text-on-surface"
                            >
                              <v-icon size="small" class="me-1" color="on-surface">
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
                            class="text-caption text-medium-emphasis me-2 text-on-surface"
                          >
                            {{ isOverduePanelExpanded ? 'Hide' : 'Show all' }}
                            <v-btn
                              density="comfortable"
                              :icon="
                                isOverduePanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                              "
                              variant="text"
                              size="small"
                              aria-label="Toggle overdue tasks panel"
                            >
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text eager class="px-2 pb-4 pt-0">
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
                            class="px-2 py-2 rounded-lg mb-2 task-item overdue"
                            exact
                            lines="two"
                            color="surface-variant"
                            base-color="on-surface"
                          >
                            <template v-slot:prepend>
                              <v-icon
                                :color="task.color || 'primary'"
                                size="32"
                                :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                              />
                            </template>
                            <v-list-item-title
                              class="text-truncate text-subtitle-2 text-on-surface"
                            >
                              {{ task.title }}
                            </v-list-item-title>
                            <v-list-item-subtitle
                              class="text-caption d-flex align-center rounded-lg bg-error text-on-surface pl-2"
                            >
                              <v-icon
                                size="x-small"
                                icon="mdi-clock-alert-outline"
                                color="on-surface"
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
                              color="on-surface"
                              rounded
                              size="small"
                              :to="{ name: 'filter-and-labels' }"
                              class="d-flex align-center text-none pa-8"
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

        <v-divider :class="xs || sm ? 'my-2' : 'my-4'" color="surface-container-high"></v-divider>
        
        <!-- Controles del calendario -->
        <v-row align="center" justify="center" class="ma-0">
          <v-col :cols="xs || sm ? 12 : 6" md="5" lg="4" xl="3" :class="xs || sm ? 'pa-2' : 'pa-4'">
            <v-select
              v-model="type"
              :items="types"
              label="View Mode"
              variant="outlined"
              density="comfortable"
              hide-details
              rounded
              color="primary"
              bg-color="surface-container"
              prepend-inner-icon="mdi-calendar-month"
              menu-icon="mdi-menu-down"
              class="font-weight-medium"
              item-title="text"
              item-value="value"
              :menu-props="{ contentClass: 'bg-surface-container-low' }"
            ></v-select>
          </v-col>

          <v-col :cols="xs || sm ? 12 : 6" md="5" lg="4" xl="3" :class="xs || sm ? 'pa-2' : 'pa-4'">
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
              bg-color="surface-container"
              prepend-inner-icon="mdi-calendar-week"
              menu-icon="mdi-menu-down"
              class="font-weight-medium"
              :menu-props="{ contentClass: 'bg-surface-container-low' }"
            ></v-select>
          </v-col>
        </v-row>

        <!-- Calendario a ancho completo -->
        <v-row justify="center" class="ma-0">
          <v-col cols="12" :class="xs || sm ? 'pa-2' : 'pa-4'">
            <v-sheet class="pa-2">
              <Suspense>
                <template #default>
                  <v-calendar
                    ref="calendar"
                    v-model="value"
                    :events="calendarEvents"
                    :view-mode="type"
                    :weekdays="getWeekdays(weekday)"
                    :class="xs ? 'calendar-xs' : ''"
                    aria-label="Tasks Calendar"
                  >
                  </v-calendar>
                </template>
                <template #fallback>
                  <v-skeleton-loader type="article" class="my-2"></v-skeleton-loader>
                </template>
              </Suspense>
            </v-sheet>
          </v-col>
        </v-row>
      </v-sheet>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.progress-percentage-transition {
  transition:
    color 0.3s,
    font-size 0.3s;
}

/* Estilos específicos para pantallas pequeñas */
.calendar-xs :deep(.v-calendar) {
  margin: 0 -8px; /* Compensar el padding interno del calendario */
}

/* Ajustes responsivos adicionales */
@media (max-width: 960px) {
  .v-sheet {
    border-radius: 8px;
  }
  
  /* Ajustes específicos para pantallas pequeñas y medianas */
  .upcoming-panel, .overdue-panel {
    height: 100%;
  }
  
  .progress-panel {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
