import { defineStore } from 'pinia'
import { useDataStore } from './dataStore.js'
import { computed } from 'vue'

export const useProjectStore = defineStore('projects', () => {
  // State
  const dataStore = useDataStore()

  // Getters
  const tasks = computed(() => {
    return dataStore.tasks
  })
  const projects = computed(() => {
    return dataStore.projects
  })
  const getProject = (id) => {
    return projects.value.find((project) => project.id === id)
  }
  const getProjectCount = () => {
    return projects.value.length
  }
  const getTasksInProject = (id) => {
    return tasks.value.filter((task) => task.projectId === id)
  }

  return {
    //Getters
    getProject,
    getProjectCount,
    getTasksInProject,
  }
})
