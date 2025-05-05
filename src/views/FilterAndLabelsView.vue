<!-- FilterAndLabelsView.vue  -->

<script setup>
import VActionButtons from '@/components/tasks/VActionButtons.vue'
import VCardTask from '@/components/tasks/VCardTask.vue'
import VPagination from '@/components/tasks/VPagination.vue'
import VTaskForm from '@/components/tasks/VTaskForm.vue'
import VEmptyState from '@/components/tasks/VEmptyState.vue'
import VBackButton from '@/components/ui/VBackButton.vue'
import { useFormBtnActions } from '@/composables/forms/useFormBtnActions'
import { useResetForm } from '@/composables/forms/useResetForm'
import { useSubmitEditedTask } from '@/composables/forms/useSubmitEditedTask'
import { useMaxLengthRule } from '@/composables/forms/validationFormRules.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { onUnmounted, ref, computed } from 'vue'
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

const { xs, sm, smAndDown, md, mdAndUp, lg, xl } = useDisplay()
</script>

<template>
  <v-container :class="xs ? '' : 'pa-4'" fluid>
    <v-responsive
      class="tasksFiltered-container mx-auto"
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
    >
      <v-row>
        <v-col cols="12">
          <h2
            class="text-center text-on-surface font-weight-bold"
            :class="xs ? 'text-h5 my-4' : sm ? 'text-h4 my-6' : 'text-h3 my-8'"
          >
            Filter and Label Tasks
          </h2>
        </v-col>
      </v-row>

      <!-- Filtros -->
      <v-card class="mb-8 mx-2 search-card" :class="xs ? '' : 'pa-4'" variant="text">
        <v-card-title
          class="d-flex align-center justify-space-between pb-2 mb-2"
          :class="xs ? 'px-2' : 'px-4'"
        >
          <v-sheet
            class="filter-header"
            :class="xs ? 'pa-1' : 'pa-2'"
            rounded="lg"
            color="surface-container"
          >
            <div class="d-flex align-center">
              <v-icon
                icon="mdi-filter-variant"
                color="primary"
                :size="xs ? '28' : '40'"
                class="mr-1"
              ></v-icon>
              <div class="ml-0">
                <div
                  class="text-h6 font-weight-medium text-onSurfaceVariant"
                  :class="xs ? 'text-subtitle-1' : ''"
                >
                  Filter Options
                </div>
                <div class="text-caption text-onSurfaceVariant mt-1 text-wrap">
                  {{ xs ? 'Find matching tasks' : 'Filter tasks using multiple criteria' }}
                </div>
              </div>
            </div>
          </v-sheet>
          <v-chip
            v-if="hasActiveFilters()"
            color="primary"
            size="small"
            prepend-icon="mdi-filter-outline"
            class="font-weight-medium mx-2"
            :class="xs ? 'px-2 py-1' : ''"
          >
            {{ filterAppliedText }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle
          class="text-subtitle-1 font-weight-medium py-2 text-center mb-4"
          :class="xs ? 'px-2' : 'px-4'"
        >
          <v-icon icon="mdi-tune" class="mr-2" :size="xs ? 18 : 24"></v-icon>
          <span :class="xs ? 'text-body-2' : ''">Choose your filters</span>
        </v-card-subtitle>

        <v-divider class="mb-4"></v-divider>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedProjects"
                label="Project"
                :placeholder="
                  userStore.isLoggedIn ? 'Select project...' : 'Login to view projects...'
                "
                :items="userStore.isLoggedIn ? projectStore.projectItems : []"
                item-title="title"
                item-value="value"
                variant="outlined"
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
                multiple
                :chips="!!taskStore.state.selectedProjects.length"
                closable-chips
                auto-select-first
                @click="handleFilterClick"
                :menu-props="{
                  maxHeight: 300,
                  maxWidth: '100%',
                  contentClass: 'search-results-menu rounded-lg',
                  transition: 'scale-transition'
                }"
                @update:modelValue="
                  (val) => {
                    taskStore.state.selectedProjects = Array.isArray(val) ? val : []
                  }
                "
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
                label="Priority"
                :placeholder="
                  userStore.isLoggedIn ? 'Select priority...' : 'Log in to view priorities.'
                "
                :items="userStore.isLoggedIn ? dataStore.priorityItems : []"
                item-title="title"
                item-value="title"
                variant="outlined"
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
                multiple
                :chips="!!taskStore.state.selectedPriorities.length"
                closable-chips
                auto-select-first
                @click="handleFilterClick"
                :menu-props="{
                  maxHeight: 300,
                  contentClass: 'filter-menu rounded-lg',
                  transition: 'scale-transition'
                }"
                @update:modelValue="
                  (val) => {
                    taskStore.state.selectedPriorities = Array.isArray(val) ? val : []
                  }
                "
              >
                <template v-slot:selection="{ item }">
                  <v-chip
                    :color="item.raw?.color || 'grey'"
                    variant="tonal"
                    size="small"
                    class="font-weight-medium"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
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
                <template v-slot:no-data>
                  <v-list-item class="pa-4">
                    <div class="d-flex flex-column align-center justify-center pa-2">
                      <v-icon
                        icon="mdi-filter-remove"
                        color="grey-darken-1"
                        :size="28"
                        class="mb-3"
                      ></v-icon>
                      <span class="text-subtitle-2 text-grey-darken-1 text-center"
                        >No matching priorities</span
                      >
                    </div>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="taskStore.state.selectedLabels"
                label="Label"
                :placeholder="userStore.isLoggedIn ? 'Select label...' : 'Log in to view labels.'"
                :items="userStore.isLoggedIn ? dataStore.labelItems : []"
                item-title="title"
                item-value="title"
                variant="outlined"
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
                multiple
                :chips="!!taskStore.state.selectedLabels.length"
                closable-chips
                auto-select-first
                @click="handleFilterClick"
                :menu-props="{
                  maxHeight: 300,
                  maxWidth: '100%',
                  contentClass: 'search-results-menu rounded-lg',
                  transition: 'scale-transition'
                }"
                @update:modelValue="
                  (val) => {
                    taskStore.state.selectedLabels = Array.isArray(val) ? val : []
                  }
                "
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
                label="Status"
                :placeholder="
                  userStore.isLoggedIn ? 'Select status...' : 'Log in to view statuses.'
                "
                :items="userStore.isLoggedIn ? dataStore.statusItems : []"
                item-title="title"
                item-value="title"
                variant="outlined"
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
                multiple
                :chips="!!taskStore.state.selectedStatuses.length"
                closable-chips
                auto-select-first
                @click="handleFilterClick"
                :menu-props="{
                  maxHeight: 300,
                  maxWidth: '100%',
                  contentClass: 'search-results-menu rounded-lg',
                  transition: 'scale-transition'
                }"
                @update:modelValue="
                  (val) => {
                    taskStore.state.selectedStatuses = Array.isArray(val) ? val : []
                  }
                "
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
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
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
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
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
              <v-autocomplete
                v-model="taskStore.state.selectedCompletionStatus"
                label="Completion Status"
                :placeholder="'Completion status...'"
                :items="completionStatusItems"
                item-title="title"
                item-value="value"
                variant="outlined"
                color="primary"
                bg-color="surface-container"
                density="comfortable"
                rounded
                clearable
                hide-details="auto"
                :chips="taskStore.state.selectedCompletionStatus !== null"
                closable-chips
                auto-select-first
                @click="handleFilterClick"
                :menu-props="{
                  maxHeight: 300,
                  maxWidth: '100%',
                  contentClass: 'search-results-menu rounded-lg',
                  transition: 'scale-transition'
                }"
                @update:modelValue="
                  (val) => {
                    taskStore.state.selectedCompletionStatus = val === '' ? null : val
                  }
                "
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
                <template v-slot:no-data>
                  <v-list-item class="pa-4">
                    <div class="d-flex flex-column align-center justify-center pa-2">
                      <v-icon
                        icon="mdi-filter-remove"
                        color="grey-darken-1"
                        :size="28"
                        class="mb-3"
                      ></v-icon>
                      <span class="text-subtitle-2 text-grey-darken-1 text-center">
                        No matching completion status
                      </span>
                    </div>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-card-text>

        <v-row v-if="!hasActiveFilters()">
          <v-col>
            <VEmptyState
              icon="mdi-filter-outline"
              :icon-size="xs ? 60 : sm ? 70 : 80"
              :title="xs ? 'Use filters above' : 'Use the filters above to search for tasks'"
              :subtitle="
                xs
                  ? 'Choose your criteria'
                  : 'Select different filtering options to find your tasks.'
              "
              class="empty-state-container"
            />
          </v-col>
        </v-row>

        <v-card-actions class="justify-center pt-4 pb-8 mt-4">
          <v-btn
            variant="tonal"
            rounded
            size="large"
            prepend-icon="mdi-refresh"
            :class="xs ? 'px-4 py-2' : 'px-8'"
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
        class="mt-8 mx-auto d-flex flex-wrap justify-center"
        aria-live="polite"
      >
        {{ taskStore.state.error }}
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
          {{ xs ? 'Please, log in...' : 'Please, log in to use the filters' }}
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
            <span>Log in to unlock filter options</span>
          </v-tooltip>
        </v-btn>
      </v-alert>

      <!-- Resultados de filtros -->
      <v-row
        v-if="hasActiveFilters() && taskStore.tasksPage.length > 0"
        class="d-flex align-center my-8"
      >
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-divider class="mr-4"></v-divider>
            <span class="text-h6 font-weight-medium">Filtered Tasks</span>
            <v-divider class="ml-4"></v-divider>
          </div>
          <div class="d-flex align-center justify-end">
            <v-chip
              color="success"
              size="small"
              label
              rounded
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
        v-if="hasActiveFilters() && taskStore.tasksPage.length > 0"
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
        <template v-else-if="hasActiveFilters() && taskStore.tasksPage.length > 0">
          <v-col
            v-for="task in taskStore.tasksPage"
            :key="task.id"
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
                    color="primary"
                    :size="40"
                    class="mr-2"
                  ></v-progress-circular>
                  Loading...
                </div>
              </template>
            </Suspense>
          </v-col>
        </template>
      </v-row>

      <!-- Paginación -->
      <v-row
        v-if="taskStore.tasksPage.length > 0 && taskStore.totalPages > 1 && hasActiveFilters()"
        class="pa-3 mt-4 d-flex justify-center"
      >
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
            <span class="font-weight-medium">
              Page {{ taskStore.state.currentPage }} of {{ taskStore.totalPages }}
            </span>
          </template>
        </VPagination>
      </v-row>

      <!-- Botón para regresar -->
      <v-row v-if="hasActiveFilters() && taskStore.tasksPage.length > 0" class="mt-8">
        <v-col cols="12" :class="xs ? 'd-flex justify-center mt-4' : 'd-flex justify-end'">
          <VBackButton
            :block="xs ? true : false"
            :size="xs ? 'default' : 'large'"
            :class="xs ? 'px-4 py-2' : 'px-8'"
            @click="goBack"
            aria-label="Go back to previous page"
          >
            Back
          </VBackButton>
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

.tasks-loading {
  opacity: 0.5;
  pointer-events: none;
}

.fallback {
  min-height: 150px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin: 16px;
  padding: 24px;
  font-size: 16px;
}

.empty-state-container {
  opacity: 0.7;
}

.empty-icon {
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

.date-picker {
  width: 100%;
}

:deep(.v-card-title) {
  line-height: 1.5;
}
</style>
