//validationFormRules.js

export const useMaxLengthRule = () => {
  return [
    (v) => {
      // Check if 'v' is null or undefined before accessing 'length'
      if (v !== null && v !== undefined) {
        return v.length <= 100 || 'Max 100 characters'
      } else {
        // Handle the case where 'v' is null
        return 'This field is required.'
      }
    }
  ]
}

export const validTaskForm = (task) => {
  return (
    task.title &&
    task.title.trim() !== '' &&
    task.description &&
    task.description.trim() !== '' &&
    task.project &&
    task.project.trim() !== '' &&
    task.label &&
    task.label.trim() !== '' &&
    task.priority &&
    task.priority.trim() !== '' &&
    task.status &&
    task.status.trim() !== '' &&
    task.startDate &&
    task.startDate.trim() !== '' &&
    task.endDate &&
    task.endDate.trim() !== ''
  )
}

export const validProjectForm = (project) => {
  return (
    project.title &&
    project.title.trim() !== '' &&
    project.icon &&
    project.icon.trim() !== '' &&
    project.color &&
    project.color.trim() !== ''
  )
}

export const validLabelForm = (label) => {
  return label.title && label.title.trim() !== '' && label.color
}
