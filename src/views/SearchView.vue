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
import { useDataInitialization } from '@/composables/useDataInitialization'
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
const { reset } = useResetForm(form)

// Campo de búsqueda local (ahora almacena el objeto seleccionado)
const selectedTask = ref(null)

// Computed para filtrar tareas por título (case-insensitive)
const filteredTasks = computed(() => {
  if (!selectedTask.value) return []
  // Si el usuario selecciona una tarea del autocomplete, mostrar solo esa
  return taskStore.state.tasks.filter((task) => task.id === selectedTask.value.id)
})

const showCards = computed(() => filteredTasks.value.length > 0)

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

const { xs, sm, smAndDown, smAndUp, md, lg, xl } = useDisplay()

const { initializeData, cleanup } = useDataInitialization()

onMounted(() => {
  initializeData()
})

onUnmounted(() => {
  cleanup()
})
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
          <h2 class="text-h4 font-weight-bold text-red-darken-2 text-center">Search Tasks</h2>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="9" lg="6" class="mx-auto">
          <v-autocomplete
            v-model="selectedTask"
            :items="userStore.isLoggedIn ? taskStore.state.tasks : []"
            item-title="title"
            return-object
            :placeholder="userStore.isLoggedIn ? 'Enter task title...' : 'Log in to search...'"
            label="Search by title..."
            clearable
            density="default"
            rounded
            color="red-accent-2"
            hide-details
            dense
            variant="outlined"
            chips
            prepend-inner-icon="mdi-magnify"
            auto-select-first
            :multiple="false"
            @click="handleSearchClick"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <v-alert
        v-if="taskStore.error"
        type="error"
        dense
        outlined
        closable
        height="4rem"
        width="32rem"
        class="mt-8 mx-auto rounded-pill d-flex flex-wrap justify-center"
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
        class="alert mt-8 rounded-pill"
      >
        <span>
          {{ xs ? 'Please, log in...' : 'Please, log in to use the search feature' }}
        </span>
        <v-btn icon class="ml-2" variant="plain" @click="$router.push('/login')">
          <v-icon>mdi-account-arrow-right-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            <span>Log in to unlock search option</span>
          </v-tooltip>
        </v-btn>
      </v-alert>

      <v-row
        class="tasks d-flex flex-wrap align-items-center justify-content-center"
        v-if="showCards"
      >
        <v-divider
          color="red-darken-2"
          :thickness="1"
          class="mx-auto border-opacity-50 mb-4"
        ></v-divider>
        <template v-if="taskStore.state.isLoading">
          <v-col cols="12" class="d-flex justify-center align-center" style="min-height: 200px">
            <v-skeleton-loader type="card" />
          </v-col>
        </template>
        <template v-else>
          <v-col
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            :value="task"
            :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '9' : xl ? '8' : ''"
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
          v-if="filteredTasks.length === 0 && selectedTask"
          :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
          lg="6"
          class="mx-auto"
        >
          <v-alert
            type="info"
            dense
            outlined
            closable
            class="rounded-pill text-center text-subtitle-1"
            color="red-darken-2"
          >
            <span>No tasks found for the search term.</span>
          </v-alert>
        </v-col>
      </v-row>
      <v-row v-if="showCards">
        <v-col cols="12" class="">
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
</style>
