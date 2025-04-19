<script setup>
import { useUserStore } from '@/stores/userStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useRouter } from 'vue-router'
import { useSubmitNewTask } from '@/composables/useSubmitNewTask'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useResetForm } from '@/composables/useResetForm'
import { requiredRule } from '@/composables/useFieldRules'
import VActionButtons from '@/components/VActionButtons.vue'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import VCardTask from '@/components/VCardTask.vue'
import VPagination from '@/components/VPagination.vue'
import VTaskForm from '@/components/VTaskForm.vue'

const userStore = useUserStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dataStore = useDataStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()

const { submitEditedTask } = useSubmitEditedTask()
const { submitNewTask } = useSubmitNewTask()

const props = defineProps({
  projectName: {
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
  stopWatch = watch(
    [() => projectStore.projects, () => props.projectName],
    ([projects, projectName]) => {
      const selectedProject = projects.find((project) => project.title === projectName)
      if (selectedProject) {
        taskStore.setSelectedProject(selectedProject.id)
        if (stopWatch) stopWatch()
      }
    },
    { immediate: true, deep: true }
  )
})

onUnmounted(() => {
  if (stopWatch) stopWatch()
})

const form = ref(null)
const taskFormRef = ref(null)
const dialogEditProject = ref(false)
const dialogAddTask = ref(false)

const isLoading = computed(() => taskStore.state.isLoading)

const progressPercentage = computed(() => {
  const total = taskStore.totalFilteredTasksInProject
  const completed = taskStore.completedFilteredTasksInProject
  if (typeof total === 'number' && total > 0) {
    return Math.round((completed / total) * 100)
  } else {
    return 0
  }
})

const handleAddTaskClick = () => {
  if (!userStore.isLoggedIn) {
    notificationsStore.displaySnackbar('Authentication required', 'info', 'mdi-information')
    router.push({ path: '/login' })
    return
  }

  // Establecer proyecto actual por defecto y reinicializar newTask
  const currentProject = projectStore.projects.find(
    (p) => p.title === taskStore.selectedProjectTitle
  )
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
    notificationsStore.displaySnackbar('Project updated', 'success', 'mdi-check')
  } catch (error) {
    console.error(error)
    notificationsStore.displaySnackbar('Error updating project', 'error', 'mdi-alert-circle')
  }
}

// Reseteo para el formulario de edición de proyecto
const resetProjectFormState = () => {
  const projectId = projectStore.editedProject.id
  const originalProject = projectStore.projects.find((project) => project.id === projectId)
  if (originalProject) {
    projectStore.editedProject = { ...originalProject }
  } else {
    projectStore.editedProject = { id: '', title: '', icon: '', color: '' }
  }
}
const { reset: resetProject } = useResetForm(
  form,
  'Project edit form reset',
  'info',
  'mdi-information',
  resetProjectFormState
)

// Reseteo para el formulario de edición de tarea
const resetTaskFormState = () => {
  taskStore.editedTask = {
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
  }
}
const { reset: resetTask } = useResetForm(
  form,
  'Task edit form reset',
  'info',
  'mdi-information',
  resetTaskFormState
)

// Reseteo por defecto
const { reset: resetDefault } = useResetForm(form, 'Form reset', 'info', 'mdi-information')

const reset = () => {
  if (dialogEditProject.value) {
    resetProject()
  } else if (taskStore.dialogEditTask) {
    resetTask()
  } else {
    resetDefault()
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

// Define the buttons Project array
const btnsProject = [
  {
    label: 'Edit project',
    text: 'Edit project',
    icon: 'mdi-pencil',
    function: () => {
      const projectId = projectStore.projects.find(
        (project) => project.title === taskStore.selectedProjectTitle
      )?.id
      if (projectId) {
        editProject(projectId)
      } else {
        // Handle the case where the project is not found
        console.error('Project not found:', taskStore.selectedProjectTitle)
      }
    }
  },
  {
    text: 'Delete project',
    label: 'Delete project',
    icon: 'mdi-delete',
    function: () => {
      const projectId = projectStore.projects.find(
        (project) => project.title === taskStore.selectedProjectTitle
      )?.id
      if (projectId) {
        projectStore.deleteProject(projectId)
      } else {
        // Handle the case where the project is not found
        console.error('Project not found:', taskStore.selectedProjectTitle)
      }
    }
  }
]

// Define the buttons Form Project array
const btnsFormProject = [
  {
    type: 'submit',
    height: '3rem',
    text: 'Save Edit',
    icon: 'mdi-check',
    function: submitEditedProject
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Reset Form',
    icon: 'mdi-refresh',
    function: reset
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Close',
    icon: 'mdi-close',
    function: () => (dialogEditProject.value = false)
  }
]

const rules = useMaxLengthRule()

const titleRules = requiredRule('Title')
const iconRules = requiredRule('Icon')
const colorRules = requiredRule('Color')

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

const { mobile, xs, sm, smAndDown, smAndUp, md, mdAndDown, lg, xl } = useDisplay()
</script>

<template>
  <v-container fluid class="my-6">
    <v-responsive
      class="tasksByProject-container mx-auto"
      :class="xs ? 'pa-1' : ''"
      :max-width="xs ? '100vw' : sm ? '80vw' : md ? '70vw' : lg ? '65vw' : xl ? '60vw' : ''"
    >
      <v-row
        v-if="isLoading"
        class="tasks d-flex flex-wrap align-items-center justify-content-center"
      >
        <v-divider
          color="red-darken-2"
          :thickness="1"
          class="mx-auto border-opacity-50 mb-4"
        ></v-divider>
        <v-col
          v-for="n in taskStore.state.pageSize"
          :key="n"
          :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
          lg="6"
          class="py-0"
          :class="mdAndDown ? 'mx-auto' : ''"
        >
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
      <template v-else>
        <v-dialog
          v-model="dialogAddTask"
          :max-width="xs ? '100vw' : smAndUp ? '600px' : mdAndDown ? '800px' : '1000px'"
          class="dialog dialog-create-task"
        >
          <v-card class="card card-create-task pa-4">
            <v-card-title class="card-title card-title-create-task" :class="mobile ? 'px-1' : ''">
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
            <v-card-actions class="justify-center">
              <VActionButtons :buttons="btnsNewTaskForm" />
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-row>
          <v-col cols="12" class="d-flex justify-content-between align-items-center">
            <h2
              class="text-left text-h4 font-weight-bold text-red-darken-2 d-flex align-self-center"
            >
              {{ taskStore.selectedProjectTitle }} project tasks
            </h2>
            <v-spacer></v-spacer>

            <v-btn
              icon
              variant="flat"
              class="delete-project-btn"
              @click="projectStore.deleteAllTasksInProject"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="bottom" class="delete-all-tasks-tooltip"
                >Delete all tasks in project</v-tooltip
              >
            </v-btn>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" class="menu-project-btn" variant="text">
                  <v-icon>mdi-dots-vertical</v-icon>
                  <v-tooltip activator="parent" location="bottom" class="menu-project-tooltip"
                    >Project options</v-tooltip
                  >
                </v-btn>
              </template>
              <v-list class="menu-list">
                <v-list-item
                  v-for="(btn, i) in btnsProject"
                  :key="i"
                  :value="btn"
                  class="menu-item d-flex align-items-center justify-content-between"
                  @click="btn.function"
                >
                  <v-list-item-title class="d-flex align-items-center">
                    <v-icon class="me-2">{{ btn.icon }}</v-icon>
                    {{ btn.text }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
        <v-row class="d-flex align-items-center align-content-center">
          <v-col
            cols="12"
            class="d-flex align-items-center mb-4"
            :class="{
              'col-xs-12': xs,
              'col-sm-11': sm,
              'col-md-9': md,
              'col-lg-8': lg,
              'col-xl-7': xl
            }"
          >
            <div class="container-project-info pa-3">
              <v-divider></v-divider>
              <v-row class="d-flex align-items-center align-content-center py-4">
                <v-col cols="auto" class="d-flex align-items-center align-content-center">
                  <v-icon
                    class="me-3 d-flex align-self-center"
                    color="red-darken-2"
                    :icon="totalTasksIcon"
                  >
                  </v-icon>
                  <strong class="text-red-darken-2 text-h6">
                    Total: {{ taskStore.totalFilteredTasksInProject }}
                  </strong>
                </v-col>
              </v-row>
              <v-divider class="my-3"></v-divider>
              <v-row class="d-flex align-items-center align-content-center">
                <v-col cols="auto" class="d-flex align-items-center">
                  <v-icon
                    icon="mdi-calendar-clock-outline"
                    class="me-3 d-flex align-self-center"
                  ></v-icon>
                  <strong class="d-flex align-self-center">
                    Remaining: {{ taskStore.remainingFilteredTasksInProject }}
                  </strong>
                </v-col>
                <v-divider class="mx-4 my-2" vertical></v-divider>
                <v-col cols="auto" class="d-flex align-items-center">
                  <v-icon class="me-3 d-flex align-self-center" :icon="completedTasksIcon">
                  </v-icon>
                  <strong class="d-flex align-self-center">
                    Completed: {{ taskStore.completedFilteredTasksInProject }}
                  </strong>
                </v-col>
                <v-col cols="auto" class="d-flex align-items-center ml-8">
                  <v-fade-transition>
                    <v-progress-circular
                      v-model="progressPercentage"
                      :size="64"
                      :width="7"
                      :value="progressPercentage"
                      color="red-darken-2"
                    >
                      <v-fade-transition>
                        <p class="text-overline">{{ progressPercentage }}%</p>
                      </v-fade-transition>
                    </v-progress-circular>
                  </v-fade-transition>
                </v-col>
                <v-divider></v-divider>
              </v-row>
            </div>
          </v-col>
        </v-row>
        <v-row
          v-if="
            Array.isArray(taskStore.tasksInSelectedProject) &&
            taskStore.tasksInSelectedProject.length > 0
          "
          class="tasks d-flex flex-wrap align-items-center justify-content-center"
        >
          <v-divider
            color="red-darken-2"
            :thickness="1"
            class="mx-auto border-opacity-50 mb-4"
          ></v-divider>
          <v-col
            v-for="(task, i) in taskStore.paginatedTasksInSelectedProject"
            :key="i"
            :task="task"
            :value="task"
            :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
            lg="6"
            class="py-0"
            :class="mdAndDown ? 'mx-auto' : ''"
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
                >
                </VCardTask>
              </template>
              <template #fallback>
                <div class="fallback">Loading...</div>
              </template>
            </Suspense>
          </v-col>
        </v-row>
        <template v-else>
          <v-container class="empty-state-container">
            <v-row class="d-flex flex-column align-center justify-center text-center pa-8">
              <v-col cols="auto" class="py-8">
                <v-icon
                  icon="mdi-clipboard-text-off"
                  size="128"
                  color="grey-lighten-1"
                  class="mb-6 empty-icon"
                />
                <v-list-item-title class="text-h5 font-weight-medium text-grey-lighten-1 mb-2">
                  No tasks in this project
                </v-list-item-title>
                <v-list-item-subtitle class="text-subtitle-1 text-grey-lighten-1">
                  Start by creating your first task!
                </v-list-item-subtitle>
              </v-col>

              <v-col cols="auto">
                <v-btn
                  :class="xs ? '' : 'px-8'"
                  :block="xs"
                  class="text-none text-button"
                  color="red-accent-2"
                  variant="tonal"
                  rounded="pill"
                  size="large"
                  prepend-icon="mdi-plus-circle-outline"
                  @click="handleAddTaskClick"
                >
                  New Task
                  <v-tooltip activator="parent" location="bottom" class="add-task-tooltip"
                    >Create a new task in this project</v-tooltip
                  >
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </template>
        <v-row class="pa-3">
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
              Page {{ taskStore.state.currentPage }} of {{ taskStore.totalPages }}
            </template>
          </VPagination>
        </v-row>

        <v-dialog
          v-model="dialogEditProject"
          :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
          class="dialog dialog-edit-project"
        >
          <v-card class="card card-edit-project pa-4">
            <v-card-title class="card-title card-title-edit-project">
              <span class="text-h5">Edit Project {{ taskStore.selectedProject }} </span>
            </v-card-title>
            <v-card-text>
              <v-form
                class="form form-edit-project"
                ref="form"
                @submit.prevent="submitEditedProject"
              >
                <v-text-field
                  v-model="projectStore.editedProject.title"
                  placeholder="Enter project title"
                  prepend-inner-icon="mdi-format-title"
                  type="text"
                  variant="plain"
                  color="red-darken-2"
                  :rules="titleRules"
                  clearable
                  required
                ></v-text-field>
                <v-divider class="mb-4"></v-divider>
                <v-text-field
                  v-model="projectStore.editedProject.icon"
                  placeholder="Icon"
                  prepend-inner-icon="mdi-symbol"
                  type="text"
                  variant="plain"
                  color="red-darken-2"
                  :rules="iconRules"
                  clearable
                  required
                ></v-text-field>
                <v-divider class="mb-4"></v-divider>
                <v-select
                  v-model="projectStore.editedProject.color"
                  label="Color"
                  prepend-inner-icon="mdi-palette"
                  variant="plain"
                  color="red-darken-2"
                  :rules="colorRules"
                  clearable
                  required
                  :items="dataStore.colors"
                ></v-select>
                <v-divider class="mb-4"></v-divider>
              </v-form>
            </v-card-text>
            <v-card-actions
              :class="
                smAndDown
                  ? 'd-flex flex-column align-center'
                  : 'd-flex flex-wrap justify-space-around'
              "
            >
              <VActionButtons :buttons="btnsFormProject" />
            </v-card-actions>
          </v-card>
        </v-dialog>
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
      </template>
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
