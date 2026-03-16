<script setup>
import CardTask from '@/components/tasks/CardTask.vue'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useSubmitEditedTask } from '@/composables/forms/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/forms/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/forms/validationFormRules.js'
import { useResetForm } from '@/composables/forms/useResetForm'
import ActionButtons from '@/components/tasks/ActionButtons.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import { useDisplay } from 'vuetify'
import BackButton from '@/components/ui/BackButton.vue'

const dataStore = useDataStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const form = ref(null)
const { submitEditedTask } = useSubmitEditedTask()

// Callback para restaurar el modelo reactivo de la tarea editada
const resetEditTaskFormState = () => {
  const originalTask = taskStore.tasksData.find((t) => t.id === taskStore.editedTask.id)
  if (originalTask) {
    Object.assign(taskStore.editedTask, { ...originalTask })
  } else {
    // Si no se encuentra, limpia el modelo
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

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const task = computed(() => {
  return taskStore.tasksData.find((task) => task.id === props.taskId)
})

const { btnsForm } = useFormBtnActions(
  submitEditedTask,
  reset,
  () => (taskStore.dialogEditTask = false)
)

btnsForm[0].text = 'Update Task'
btnsForm[0].icon = 'mdi-pencil'


const rules = useMaxLengthRule()

const { xs, sm, smAndDown, mobile, smAndUp, md, lg, xl } = useDisplay()

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
})
</script>

<template>
  <v-container :class="xs ? '' : 'pa-4'" fluid>
    <v-responsive
      class="task-detail-container mx-auto"
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
    >
      <v-row>
        <v-col cols="12">
          <h2
            v-if="task"
            class="text-left text-on-surface font-weight-bold"
            :class="xs ? 'text-h5 my-4' : mobile ? 'text-h4 my-6' : 'text-h3 my-8'"
          >
            Task {{ task.title }}
          </h2>
          <BackButton 
            to="/" 
            aria-label="Back to Home" 
          />
          <v-divider></v-divider>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="11" md="10" lg="9" xl="8" class="mx-auto px-4">
          <Suspense>
            <template #default>
              <CardTask
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
                :startDateHour="task.startDateHour"
                :endDateHour="task.endDateHour"
                @edit-task="() => taskStore.editTask(task.id)"
                @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
                @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
              />
            </template>
            <template #fallback>
              <v-card flat color="surface-variant" rounded="lg" class="pa-6 d-flex flex-column align-center justify-center">
                <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
                <v-sheet 
                  color="transparent" 
                  class="text-body-1 text-on-surface-variant"
                >
                  Loading task details...
                </v-sheet>
              </v-card>
            </template>
          </Suspense>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
  <v-dialog
    v-model="taskStore.dialogEditTask"
    :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
    class="dialog dialog-edit-task"
    scrollable
  >
    <v-card v-if="taskStore.editedTask" class="card card-edit-task pa-6" rounded="lg" elevation="4">
      <v-card-title class="card-title card-title-edit-task">
        <span class="text-h6">Edit task {{ taskStore.editedTask.title }}</span>
      </v-card-title>
      <v-card-text>
        <TaskForm
          v-model="taskStore.editedTask"
          :projects="projectStore.projects"
          :labels="dataStore.labels"
          :priorities="dataStore.priorities"
          :statuses="dataStore.statuses"
          :rules="rules"
          ref="form"
          @submit="submitEditedTask"
        ></TaskForm>
      </v-card-text>
      <v-card-actions
        :class="
          smAndDown ? 'd-flex flex-column align-center' : 'd-flex flex-wrap justify-space-around'
        "
      >
        <ActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
