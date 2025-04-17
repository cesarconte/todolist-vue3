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
  if (filters.selectedEndDate) {
    const date = new Date(filters.selectedEndDate)
    const start = new Date(date.setHours(0, 0, 0, 0))
    const end = new Date(date.setHours(23, 59, 59, 999))
    conditions.push(where('endDate', '>=', start), where('endDate', '<=', end))
  }
  if (filters.searchTerm) {
    conditions.push(
      where('title', '>=', filters.searchTerm),
      where('title', '<=', filters.searchTerm + '\uf8ff')
    )
  }

  return conditions
}
