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
import VTaskForm from '@/components/VTaskForm.vue'

const dataStore = useDataStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const { submitEditedTask } = useSubmitEditedTask()

const showCards = ref(false)
const form = ref(null)
const showAlert = ref(false)

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
