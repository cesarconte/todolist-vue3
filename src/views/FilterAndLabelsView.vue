<!-- FilterAndLabelsView.vue  -->

<script setup>
import VActionButtons from '@/components/VActionButtons.vue'
import VCardTask from '@/components/VCardTask.vue'
import VPagination from '@/components/VPagination.vue'
import VTaskForm from '@/components/VTaskForm.vue'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useResetForm } from '@/composables/useResetForm'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { onUnmounted, ref, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'

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

const showCards = ref(false)
const showAlert = ref(false)

const completionStatusItems = [
  { title: 'Completed', value: true },
  { title: 'Not Completed', value: false }
]

const hasActiveFilters = () => {
  return (
    taskStore.state.selectedProjects.length > 0 ||
    taskStore.state.selectedPriorities.length > 0 ||
    taskStore.state.selectedStatuses.length > 0 ||
    taskStore.state.selectedLabels.length > 0 ||
    !!taskStore.state.selectedEndDate ||
    !!taskStore.state.selectedStartDate ||
    taskStore.state.selectedCompletionStatus !== null || // Keep this check: null means inactive
    !!taskStore.state.searchTerm
  )
}

// Cleanup al desmontar el componente
onUnmounted(() => {
  taskStore.resetFilters()
})

// Manejar cambios en filtros
watch(
  [
    () => taskStore.tasksPage,
    () => taskStore.state.selectedProjects,
    () => taskStore.state.selectedPriorities,
    () => taskStore.state.selectedStatuses,
    () => taskStore.state.selectedLabels,
    () => taskStore.state.selectedEndDate,
    () => taskStore.state.selectedStartDate,
    () => taskStore.state.selectedCompletionStatus,
    () => taskStore.state.searchTerm
  ],
  () => {
    // Check the length of the paginated tasks for the current view
    showCards.value = hasActiveFilters() && taskStore.tasksPage.length > 0
  },
  { immediate: true }
)

const handleFilterClick = () => {
  if (!userStore.isLoggedIn) showAlert.value = true
}

const handleClearDate = () => {
  taskStore.state.selectedEndDate = null
}

const handleClearStartDate = () => {
  taskStore.state.selectedStartDate = null
}

const { btnsForm } = useFormBtnActions(
  submitEditedTask,
  reset,
  () => (taskStore.dialogEditTask = false)
)
btnsForm[0].text = 'Update Task'
btnsForm[0].icon = 'mdi-pencil'

// Añadir la función goBack para el botón de regreso
const goBack = () => {
  router.back()
}

const rules = useMaxLengthRule()

// Computed property para texto dinámico del chip
const filterAppliedText = computed(() => {
  let count = 0
  if (taskStore.state.selectedProjects.length > 0) count++
  if (taskStore.state.selectedPriorities.length > 0) count++
  if (taskStore.state.selectedStatuses.length > 0) count++
  if (taskStore.state.selectedLabels.length > 0) count++
  if (taskStore.state.selectedEndDate) count++
  if (taskStore.state.selectedStartDate) count++
  if (taskStore.state.selectedCompletionStatus !== null) count++
  if (taskStore.state.searchTerm) count++

  return count === 1 ? 'Filter applied' : 'Filters applied'
})

const { xs, sm, smAndDown, smAndUp, md, mdAndDown, mdAndUp, lg, xl } = useDisplay()
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
          <h2 class="text-h4 font-weight-bold text-red-darken-2 text-center">
            Filter and Label Tasks
          </h2>
        </v-col>
      </v-row>

      <!-- Filtros -->
      <v-card class="my-4 mx-1 pa-2" variant="outlined" rounded="lg" elevation="2">
        <v-card-title class="d-flex align-center justify-space-between pb-2">
          <div class="d-flex align-center">
            <v-icon icon="mdi-filter-variant" class="mr-2" color="red-darken-2"></v-icon>
            <span class="text-subtitle-1 font-weight-medium">Filter Options</span>
          </div>
          <v-chip
            v-if="hasActiveFilters()"
            color="red-darken-2"
            size="small"
            label
            rounded="pill"
            prepend-icon="mdi-filter-outline"
            class="font-weight-medium"
          >
            {{ filterAppliedText }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle
          class="text-subtitle-1 font-weight-medium py-2 text-red-accent-2 text-center"
        >
          <v-icon icon="mdi-tune" class="mr-2" color="red-accent-2"></v-icon>
          Choose your filters
        </v-card-subtitle>

        <v-divider class="mb-3"></v-divider>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedProjects"
                label="Filter by project"
                :items="userStore.isLoggedIn ? projectStore.projectItems : []"
                item-title="title"
                item-value="value"
                :placeholder="
                  userStore.isLoggedIn ? 'Select project...' : 'Login to view projects...'
                "
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                multiple
                chips
                closable-chips
                auto-select-first
                @click="handleFilterClick"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.title" />
                </template>
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-folder-outline"></v-icon>
                    </template>
                    <span>Filter tasks by project. You can select multiple projects.</span>
                  </v-tooltip>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedPriorities"
                label="Filter by priority"
                :items="userStore.isLoggedIn ? dataStore.priorityItems : []"
                item-title="title"
                item-value="value"
                :placeholder="
                  userStore.isLoggedIn ? 'Select priority...' : 'Log in to view priorities.'
                "
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                multiple
                chips
                closable-chips
                auto-select-first
                @click="handleFilterClick"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.title" />
                </template>
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-flag-outline"></v-icon>
                    </template>
                    <span>Filter tasks by priority level. You can select multiple priorities.</span>
                  </v-tooltip>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedLabels"
                label="Filter by label"
                :items="userStore.isLoggedIn ? dataStore.labelItems : []"
                item-title="title"
                item-value="value"
                :placeholder="userStore.isLoggedIn ? 'Select label...' : 'Log in to view labels.'"
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                multiple
                chips
                closable-chips
                auto-select-first
                @click="handleFilterClick"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.title" />
                </template>
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-label-outline"></v-icon>
                    </template>
                    <span>Filter tasks by label category. You can select multiple labels.</span>
                  </v-tooltip>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedStatuses"
                label="Filter by status"
                :items="userStore.isLoggedIn ? dataStore.statusItems : []"
                item-title="title"
                item-value="value"
                :placeholder="
                  userStore.isLoggedIn ? 'Select status...' : 'Log in to view statuses.'
                "
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                multiple
                chips
                closable-chips
                auto-select-first
                @click="handleFilterClick"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.title" />
                </template>
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-format-list-checks"></v-icon>
                    </template>
                    <span>Filter tasks by current status. You can select multiple statuses.</span>
                  </v-tooltip>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-date-input
                v-model="taskStore.state.selectedStartDate"
                label="Filter by start date"
                class="date-picker"
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                prepend-icon=""
                @click:clear="handleClearStartDate"
              >
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-calendar"></v-icon>
                    </template>
                    <span>Filter tasks by start date. Click to open calendar.</span>
                  </v-tooltip>
                </template>
              </v-date-input>
            </v-col>
            <v-col cols="12" sm="6">
              <v-date-input
                v-model="taskStore.state.selectedEndDate"
                label="Filter by end date"
                class="date-picker"
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                prepend-icon=""
                @click:clear="handleClearDate"
              >
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-calendar"></v-icon>
                    </template>
                    <span>Filter tasks by due date. Click to open calendar.</span>
                  </v-tooltip>
                </template>
              </v-date-input>
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12" sm="6" :class="mdAndUp ? 'mx-auto' : ''">
              <v-select
                v-model="taskStore.state.selectedCompletionStatus"
                label="Filter by completion status"
                :items="completionStatusItems"
                item-title="title"
                item-value="value"
                :placeholder="'Completion status...'"
                variant="outlined"
                color="red-accent-2"
                rounded
                density="comfortable"
                clearable
                hide-details
                chips
                closable-chips
                @click="handleFilterClick"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.title" />
                </template>
                <template v-slot:prepend-inner>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-checkbox-marked-circle-outline"></v-icon>
                    </template>
                    <span>Filter tasks by completion status (completed or not completed).</span>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-card-text>

        <v-row v-if="!hasActiveFilters()">
          <v-col class="text-center py-8 d-flex flex-column align-center">
            <v-icon size="64" color="grey-lighten-1" class="empty-icon">mdi-filter-outline</v-icon>
            <p class="text-h6 font-weight-medium text-grey-lighten-1 mt-3">
              Use the filters above to search for tasks
            </p>
          </v-col>
        </v-row>
        <v-row
          v-else-if="
            hasActiveFilters() && !taskStore.state.isLoading && taskStore.totalFilteredTasks === 0
          "
        >
          <v-col class="text-center py-8 d-flex flex-column align-center">
            <v-icon size="64" color="grey-lighten-1" class="empty-icon">mdi-magnify</v-icon>
            <p class="text-h6 font-weight-medium text-grey-lighten-1 mt-3">
              No tasks found with current filters
            </p>
          </v-col>
        </v-row>

        <v-card-actions class="justify-center pt-2 pb-4 mt-4">
          <v-btn
            color="red-accent-2"
            variant="tonal"
            rounded="pill"
            size="large"
            prepend-icon="mdi-refresh"
            :class="xs ? '' : 'px-8'"
            :block="xs"
            class="text-none text-button"
            @click="taskStore.resetFilters()"
            :disabled="!hasActiveFilters()"
          >
            Clear All Filters
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Alertas -->
      <v-alert
        v-if="taskStore.state.error"
        type="error"
        dense
        outlined
        closable
        height="4rem"
        width="32rem"
        class="mt-8 mx-auto rounded-pill"
      >
        {{ taskStore.state.error }}
      </v-alert>

      <v-alert
        v-model="showAlert"
        type="warning"
        dense
        outlined
        closable
        height="4rem"
        :width="xs ? '90%' : '32rem'"
        class="alert mt-8 rounded-pill"
      >
        <span>
          {{ xs ? 'Please, log in...' : 'Please, log in to use the filters' }}
        </span>
        <v-btn icon class="ml-2" variant="plain" @click="$router.push('/login')">
          <v-icon>mdi-account-arrow-right-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            <span>Log in to unlock filter options</span>
          </v-tooltip>
        </v-btn>
      </v-alert>

      <!-- Resultados de filtros -->
      <v-row v-if="showCards && taskStore.tasksPage.length > 0" class="d-flex align-center my-4">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-divider class="mr-4"></v-divider>
            <span class="text-h6 font-weight-medium text-red-darken-2">Filtered Tasks</span>
            <v-divider class="ml-4"></v-divider>
          </div>
          <div class="d-flex align-center justify-end">
            <v-chip
              color="green"
              size="small"
              label
              rounded="pill"
              prepend-icon="mdi-check"
              class="font-weight-medium"
            >
              {{
                taskStore.totalFilteredTasks === 1
                  ? '1 Task Found'
                  : `${taskStore.totalFilteredTasks} Tasks Found`
              }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Lista de tareas y mensajes -->
      <v-row
        class="tasks d-flex flex-wrap align-items-center justify-content-center"
        v-if="showCards"
      >
        <template v-if="taskStore.state.isLoading">
          <v-col v-for="n in taskStore.state.pageSize" :key="n" cols="12" md="6" lg="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </template>
        <template v-else-if="showCards">
          <v-col
            v-for="task in taskStore.tasksPage"
            :key="task.id"
            :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
            lg="6"
            :class="mdAndDown ? 'mx-auto' : ''"
          >
            <VCardTask
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
              :color="task.color ? task.color : task.project?.color || 'default'"
              :projectId="task.projectId"
              :startDateHour="task.startDateHour"
              :endDateHour="task.endDateHour"
              @edit-task="(projectId, taskId) => taskStore.editTask(taskId)"
              @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
              @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
            />
          </v-col>
        </template>
      </v-row>

      <!-- Paginación -->
      <v-row v-if="taskStore.totalPages >= 1" class="pa-3">
        <VPagination
          :currentPage="taskStore.state.currentPage"
          :totalPages="taskStore.totalPages"
          :hasPrevPage="taskStore.state.hasPrevPage"
          :hasNextPage="taskStore.state.hasNextPage"
          @prev-page="taskStore.prevPage"
          @next-page="taskStore.nextPage"
          @first-page="taskStore.firstPage"
          @last-page="taskStore.lastPage"
        >
          <template #default>
            Page {{ taskStore.state.currentPage }} of {{ taskStore.totalPages }}
          </template>
        </VPagination>
      </v-row>

      <!-- Botón para regresar -->
      <v-row v-if="showCards && taskStore.tasksPage.length > 0" class="mt-4">
        <v-col cols="12">
          <div class="d-flex justify-space-between">
            <v-spacer></v-spacer>
            <v-btn
              @click="goBack"
              color="red-darken-2"
              variant="flat"
              rounded="pill"
              size="large"
              prepend-icon="mdi-chevron-left"
              :class="xs ? '' : 'px-8'"
              class="text-none text-button"
            >
              Back
            </v-btn>
          </div>
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
            <span class="text-h6">Edit task </span>
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
  top: 42%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}

.tasks {
  min-height: 60vh;
  position: relative;
  transition: opacity 0.3s ease;
}

.tasks-loading {
  opacity: 0.5;
  pointer-events: none;
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

.v-col .fallback {
  height: 200px;
  width: 100%;
}

.date-picker {
  width: 100%;
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
</style>
