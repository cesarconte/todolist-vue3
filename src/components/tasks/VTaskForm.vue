<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  projects: {
    type: Array,
    default: () => []
  },
  labels: {
    type: Array,
    default: () => []
  },
  priorities: {
    type: Array,
    default: () => []
  },
  statuses: {
    type: Array,
    default: () => []
  },
  rules: {
    type: Array,
    default: () => [(v) => !!v || 'This field is required']
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'invalid-project'])

const formData = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(formData, newValue)
  },
  { deep: true }
)

watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

watch(
  () => formData.projectId,
  (newProjectId) => {
    if (newProjectId && !props.projects.some((p) => p.id === newProjectId)) {
      formData.projectId = ''
      emit('invalid-project', newProjectId)
    }
  }
)

const menuStart = ref(false)
const menuEnd = ref(false)
const taskFormRef = ref(null)

defineExpose({
  validate: () => taskFormRef.value?.validate(),
  reset: () => {
    Object.assign(formData, props.modelValue)
    taskFormRef.value?.reset()
  },
  resetValidation: () => taskFormRef.value?.resetValidation()
})

const requiredRule = (label) => [(v) => !!v || `${label} is required`]
const titleRules = requiredRule('Title')
const descriptionRules = requiredRule('Description')
const projectRules = requiredRule('Project')
const labelRules = requiredRule('Label')
const priorityRules = requiredRule('Priority')
const statusRules = requiredRule('Status')
const startDateRules = requiredRule('Start Date')
const endDateRules = requiredRule('Due Date')

onMounted(() => {
  // Keep other onMounted logic if present
})

onUnmounted(() => {
  // Keep other onUnmounted logic if present
})
</script>

<template>
  <v-form class="form pa-6" ref="taskFormRef" @submit.prevent="$emit('submit')">
    <v-alert
      v-if="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
      type="warning"
      class="mb-6"
      border="start"
      border-color="warning"
      variant="tonal"
      color="warning"
      icon="mdi-alert-circle-outline"
      prominent
    >
      <span v-if="projects.length === 0"
        >You must create a project before creating a task.<br
      /></span>
      <span v-if="priorities.length === 0">You must define at least one priority.<br /></span>
      <span v-if="labels.length === 0">You must define at least one label.<br /></span>
      <span v-if="statuses.length === 0">You must define at least one status.<br /></span>
      The form is disabled until all required data is available.
    </v-alert>
    <v-text-field
      v-model="formData.title"
      label="Title"
      placeholder="Enter title"
      prepend-inner-icon="mdi-format-title"
      type="text"
      variant="outlined"
      color="primary"
      :rules="titleRules"
      counter
      clearable
      required
      class="mb-6"
      bg-color="surface-container"
      rounded
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-text-field>
    <v-divider class="mb-6"></v-divider>
    <v-textarea
      v-model="formData.description"
      label="Description"
      placeholder="Enter description"
      prepend-inner-icon="mdi-text"
      type="text"
      variant="outlined"
      color="primary"
      :rules="descriptionRules"
      counter
      clearable
      required
      class="mb-6"
      bg-color="surface-container"
      rounded="xl"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-textarea>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.projectId"
      label="Project"
      prepend-inner-icon="mdi-folder-outline"
      variant="outlined"
      color="primary"
      clearable
      required
      :items="projects"
      item-title="title"
      item-value="id"
      :rules="projectRules"
      class="mb-6"
      bg-color="surface-container"
      rounded
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.label"
      label="Label"
      prepend-inner-icon="mdi-label-outline"
      variant="outlined"
      color="primary"
      clearable
      required
      :items="labels"
      item-title="title"
      item-value="value"
      :rules="labelRules"
      class="mb-6"
      bg-color="surface-container"
      rounded
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.priority"
      label="Priority"
      prepend-inner-icon="mdi-alert-circle-outline"
      variant="outlined"
      color="primary"
      clearable
      required
      :items="priorities"
      item-title="title"
      item-value="value"
      :rules="priorityRules"
      class="mb-6"
      bg-color="surface-container"
      rounded
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.status"
      label="Status"
      prepend-inner-icon="mdi-checkbox-marked-outline"
      variant="outlined"
      color="primary"
      clearable
      required
      :items="statuses"
      item-title="title"
      item-value="value"
      :rules="statusRules"
      class="mb-6"
      bg-color="surface-container"
      rounded
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-6"></v-divider>
    <v-date-input
      v-model="formData.startDate"
      label="Start Date"
      required
      clearable
      variant="outlined"
      prepend-icon=""
      prepend-inner-icon="mdi-calendar"
      color="primary"
      class="date-create-task mb-6"
      bg-color="surface-container"
      rounded
      :rules="startDateRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    >
    </v-date-input>
    <v-divider class="mb-6"></v-divider>
    <v-date-input
      v-model="formData.endDate"
      label="Due Date"
      required
      clearable
      variant="outlined"
      prepend-icon=""
      prepend-inner-icon="mdi-calendar"
      color="primary"
      class="date-create-task mb-6"
      bg-color="surface-container"
      rounded
      :rules="endDateRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    >
    </v-date-input>
    <v-divider class="mb-6"></v-divider>
    <v-text-field
      v-model="formData.startDateHour"
      label="Start Hour"
      placeholder="hh:mm"
      prepend-inner-icon="mdi-clock-time-four-outline"
      variant="outlined"
      readonly
      clearable
      :active="menuStart"
      :focused="menuStart"
      color="primary"
      class="mb-6"
      bg-color="surface-container"
      rounded
      @click="menuStart = true"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
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
          v-model="formData.startDateHour"
          format="24hr"
          full-width
          color="primary"
          scrollable
          required
          class="time-create-task justify-center w-100"
          :class="xs ? 'px-0' : ''"
          @update:modelValue="menuStart = false"
        ></v-time-picker>
      </v-menu>
    </v-text-field>
    <v-divider class="mb-6"></v-divider>
    <v-text-field
      v-model="formData.endDateHour"
      label="Due Hour"
      placeholder="hh:mm"
      prepend-inner-icon="mdi-clock-time-four-outline"
      variant="outlined"
      readonly
      clearable
      bg-color="surface-container"
      rounded
      :active="menuEnd"
      :focused="menuEnd"
      @click="menuEnd = true"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
      color="primary"
      class="mb-6"
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
          v-model="formData.endDateHour"
          format="24hr"
          full-width
          color="primary"
          scrollable
          required
          class="time-create-task justify-center w-100"
          :class="xs ? 'px-0' : ''"
          @update:modelValue="menuEnd = false"
        ></v-time-picker>
      </v-menu>
    </v-text-field>
    <v-divider class="mb-6"></v-divider>
    <slot name="actions"></slot>
  </v-form>
</template>

<style scoped>
.taskFormRef {
  width: 100%;
}
.date-create-task {
  width: 100%;
}
.time-create-task {
  width: 100%;
}
</style>
