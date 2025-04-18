<!-- VProjectForm.vue -->

<script setup>
import { ref, reactive, watch } from 'vue'
import { requiredRule } from '@/composables/useFieldRules'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  projectTemplates: {
    type: Array,
    default: () => []
  },
  icons: {
    type: Array,
    default: () => []
  },
  colors: {
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

const formProject = ref(null)

const titleRules = requiredRule('Title')
const iconRules = requiredRule('Icon')
const colorRules = requiredRule('Color')

defineExpose({
  validate: () => formProject.value?.validate(),
  reset: () => {
    Object.assign(formData, props.modelValue)
    formProject.value?.reset()
  },
  resetValidation: () => formProject.value?.resetValidation()
})
</script>

<style scoped>
.form {
  width: 100%;
}
</style>

<template>
  <v-form class="form" ref="formProject" @submit.prevent="$emit('submit')">
    <v-text-field
      v-model="formData.title"
      label="Title"
      prepend-inner-icon="mdi-format-title"
      variant="plain"
      color="red-darken-2"
      :rules="titleRules"
      clearable
      required
    ></v-text-field>
    <v-divider class="mb-4"></v-divider>
    <v-text-field
      v-model="formData.icon"
      label="Icon"
      prepend-inner-icon="mdi-symbol"
      variant="plain"
      color="red-darken-2"
      :rules="iconRules"
      clearable
      required
    ></v-text-field>
    <v-divider class="mb-4"></v-divider>
    <v-select
      v-model="formData.color"
      label="Color"
      prepend-inner-icon="mdi-palette"
      variant="plain"
      color="red-darken-2"
      :rules="colorRules"
      clearable
      required
      :items="colors"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <template v-slot:prepend>
            <v-icon :color="item.value">mdi-invert-colors</v-icon>
          </template>
        </v-list-item>
      </template>
    </v-select>
    <v-divider class="mb-4"></v-divider>
    <slot name="actions"></slot>
  </v-form>
</template>
