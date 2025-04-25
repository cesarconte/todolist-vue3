<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSubmitEditedTask } from '@/composables/forms/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/forms/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/forms/validationFormRules.js'
import { useResetForm } from '@/composables/forms/useResetForm'
import VCardTask from '@/components/tasks/VCardTask.vue'
import VActionButtons from '@/components/tasks/VActionButtons.vue'
import VTaskForm from '@/components/tasks/VTaskForm.vue'
import VEmptyState from '@/components/tasks/VEmptyState.vue'

const dataStore = useDataStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const router = useRouter()

const form = ref(null)
const isFocused = ref(false)
const searchTitle = ref('')
const searchItems = computed(() =>
  userStore.isLoggedIn ? taskStore.tasksData.map((task) => ({ title: task.title })) : []
)

const { submitEditedTask } = useSubmitEditedTask()

// Callback para restaurar el modelo reactivo de la tarea editada
const resetEditTaskFormState = () => {
  const originalTask = taskStore.tasksData.find((t) => t.id === taskStore.editedTask.id)
  if (originalTask) {
    Object.assign(taskStore.editedTask, { ...originalTask })
  } else {
    Object.assign(taskStore.editedTask, {
      projectId: '',
      title: '',
      description: '',
      label: '',
      priority: '',
      status: '',
      startDate: null,
      endDate: null,
      completed: false,
      color: null
    })
  }
}

// Reset personalizado y notificación coherente
const { reset } = useResetForm(
  form,
  'Edit Task Form has been reset',
  'info',
  'mdi-information',
  resetEditTaskFormState
)

const showAlert = ref(false)

const handleSearchClick = () => {
  if (!userStore.isLoggedIn) {
    showAlert.value = true
  }
}

// Watch para sincronizar el filtro del store con el input
watch(searchTitle, (newValue) => {
  if (typeof taskStore.setSearchTitle === 'function') {
    taskStore.setSearchTitle(newValue)
  } else {
    taskStore.state.searchTitle = newValue
  }
})

// Usa el composable para los botones
const { btnsForm } = useFormBtnActions(
  submitEditedTask,
  reset,
  () => (taskStore.dialogEditTask = false)
)

// Configure the submit button for editing a task
btnsForm[0].text = 'Update Task' // Set the text for the submit button
btnsForm[0].icon = 'mdi-pencil' // Set the icon for the submit button

const goBack = () => {
  router.back()
}

const rules = useMaxLengthRule()

// Función para verificar si hay una búsqueda activa
const hasActiveSearch = computed(() => !!taskStore.state.searchTitle)

const showSearchResults = computed(
  () => hasActiveSearch.value && taskStore.allFilteredTasks.length > 0
)

const exactTask = computed(() => {
  if (!taskStore.state.searchTitle) return null
  return taskStore.tasksData.find(
    (t) => t.title.trim().toLowerCase() === taskStore.state.searchTitle.trim().toLowerCase()
  )
})

const tasksToShow = computed(() => {
  if (exactTask.value) return [exactTask.value]
  return taskStore.allFilteredTasks
})

const { xs, sm, smAndDown, md, lg, xl } = useDisplay()

onMounted(() => {
  if (userStore.isLoggedIn && taskStore.tasksData.length === 0) {
    taskStore.subscribeToTasks()
  }
})
</script>

<template>
  <v-container fluid class="my-6">
    <v-responsive
      class="tasksByProject-container mx-auto"
      :class="xs ? 'pa-1' : ''"
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
    >
      <v-row>
        <v-col cols="12">
          <h1
            class="text-center font-weight-bold text-red-darken-2"
            :class="xs ? 'text-h5 my-4' : sm ? 'text-h4 my-6' : 'text-h4 mb-8'"
          >
            Search Tasks
          </h1>
        </v-col>
      </v-row>

      <!-- Búsqueda -->
      <v-card class="mb-8" :class="xs ? 'pa-2' : 'pa-4'" variant="outlined" rounded elevation="2">
        <v-card-title
          class="d-flex align-center justify-space-between pb-2 mb-2"
          :class="xs ? 'px-2' : 'px-4'"
        >
          <v-sheet class="search-header" :class="xs ? 'pa-1' : 'pa-2'" rounded>
            <div class="d-flex align-center">
              <v-icon
                icon="mdi-text-search"
                color="red-darken-2"
                :size="xs ? '28' : '40'"
                class="mr-1"
              ></v-icon>
              <div class="ml-0">
                <div class="text-h6 font-weight-medium" :class="xs ? 'text-subtitle-1' : ''">
                  Search Tasks
                </div>
                <div class="text-caption text-medium-emphasis mt-1 text-wrap">
                  {{ xs ? 'Find by title keywords' : 'Find tasks by title or keywords' }}
                </div>
              </div>
            </div>
          </v-sheet>
          <v-chip
            v-if="searchTitle"
            color="red-darken-2"
            size="small"
            prepend-icon="mdi-text-search-variant"
            class="font-weight-medium mx-2"
            :class="xs ? 'px-2 py-1' : ''"
          >
            Search Active
          </v-chip>
        </v-card-title>
        <v-card-subtitle
          class="text-subtitle-1 font-weight-medium py-2 text-red-accent-4 text-center mb-4"
          :class="xs ? 'px-2' : 'px-4'"
        >
          <v-icon
            icon="mdi-magnify"
            class="mr-2"
            color="red-accent-4"
            :size="xs ? 18 : 24"
          ></v-icon>
          <span :class="xs ? 'text-body-2' : ''">Search your task by title</span>
        </v-card-subtitle>
        <v-divider class="mb-4"></v-divider>
        <v-card-text class="pb-0" :class="xs ? 'px-2' : 'px-4'">
          <v-row class="mb-2">
            <v-col cols="12" md="9" lg="8" class="mx-auto d-flex align-center">
              <v-autocomplete
                v-model="searchTitle"
                :items="searchItems"
                :placeholder="userStore.isLoggedIn ? 'Search' : 'Log in to search...'"
                variant="outlined"
                rounded
                :density="xs ? 'default' : 'comfortable'"
                color="red-accent-2"
                hide-details
                :disabled="!userStore.isLoggedIn"
                @click="handleSearchClick"
                @focus="isFocused = true"
                @blur="isFocused = false"
                :prepend-inner-icon="searchTitle || isFocused ? 'mdi-magnify' : undefined"
                aria-label="Search tasks by title"
                :aria-disabled="!userStore.isLoggedIn"
                :class="xs ? 'text-body-2' : ''"
                clearable
                item-title="title"
                auto-select-first
                class="flex-grow-1"
              >
                <!-- Personalización de los items -->
                <template #item="{ props }">
                  <v-list-item v-bind="props" :class="xs ? 'px-2 py-1' : 'px-4 py-2'">
                    <template #prepend>
                      <v-icon color="black" :size="xs ? 18 : 20">mdi-magnify</v-icon>
                    </template>
                  </v-list-item>
                </template>

                <!-- Slot para "no hay resultados" -->
                <template #no-data>
                  <v-list-item class="pa-4">
                    <div class="d-flex flex-column align-center justify-center pa-2">
                      <v-icon
                        icon="mdi-magnify-close"
                        color="grey-darken-1"
                        :size="28"
                        class="mb-3"
                      ></v-icon>
                      <span class="text-subtitle-2 text-grey-darken-1 text-center">
                        No tasks match your search
                      </span>
                      <span class="text-caption text-grey text-center mt-1">
                        Try different keywords
                      </span>
                    </div>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <!-- Estado sin búsqueda activa -->
          <v-row v-if="!hasActiveSearch && userStore.isLoggedIn">
            <v-col>
              <VEmptyState
                icon="mdi-text-search"
                :icon-size="xs ? 60 : sm ? 70 : 80"
                :icon-color="xs ? 'grey-darken-1' : 'grey-lighten-1'"
                :title="xs ? 'Search for tasks' : 'Type a task title in the search box above'"
                :subtitle="xs ? 'Enter keywords above' : 'Use keywords to quickly find your tasks.'"
                img-src="/src/assets/todolist.svg"
                img-alt="Empty search illustration"
                :text-color="xs ? 'text-grey-darken-1' : 'text-grey-lighten-1'"
              />
            </v-col>
          </v-row>

          <!-- Estado sin resultados -->
          <v-row
            v-else-if="
              hasActiveSearch &&
              !taskStore.state.isLoading &&
              taskStore.allFilteredTasks.length === 0
            "
          >
            <v-col>
              <VEmptyState
                icon="mdi-magnify"
                :icon-size="xs ? 80 : sm ? 100 : 120"
                :icon-color="xs ? 'grey-darken-1' : 'grey-lighten-1'"
                :title="xs ? 'No tasks found' : 'No tasks found with the current search term'"
                :subtitle="
                  xs ? 'Try different keywords' : 'Try different keywords or check your spelling.'
                "
                img-src="/src/assets/todolist.svg"
                img-alt="No results illustration"
                :text-color="xs ? 'text-grey-darken-1' : 'text-grey-lighten-1'"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-center pt-4 pb-8 mt-4 mb-2" :class="xs ? 'px-2' : 'px-4'">
          <v-btn
            color="red-accent-4"
            variant="tonal"
            rounded
            size="large"
            prepend-icon="mdi-close-circle"
            :class="xs ? 'px-2' : 'px-8'"
            :block="xs"
            class="text-none text-button"
            @click="searchTitle = ''"
            :disabled="!searchTitle"
            aria-label="Clear search input"
          >
            <span :class="xs ? 'text-body-2' : ''">Clear Search</span>
            <v-tooltip activator="parent" location="bottom">Clear the search box</v-tooltip>
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Alertas -->
      <v-alert
        v-if="taskStore.error"
        type="error"
        dense
        outlined
        closable
        height="4rem"
        width="32rem"
        class="mt-8 mx-auto d-flex flex-wrap justify-center"
        aria-live="polite"
      >
        {{ error }}
      </v-alert>

      <v-alert
        v-model="showAlert"
        type="info"
        dense
        outlined
        closable
        height="4rem"
        :width="xs ? '90%' : '32rem'"
        class="alert mt-8"
        aria-live="polite"
      >
        <span>
          {{ xs ? 'Please, log in...' : 'Please, log in to use the search feature' }}
        </span>
        <v-btn
          icon
          class="ml-2"
          variant="plain"
          @click="$router.push('/login')"
          aria-label="Log in"
        >
          <v-icon>mdi-account-arrow-right-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            <span>Log in to unlock search option</span>
          </v-tooltip>
        </v-btn>
      </v-alert>

      <!-- Resultados de búsqueda -->
      <v-row
        class="tasks d-flex flex-wrap align-items-center justify-content-center"
        v-if="showSearchResults"
      >
        <template v-if="taskStore.state.isLoading">
          <v-col cols="12" class="d-flex justify-center align-center">
            <v-skeleton-loader
              type="card"
              :class="xs ? 'my-4' : 'my-8'"
              :width="xs ? '95%' : sm ? '90%' : '85%'"
            />
          </v-col>
        </template>
        <template v-else>
          <v-col
            v-for="task in tasksToShow"
            :key="task.id"
            :task="task"
            :value="task"
            cols="12"
            sm="11"
            md="10"
            lg="9"
            xl="8"
            :class="xs ? 'mx-auto my-2' : 'mx-auto my-4'"
          >
            <Suspense>
              <template #default>
                <VCardTask
                  v-if="task"
                  :key="task.id"
                  :title="task.title"
                  :id="task.id"
                  :description="task.description"
                  :label="task.label"
                  :project="task.project"
                  :priority="task.priority"
                  :status="task.status"
                  :startDate="task.startDate"
                  :endDate="task.endDate"
                  :createdAt="task.createdAt"
                  :completed="task.completed"
                  :color="task.color ? task.color : 'default'"
                  :projectId="task.projectId"
                  :startDateHour="task.startDateHour"
                  :endDateHour="task.endDateHour"
                  elevation="1"
                  @edit-task="(projectId, taskId) => taskStore.editTask(taskId)"
                  @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
                  @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
                  :aria-label="`Task card: ${task.title}`"
                />
              </template>
              <template #fallback>
                <div class="fallback" role="status" aria-live="polite">
                  <v-progress-circular
                    indeterminate
                    color="red-darken-2"
                    :size="40"
                    class="mr-2"
                  ></v-progress-circular>
                  Loading...
                </div>
              </template>
            </Suspense>
          </v-col>
        </template>
        <v-col
          v-if="taskStore.allFilteredTasks.length === 0 && searchTitle"
          cols="12"
          sm="11"
          md="10"
          lg="12"
          xl="12"
          class="mx-auto"
        >
          <v-alert
            type="info"
            density="comfortable"
            variant="outlined"
            closable
            class="text-center"
            :class="xs ? 'text-body-2 my-3' : 'text-subtitle-1 my-4'"
            color="red-darken-2"
            aria-live="polite"
            role="alert"
          >
            <span>No tasks found for the search term.</span>
          </v-alert>
        </v-col>
      </v-row>
      <v-row v-if="showSearchResults">
        <v-col cols="12" :class="xs ? 'd-flex justify-center mt-4' : 'd-flex justify-end mt-8'">
          <v-btn
            @click="goBack"
            color="red-darken-2"
            variant="flat"
            rounded
            :size="xs ? 'default' : 'large'"
            :block="xs ? true : false"
            prepend-icon="mdi-chevron-left"
            :class="xs ? 'px-4 py-2' : 'px-8'"
            class="text-none text-button"
            aria-label="Go back to previous page"
          >
            Back
          </v-btn>
        </v-col>
      </v-row>

      <!-- Diálogo de edición -->
      <v-dialog
        v-model="taskStore.dialogEditTask"
        :max-width="xs ? '100%' : sm ? '90%' : md ? '600px' : '600px'"
        class="dialog dialog-edit-task"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`edit-task-dialog-title-${taskStore.editedTask?.id}`"
      >
        <v-card
          class="card card-edit-task"
          :class="xs ? 'pa-2' : 'pa-4'"
          variant="elevated"
          elevation="3"
        >
          <v-card-title
            class="card-title card-title-edit-task"
            :class="xs ? 'text-subtitle-1 py-2' : 'text-h6 py-3'"
            :id="`edit-task-dialog-title-${taskStore.editedTask?.id}`"
          >
            <span>Edit task: {{ taskStore.editedTask?.title }}</span>
          </v-card-title>
          <v-card-text :class="xs ? 'px-1 py-2' : ''">
            <VTaskForm
              v-model="taskStore.editedTask"
              :projects="projectStore.projects"
              :labels="dataStore.labels"
              :priorities="dataStore.priorities"
              :statuses="dataStore.statuses"
              :rules="rules"
              ref="form"
              @submit="submitEditedTask"
            ></VTaskForm>
          </v-card-text>
          <v-card-actions
            :class="
              smAndDown
                ? 'd-flex flex-column align-center py-2 gap-3'
                : 'd-flex flex-wrap justify-space-around py-3'
            "
          >
            <VActionButtons :buttons="btnsForm" />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.alert {
  position: fixed;
  top: 37%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tasks {
  position: relative;
  transition: opacity 0.3s ease;
  min-height: 200px;
}

.fallback {
  min-height: 150px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 16px;
  padding: 24px;
  font-size: 16px;
}

.empty-icon {
  opacity: 0.8;
  transform: translateY(-5px);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
}

:deep(.v-card-title) {
  line-height: 1.5;
}
</style>
