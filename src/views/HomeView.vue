<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import useLabelIcons from '@/composables/useLabelIcons.js'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useDisplay } from 'vuetify'
import { formatDate } from '@/utils/dateFormat'
import { combineDateTime } from '@/utils/taskUtils'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()
const { labelIcons } = useLabelIcons()

// Ref variables for the calendar
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

// Computed variables for the calendar
const calendarEvents = computed(() => {
  // Ordenar por endDate y endDateHour ascendente
  return (taskStore.tasksData || [])
    .slice() // Copia para no mutar el store
    .sort((a, b) => {
      // Combina fecha y hora para comparar correctamente
      const aDue = combineDateTime(a.endDate, a.endDateHour)
      const bDue = combineDateTime(b.endDate, b.endDateHour)
      return aDue - bDue
    })
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

// Computed properties for dashboard statistics
const pendingTasks = computed(() => {
  return (taskStore.tasksData || []).filter((task) => !task.completed)
})

const pendingTasksCount = computed(() => pendingTasks.value.length)

const completedTasksCount = computed(() => {
  return (taskStore.tasksData || []).filter((task) => task.completed).length
})

const totalTasks = computed(() => taskStore.tasksData?.length || 0)

const completionPercentage = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasksCount.value / totalTasks.value) * 100)
})

// Get upcoming deadlines (all pending tasks with future deadlines, sorted by date and hour)
const upcomingDeadlines = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => {
      if (!task.endDate) return false
      const taskDue = combineDateTime(task.endDate, task.endDateHour)
      return taskDue >= now
    })
    .sort((a, b) => {
      const aDue = combineDateTime(a.endDate, a.endDateHour)
      const bDue = combineDateTime(b.endDate, b.endDateHour)
      return aDue - bDue
    })
    .slice(0, 3) // Mostrar solo las primeras 3 tareas
})

// Get total upcoming deadlines (all pending tasks with future deadlines, sin límite)
const upcomingDeadlinesTotal = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter((task) => {
    if (!task.endDate) return false
    const taskDue = combineDateTime(task.endDate, task.endDateHour)
    return taskDue >= now
  }).length
})

// Control the expansion state of the deadlines panel
const isDeadlinesPanelExpanded = ref(false)

// Check if user has overdue tasks (pending, con fecha+hora pasada)
const overdueTasks = computed(() => {
  const now = new Date()
  return pendingTasks.value
    .filter((task) => {
      if (!task.endDate) return false
      const taskDue = combineDateTime(task.endDate, task.endDateHour)
      return taskDue < now
    })
    .sort((a, b) => {
      const aDue = combineDateTime(a.endDate, a.endDateHour)
      const bDue = combineDateTime(b.endDate, b.endDateHour)
      return aDue - bDue
    })
    .slice(0, 3) // Mostrar solo las primeras 3 tareas
})

const overdueTasksCount = computed(() => overdueTasks.value.length)

// Get total overdue tasks (all pending tasks with past deadlines, sin límite)
const overdueTasksTotal = computed(() => {
  const now = new Date()
  return pendingTasks.value.filter((task) => {
    if (!task.endDate) return false
    const taskDue = combineDateTime(task.endDate, task.endDateHour)
    return taskDue < now
  }).length
})

// Control the expansion state of the overdue tasks panel
const isOverduePanelExpanded = ref(false)

// Format date for display
const formatDisplayDate = (date) => {
  if (!date) return 'No date'
  return formatDate(date, 'MMM DD, YYYY')
}

// Función para garantizar colores accesibles con contraste adecuado según WCAG 2.1
// Respetando los colores originales de Firestore
const getAccessibleColor = (color, isCompleted) => {
  if (isCompleted) return 'grey-darken-1' // Mantener gris para tareas completadas

  // Todos los proyectos y tareas tienen un color asignado desde Firestore
  return color // Mantener el color original de la tarea/proyecto
}

// Helper function to get the weekdays array from the selected title
const getWeekdays = (title) => {
  if (!title) return [0, 1, 2, 3, 4, 5, 6] // Valor predeterminado si no hay título
  const found = weekdays.value.find((item) => item.title === title)
  return found ? found.value : [0, 1, 2, 3, 4, 5, 6] // Valor predeterminado si no encuentra coincidencia
}

// Función para obtener mensajes motivacionales según el porcentaje de tareas completadas
const getMotivationalMessage = (percentage) => {
  const color = getMotivationalColor(percentage)
  let message = ''
  if (percentage === 100) message = 'All tasks done!'
  else if (percentage >= 90) message = 'Almost there!'
  else if (percentage >= 75) message = 'Great progress!'
  else if (percentage >= 50) message = 'Halfway there!'
  else if (percentage >= 25) message = 'Good start!'
  else if (percentage > 0) message = 'Keep going!'
  else message = 'Start your first task!'
  return { message, color }
}

// Helper to get icon and color for motivational message
const getMotivationalIcon = (percentage) => {
  if (percentage === 100)
    return { icon: 'mdi-trophy', color: getMotivationalColor(percentage), size: 28 }
  if (percentage >= 90)
    return { icon: 'mdi-star-circle', color: getMotivationalColor(percentage), size: 24 }
  if (percentage >= 75)
    return { icon: 'mdi-star-circle', color: getMotivationalColor(percentage), size: 24 }
  if (percentage >= 50)
    return { icon: 'mdi-fire', color: getMotivationalColor(percentage), size: 24 }
  if (percentage >= 25)
    return { icon: 'mdi-fire', color: getMotivationalColor(percentage), size: 24 }
  if (percentage > 0)
    return { icon: 'mdi-alert-circle', color: getMotivationalColor(percentage), size: 24 }
  return { icon: 'mdi-flag-outline', color: getMotivationalColor(percentage), size: 24 }
}

// Helper to get color for progress circle based on completion percentage
const getMotivationalColor = (percentage) => {
  if (percentage === 100) return 'green-darken-3' // #388e3c, contraste ≈ 4.53:1
  if (percentage >= 90) return 'light-green-darken-2' // #689f38, contraste ≈ 3.17:1
  if (percentage >= 75) return 'amber-darken-4' // #F9A825, contraste ≈ 1.97:1
  if (percentage >= 50) return 'orange-darken-4' // #E65100, contraste ≈ 3.78:1
  if (percentage >= 25) return 'deep-orange-darken-4' // #BF360C, contraste ≈ 5.6:1
  if (percentage > 0) return 'red-darken-4' // #B71C1C, contraste ≈ 6.57:1
  return 'grey-darken-3' // #424242, contraste ≈ 8.59:1
}

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

const { xs, sm, md, lg, xl, mobile } = useDisplay()
</script>

<template>
  <v-container class="pa-4 pa-sm-6">
    <v-responsive
      class="mx-auto"
      :max-width="xs ? '100%' : sm ? '95%' : md ? '85%' : lg ? '80%' : xl ? '75%' : '70%'"
    >
      <v-card flat :elevation="4" class="rounded-lg pa-8" color="background">
        <v-card-title class="text-center font-weight-bold mb-8">
          <span class="text-red-darken-2" :class="xs ? 'text-h4' : mobile ? 'text-h3' : 'text-h2'">
            Vuetify Todolist
          </span>
        </v-card-title>

        <v-card-text>
          <!-- Panel estadístico -->
          <v-expand-transition>
            <v-sheet
              v-if="userStore.isLoggedIn && totalTasks > 0"
              rounded="lg"
              class="mb-8 pa-4 bg-grey-lighten-4"
              border
            >
              <v-row align="center" class="px-2">
                <!-- Upcoming Deadlines: izquierda -->
                <v-col :cols="xs ? 12 : sm ? 4 : 4" class="mb-8">
                  <v-card
                    flat
                    rounded="lg"
                    class="stat-panel-card"
                    :class="upcomingDeadlines.length > 0 ? 'bg-yellow-lighten-5' : ''"
                  >
                    <v-card-item class="pa-3 pb-1">
                      <template v-slot:prepend>
                        <v-icon
                          :color="
                            upcomingDeadlines.length > 0 ? 'yellow-darken-4' : 'grey-darken-3'
                          "
                          icon="mdi-clock-alert"
                        ></v-icon>
                      </template>
                      <v-card-title class="text-subtitle-1 font-weight-bold pa-0"
                        >Upcoming Deadlines</v-card-title
                      >
                      <template v-slot:append>
                        <v-badge
                          v-if="upcomingDeadlinesTotal > 0"
                          :content="upcomingDeadlinesTotal"
                          color="yellow-darken-4"
                          floating
                          class="me-4"
                        ></v-badge>
                      </template>
                    </v-card-item>
                    <v-expansion-panels
                      v-model="isDeadlinesPanelExpanded"
                      variant="accordion"
                      class="mt-2 deadlines-panel"
                    >
                      <v-expansion-panel value="true" class="border-0">
                        <v-expansion-panel-title class="px-3 py-2 upcoming-panel" hide-actions>
                          <v-row align="center" no-gutters class="w-100">
                            <v-col>
                              <v-sheet
                                color="transparent"
                                class="text-body-2 d-inline-flex align-center"
                              >
                                <v-icon
                                  size="small"
                                  class="me-1"
                                  :color="
                                    upcomingDeadlines.length > 0
                                      ? 'yellow-darken-4'
                                      : 'grey-darken-3'
                                  "
                                >
                                  {{
                                    upcomingDeadlines.length > 0
                                      ? 'mdi-calendar-clock'
                                      : 'mdi-calendar-check'
                                  }}
                                </v-icon>
                                <span class="text-truncate d-inline-block" style="max-width: 220px">
                                  {{
                                    upcomingDeadlines.length > 0
                                      ? `Next: ${upcomingDeadlines[0]?.title}`
                                      : 'No upcoming deadlines'
                                  }}
                                </span>
                              </v-sheet>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col cols="auto" class="text-caption text-medium-emphasis me-2">
                              {{ isDeadlinesPanelExpanded ? 'Hide' : 'Show all' }}
                              <v-btn
                                density="comfortable"
                                :icon="
                                  isDeadlinesPanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                                "
                                variant="text"
                                size="small"
                                :color="
                                  upcomingDeadlines.length > 0 ? 'yellow-darken-4' : 'grey-darken-3'
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
                            class="bg-transparent px-0"
                          >
                            <v-list-item
                              v-for="task in upcomingDeadlines"
                              :key="task.id"
                              :to="{ name: 'task-detail', params: { taskId: task.id } }"
                              class="px-2 py-1 rounded-lg mb-1 bg-grey-lighten-5 task-item upcoming"
                              exact
                              lines="two"
                            >
                              <template v-slot:prepend>
                                <v-icon
                                  :color="task.color || 'primary'"
                                  size="32"
                                  class="me-2 bg-grey-lighten-3 rounded-circle pa-1"
                                  :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                                />
                              </template>
                              <v-list-item-title class="text-truncate text-subtitle-2">
                                {{ task.title }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption d-flex align-center">
                                <v-icon
                                  size="x-small"
                                  class="me-1"
                                  :color="
                                    upcomingDeadlines.length > 0
                                      ? 'yellow-darken-4'
                                      : 'grey-darken-3'
                                  "
                                  icon="mdi-clock-alert-outline"
                                ></v-icon>
                                {{ formatDisplayDate(task.endDate) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                          <v-sheet v-else class="text-caption text-center pa-2">
                            No upcoming deadlines
                          </v-sheet>
                          <v-row justify="end" no-gutters class="mt-2">
                            <v-col cols="auto">
                              <v-btn
                                density="comfortable"
                                variant="text"
                                :color="
                                  upcomingDeadlines.length > 0 ? 'yellow-darken-4' : 'grey-darken-3'
                                "
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
                  class="d-flex flex-column align-center justify-center mb-8"
                >
                  <v-card
                    flat
                    rounded="lg"
                    class="stat-panel-card"
                    :class="completionPercentage === 100 ? 'bg-green-lighten-5' : ''"
                  >
                    <v-card-text class="d-flex flex-column align-center justify-center pa-6">
                      <v-fade-transition>
                        <v-icon
                          v-if="completionPercentage === 100"
                          size="64"
                          :color="getMotivationalColor(completionPercentage)"
                          class="mb-2 animate__animated animate__bounceIn"
                          >mdi-check-circle</v-icon
                        >
                      </v-fade-transition>
                      <v-progress-circular
                        :model-value="completionPercentage"
                        :color="getMotivationalColor(completionPercentage)"
                        :width="6"
                        :size="100"
                        class="mb-4"
                        bg-color="grey-lighten-4"
                        :indeterminate="false"
                        :rotate="-90"
                        transition="scale-transition"
                      >
                        <span
                          :class="[
                            'font-weight-bold',
                            'text-h4',
                            `text-${getMotivationalColor(completionPercentage)}`,
                            'progress-percentage-transition'
                          ]"
                        >
                          {{ completionPercentage }}%
                        </span>
                      </v-progress-circular>

                      <v-card-text class="text-center pa-0">
                        <div
                          class="text-body-1 mb-1 font-weight-bold"
                          :class="`text-${getMotivationalColor(completionPercentage)}`"
                        >
                          <span class="font-weight-bold">{{ completedTasksCount }}</span>
                          <span class="font-weight-bold"> / </span>
                          <span class="font-weight-bold">{{ totalTasks }}</span>
                          <span class="font-weight-bold"> Tasks Completed</span>
                        </div>
                        <div
                          class="text-body-2 font-weight-medium mb-3"
                          :class="`text-${getMotivationalColor(completionPercentage)}`"
                        >
                          {{ pendingTasksCount }} remaining
                        </div>
                        <v-fade-transition mode="out-in">
                          <div
                            key="motivational-{{ completionPercentage }}"
                            class="text-h6 font-weight-bold d-flex align-center justify-center mt-2"
                            :class="`text-${getMotivationalColor(completionPercentage)}`"
                          >
                            <v-icon
                              :icon="getMotivationalIcon(completionPercentage).icon"
                              :color="getMotivationalIcon(completionPercentage).color"
                              :size="getMotivationalIcon(completionPercentage).size"
                              class="me-2"
                            ></v-icon>
                            {{ getMotivationalMessage(completionPercentage).message }}
                          </div>
                        </v-fade-transition>
                      </v-card-text>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Overdue Tasks: derecha -->
                <v-col cols="12" sm="4" md="4" class="mb-8">
                  <v-card
                    flat
                    rounded="lg"
                    class="stat-panel-card"
                    :class="overdueTasksCount > 0 ? 'bg-red-lighten-5' : ''"
                  >
                    <v-card-item class="pa-3 pb-1">
                      <template v-slot:prepend>
                        <v-icon
                          :color="overdueTasksCount > 0 ? 'red-darken-2' : 'grey-darken-3'"
                          icon="mdi-alarm"
                        ></v-icon>
                      </template>
                      <v-card-title class="text-subtitle-1 font-weight-bold pa-0"
                        >Overdue Tasks</v-card-title
                      >
                      <template v-slot:append>
                        <v-badge
                          v-if="overdueTasksTotal > 0"
                          :content="overdueTasksTotal"
                          color="red-darken-2"
                          floating
                          class="me-4"
                        ></v-badge>
                      </template>
                    </v-card-item>
                    <v-expansion-panels
                      v-model="isOverduePanelExpanded"
                      variant="accordion"
                      class="mt-2 deadlines-panel"
                    >
                      <v-expansion-panel value="true" class="border-0">
                        <v-expansion-panel-title class="px-3 py-2 overdue-panel" hide-actions>
                          <v-row align="center" no-gutters class="w-100">
                            <v-col>
                              <v-sheet
                                color="transparent"
                                class="text-body-2 d-inline-flex align-center text-truncate"
                              >
                                <v-icon
                                  size="small"
                                  class="me-1"
                                  :color="overdueTasksCount > 0 ? 'red-darken-2' : 'grey-darken-3'"
                                >
                                  {{
                                    overdueTasksCount > 0 ? 'mdi-alert-circle' : 'mdi-check-circle'
                                  }}
                                </v-icon>
                                <span class="text-truncate d-inline-block" style="max-width: 220px">
                                  {{
                                    overdueTasksCount > 0
                                      ? `${overdueTasksCount} task${overdueTasksCount > 1 ? 's' : ''} past deadline`
                                      : 'All tasks are on schedule'
                                  }}
                                </span>
                              </v-sheet>
                            </v-col>
                            <v-spacer></v-spacer>
                            <v-col cols="auto" class="text-caption text-medium-emphasis me-2">
                              {{ isOverduePanelExpanded ? 'Hide' : 'Show all' }}
                              <v-btn
                                density="comfortable"
                                :icon="
                                  isOverduePanelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                                "
                                variant="text"
                                size="small"
                                :color="overdueTasksCount > 0 ? 'red-darken-2' : 'grey-darken-3'"
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
                            class="bg-transparent px-0"
                          >
                            <v-list-item
                              v-for="task in overdueTasks"
                              :key="task.id"
                              :to="{ name: 'task-detail', params: { taskId: task.id } }"
                              class="px-2 py-1 rounded-lg mb-1 bg-grey-lighten-5 task-item overdue"
                              exact
                              lines="two"
                            >
                              <template v-slot:prepend>
                                <v-icon
                                  :color="task.color || 'primary'"
                                  size="32"
                                  class="me-2 bg-grey-lighten-3 rounded-circle pa-1"
                                  :icon="labelIcons[task.label] || 'mdi-calendar-alert'"
                                />
                              </template>
                              <v-list-item-title class="text-truncate text-subtitle-2">
                                {{ task.title }}
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-caption d-flex align-center">
                                <v-icon
                                  size="x-small"
                                  class="me-1"
                                  icon="mdi-clock-alert-outline"
                                  :color="overdueTasksCount > 0 ? 'red-darken-2' : 'grey-darken-3'"
                                ></v-icon>
                                Due: {{ formatDisplayDate(task.endDate) }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                          <v-sheet v-else class="text-caption text-center pa-2">
                            All tasks are on schedule!
                          </v-sheet>
                          <v-row justify="end" no-gutters class="mt-2">
                            <v-col cols="auto">
                              <v-btn
                                density="comfortable"
                                variant="text"
                                :color="overdueTasksCount > 0 ? 'red-darken-2' : 'grey-darken-3'"
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
                bg-color="grey-lighten-4"
                hide-details
                rounded
                color="red-darken-2"
                prepend-inner-icon="mdi-calendar-month"
                menu-icon="mdi-menu-down"
                class="font-weight-medium"
                item-title="text"
                item-value="value"
                :menu-props="{ contentClass: 'bg-grey-lighten-4' }"
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
                bg-color="grey-lighten-4"
                hide-details
                rounded
                color="red-darken-2"
                prepend-inner-icon="mdi-calendar-week"
                menu-icon="mdi-menu-down"
                class="font-weight-medium"
                :menu-props="{ contentClass: 'bg-grey-lighten-4' }"
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
                  >
                    <template #event="{ event }">
                      <v-card
                        :key="event.id"
                        flat
                        :color="event.completed ? 'grey-lighten-5' : 'grey-lighten-3'"
                        :class="[
                          'ma-1 pa-2 rounded cursor-pointer transition-swing focus-visible-outline'
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
                                'text-decoration-line-through text-grey-lighten-1': event.completed
                              }"
                            >
                              {{ event.title }}
                            </span>
                          </v-col>
                          <v-col cols="3" class="text-right">
                            <v-icon
                              :color="getAccessibleColor(event.color, event.completed)"
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
/* Animación y transición más sutil para los paneles del Panel estadístico */
.stat-panel-card {
  transition:
    box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: box-shadow, transform, background-color;
}
.stat-panel-card:hover {
  box-shadow:
    0 4px 16px rgba(60, 60, 60, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px) scale(1.0125);
  background-color: #fafafa;
  z-index: 2;
}

.stat-panel-card:focus-visible {
  outline: 2px solid var(--v-theme-primary, #1976d2);
  outline-offset: 2px;
}

.progress-percentage-transition {
  transition:
    color 0.3s,
    font-size 0.3s;
}
</style>
