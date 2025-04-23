<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useResetForm } from '@/composables/useResetForm'
import VCardTask from '@/components/VCardTask.vue'
import VActionButtons from '@/components/VActionButtons.vue'
import VTaskForm from '@/components/VTaskForm.vue'

const dataStore = useDataStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const router = useRouter()

const form = ref(null)
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

const searchTitle = computed({
  get: () => taskStore.state.searchTitle,
  set: (val) => taskStore.setSearchTitle(val)
})

const showAlert = ref(false)

const handleSearchClick = () => {
  if (!userStore.isLoggedIn) {
    showAlert.value = true
  }
}

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

const { xs, sm, smAndDown, smAndUp, md, lg, xl } = useDisplay()

onMounted(() => {})

onUnmounted(() => {})
</script>

<template>
  <v-container fluid class="my-6">
    <v-responsive
      class="tasksByProject-container mx-auto"
      :class="xs ? 'pa-1' : ''"
      :max-width="xs ? '100vw' : sm ? '80vw' : md ? '70vw' : lg ? '65vw' : xl ? '60vw' : ''"
    >
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 font-weight-bold text-red-darken-2 text-center mb-8">Search Tasks</h2>
        </v-col>
      </v-row>

      <!-- Búsqueda -->
      <v-card class="mb-8 pa-4" variant="outlined" rounded elevation="2">
        <v-card-title class="d-flex align-center justify-space-between pb-2">
          <div class="d-flex align-center">
            <v-icon icon="mdi-clipboard-search-outline" class="mr-2" color="red-darken-2"></v-icon>
            <span class="text-subtitle-1 font-weight-medium">Search Tasks</span>
          </div>
          <v-chip
            v-if="searchTitle"
            color="red-darken-2"
            size="small"
            prepend-icon="mdi-text-search-variant"
            class="font-weight-medium mx-2"
          >
            Search Active
          </v-chip>
        </v-card-title>
        <v-card-subtitle
          class="text-subtitle-1 font-weight-medium py-2 text-red-accent-4 text-center mb-2"
        >
          <v-icon icon="mdi-magnify" class="mr-2" color="red-accent-4"></v-icon>
          Search your task by title
        </v-card-subtitle>
        <v-divider class="mb-3"></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="9" lg="8" class="mx-auto">
              <v-text-field
                v-model="searchTitle"
                :placeholder="userStore.isLoggedIn ? 'Enter task title...' : 'Log in to search...'"
                label="Search by title"
                clearable
                density="comfortable"
                rounded
                color="red-accent-4"
                hide-details
                variant="outlined"
                :disabled="!userStore.isLoggedIn"
                @click="handleSearchClick"
                prepend-inner-icon="mdi-magnify"
              />
            </v-col>
          </v-row>

          <!-- Estado sin búsqueda activa -->
          <v-row v-if="!hasActiveSearch && userStore.isLoggedIn">
            <v-col class="text-center py-8 d-flex flex-column align-center">
              <v-icon size="64" color="grey-lighten-1" class="empty-icon mb-4"
                >mdi-text-search</v-icon
              >
              <p class="text-h6 font-weight-medium text-grey-lighten-1 mt-4">
                Type a task title in the search box above
              </p>
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
            <v-col class="text-center py-8 d-flex flex-column align-center">
              <v-icon size="128" color="grey-lighten-1" class="empty-icon mb-4">mdi-magnify</v-icon>
              <p class="text-h6 font-weight-medium text-grey-lighten-1 mt-4">
                No tasks found with the current search term
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-center pt-4 pb-8 mt-8">
          <v-btn
            color="red-accent-4"
            variant="tonal"
            rounded
            size="large"
            prepend-icon="mdi-refresh"
            :class="xs ? '' : 'px-8'"
            :block="xs"
            class="text-none text-button"
            @click="searchTitle = ''"
            :disabled="!searchTitle"
            aria-label="Clear search input"
          >
            Clear Search
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
      <v-row v-if="showSearchResults" class="d-flex align-center mt-8">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-divider class="mr-4"></v-divider>
            <span class="text-h6 font-weight-medium text-red-darken-2">Search Result</span>
            <v-divider class="ml-4"></v-divider>
          </div>
          <div class="d-flex align-center justify-end">
            <v-chip
              v-if="taskStore.allFilteredTasks.length > 0"
              color="green-darken-3"
              size="small"
              label
              rounded="pill"
              prepend-icon="mdi-check"
              :class="xs ? 'mx-2' : 'mx-4'"
              class="font-weight-medium"
            >
              {{ taskStore.allFilteredTasks.length }} Result{{
                taskStore.allFilteredTasks.length === 1 ? '' : 's'
              }}
              Found
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <v-row
        class="tasks d-flex flex-wrap align-items-center justify-content-center"
        v-if="showSearchResults"
      >
        <template v-if="taskStore.state.isLoading">
          <v-col cols="12" class="d-flex justify-center align-center" style="min-height: 200px">
            <v-skeleton-loader type="card" />
          </v-col>
        </template>
        <template v-else>
          <v-col
            v-for="task in taskStore.allFilteredTasks"
            :key="task.id"
            :task="task"
            :value="task"
            cols="12"
            sm="11"
            md="10"
            lg="9"
            xl="8"
            class="mx-auto"
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
                  @edit-task="(projectId, taskId) => taskStore.editTask(taskId)"
                  @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
                  @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
                />
              </template>
              <template #fallback>
                <div class="fallback">Loading...</div>
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
            dense
            outlined
            closable
            class="text-center text-subtitle-1"
            color="red-darken-2"
            aria-live="polite"
          >
            <span>No tasks found for the search term.</span>
          </v-alert>
        </v-col>
      </v-row>
      <v-row v-if="showSearchResults">
        <v-col cols="12" class="d-flex justify-end mt-8">
          <v-btn
            @click="goBack"
            color="red-darken-2"
            variant="flat"
            rounded
            size="large"
            prepend-icon="mdi-chevron-left"
            :class="xs ? '' : 'px-8'"
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
        :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
        class="dialog dialog-edit-task"
      >
        <v-card class="card card-edit-task pa-4">
          <v-card-title class="card-title card-title-edit-task">
            <span class="text-h6">Edit task {{ taskStore.editedTask.title }} </span>
          </v-card-title>
          <v-card-text>
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
                ? 'd-flex flex-column align-center'
                : 'd-flex flex-wrap justify-space-around'
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
}

.tasks {
  position: relative;
  transition: opacity 0.3s ease;
}

.fallback {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 16px;
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

/* Tooltip y estilos de iconos */
:deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
}

:deep(.v-card-title) {
  line-height: 1.5;
}
</style>
