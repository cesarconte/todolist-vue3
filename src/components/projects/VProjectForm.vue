<!-- VProjectForm.vue -->

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { requiredRule } from '@/composables/forms/useFieldRules'

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
    // Limpia los campos del formulario visualmente
    if (formProject.value && typeof formProject.value.reset === 'function') {
      formProject.value.reset()
    }
    // Limpia el modelo reactivo
    Object.assign(formData, { title: '', icon: '', color: '' })
  },
  resetValidation: () => formProject.value?.resetValidation()
})

onMounted(() => {
  // Keep other onMounted logic if present
})

onUnmounted(() => {
  // Keep other onUnmounted logic if present
})
</script>

<style scoped>
.form {
  width: 100%;
}
</style>

<template>
  <v-form class="form pa-6" ref="formProject" @submit.prevent="$emit('submit')">
    <v-select
      v-model="formData.title"
      label="Title"
      prepend-inner-icon="mdi-format-title"
      variant="outlined"
      color="primary"
      :rules="titleRules"
      clearable
      required
      class="mb-6"
      :items="projectTemplates"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :prepend-icon="item.value" :title="item.value"></v-list-item>
      </template>
      <template v-slot:selection="{ item }">
        <v-icon :icon="item.value" class="mr-2"></v-icon>
        {{ item.value }}
      </template>
    </v-select>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.icon"
      label="Icon"
      prepend-inner-icon="mdi-shape-outline"
      variant="outlined"
      color="primary"
      :items="icons"
      :rules="iconRules"
      clearable
      required
      class="mb-6"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :prepend-icon="item.value" :title="item.value"></v-list-item>
      </template>
      <template v-slot:selection="{ item }">
        <v-icon :icon="item.value" class="mr-2"></v-icon>
        {{ item.value }}
      </template>
    </v-select>
    <v-divider class="mb-6"></v-divider>
    <v-select
      v-model="formData.color"
      label="Color"
      prepend-inner-icon="mdi-palette"
      variant="outlined"
      color="primary"
      :rules="colorRules"
      clearable
      required
      :items="colors"
      class="mb-6"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <template v-slot:prepend>
            <v-icon :color="item.value">mdi-circle</v-icon>
          </template>
          <template v-slot:title>
            <span :style="{ color: item.value }">{{ item.title }}</span>
          </template>
        </v-list-item>
      </template>
      <template v-slot:selection="{ item }">
        <v-icon :color="item.value" class="mr-2">mdi-circle</v-icon>
        <span :style="{ color: item.value }">{{ item.title }}</span>
      </template>
    </v-select>
    <v-divider class="mb-6"></v-divider>
    <slot name="actions"></slot>
  </v-form>
</template>
