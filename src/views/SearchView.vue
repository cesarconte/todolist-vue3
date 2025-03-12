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

const dataStore = useDataStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const showCards = ref(false)
const form = ref(null)
const showAlert = ref(false)

// Time Picker states
const menuStart = ref(false)
const menuEnd = ref(false)

// Watch for changes in any of the filters and fetch filtered tasks
watchEffect(async () => {
  // Check if any filter is active
  const hasFiltersSelected = taskStore.searchTaskTitle // Search by title

  if (userStore.isLoggedIn) {
    // Check if logged in only before fetching data
    if (hasFiltersSelected) {
      await taskStore.getFilteredTasksPaginated() // Fetch filtered tasks
      showCards.value = true // Show the cards
    } else {
      taskStore.filteredTasks.value = [] // Reset the filtered tasks
      showCards.value = false // Hide the cards
    }
  } else if (hasFiltersSelected) {
    // User is not logged in and tried to use filters
    showAlert.value = true // Show the alert
  }
})

// Define the handleSearchClick function to handle the search click event
const handleSearchClick = () => {
  if (!userStore.isLoggedIn) {
    showAlert.value = true // Show the alert
  }
}

// Function to format the date as YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  const year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

// Define the submitEditedTask function to save the edited task to Firestore
const submitEditedTask = async () => {
  try {
    // Format the start and end dates
    const formattedStartDate = formatDate(dataStore.editedTask.startDate)
    const formattedEndDate = formatDate(dataStore.editedTask.endDate)

    // Create a new object with the formatted dates
    const editedTaskData = {
      ...dataStore.editedTask,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }
    // Save the edited task to Firestore
    await dataStore.updateTask(dataStore.editedTask.id, editedTaskData)
    // Close the dialog
    taskStore.dialogEditTask = false
  } catch (error) {
    console.error(error)
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
        <v-col cols="12" md="9" lg="6" class="mx-auto">
          <v-autocomplete
            v-model="taskStore.searchTaskTitle"
            :items="userStore.isLoggedIn ? taskStore.tasks : []"
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
        type="warning"
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

<style scoped>
.alert {
  position: fixed;
  top: 37%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}
</style>
