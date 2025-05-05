<script setup>
import { useUserStore } from '@/stores/userStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useRouter } from 'vue-router'
import { useSubmitNewTask } from '@/composables/forms/useSubmitNewTask'
import { useSubmitEditedTask } from '@/composables/forms/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/forms/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/forms/validationFormRules.js'
import { useResetForm } from '@/composables/forms/useResetForm'
import VActionButtons from '@/components/tasks/VActionButtons.vue'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import VCardTask from '@/components/tasks/VCardTask.vue'
import VPagination from '@/components/tasks/VPagination.vue'
import VTaskForm from '@/components/tasks/VTaskForm.vue'
import VProjectForm from '@/components/projects/VProjectForm.vue'
import { showSnackbar } from '@/utils/notifications/notificationHelpers.js' // Import the helper
import VEmptyState from '@/components/tasks/VEmptyState.vue'
import { useMotivationalProgress } from '@/composables/ui/useMotivationalProgress.js'

const userStore = useUserStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dataStore = useDataStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()

const { submitEditedTask } = useSubmitEditedTask()
const { submitNewTask } = useSubmitNewTask()

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  taskId: {
    type: String,
    required: false // Optional if you want to display a specific task
  }
})

// --- Espera a que los proyectos estén cargados antes de buscar y cargar tareas ---
let stopWatch = null
onMounted(() => {
  // Siempre asegurar la suscripción a proyectos al montar la vista
  if (userStore.isLoggedIn) {
    projectStore.subscribeToCollection()
  }
  // Watch for the projectId prop directly
  stopWatch = watch(
    () => props.projectId,
    (newProjectId) => {
      // Can keep async or remove if not needed elsewhere
      if (newProjectId) {
        // Use the projectId directly to set the selected project in stores
        taskStore.setSelectedProject(newProjectId)
        projectStore.setSelectedProject(newProjectId)
      } else {
        // Handle case where projectId becomes null or undefined if necessary
        taskStore.setSelectedProject(null)
        projectStore.setSelectedProject(null)
        // Optionally clear tasks or handle appropriately
        taskStore.state.totalTasks = 0
      }
    },
    { immediate: true } // Run immediately when the component mounts
  )
})

onUnmounted(() => {
  if (stopWatch) stopWatch()
})

const form = ref(null)
const taskFormRef = ref(null)
const projectFormRef = ref(null)
const dialogEditProject = ref(false)
const dialogAddTask = ref(false)
const confirmDialog = ref(false)

// const isLoading = computed(() => taskStore.state.isLoading)

const progressPercentage = computed(() => {
  const total = taskStore.totalFilteredTasksInProject
  const completed = taskStore.completedFilteredTasksInProject
  if (typeof total === 'number' && total > 0) {
    return Math.round((completed / total) * 100)
  } else {
    return 0
  }
})

const { color: motivationalColor } = useMotivationalProgress(progressPercentage)

const handleAddTaskClick = () => {
  if (!userStore.isLoggedIn) {
    showSnackbar(notificationsStore, 'Authentication required', 'info', 'mdi-information')
    router.push({ path: '/login' })
    return
  }

  // Usar el id del proyecto seleccionado
  const currentProject = projectStore.selectedProject
  taskStore.newTask = {
    projectId: currentProject ? currentProject.id : '',
    title: '',
    description: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    endDate: null,
    completed: false,
    color: currentProject ? currentProject.color : null
  }

  dialogAddTask.value = true
}

const editProject = async (projectId) => {
  dialogEditProject.value = true
  // Get the project data from Firestore and update the UI
  const projectData = await projectStore.projects.find((project) => project.id === projectId)
  // Update the form values with the project data
  if (projectData) {
    projectStore.editedProject = {
      ...projectData
    }
  } else {
    projectStore.editedProject = {
      id: '',
      name: '',
      description: ''
    }
  }
}

const submitEditedProject = async () => {
  try {
    // Save the edited project to Firestore
    await projectStore.saveEditedProject(projectStore.editedProject.id, projectStore.editedProject)
    // Close the dialog
    dialogEditProject.value = false
    showSnackbar(notificationsStore, 'Project updated', 'success', 'mdi-check')
  } catch (error) {
    console.error(error)
    showSnackbar(notificationsStore, 'Error updating project', 'error', 'mdi-alert-circle')
  }
}

// Reseteo para el formulario de edición de proyecto
// Callback para restaurar el modelo reactivo del proyecto editado
// Este callback se usa para restaurar el modelo reactivo del proyecto editado
// y se pasa como argumento a useResetForm
const resetProjectFormState = () => {
  // Restaura el modelo reactivo al original (si existe) o lo deja vacío
  const projectId = projectStore.editedProject.id
  const originalProject = projectStore.projects.find((project) => project.id === projectId)
  if (originalProject) {
    Object.assign(projectStore.editedProject, { ...originalProject })
  } else {
    Object.assign(projectStore.editedProject, { id: '', title: '', icon: '', color: '' })
  }
}
// Reset personalizado y notificación coherente
// Este callback se usa para restaurar el modelo reactivo del proyecto editado
// y se pasa como argumento a useResetForm
const { reset: resetEditProject } = useResetForm(
  projectFormRef,
  'Project edit form reset',
  'info',
  'mdi-information',
  resetProjectFormState
)
// Reseteo para el formulario de edición de tarea
// Callback para restaurar el modelo reactivo de la tarea editada
// Este callback se usa para restaurar el modelo reactivo de la tarea editada
// y se pasa como argumento a useResetForm
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
const { reset: resetEditTask } = useResetForm(
  form,
  'Edit Task Form has been reset',
  'info',
  'mdi-information',
  resetEditTaskFormState
)

// Reseteo de formularios
const reset = () => {
  if (dialogEditProject.value) {
    resetEditProject()
  } else if (taskStore.dialogEditTask) {
    resetEditTask()
  }
}

const { btnsForm: btnsNewTaskForm } = useFormBtnActions(
  submitNewTask,
  () => taskFormRef.value?.reset(),
  () => (dialogAddTask.value = false)
)
btnsNewTaskForm[0].text = 'Create Task'
btnsNewTaskForm[0].icon = 'mdi-plus'

// Usa el composable para los botones
const { btnsForm } = useFormBtnActions(
  submitEditedTask,
  reset,
  () => (taskStore.dialogEditTask = false)
)

// Configure the submit button for editing a task
btnsForm[0].text = 'Update Task' // Set the text for the submit button
btnsForm[0].icon = 'mdi-pencil' // Set the icon for the submit button

// Botones para el formulario de edición de proyecto usando el composable
const { btnsForm: btnsFormEditProject } = useFormBtnActions(
  submitEditedProject,
  resetEditProject,
  () => (dialogEditProject.value = false)
)
btnsFormEditProject[0].text = 'Save Edit'
btnsFormEditProject[0].icon = 'mdi-check'

// Define the buttons Project array
const btnsProject = [
  {
    label: 'Edit project',
    text: 'Edit project',
    icon: 'mdi-pencil',
    function: () => {
      const projectId = projectStore.selectedProjectId
      if (projectId) {
        editProject(projectId)
      } else {
        console.error('Project not found:', projectStore.selectedProjectTitle)
      }
    }
  },
  {
    text: 'Delete project',
    label: 'Delete project',
    icon: 'mdi-delete',
    function: () => {
      const projectId = projectStore.selectedProjectId
      if (projectId) {
        projectStore.deleteProject(projectId)
      } else {
        console.error('Project not found:', projectStore.selectedProjectTitle)
      }
    }
  }
]

const rules = useMaxLengthRule()

const totalTasksIcon = computed(() => {
  return taskStore.tasksInSelectedProject.length > 1
    ? 'mdi-clipboard-text-multiple-outline'
    : 'mdi-clipboard-text-outline'
})

const completedTasksIcon = computed(() => {
  return taskStore.completedFilteredTasks.length > 1
    ? 'mdi-calendar-multiple-check'
    : 'mdi-calendar-check-outline'
})

const { mobile, xs, sm, smAndUp, md, mdAndDown, mdAndUp, lg, xl } = useDisplay()

const computedProgressSize = computed(() => {
  if (xs.value) return 64 // Size for xs (increased from 56 to 64 to match our direct template change)
  if (sm.value) return 64 // Size for sm
  if (mdAndUp.value) return 72 // Size for md and up
  return 64 // Default fallback
})

const computedProgressWidth = computed(() => {
  if (xs.value) return 6 // Width for xs (increased from 5 to 6 to match our direct template change)
  if (sm.value) return 6 // Width for sm
  if (mdAndUp.value) return 7 // Width for md and up
  return 6 // Default fallback
})

const confirmDeleteAllTasks = () => {
  confirmDialog.value = true
}

const confirmDeleteAndClose = () => {
  projectStore.deleteAllTasksInProject()
  confirmDialog.value = false
  showSnackbar(notificationsStore, 'All tasks deleted from project', 'success', 'mdi-delete-sweep')
}
</script>

<template>
  <v-container :class="xs ? '' : 'pa-4'" fluid>
    <v-responsive
      class="tasksByProject-container mx-auto"
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
    >
      <v-dialog
        v-model="dialogAddTask"
        :max-width="xs ? '100vw' : smAndUp ? '600px' : mdAndDown ? '800px' : '1000px'"
        class="dialog dialog-create-task"
        scrollable
      >
        <v-card
          class="card card-create-task pa-4"
          color="surface"
          variant="elevated"
          elevation="2"
          rounded="lg"
        >
          <v-card-title
            class="card-title card-title-create-task mb-8"
            :class="mobile ? 'px-1' : ''"
          >
            <span class="text-h6">Add new task</span>
          </v-card-title>
          <v-card-text :class="mobile ? 'px-0' : ''">
            <VTaskForm
              v-model="taskStore.newTask"
              :projects="projectStore.projects"
              :labels="dataStore.labels"
              :priorities="dataStore.priorities"
              :statuses="dataStore.statuses"
              :rules="rules"
              ref="taskFormRef"
              @submit="submitNewTask"
            >
            </VTaskForm>
          </v-card-text>
          <v-card-actions class="justify-center px-4 pb-4">
            <VActionButtons :buttons="btnsNewTaskForm" />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="dialogEditProject"
        :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
        class="dialog dialog-edit-project"
        scrollable
      >
        <v-card
          class="card card-edit-project pa-4"
          color="surface"
          variant="elevated"
          elevation="2"
          rounded="lg"
        >
          <v-card-title class="card-title card-title-edit-project mb-8">
            <span class="text-h5">Edit Project {{ projectStore.selectedProjectTitle }} </span>
          </v-card-title>
          <v-card-text>
            <VProjectForm
              v-model="projectStore.editedProject"
              :project-templates="dataStore.projectTemplates"
              :icons="dataStore.icons"
              :colors="dataStore.colors"
              ref="projectFormRef"
              @submit="submitEditedProject"
            />
          </v-card-text>
          <v-card-actions class="justify-center px-4 pb-4">
            <VActionButtons :buttons="btnsFormEditProject" />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="taskStore.dialogEditTask"
        :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
        class="dialog dialog-edit-task"
        scrollable
      >
        <v-card
          class="card card-edit-task pa-4"
          color="surface"
          variant="elevated"
          elevation="2"
          rounded="lg"
        >
          <v-card-title class="card-title card-title-edit-task text-onSurface">
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
          <v-card-actions class="justify-end px-4 pb-4">
            <VActionButtons :buttons="btnsForm" />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="confirmDialog" max-width="400px" class="dialog-confirm-delete">
        <v-card color="surface" variant="elevated" elevation="2" rounded="lg" class="pa-4">
          <v-card-title class="text-h6 pb-2">Confirm Delete</v-card-title>
          <v-card-text>
            <p>Are you sure you want to delete all tasks in this project?</p>
            <p class="text-caption text-tertiary mt-2">This action cannot be undone.</p>
          </v-card-text>
          <v-card-actions class="justify-end pt-3">
            <v-btn
              color="surface"
              variant="text"
              @click="confirmDialog = false"
              class="text-button mr-2"
            >
              Cancel
            </v-btn>
            <v-btn
              color="tertiary"
              variant="flat"
              @click="confirmDeleteAndClose"
              class="text-button"
            >
              Delete All
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-row>
        <v-col
          cols="12"
          class="d-flex justify-content-between align-items-center"
          :class="xs ? 'my-4' : mobile ? 'my-6' : 'my-8'"
        >
          <h2
            class="text-left font-weight-bold d-flex align-self-center"
            :class="xs ? 'text-h5' : sm ? 'text-h4' : 'text-h3'"
          >
            {{ projectStore.selectedProjectTitle }} tasks
          </h2>
          <v-spacer></v-spacer>
          <!-- Botón Delete all tasks in project con color terciario -->
          <v-btn
            icon
            variant="text"
            color="error"
            class="delete-project-btn me-2"
            @click="confirmDeleteAllTasks"
            aria-label="Delete all tasks in project"
          >
            <v-icon>mdi-delete</v-icon>
            <v-tooltip activator="parent" location="bottom" class="delete-all-tasks-tooltip"
              >Delete all tasks in project</v-tooltip
            >
          </v-btn>
          <!-- Botón de menú de proyecto con color primary explícito -->
          <v-menu
            transition="scale-transition"
            location="bottom end"
            :close-on-content-click="true"
            :offset="8"
          >
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" class="menu-project-btn" variant="text">
                <v-icon>mdi-dots-vertical</v-icon>
                <v-tooltip activator="parent" location="bottom" class="menu-project-tooltip"
                  >Project options</v-tooltip
                >
              </v-btn>
            </template>
            <v-card
              variant="elevated"
              elevation="2"
              rounded="lg"
              class="menu-card pa-2"
              width="auto"
              color="surface"
            >
              <v-list class="menu-list pa-2" density="comfortable">
                <v-list-item
                  v-for="(btn, i) in btnsProject"
                  :key="i"
                  :value="btn"
                  class="menu-item mb-1"
                  @click="btn.function"
                  rounded="lg"
                  :ripple="true"
                  :active="false"
                  :hover="true"
                  variant="text"
                >
                  <template v-slot:prepend>
                    <v-icon
                      :color="btn.text.includes('Delete') ? 'error' : 'primary'"
                      class="me-2"
                      >{{ btn.icon }}</v-icon
                    >
                  </template>
                  <v-list-item-title>
                    {{ btn.text }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </v-col>
      </v-row>
      <v-row class="d-flex align-center mb-8">
        <v-col
          cols="12"
          class="mb-8"
          :class="{
            'col-xs-12': xs,
            'col-sm-11': sm,
            'col-md-9': md,
            'col-lg-8': lg,
            'col-xl-7': xl
          }"
        >
          <v-card variant="flat" rounded="lg" class="bg-surface-container-low" :class="xs ? 'pa-3' : 'pa-4'">
            <!-- Primera fila: Total con icono + botón añadir -->
            <v-row class="d-flex align-center" :class="xs ? 'py-1' : 'py-2'">
              <v-col cols="auto" class="d-flex align-center">
                <v-icon :icon="totalTasksIcon" class="me-3" :size="xs ? 28 : sm ? 32 : 36"></v-icon>
                <span class="font-weight-bold" :class="xs ? 'text-h6' : sm ? 'text-h5' : 'text-h4'">
                  Total: {{ taskStore.totalFilteredTasksInProject }}
                </span>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <!-- Botón para añadir tarea (FAB en xs/sm, texto en md+) -->
                <v-tooltip location="top" v-if="xs || sm">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      icon="mdi-plus"
                      color="primary"
                      elevation="3"
                      class="action-btn-animated"
                      size="default"
                      @click="handleAddTaskClick"
                      aria-label="Add Task"
                    >
                    </v-btn>
                  </template>
                  <span>Add Task</span>
                </v-tooltip>
                <v-btn
                  v-else
                  color="primary"
                  variant="tonal"
                  rounded
                  size="large"
                  prepend-icon="mdi-plus"
                  class="action-btn-animated text-none text-button"
                  @click="handleAddTaskClick"
                >
                  Add Task
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-2"></v-divider>

            <!-- Diseño responsivo para la parte inferior -->
            <template v-if="xs">
              <!-- Segunda fila: Remaining y Completed -->
              <v-row dense class="mb-2">
                <!-- Columna Remaining -->
                <v-col cols="6" class="d-flex align-center">
                  <v-icon icon="mdi-calendar-clock-outline" class="me-2" size="22"></v-icon>
                  <span class="text onSurfaceVariant font-weight-medium text-body-2">
                    Remaining: {{ taskStore.remainingFilteredTasksInProject }}
                  </span>
                </v-col>

                <!-- Columna Completed -->
                <v-col cols="6" class="d-flex align-center">
                  <v-icon :icon="completedTasksIcon" class="me-2" size="22"></v-icon>
                  <span class="text onSurfaceVariant font-weight-medium text-body-2">
                    Completed: {{ taskStore.completedFilteredTasksInProject }}
                  </span>
                </v-col>
              </v-row>

              <!-- Tercera fila: Progress -->
              <v-row dense class="pb-2">
                <v-col cols="12">
                  <div class="d-flex flex-column align-center mt-2">
                    <span class="text-body-2 font-weight-medium mb-2">Progress:</span>
                    <v-progress-circular
                      v-model="progressPercentage"
                      :size="64"
                      :width="6"
                      :value="progressPercentage"
                      :color="motivationalColor"
                    >
                      <!-- Texto del porcentaje más visible -->
                      <span class="text-body-1 font-weight-medium">{{ progressPercentage }}%</span>
                    </v-progress-circular>
                  </div>
                </v-col>
              </v-row>
            </template>

            <!-- Diseño optimizado para pantallas sm+ (incluye ahora sm) -->
            <template v-else>
              <v-row class="d-flex align-center py-2">
                <!-- Stats en una fila más compacta para sm+ -->
                <v-col cols="auto" class="d-flex align-center mr-4">
                  <v-icon
                    icon="mdi-calendar-clock-outline"
                    class="me-2"
                    :size="sm ? 22 : md ? 24 : 26"
                  ></v-icon>
                  <span
                    class="text-onSurfaceVariant font-weight-medium"
                    :class="sm ? 'text-body-2' : 'text-body-1'"
                  >
                    Remaining: {{ taskStore.remainingFilteredTasksInProject }}
                  </span>
                </v-col>

                <v-col cols="auto" class="d-flex align-center mr-4">
                  <v-icon
                    :icon="completedTasksIcon"
                    class="me-2"
                    :size="sm ? 22 : md ? 24 : 26"
                  ></v-icon>
                  <span
                    class="text onSurfaceVariant font-weight-medium"
                    :class="sm ? 'text-body-2' : 'text-body-1'"
                  >
                    Completed: {{ taskStore.completedFilteredTasksInProject }}
                  </span>
                </v-col>

                <v-divider vertical class="mx-4"></v-divider>

                <!-- Progreso inline para sm+ -->
                <v-col cols="auto">
                  <div class="d-flex align-center">
                    <span class="text-body-2 font-weight-medium mr-3">Progress:</span>
                    <v-progress-circular
                      v-model="progressPercentage"
                      :size="sm ? 56 : computedProgressSize"
                      :width="sm ? 5 : computedProgressWidth"
                      :value="progressPercentage"
                      :color="motivationalColor"
                    >
                      <span class="text-body-2 font-weight-medium">{{ progressPercentage }}%</span>
                    </v-progress-circular>
                  </div>
                </v-col>
              </v-row>
            </template>
          </v-card>
        </v-col>
      </v-row>

      <v-row
        v-if="taskStore.state.isLoading || taskStore.state.initialLoadPending"
        class="tasks d-flex flex-wrap align-items-center justify-content-center mb-8"
      >
        <v-col
          v-for="n in taskStore.state.pageSize"
          :key="`skel-${n}`"
          cols="12"
          sm="11"
          md="10"
          lg="12"
          xl="12"
          class="py-0 mb-8"
          :class="mdAndDown ? 'mx-auto' : ''"
        >
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <v-row
        v-else-if="
          !taskStore.state.isLoading &&
          !taskStore.state.initialLoadPending &&
          taskStore.paginatedTasksInSelectedProject.length > 0
        "
        class="tasks d-flex flex-wrap align-items-center justify-content-center mb-8"
      >
        <v-col
          v-for="task in taskStore.paginatedTasksInSelectedProject"
          :key="task.id"
          cols="12"
          sm="11"
          md="10"
          lg="9"
          xl="8"
          class="py-0 mb-8"
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
                :color="task.color ? task.color : 'primary'"
                :projectId="task.projectId"
                :startDateHour="task.startDateHour"
                :endDateHour="task.endDateHour"
                @edit-task="(projectId, taskId) => taskStore.editTask(taskId)"
                @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
                @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
              >
              </VCardTask>
            </template>
            <template #fallback>
              <div class="fallback">Loading Task...</div>
            </template>
          </Suspense>
        </v-col>
      </v-row>

      <v-row
        v-if="
          !taskStore.state.isLoading &&
          !taskStore.state.initialLoadPending &&
          taskStore.paginatedTasksInSelectedProject.length === 0
        "
      >
        <v-col>
          <VEmptyState
            icon="mdi-clipboard-text-off"
            :icon-size="128"
            title="No tasks in this project"
            subtitle="Start by creating your first task!"
          >
            <v-btn
              color="primary"
              variant="tonal"
              rounded
              size="large"
              prepend-icon="mdi-plus"
              class="mt-6 action-btn-animated"
              @click="handleAddTaskClick"
            >
              Add Task
            </v-btn>
          </VEmptyState>
        </v-col>
      </v-row>

      <v-row
        v-if="
          !taskStore.state.isLoading &&
          !taskStore.state.initialLoadPending &&
          taskStore.paginatedTasksInSelectedProject.length > 0 &&
          taskStore.totalPages > 1
        "
        class="pa-3 mt-4 d-flex justify-center"
      >
        <VPagination
          :currentPage="taskStore.state.currentPage"
          :totalPages="taskStore.totalPages"
          :hasPrevPage="taskStore.state.currentPage > 1"
          :hasNextPage="taskStore.state.currentPage < taskStore.totalPages"
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
      <v-row v-if="!taskStore.state.isLoading && !taskStore.state.initialLoadPending" class="mt-8">
        <v-col cols="12" :class="xs ? 'd-flex justify-center mt-4' : 'd-flex justify-end mt-8'">
          <v-btn
            @click="router.back()"
            color="primary"
            variant="tonal"
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
    </v-responsive>
  </v-container>
</template>

<style scoped>
.empty-state-container {
  min-height: 60vh;
  transition: all 0.3s ease;
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

.v-list-item-title {
  letter-spacing: 0.5px !important;
}

.v-list-item-subtitle {
  max-width: 400px;
}
</style>
