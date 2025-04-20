<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUserStore } from '@/stores/userStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import useLabelIcons from '@/composables/useLabelIcons.js'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()
const { labelIcons } = useLabelIcons()

// Ref variables for the calendar
const type = ref('month')
const types = ref(['month', 'week', 'day'])
const weekday = ref('Sun - Sat')
const weekdays = ref([
  { title: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
  { title: 'Mon - Fri', value: [1, 2, 3, 4, 5] }
])
const value = ref([new Date()])

// Computed variables for the calendar
const calendarEvents = computed(() => {
  // Usa tasksData (que siempre es un array) en vez de tasks
  return (taskStore.tasksData || []).map((task) => ({
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

// Helper function to get the weekdays array from the selected title
const getWeekdays = (title) => {
  if (title) return weekdays.value.find((item) => item.title === title).value
}

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
  <v-container fluid class="my-6">
    <v-responsive
      class="mx-auto"
      :max-width="xs ? '100vw' : sm ? '80vw' : md ? '70vw' : lg ? '65vw' : xl ? '60vw' : ''"
    >
      <v-row justify="center">
        <v-col
          cols="12"
          :class="{
            'col-xs-12': xs,
            'col-sm-11': sm,
            'col-md-9': md,
            'col-lg-8': lg,
            'col-xl-7': xl
          }"
        >
          <h1
            class="text-center font-weight-bold mb-4 text-red-darken-2"
            :class="xs ? 'text-h4' : mobile ? 'text-h3' : 'text-h2'"
          >
            Vuetify Todolist
          </h1>
          <div class="d-flex" :class="xs ? 'flex-column' : ''">
            <v-select
              v-model="type"
              :items="types"
              class="ma-2"
              label="View Mode"
              variant="outlined"
              dense
              hide-details
              rounded="pill"
              color="red-accent-2"
            ></v-select>
            <v-select
              v-model="weekday"
              :items="weekdays.map((item) => item.title)"
              class="ma-2"
              label="Weekdays"
              variant="outlined"
              dense
              hide-details
              rounded="pill"
              color="red-accent-2"
            ></v-select>
          </div>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col cols="12">
          <Suspense>
            <template #default>
              <v-calendar
                ref="calendar"
                v-model="value"
                :events="calendarEvents"
                :view-mode="type"
                :weekdays="getWeekdays(weekday)"
                color="primary"
              >
                <template #event="{ event }">
                  <v-row
                    :key="event.id"
                    class="mx-1 mb-1 mt-1 bg-grey-lighten-3 cursor-pointer flex-nowrap text-truncate"
                    @click="
                      () => router.push({ name: 'task-detail', params: { taskId: event.id } })
                    "
                  >
                    <v-col cols="9" class="pa-1 text-truncate">
                      <template v-if="event.completed">
                        <p class="text-decoration-line-through text-grey-lighten-1 flex-grow-1">
                          {{ event.title }}
                        </p>
                      </template>
                      <template v-else>
                        <p class="flex-grow-1">
                          {{ event.title }}
                        </p>
                      </template>
                    </v-col>
                    <v-col cols="3" class="pa-1 text-right text-truncate">
                      <v-icon class="icon align-self-center" size="20" :color="event.color">
                        {{
                          event.completed
                            ? 'mdi-check-circle'
                            : labelIcons[event.label] || 'mdi-question'
                        }}
                      </v-icon>
                      <v-tooltip activator="parent" location="right" class="tooltip">
                        {{ event.completed ? 'Task completed' : 'Task ' + event.label }}
                      </v-tooltip>
                    </v-col>
                  </v-row>
                </template>
              </v-calendar>
            </template>
            <template #fallback>
              <div class="fallback">Loading...</div>
            </template>
          </Suspense>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>
