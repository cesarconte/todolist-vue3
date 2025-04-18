<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useDataInitialization } from '@/composables/useDataInitialization'

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

const { initializeData, cleanup } = useDataInitialization()

onMounted(() => {
  initializeData()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <v-form class="form" ref="taskFormRef" @submit.prevent="$emit('submit')">
    <v-alert
      v-if="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
      type="warning"
      class="mb-4"
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
      variant="plain"
      color="red-darken-2"
      :rules="titleRules"
      counter
      clearable
      required
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-text-field>
    <v-divider class="mb-4"></v-divider>
    <v-textarea
      v-model="formData.description"
      label="Description"
      placeholder="Enter description"
      prepend-inner-icon="mdi-text"
      type="text"
      variant="plain"
      color="red-darken-2"
      required
      counter
      :rules="descriptionRules"
      clearable
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-textarea>
    <v-divider class="mb-4"></v-divider>
    <v-select
      v-model="formData.projectId"
      label="Project"
      prepend-inner-icon="mdi-folder-outline"
      variant="plain"
      color="red-darken-2"
      clearable
      required
      :items="projects"
      item-title="title"
      item-value="id"
      :rules="projectRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-4"></v-divider>
    <v-select
      v-model="formData.label"
      label="Label"
      prepend-inner-icon="mdi-label-outline"
      variant="plain"
      color="red-darken-2"
      clearable
      required
      :items="labels"
      :rules="labelRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-4"></v-divider>
    <v-select
      v-model="formData.priority"
      label="Priority"
      prepend-inner-icon="mdi-alert-circle-outline"
      variant="plain"
      color="red-darken-2"
      clearable
      required
      :items="priorities"
      :rules="priorityRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-4"></v-divider>
    <v-select
      v-model="formData.status"
      label="Status"
      prepend-inner-icon="mdi-checkbox-marked-outline"
      variant="plain"
      color="red-darken-2"
      clearable
      required
      :items="statuses"
      :rules="statusRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    ></v-select>
    <v-divider class="mb-4"></v-divider>
    <v-date-input
      v-model="formData.startDate"
      label="Start Date"
      required
      clearable
      variant="plain"
      prepend-icon=""
      prepend-inner-icon="mdi-calendar"
      color="red-darken-2"
      class="date-create-task"
      :rules="startDateRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    >
    </v-date-input>
    <v-divider class="mb-4"></v-divider>
    <v-date-input
      v-model="formData.endDate"
      label="Due Date"
      required
      clearable
      variant="plain"
      prepend-icon=""
      prepend-inner-icon="mdi-calendar"
      color="red-darken-2"
      class="date-create-task"
      :rules="endDateRules"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
    >
    </v-date-input>
    <v-divider class="mb-4"></v-divider>
    <v-text-field
      v-model="formData.startDateHour"
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
      v-model="formData.endDateHour"
      label="Due Hour"
      placeholder="hh:mm"
      prepend-inner-icon="mdi-clock-time-four-outline"
      variant="plain"
      readonly
      clearable
      :active="menuEnd"
      :focused="menuEnd"
      @click="menuEnd = true"
      :disabled="
        projects.length === 0 ||
        priorities.length === 0 ||
        labels.length === 0 ||
        statuses.length === 0
      "
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
