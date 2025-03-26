<script setup>
import VCardTask from '@/components/VCardTask.vue'
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useRouter } from 'vue-router'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import VActionButtons from '@/components/VActionButtons.vue'
import VTaskForm from '@/components/VTaskForm.vue'
import { useDisplay } from 'vuetify'

const dataStore = useDataStore()
const taskStore = useTaskStore()
const router = useRouter()
const { submitEditedTask } = useSubmitEditedTask()

// Time Picker states
// const menuStart = ref(false)
// const menuEnd = ref(false)

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  taskId: {
    type: String,
    required: true
  }
})

const form = ref(null)
// Get the task from Firestore
/* ==> El computed en TaskDetailView.vue asegura que la vista se actualice en tiempo real
cuando se producen cambios en la base de datos de Firebase.
La reactividad de computed permite que las ediciones en Firebase se reflejen en la vista.
* ==> Importante: la reactividad de computed funciona porque dataStore.tasks es un array reactivo.
Si dataStore.tasks no fuera reactivo, computed no se recalcularía y la vista no se actualizaría. */
const task = computed(() => {
  return dataStore.tasks.find((task) => task.id === props.taskId)
})

// Reset the form
const reset = () => {
  form.value.reset()
  alert('Form has been reset')
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
                @edit-task="taskStore.editTask(task.id)"
                @delete-task="dataStore.deleteTask(task.id)"
                @complete-task="taskStore.completeTask(task.id)"
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
        <!-- <v-form class="form form-create-task" ref="form" @submit.prevent>
          <v-text-field
            v-model="dataStore.editedTask.title"
            placeholder="Enter title"
            prepend-inner-icon="mdi-format-title"
            type="text"
            variant="plain"
            color="red-darken-2"
            :rules="rules"
            counter
            clearable
            required
          ></v-text-field>
          <v-divider class="mb-4"></v-divider>
          <v-textarea
            v-model="dataStore.editedTask.description"
            placeholder="Enter description"
            prepend-inner-icon="mdi-text"
            type="text"
            variant="plain"
            color="red-darken-2"
            required
            :rules="rules"
            counter
            clearable
          ></v-textarea>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.editedTask.project"
            label="Project"
            prepend-inner-icon="mdi-folder-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.projects"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.editedTask.label"
            label="Label"
            prepend-inner-icon="mdi-label-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.labels"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.editedTask.priority"
            label="Priority"
            prepend-inner-icon="mdi-star-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.priorities"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.editedTask.status"
            label="Status"
            prepend-inner-icon="mdi-checkbox-marked-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.statuses"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-date-input
            v-model="dataStore.editedTask.startDate"
            label="Start Date"
            required
            clearable
            variant="plain"
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            color="red-darken-2"
            class="date-create-task"
          >
          </v-date-input>
          <v-divider class="mb-4"></v-divider>
          <v-date-input
            v-model="dataStore.editedTask.endDate"
            label="End Date"
            required
            clearable
            variant="plain"
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            color="red-darken-2"
            class="date-create-task"
          >
          </v-date-input>
          <v-divider class="mb-4"></v-divider>
          <v-text-field
            v-model="dataStore.editedTask.startDateHour"
            label="Start Hour"
            placeholder="hh:mm"
            prepend-inner-icon="mdi-clock-time-four-outline"
            variant="plain"
            readonly
            clearable
            :active="menuStart"
            :focused="menuStart"
            color="red-darken-2"
            @click="menuStart = true"
          >
            <v-menu
              v-model="menuStart"
              :close-on-content-click="false"
              activator="parent"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <v-time-picker
                v-if="menuStart"
                v-model="dataStore.editedTask.startDateHour"
                format="24hr"
                full-width
                color="red-darken-2"
                scrollable
                required
                class="time-create-task justify-center w-100"
                :class="xs ? 'px-0' : ''"
                @click:minute="$nextTick(() => (menuStart = false))"
              ></v-time-picker>
            </v-menu>
          </v-text-field>
          <v-divider class="mb-4"></v-divider>
          <v-text-field
            v-model="dataStore.editedTask.endDateHour"
            label="Due Hour"
            placeholder="hh:mm"
            prepend-inner-icon="mdi-clock-time-four-outline"
            variant="plain"
            readonly
            clearable
            :active="menuEnd"
            :focused="menuEnd"
            @click="menuEnd = true"
          >
            <v-menu
              v-model="menuEnd"
              :close-on-content-click="false"
              activator="parent"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <v-time-picker
                v-if="menuEnd"
                v-model="dataStore.editedTask.endDateHour"
                format="24hr"
                full-width
                color="red-darken-2"
                scrollable
                required
                class="time-create-task justify-center w-100"
                :class="xs ? 'px-0' : ''"
                @click:minute="$nextTick(() => (menuEnd = false))"
              ></v-time-picker>
            </v-menu>
          </v-text-field>
          <v-divider class="mb-4"></v-divider>
        </v-form> -->
        <VTaskForm
          v-model="dataStore.editedTask"
          :projects="dataStore.projects"
          :labels="dataStore.labels"
          :priorities="dataStore.priorities"
          :statuses="dataStore.statuses"
          :rules="rules"
          ref="form"
          @submit="submitEditedTask"
        ></VTaskForm>
      </v-card-text>
      <v-card-actions class="justify-center">
        <VActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
