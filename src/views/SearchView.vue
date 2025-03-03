<script setup>
import { useDataStore } from '@/stores/dataStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useDisplay } from 'vuetify'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import VCardTask from '@/components/VCardTask.vue'
import VActionButtons from '@/components/VActionButtons.vue'
import VPagination from '@/components/VPagination.vue'
import { ref, watchEffect } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const dataStore = useDataStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const showCards = ref(false)
const form = ref(null)
const showAlert = ref(false)

// Watch for changes in any of the filters and fetch filtered tasks
watchEffect(async () => {
  // Check if any filter is active
  const hasFiltersSelected = taskStore.searchTaskTitle

  if (userStore.isLoggedIn) {
    // Check if logged in only before fetching data
    if (hasFiltersSelected) {
      await taskStore.getFilteredTasksPaginated()
      showCards.value = true
    } else {
      taskStore.filteredTasks.value = []
      showCards.value = false
    }
  } else if (hasFiltersSelected) {
    // User is not logged in and tried to use filters
    showAlert.value = true
  }
})

// Define the submitEditedTask function to save the edited task to Firestore
const submitEditedTask = async () => {
  try {
    // Save the edited task to Firestore
    await dataStore.updateTask(dataStore.editedTask.id, dataStore.editedTask)
    // Close the dialog
    taskStore.dialogEditTask = false
  } catch (error) {
    console.error(error)
    alert('Error saving task. Please try again.', error)
  }
}

// Define the reset function to reset the form values
const reset = () => {
  form.value.reset()
  alert('Form has been reset.')
}

// Define the buttons Form array
const btnsForm = [
  {
    type: 'submit',
    height: '3rem',
    text: 'Save Edit',
    icon: 'mdi-check',
    function: submitEditedTask
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
    function: () => (taskStore.dialogEditTask = false)
  }
]

onBeforeRouteLeave((to, from, next) => {
  // Reset filters, pagination and UI elements in one go
  taskStore.resetFilters()

  next()
})

const rules = useMaxLengthRule()

const { xs, sm, smAndDown, smAndUp, md, lg, xl } = useDisplay()
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
        <v-col cols="12" sm="6" class="mx-auto">
          <v-text-field
            v-model="taskStore.searchTaskTitle"
            label="Search by title"
            :placeholder="userStore.isLoggedIn ? 'Enter task title...' : 'Log in to search...'"
            type="text"
            variant="outlined"
            rounded="pill"
            clearable
            hide-details
            dense
            color="red-accent-1"
          />
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
        class="mt-8 mx-auto rounded-pill"
      >
        {{ error }}
      </v-alert>

      <v-alert
        v-model="showAlert"
        type="warning"
        dense
        outlined
        closable
        height="4rem"
        width="32rem"
        class="mt-8 mx-auto rounded-pill"
      >
        Please, log in to use filters
        <v-btn icon class="ml-4" variant="plain" @click="$router.push('/login')">
          <v-icon>mdi-account-arrow-right-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            <span>Log in to unlock filter options</span>
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
        <v-col
          v-for="(task, i) in taskStore.filteredTasks"
          :key="i"
          :task="task"
          :value="task"
          :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '9' : xl ? '8' : ''"
          class="py- mx-auto"
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
        <v-col
          v-if="taskStore.noResultsMessage"
          :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
          lg="6"
          class="mx-auto"
        >
          <v-alert
            type="error"
            dense
            outlined
            closable
            class="rounded-pill text-center text-subtitle-1"
            color="red-darken-2"
          >
            <span>No tasks found for the selected filters.</span>
          </v-alert>
        </v-col>
      </v-row>
      <v-row v-if="showCards && taskStore.filteredTasks.length" class="pa-3">
        <VPagination
          :currentPage="taskStore.currentPage"
          :totalPages="taskStore.totalPagesInFilteredTasks"
          :hasPrevPage="taskStore.hasPrevPage"
          :hasNextPage="taskStore.hasNextPage"
          @prev-page="taskStore.getFilteredTasksPaginated({ prev: true })"
          @next-page="taskStore.getFilteredTasksPaginated({ next: true })"
          @first-page="taskStore.getFilteredTasksPaginated({ first: true })"
          @last-page="taskStore.getFilteredTasksPaginated({ last: true })"
        >
          <template #default>
            Page {{ taskStore.currentPage }} of {{ taskStore.totalPagesInFilteredTasks }}
          </template>
        </VPagination>
      </v-row>
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
            <v-form class="form form-edit-task" ref="form" @submit.prevent="submitEditedTask">
              <v-text-field
                v-model="dataStore.editedTask.title"
                placeholder="Enter title"
                prepend-inner-icon="mdi-format-title"
                type="text"
                variant="plain"
                color="red-darken-2"
                counter
                :rules="rules"
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
                counter
                :rules="rules"
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
              <v-text-field
                v-model="dataStore.editedTask.startDate"
                label="Start Date"
                type="date"
                variant="plain"
                color="red-darken-2"
                clearable
                required
                class="date-create-task"
              >
              </v-text-field>
              <v-divider class="mb-4"></v-divider>
              <v-text-field
                v-model="dataStore.editedTask.endDate"
                label="End Date"
                type="date"
                variant="plain"
                color="red-darken-2"
                clearable
                required
                class="date-create-task"
              >
              </v-text-field>
            </v-form>
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
