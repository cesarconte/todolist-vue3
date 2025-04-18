// src/composables/useTaskHelpers.js
export function getEmptyTask(project) {
  return {
    projectId: project ? project.id : '',
    title: '',
    description: '',
    label: null, // Corregido: inicializar como null
    priority: null, // Corregido: inicializar como null
    status: null, // Corregido: inicializar como null
    startDate: null,
    endDate: null,
    startDateHour: '', // Mantener como '' si es un campo de texto para hora
    endDateHour: '', // Mantener como '' si es un campo de texto para hora
    completed: false,
    color: project ? project.color : null
  }
}
