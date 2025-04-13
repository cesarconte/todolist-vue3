<script setup>
import { ref, reactive, watch } from 'vue'
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

const emit = defineEmits(['update:modelValue', 'submit'])

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
</script>

<template>
  <v-form class="form" ref="taskFormRef" @submit.prevent="$emit('submit')">
    <v-text-field
      v-model="formData.title"
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
      v-model="formData.description"
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
      v-model="formData.project"
      label="Project"
      prepend-inner-icon="mdi-folder-outline"
      variant="plain"
      color="red-darken-2"
      clearable
      required
      :items="projects"
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
