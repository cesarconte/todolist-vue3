<!-- FilterAndLabelsView.vue  -->

<script setup>
import VActionButtons from '@/components/VActionButtons.vue'
import VCardTask from '@/components/VCardTask.vue'
import VPagination from '@/components/VPagination.vue'
import VTaskForm from '@/components/VTaskForm.vue'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useResetForm } from '@/composables/useResetForm'
import { useSubmitEditedTask } from '@/composables/useSubmitEditedTask'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const dataStore = useDataStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()

const form = ref(null)
const { submitEditedTask } = useSubmitEditedTask()
const { reset } = useResetForm(form)

const showCards = ref(false)
const showAlert = ref(false)

const hasActiveFilters = () => {
  return (
    taskStore.state.selectedProjects.length > 0 ||
    taskStore.state.selectedPriorities.length > 0 ||
    taskStore.state.selectedStatuses.length > 0 ||
    taskStore.state.selectedLabels.length > 0 ||
    !!taskStore.state.selectedEndDate ||
    !!taskStore.state.searchTerm
  )
}

// Cleanup al desmontar el componente
onUnmounted(() => {
  taskStore.resetFilters()
})

// Manejar cambios en filtros
watch(
  [
    () => taskStore.state.filteredTasks,
    () => taskStore.state.selectedProjects,
    () => taskStore.state.selectedPriorities,
    () => taskStore.state.selectedStatuses,
    () => taskStore.state.selectedLabels,
    () => taskStore.state.selectedEndDate,
    () => taskStore.state.searchTerm
  ],
  () => {
    showCards.value = hasActiveFilters() && taskStore.state.filteredTasks.length > 0
  },
  { immediate: true }
)

const handleFilterClick = () => {
  if (!userStore.isLoggedIn) showAlert.value = true
}

const handleClearDate = () => {
  taskStore.state.selectedEndDate = null
}

const { btnsForm } = useFormBtnActions(
  submitEditedTask,
  reset,
  () => (taskStore.state.isEditing = false)
)
btnsForm[0].text = 'Update Task'
btnsForm[0].icon = 'mdi-pencil'

const rules = useMaxLengthRule()
const { mobile, xs, sm, smAndDown, smAndUp, md, mdAndDown, mdAndUp, lg, xl } = useDisplay()
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
      <!-- Filtros -->
      <v-row>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="taskStore.state.selectedProjects"
            :items="userStore.isLoggedIn ? projectStore.projectItems : []"
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
            v-model="taskStore.state.selectedPriorities"
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
            v-model="taskStore.state.selectedLabels"
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
            v-model="taskStore.state.selectedStatuses"
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
            v-model="taskStore.state.selectedEndDate"
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

      <!-- Alertas -->
      <v-alert
        v-if="taskStore.state.error"
        type="error"
        dense
        outlined
        closable
        height="4rem"
        width="32rem"
        class="mt-8 mx-auto rounded-pill"
      >
        {{ taskStore.state.error }}
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

      <!-- Lista de tareas y mensajes -->
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
          <v-col v-for="n in 4" :key="n" cols="12" md="6" lg="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </template>

        <template v-else-if="showCards">
          <v-col
            v-for="task in taskStore.state.filteredTasks"
            :key="task.id"
            :cols="xs ? '12' : sm ? '11' : md ? '10' : lg ? '12' : xl ? '12' : ''"
            lg="6"
            :class="mdAndDown ? 'mx-auto' : ''"
          >
            <VCardTask
              :title="task.title"
              :id="task.id"
              :description="task.description"
              :label="task.label"
              :priority="task.priority"
              :status="task.status"
              :start-date="task.startDate"
              :end-date="task.endDate"
              :completed="task.completed"
              :color="task.project?.color"
              :project="task.project"
              :created-at="task.createdAt"
              :startDateHour="task.startDateHour"
              :endDateHour="task.endDateHour"
              @edit-task="taskStore.editTask(task.id)"
              @delete-task="taskStore.deleteTask(task.projectId, task.id)"
              @complete-task="taskStore.completeTask(task.projectId, task.id)"
            />
          </v-col>
        </template>
      </v-row>
      <v-row v-if="!hasActiveFilters()">
        <v-col :cols="mobile ? '12' : '9 mx-auto'">
          <v-alert
            type="info"
            class="text-center"
            :class="mobile ? '' : 'ma-2'"
            variant="tonal"
            rounded="pill"
            closable
          >
            Use the filters above to search for tasks
          </v-alert>
        </v-col>
      </v-row>
      <v-row
        v-if="
          hasActiveFilters() &&
          !taskStore.state.isLoading &&
          taskStore.state.filteredTasks.length === 0
        "
      >
        <v-col :cols="mobile ? '12' : '9 mx-auto'">
          <v-alert
            type="info"
            class="text-center"
            :class="mobile ? '' : 'ma-2'"
            variant="tonal"
            rounded="pill"
            closable
          >
            No tasks found with current filters
          </v-alert>
        </v-col>
      </v-row>

      <!-- Paginación -->
      <v-row v-if="taskStore.totalPages >= 1" class="pa-3">
        <VPagination
          :currentPage="taskStore.state.currentPage"
          :totalPages="taskStore.totalPages"
          :hasPrevPage="taskStore.state.hasPrevPage"
          :hasNextPage="taskStore.state.hasNextPage"
          @prev-page="taskStore.prevPage"
          @next-page="taskStore.nextPage"
          @first-page="taskStore.firstPage"
          @last-page="taskStore.lastPage"
        >
          <template #default>
            Page {{ taskStore.state.currentPage }} of {{ taskStore.totalPages }}
          </template>
        </VPagination>
      </v-row>

      <!-- Diálogo de edición -->
      <v-dialog
        v-model="taskStore.state.isEditing"
        :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
        class="dialog dialog-edit-task"
      >
        <v-card class="card card-edit-task pa-4">
          <v-card-title class="card-title card-title-edit-task">
            <!-- <span class="text-h6">Edit task {{ taskStore.editedTask.title }} </span> -->
            <span class="text-h6">Edit task </span>
          </v-card-title>
          <v-card-text>
            <VTaskForm
              v-model="taskStore.state.editingTask"
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
  top: 42%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}

.tasks {
  min-height: 60vh;
  position: relative;
  transition: opacity 0.3s ease;
}

.tasks-loading {
  opacity: 0.5;
  pointer-events: none;
}

.fallback {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 16px;
}

.v-col .fallback {
  height: 200px;
  width: 100%;
}

.date-create-task {
  max-width: 300px;
  margin: 0 auto;
}
</style>
