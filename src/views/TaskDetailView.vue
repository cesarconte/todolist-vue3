<script setup>
import VCardTask from '@/components/VCardTask.vue'
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useRouter } from 'vue-router'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useResetForm } from '@/composables/useResetForm'
import VActionButtons from '@/components/VActionButtons.vue'
import VTaskForm from '@/components/VTaskForm.vue'
import { useDisplay } from 'vuetify'

const dataStore = useDataStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const router = useRouter()

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

const goBack = () => {
  router.back()
}

const rules = useMaxLengthRule()

const { xs, sm, smAndUp, md, lg, xl } = useDisplay()
</script>

<template>
  <v-container fluid class="mt-6">
    <v-responsive
      class="task-detail-container mx-auto"
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
    >
      <v-row>
        <v-col cols="12">
          <h2 v-if="task" class="text-h5 font-weight-bold mb-4 text-red-darken-2">
            Task {{ task.title }}
          </h2>
          <v-divider
            color="red-darken-2"
            :thickness="1"
            class="mx-auto border-opacity-50"
          ></v-divider>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="11" md="10" lg="9" xl="8" class="mx-auto px-4">
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
                :startDateHour="task.startDateHour"
                :endDateHour="task.endDateHour"
                @edit-task="() => taskStore.editTask(task.id)"
                @delete-task="(projectId, taskId) => taskStore.deleteTask(projectId, taskId)"
                @complete-task="(projectId, taskId) => taskStore.completeTask(projectId, taskId)"
              />
            </template>
            <template #fallback>
              <div class="fallback">Loading...</div>
            </template>
          </Suspense>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <div class="d-flex justify-space-between">
            <v-spacer></v-spacer>
            <v-btn
              @click="goBack"
              color="red-darken-2"
              variant="flat"
              rounded
              size="large"
              prepend-icon="mdi-chevron-left"
              :class="xs ? '' : 'px-8'"
              class="text-none text-button mb-8 mt-8"
              aria-label="Go back to previous page"
            >
              Back
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
  <v-dialog
    v-model="taskStore.dialogEditTask"
    :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
    class="dialog dialog-edit-task"
  >
    <v-card class="card card-edit-task pa-4">
      <v-card-title class="card-title card-title-edit-task">
        <span class="text-h6">Edit task {{ taskStore.editedTask.title }}</span>
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
          smAndDown ? 'd-flex flex-column align-center' : 'd-flex flex-wrap justify-space-around'
        "
      >
        <VActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
