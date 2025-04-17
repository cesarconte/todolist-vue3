// src/composables/useTaskHelpers.js
export function getEmptyTask(project) {
  return {
    projectId: project ? project.id : '',
    title: '',
    description: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    endDate: null,
    completed: false,
    color: project ? project.color : null
  }
}
