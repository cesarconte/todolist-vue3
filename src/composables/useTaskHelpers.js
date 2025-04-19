// src/composables/useTaskHelpers.js
export function getEmptyTask() {
  return {
    projectId: null, // Siempre null para que el v-select empiece vacío
    title: '',
    description: '',
    label: null,
    priority: null,
    status: null,
    startDate: null,
    endDate: null,
    startDateHour: '',
    endDateHour: '',
    completed: false,
    color: null
  }
}

export function getEmptyProject() {
  return {
    color: '',
    createdAt: '',
    icon: '',
    projectId: '',
    title: '',
    userId: ''
  }
}

export function getEmptyEditedProject() {
  return {
    title: '',
    icon: '',
    color: ''
  }
}
