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
    task?.title?.trim() &&
    task?.description?.trim() &&
    !!task?.projectId && // Cambiado: Comprobar projectId en lugar de project
    task?.label !== null && // Cambiado: Comprobar que no sea null
    task?.priority !== null && // Cambiado: Comprobar que no sea null
    task?.status !== null && // Cambiado: Comprobar que no sea null
    task.startDate &&
    task.endDate
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
