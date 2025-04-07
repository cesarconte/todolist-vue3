<script setup>
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import VActionButtons from '@/components/VActionButtons.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import VCardTask from '@/components/VCardTask.vue'
import VPagination from '@/components/VPagination.vue'
import VTaskForm from '@/components/VTaskForm.vue'

const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dataStore = useDataStore()
const { submitEditedTask } = useSubmitEditedTask()

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

onMounted(async () => {
  taskStore.setSelectedProject(props.projectName)
  await taskStore.getTasksByProjectPaginated()
})

const form = ref(null)
const dialogEditProject = ref(false)
const progressPercentage = ref(0)

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
  } catch (error) {
    console.error(error)
    alert('Error saving project. Please try again.', error)
  }
}

// Define the reset function to reset the form values
const reset = () => {
  form.value.reset()
  alert('Form has been reset.')
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

// Define the buttons Project array
const btnsProject = [
  {
    label: 'Edit project',
    text: 'Edit project',
    icon: 'mdi-pencil',
    function: () => {
      const projectId = projectStore.projects.find(
        (project) => project.title === taskStore.selectedProject
      )?.id
      if (projectId) {
        editProject(projectId)
      } else {
        // Handle the case where the project is not found
        console.error('Project not found:', taskStore.selectedProject)
      }
    }
  },
  {
    text: 'Delete project',
    label: 'Delete project',
    icon: 'mdi-delete',
    function: () => {
      const projectId = projectStore.projects.find(
        (project) => project.title === taskStore.selectedProject
      )?.id
      if (projectId) {
        projectStore.deleteProject(projectId)
      } else {
        // Handle the case where the project is not found
        console.error('Project not found:', taskStore.selectedProject)
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

const totalTasksIcon = computed(() => {
  return taskStore.tasksInSelectedProject.length > 1
    ? 'mdi-clipboard-text-multiple-outline'
    : 'mdi-clipboard-text-outline'
})

const completedTasksIcon = computed(() => {
  return taskStore.completedTasksInSelectedProject.length > 1
    ? 'mdi-calendar-multiple-check'
    : 'mdi-calendar-check-outline'
})

watch(
  () => [taskStore.completedTasksInSelectedProject, taskStore.tasksInSelectedProject],
  () => {
    progressPercentage.value = Math.round(
      (taskStore.completedTasksInSelectedProject.length / taskStore.tasksInSelectedProject.length) *
        100
    )
  },
  { immediate: true } // Calculate initially on component mount
)

const { xs, sm, smAndDown, smAndUp, md, mdAndDown, lg, xl } = useDisplay()
</script>

<template>
  <v-container fluid class="my-6">
    <v-responsive
      class="tasksByProject-container mx-auto"
      :class="xs ? 'pa-1' : ''"
      :max-width="xs ? '100vw' : sm ? '80vw' : md ? '70vw' : lg ? '65vw' : xl ? '60vw' : ''"
    >
      <v-row>
        <v-col cols="12" class="d-flex justify-content-between align-items-center">
          <h2 class="text-left text-h4 font-weight-bold text-red-darken-2 d-flex align-self-center">
            {{ taskStore.selectedProject }} project tasks
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
                <strong class="text-red-darken-2 text-h6"
                  >Total: {{ taskStore.tasksInSelectedProject.length }}</strong
                >
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <v-row class="d-flex align-items-center align-content-center">
              <v-col cols="auto" class="d-flex align-items-center">
                <v-icon
                  icon="mdi-calendar-clock-outline"
                  class="me-3 d-flex align-self-center"
                ></v-icon>
                <strong class="d-flex align-self-center"
                  >Remaining: {{ taskStore.pendingTasksInSelectedProject.length }}</strong
                >
              </v-col>
              <v-divider class="mx-4 my-2" vertical></v-divider>
              <v-col cols="auto" class="d-flex align-items-center">
                <v-icon class="me-3 d-flex align-self-center" :icon="completedTasksIcon"> </v-icon>
                <strong class="d-flex align-self-center"
                  >Completed: {{ taskStore.completedTasksInSelectedProject.length }}</strong
                >
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
      <v-row class="tasks d-flex flex-wrap align-items-center justify-content-center">
        <v-divider
          color="red-darken-2"
          :thickness="1"
          class="mx-auto border-opacity-50 mb-4"
        ></v-divider>
        <v-col
          v-for="(task, i) in taskStore.allTasksProject"
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
                @edit-task="taskStore.editTask(task.id)"
                @delete-task="dataStore.deleteTask(task.id)"
                @complete-task="taskStore.completeTask(task.id)"
              >
              </VCardTask>
            </template>
            <template #fallback>
              <div class="fallback">Loading...</div>
            </template>
          </Suspense>
        </v-col>
      </v-row>
      <v-row class="pa-3">
        <VPagination
          :currentPage="taskStore.currentPage"
          :totalPages="taskStore.totalPagesInSelectedProject"
          :hasPrevPage="taskStore.hasPrevPage"
          :hasNextPage="taskStore.hasNextPage"
          @prev-page="taskStore.getTasksByProjectPaginated({ prev: true })"
          @next-page="taskStore.getTasksByProjectPaginated({ next: true })"
          @first-page="taskStore.getTasksByProjectPaginated({ first: true })"
          @last-page="taskStore.getTasksByProjectPaginated({ last: true })"
        >
          <template #default>
            Page {{ taskStore.currentPage }} of {{ taskStore.totalPagesInSelectedProject }}
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
            <v-form class="form form-edit-project" ref="form" @submit.prevent="submitEditedProject">
              <v-text-field
                v-model="projectStore.editedProject.title"
                placeholder="Enter project title"
                prepend-inner-icon="mdi-format-title"
                type="text"
                variant="plain"
                color="red-darken-2"
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
            <span class="text-h6">Edit task {{ dataStore.editedTask.title }} </span>
          </v-card-title>
          <v-card-text>
            <VTaskForm
              v-model="dataStore.editedTask"
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
