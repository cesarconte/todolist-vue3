import { where } from 'firebase/firestore'

export function buildFirestoreFilters(filters) {
  const conditions = []

  if (filters.selectedProjects?.length > 0) {
    conditions.push(where('projectId', 'in', filters.selectedProjects))
  }
  if (filters.selectedPriorities?.length > 0) {
    conditions.push(where('priority', 'in', filters.selectedPriorities))
  }
  if (filters.selectedStatuses?.length > 0) {
    conditions.push(where('status', 'in', filters.selectedStatuses))
  }
  if (filters.selectedLabels?.length > 0) {
    conditions.push(where('label', 'in', filters.selectedLabels))
  }

  // Add filter for completion status - check for explicit boolean values
  if (filters.completionStatus === true || filters.completionStatus === false) {
    conditions.push(where('completed', '==', filters.completionStatus))
  }

  return conditions
}
