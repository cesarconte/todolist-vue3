<!-- FilterAndLabelsView.vue  -->

<script setup>
import { ref, watchEffect } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useDisplay } from 'vuetify'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import VCardTask from '@/components/VCardTask.vue'
import VActionButtons from '@/components/VActionButtons.vue'
import VPagination from '@/components/VPagination.vue'

const dataStore = useDataStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const { submitEditedTask } = useSubmitEditedTask()

const showCards = ref(false)
const form = ref(null)
const showAlert = ref(false)

// Time Picker states
const menuStart = ref(false)
const menuEnd = ref(false)

// Watch for changes in any of the filters and fetch filtered tasks
watchEffect(async () => {
  // Check if any filter is active
  const hasFiltersSelected =
    taskStore.selectedProjects.length > 0 ||
    taskStore.selectedPriorities.length > 0 ||
    taskStore.selectedStatuses.length > 0 ||
    taskStore.selectedLabels.length > 0 ||
    taskStore.selectedEndDate

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

// Define the handleProjectClick function to show an alert if the user is not logged in
const handleFilterClick = () => {
  if (!userStore.isLoggedIn) {
    showAlert.value = true // Show the alert
  }
}

const handleClearDate = () => {
  taskStore.selectedEndDate = null
  taskStore.getFilteredTasksPaginated()
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

const rules = useMaxLengthRule()

const { xs, sm, smAndDown, smAndUp, md, mdAndDown, mdAndUp, lg, xl } = useDisplay()

/* Here's a breakdown of why the code works:

1. ==> selectedEndDate Ref: You're using a ref to store the selected date from the v-text-field.
This ref will hold a string representation of the date in the format "YYYY-MM-DD".

2. ==> fetchFilteredTasks Function:
* Inside the fetchFilteredTasks function, you're creating a new Date object using new Date(selectedEndDate.value).
This converts the string date into a JavaScript Date object.
* You're then directly using this Date object in the where clause:
q = query(q, where('endDate', '==', endDateTimestamp)).

3. ==> Firestore Timestamps: Firestore stores dates as timestamps.
When you pass a JavaScript Date object to the where clause,
Firestore automatically converts it to a timestamp for comparison.

Therefore, your code is already handling the date conversion correctly without the need
for an explicit convertDateToFirestore function.

Key Points:

- Firestore Date Handling: Firestore is smart enough to handle date conversions
when you pass JavaScript Date objects to the where clause. */
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
          <h2 class="text-h4 font-weight-bold text-red-darken-2 text-center">
            Filter and Label Tasks
          </h2>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="taskStore.selectedProjects"
            :items="userStore.isLoggedIn ? dataStore.projectItems : []"
            :placeholder="userStore.isLoggedIn ? 'Select project...' : 'Login to view projects...'"
            item-value="value"
            item-title="title"
            label="Filter by project..."
            variant="outlined"
            rounded
            clearable
            hide-details
            dense
            auto-select-first
            multiple
            chips
            closable-chips
            color="red-accent-2"
            @click="handleFilterClick"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="taskStore.selectedPriorities"
            :items="userStore.isLoggedIn ? dataStore.priorityItems : []"
            item-value="value"
            item-title="title"
            label="Filter by priority"
            :placeholder="
              userStore.isLoggedIn ? 'Select priority...' : 'Log in to view priorities.'
            "
            variant="outlined"
            rounded
            clearable
            hide-details
            dense
            auto-select-first
            chips
            closable-chips
            multiple
            color="red-accent-2"
            @click="handleFilterClick"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="taskStore.selectedLabels"
            :items="userStore.isLoggedIn ? dataStore.labelItems : []"
            item-value="value"
            item-title="title"
            label="Filter by label"
            :placeholder="userStore.isLoggedIn ? 'Select label...' : 'Log in to view labels.'"
            variant="outlined"
            rounded
            clearable
            hide-details
            dense
            auto-select-first
            multiple
            chips
            closable-chips
            color="red-accent-2"
            @click="handleFilterClick"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="taskStore.selectedStatuses"
            :items="userStore.isLoggedIn ? dataStore.statusItems : []"
            item-value="value"
            item-text="text"
            label="Filter by status"
            :placeholder="userStore.isLoggedIn ? 'Select status...' : 'Log in to view statuses.'"
            variant="outlined"
            rounded
            clearable
            hide-details
            dense
            auto-select-first
            chips
            closable-chips
            multiple
            color="red-accent-2"
            @click="handleFilterClick"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6" :class="mdAndUp ? 'mx-auto' : ''">
          <v-date-input
            v-model="taskStore.selectedEndDate"
            :items="userStore.isLoggedIn ? dataStore.endDate : []"
            label="Filter by end date"
            clearable
            variant="outlined"
            rounded
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            color="red-accent-2"
            class="date-create-task"
            @click:clear="handleClearDate"
          >
          </v-date-input>
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
        :width="xs ? '90%' : '32rem'"
        class="alert mt-8 rounded-pill"
      >
        <span>
          {{ xs ? 'Please, log in...' : 'Please, log in to use the filters' }}
        </span>
        <v-btn icon class="ml-2" variant="plain" @click="$router.push('/login')">
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
          :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
          lg="6"
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
                label="Title"
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
                label="Description"
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
  top: 42%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}
</style>
