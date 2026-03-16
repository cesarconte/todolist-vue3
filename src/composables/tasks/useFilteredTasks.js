import { computed } from 'vue'
import { useSettings } from '@/composables/settings/useSettings.js'

export function useFilteredTasks(tasks) {
  const { displaySettings } = useSettings()

  const filteredTasks = computed(() => {
    if (!tasks.value) return []

    let result = [...tasks.value]

    if (!displaySettings.showCompletedTasks) {
      result = result.filter((task) => !task.completed)
    }

    return result
  })

  const sortedTasks = computed(() => {
    const tasksToSort = filteredTasks.value

    switch (displaySettings.defaultOrder) {
      case 'date':
        return tasksToSort.sort((a, b) => {
          if (!a.endDate && !b.endDate) return 0
          if (!a.endDate) return 1
          if (!b.endDate) return -1
          return new Date(a.endDate) - new Date(b.endDate)
        })

      case 'priority':
        return tasksToSort.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          const aPriority = priorityOrder[a.priority?.toLowerCase()] ?? 1
          const bPriority = priorityOrder[b.priority?.toLowerCase()] ?? 1
          return aPriority - bPriority
        })

      case 'project':
        return tasksToSort.sort((a, b) => {
          const aProject = a.projectId || ''
          const bProject = b.projectId || ''
          return aProject.localeCompare(bProject)
        })

      case 'title':
        return tasksToSort.sort((a, b) => {
          const aTitle = a.title || ''
          const bTitle = b.title || ''
          return aTitle.localeCompare(bTitle)
        })

      default:
        return tasksToSort
    }
  })

  return {
    filteredTasks,
    sortedTasks
  }
}
