<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useSettings } from '@/composables/settings/useSettings.js'
import useLabelIcons from '@/composables/ui/useLabelIcons.js'
import { useFilteredTasks } from '@/composables/tasks/useFilteredTasks.js'
import { useDisplay } from 'vuetify'

// Components
import DashboardStats from '@/components/home/DashboardStats.vue'
import CalendarHeader from '@/components/calendar/CalendarHeader.vue'
import TaskCalendar from '@/components/calendar/TaskCalendar.vue'
import TaskList from '@/components/tasks/TaskList.vue'

// Stores
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()

// Settings
const { displaySettings } = useSettings()

// Router
const router = useRouter()

// Composables
const { labelIcons } = useLabelIcons()
const { xs, sm, name } = useDisplay()
const { sortedTasks: filteredTasks } = useFilteredTasks(computed(() => taskStore.tasksData))

// --- State Management ---
const currentCalendarDate = ref(new Date())
const currentCalendarType = ref('month')
const currentWeekdayMode = ref('Sun - Sat')

// --- Task Actions ---
const handleViewTask = (taskId) => {
  router.push({ name: 'task-detail', params: { taskId } })
}

// --- Responsive Layout Computed Properties ---
const responsiveContainerWidth = computed(() => {
  switch (name.value) {
    case 'xs':
      return '100%'
    case 'sm':
      return 600
    case 'md':
      return 960
    case 'lg':
      return 1280
    default:
      return 1440
  }
})

const pageTitleClass = computed(() => {
  if (xs.value) return 'text-h5 my-4 mb-2'
  if (sm.value) return 'text-h4 my-6'
  return 'text-h3 my-8'
})

const mainContainerClass = computed(() => (xs.value ? 'pa-2' : 'pa-4'))

// --- View Mode ---
const currentView = computed(() => displaySettings.defaultView)

// --- Calendar Logic ---
const mappedCalendarEvents = computed(() => {
  return filteredTasks.value
    .slice()
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .map((task) => {
      return {
        id: task.id,
        name: task.title,
        start: task.startDate,
        end: task.endDate,
        endDateHour: task.endDateHour,
        allDay: !task.startDateHour && !task.endDateHour,
        color: task.color,
        completed: task.completed,
        projectId: task.projectId
      }
    })
})

// --- Calendar Navigation Actions ---
const navigateToPreviousMonth = () => {
  const date = new Date(currentCalendarDate.value)
  date.setMonth(date.getMonth() - 1)
  currentCalendarDate.value = date
}

const navigateToNextMonth = () => {
  const date = new Date(currentCalendarDate.value)
  date.setMonth(date.getMonth() + 1)
  currentCalendarDate.value = date
}

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
  async (loggedIn) => {
    if (loggedIn) {
      await taskStore.loadAllUserTasks()
      notificationsStore.scheduleNotifications()
    } else {
      taskStore.clearTaskStore()
    }
  },
  { immediate: true }
)

watch(
  () => userStore.userId,
  (newId) => {
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

      <!-- Dashboard Statistics -->
      <DashboardStats :tasks="filteredTasks" :label-icons="labelIcons" />

      <!-- Main Content: Calendar or List View -->
      <template v-if="currentView === 'calendar'">
        <!-- Calendar Header -->
        <CalendarHeader
          v-model:current-date="currentCalendarDate"
          v-model:current-view="currentCalendarType"
          v-model:weekday-mode="currentWeekdayMode"
          @go-to-today="goToToday"
          @prev-year="navigateToPreviousYear"
          @prev-month="navigateToPreviousMonth"
          @next-month="navigateToNextMonth"
          @next-year="navigateToNextYear"
        />

        <!-- Main Calendar Grid -->
        <TaskCalendar
          v-model="currentCalendarDate"
          :events="mappedCalendarEvents"
          :type="currentCalendarType"
          :weekdays="[0, 1, 2, 3, 4, 5, 6]"
        />
      </template>

      <!-- List View -->
      <template v-else>
        <TaskList
          :tasks="filteredTasks"
          empty-icon="mdi-checkbox-marked-circle-auto-outline"
          empty-title="All caught up!"
          empty-subtitle="No tasks to display"
          @view-task="handleViewTask"
        />
      </template>
    </v-responsive>
  </v-container>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}
main {
  min-height: 80vh;
}
</style>
