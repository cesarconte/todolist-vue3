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
const { reset } = useResetForm(form)

const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

// Get the task from Firestore
/* ==> El computed en TaskDetailView.vue asegura que la vista se actualice en tiempo real
cuando se producen cambios en la base de datos de Firebase.
La reactividad de computed permite que las ediciones en Firebase se reflejen en la vista.
* ==> Importante: la reactividad de computed funciona porque dataStore.tasks es un array reactivo.
Si dataStore.tasks no fuera reactivo, computed no se recalcularía y la vista no se actualizaría. */
const task = computed(() => {
  return taskStore.tasksData.find((task) => task.id === props.taskId)
})

// Reset the form
// const reset = () => {
//   form.value.reset()
//   alert('Form has been reset')
// }

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

const { xs, sm, smAndUp, md, lg, xl, mobile } = useDisplay()
</script>

<template>
  <v-container fluid class="mt-6">
    <v-responsive
      class="task-detail-container mx-auto"
      :max-width="xs ? '100vw' : sm ? '80vw' : md ? '70vw' : lg ? '65vw' : xl ? '60vw' : ''"
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
              class="btn-back rounded-pill bg-red-darken-2 text-white text-none"
              variant="flat"
              ><v-icon>mdi-chevron-left</v-icon>Back</v-btn
            >
          </div>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
  <v-dialog
    v-model="taskStore.dialogEditTask"
    :max-width="xs ? '100%' : smAndUp ? '600px' : ''"
    class="dialog dialog-create-task"
  >
    <v-card class="card card-create-task pa-4">
      <v-card-title class="card-title card-title-edit-task" :class="mobile ? 'px-1' : ''">
        <span class="text-h6">Edit task {{ task.taskId }}</span>
      </v-card-title>
      <v-card-text :class="mobile ? 'px-0' : ''">
        <VTaskForm
          v-model="taskStore.editedTask"
          :projects="projectStore.projects"
          :labels="dataStore.labels"
          :priorities="dataStore.priorities"
          :statuses="dataStore.statuses"
          :rules="rules"
          ref="form"
          @submit="taskStore.updateTask"
        ></VTaskForm>
      </v-card-text>
      <v-card-actions class="justify-center">
        <VActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
