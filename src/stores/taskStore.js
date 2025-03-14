import { defineStore } from 'pinia'
import { useDataStore } from './dataStore.js'
import { db } from '../firebase.js'
import { ref, computed, watch } from 'vue'
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  onSnapshot,
  endBefore,
  limitToLast
} from 'firebase/firestore'

export const useTaskStore = defineStore('tasks', () => {
  // State
  const dataStore = useDataStore()
  const selectedProject = ref(null)
  const pageSize = 6
  const firstVisibleTask = ref(null)
  const lastVisibleTaskDoc = ref(null)
  /* ===> Recommendation:
  For pagination, it's better to use lastVisibleTaskDoc,
  because it allows you to interact directly with the Firestore document
  and efficiently fetch the subsequent documents.

  Explanation:
  * lastVisibleTaskDoc is a reference to the actual Firestore document that represents
  the last visible task on the current page.
  * Using lastVisibleTaskDoc with the startAfter method in Firestore allows you to fetch
  the next page of documents efficiently, starting from the last visible document.
  * This approach is more efficient than using lastVisibleTask because it avoids
  fetching the entire dataset every time you want to navigate to a different page. */
  const hasNextPage = ref(true)
  const hasPrevPage = ref(false)
  const currentPage = ref(1)
  const allTasksProject = ref([])
  const searchTaskTitle = ref(null)
  const selectedProjects = ref([])
  const selectedPriorities = ref([])
  const selectedStatuses = ref([])
  const selectedLabels = ref([])
  const selectedEndDate = ref(null)
  const filteredTasks = ref([])
  const error = ref(null) // Store error messages
  const dialogEditTask = ref(false)
  const noResultsMessage = ref(false)

  // Getters
  const tasks = computed(() => {
    return dataStore.tasks
  })

  const projects = computed(() => {
    return dataStore.projects
  })

  const labels = computed(() => {
    return dataStore.labels
  })

  const priorities = computed(() => {
    return dataStore.priorities
  })

  const statuses = computed(() => {
    return dataStore.statuses
  })

  const colors = computed(() => {
    return dataStore.colors
  })

  const isSelectedProject = computed(() => {
    return projects.value.find((project) => project.title === selectedProject.value)
  })

  const tasksInSelectedProject = computed(() => {
    if (selectedProject.value) {
      return tasks.value.filter((task) => task.project === selectedProject.value)
    } else {
      return []
    }
  })

  const totalPagesInSelectedProject = computed(() => {
    return Math.ceil(tasksInSelectedProject.value.length / pageSize)
  })

  const tasksInFilteredTasks = computed(() => {
    // Start with all tasks
    let filteredTasks = tasks.value

    // Apply filters one by one
    if (searchTaskTitle.value) {
      filteredTasks = filteredTasks.filter((task) =>
        task.title.toLowerCase().includes(searchTaskTitle.value.toLowerCase())
      )
    }
    if (selectedProjects.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedProjects.value.includes(task.project))
    }
    if (selectedPriorities.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedPriorities.value.includes(task.priority)
      )
    }
    if (selectedStatuses.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedStatuses.value.includes(task.status))
    }
    if (selectedLabels.value.length > 0) {
      filteredTasks = filteredTasks.filter((task) => selectedLabels.value.includes(task.label))
    }
    if (selectedEndDate.value) {
      filteredTasks = filteredTasks.filter((task) => {
        // const taskEndDate = new Date(task.endDate.toDate()) // Convert Firestore Timestamp to Date
        // const selectedEndDateObj = new Date(selectedEndDate.value) // Convert selectedEndDate to Date
        // return taskEndDate.toDateString() === selectedEndDateObj.toDateString() // Compare dates
        return task.endDate === selectedEndDate.value
      })
    }
    return filteredTasks
  })

  const totalPagesInFilteredTasks = computed(() => {
    return Math.ceil(tasksInFilteredTasks.value.length / pageSize)
  })

  const completedTasks = computed(() => {
    return tasks.value.filter((task) => task.completed)
  })

  const pendingTasks = computed(() => {
    return tasks.value.filter((task) => !task.completed)
  })

  const completedTasksInSelectedProject = computed(() => {
    return tasksInSelectedProject.value.filter((task) => task.completed)
  })

  const pendingTasksInSelectedProject = computed(() => {
    return tasksInSelectedProject.value.filter((task) => !task.completed)
  })

  const projectColor = computed(() => {
    const project = projects.value.find((project) => project.title === selectedProject.value)
    return project?.color || 'default'
  })
  // Actions

  // Get tasks by project paginated
  const getTasksByProjectPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      // Define the base query for tasks in the selected project
      let tasksRef = query(
        collection(dataStore.db, 'tasks'),
        where('project', '==', selectedProject.value), // Filter by selected project
        orderBy('endDate', 'asc'), // Order by endDate first
        orderBy('title', 'desc'), // Then by title in descending order
        limit(pageSize) // Limit to pageSize
      )

      // Apply pagination logic based on options
      tasksRef = applyPagination(tasksRef, next, prev, last, first)

      // Update pagination state based on the fetched data
      if (tasksRef) {
        // Clear the allTasksProject array before fetching new data
        allTasksProject.value = []
        // Subscribe to the new listener
        onSnapshot(tasksRef, (snapshot) => {
          // Use docChanges() to efficiently handle changes
          snapshot.docChanges().forEach((change) => {
            updateTaskArray(allTasksProject, change)
          })

          // Update pagination state
          lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
          firstVisibleTask.value = snapshot.docs[0]
          // Update pagination state based on the fetched data
          hasNextPage.value =
            snapshot.docs.length === pageSize &&
            currentPage.value < totalPagesInSelectedProject.value

          hasPrevPage.value = currentPage.value > 1
        })
      }
    } catch (error) {
      console.error('Error getting tasks:', error)
    }
  }

  // Mark a task as completed/uncompleted in Firestore
  const completeTask = async (taskId) => {
    try {
      // Update the task in Firestore
      const task = tasks.value.find((task) => task.id === taskId)
      if (!task) {
        throw new Error('Task not found.')
      } else {
        // 1. Find the task in the Firestore 'tasks' collection
        const taskRef = doc(dataStore.db, 'tasks', taskId)
        // 2. Update the 'completed' and 'status' fields of the task
        await updateDoc(taskRef, {
          completed: !task.completed, // Toggle the 'completed' status
          status: task.completed ? 'In Progress' : 'Done' // Update 'status' accordingly
        })
        alert('Task updated successfully.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error updating task:', error)
      alert('An error occurred while updating the task. Please try again.')
    }
  }

  // Set the selected project title
  const setSelectedProject = (projectName) => {
    selectedProject.value = projectName // Store the project title
  }

  // Get filtered tasks paginated
  // En taskStore.js
  const getFilteredTasksPaginated = async ({
    next = false,
    prev = false,
    last = false,
    first = false
  } = {}) => {
    try {
      // Verify if filters
      const hasFilters =
        searchTaskTitle.value ||
        selectedProjects.value.length > 0 ||
        selectedPriorities.value.length > 0 ||
        selectedStatuses.value.length > 0 ||
        selectedLabels.value.length > 0 ||
        selectedEndDate.value

      if (!hasFilters) {
        filteredTasks.value = []
        noResultsMessage.value = false
        return
      }

      // Define the base query for filtered tasks
      let tasksRef = query(
        collection(db, 'tasks'),
        orderBy('endDate', 'asc'),
        orderBy('title', 'desc'),
        limit(pageSize)
      )

      let q = query(tasksRef)

      // Aplicar filtros solo si existen
      const filters = {
        searchTaskTitle: searchTaskTitle.value,
        selectedProjects: selectedProjects.value,
        selectedPriorities: selectedPriorities.value,
        selectedStatuses: selectedStatuses.value,
        selectedLabels: selectedLabels.value,
        selectedEndDate: selectedEndDate.value
      }

      q = applyFilters(q, filters)

      // Aplicar paginación
      q = applyPagination(q, next, prev, last, first)

      if (q) {
        filteredTasks.value = []
        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            updateTaskArray(filteredTasks, change)
          })

          lastVisibleTaskDoc.value = snapshot.docs[snapshot.docs.length - 1]
          firstVisibleTask.value = snapshot.docs[0]
          hasNextPage.value =
            snapshot.docs.length === pageSize && currentPage.value < totalPagesInFilteredTasks.value

          hasPrevPage.value = currentPage.value > 1
          noResultsMessage.value = snapshot.empty
        })
      }
    } catch (error) {
      console.error('Error getting filtered tasks:', error)
      error.value = 'Error loading tasks'
    }
  }

  // Helper function to apply pagination logic
  const applyPagination = (tasksRef, next, prev, last, first) => {
    let lastPageElements // Declare the variable outside the switch

    // Determine which function is calling applyPagination
    const isFilteredTasks =
      searchTaskTitle.value ||
      selectedProjects.value.length > 0 ||
      selectedPriorities.value.length > 0 ||
      selectedStatuses.value.length > 0 ||
      selectedLabels.value.length > 0 ||
      selectedEndDate.value

    // Use the appropriate variables based on the function calling applyPagination
    const totalPages = isFilteredTasks
      ? totalPagesInFilteredTasks.value
      : totalPagesInSelectedProject.value
    const tasksArray = isFilteredTasks ? tasksInFilteredTasks.value : tasksInSelectedProject.value

    switch (true) {
      case next:
        // Get the next page using startAfter and limit
        tasksRef = query(tasksRef, startAfter(lastVisibleTaskDoc.value), limit(pageSize))
        currentPage.value++
        break
      case prev:
        // Get the previous page using endBefore and limitToLast
        tasksRef = query(tasksRef, endBefore(firstVisibleTask.value), limitToLast(pageSize))
        currentPage.value--
        break
      case last:
        // Get the last page
        // Calculate the number of elements to fetch for the last page
        lastPageElements = tasksArray.length % pageSize // Now it's declared outside
        // If the last page has less elements than pageSize, use limitToLast
        if (lastPageElements > 0) {
          tasksRef = query(
            tasksRef,
            startAfter(lastVisibleTaskDoc.value),
            limitToLast(lastPageElements)
          )
        } else {
          // If the last page has pageSize elements, use limit
          tasksRef = query(tasksRef, startAfter(lastVisibleTaskDoc.value), limitToLast(pageSize))
        }
        currentPage.value = totalPages
        break
      case first:
        // Get the first page
        tasksRef = query(tasksRef, limit(pageSize))
        currentPage.value = 1
        break
      default:
        // Handle initial page (no pagination action)
        tasksRef = query(tasksRef, limit(pageSize))
        currentPage.value = 1
        break
    }

    return tasksRef
  }

  // Helper function to update task array based on changes
  const updateTaskArray = (taskArray, change) => {
    const index = taskArray.value.findIndex((task) => task.id === change.doc.id)
    switch (change.type) {
      case 'added':
        // Check for duplicates before adding
        if (index === -1) {
          // Add the new document to the array
          taskArray.value.push({
            id: change.doc.id,
            ...change.doc.data(),
            projectColor:
              colors.value.find((color) => color.title === change.doc.data().project)?.title ||
              'default'
          })
        }
        break
      case 'modified':
        if (index !== -1) {
          // Update the existing document in the array
          taskArray.value.splice(index, 1, {
            id: change.doc.id,
            ...change.doc.data(),
            projectColor:
              colors.value.find((color) => color.title === change.doc.data().project)?.title ||
              'default'
          })
        }
        break
      case 'removed':
        if (index !== -1) {
          // Remove the document from the array
          taskArray.value.splice(index, 1)
        }
        break
    }
  }

  // Helper function to apply filters to a Firestore query
  const applyFilters = (q, filters) => {
    if (filters.searchTaskTitle && filters.searchTaskTitle.trim() !== '') {
      q = query(q, where('title', '==', filters.searchTaskTitle))
    }
    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      q = query(q, where('project', 'in', filters.selectedProjects))
    }
    if (filters.selectedPriorities && filters.selectedPriorities.length > 0) {
      q = query(q, where('priority', 'in', filters.selectedPriorities))
    }
    if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
      q = query(q, where('status', 'in', filters.selectedStatuses))
    }
    if (filters.selectedLabels && filters.selectedLabels.length > 0) {
      q = query(q, where('label', 'in', filters.selectedLabels))
    }
    if (filters.selectedEndDate) {
      const selectedEndDateObj = new Date(filters.selectedEndDate)
      // Get the year, month, and day components
      const year = selectedEndDateObj.getFullYear()
      const month = selectedEndDateObj.getMonth()
      const day = selectedEndDateObj.getDate()

      // Create a Date object for the beginning of the selected date
      const startOfDay = new Date(year, month, day, 0, 0, 0)

      // Create a Date object for the end of the selected date
      const endOfDay = new Date(year, month, day, 23, 59, 59)

      q = query(q, where('endDate', '>=', startOfDay), where('endDate', '<=', endOfDay))
    }
    return q
  }

  watch(
    () => [
      selectedProject.value,
      searchTaskTitle.value,
      selectedProjects.value,
      selectedPriorities.value,
      selectedStatuses.value,
      selectedLabels.value,
      selectedEndDate.value
    ],
    async () => {
      // Fetch the filtered tasks
      await getFilteredTasksPaginated()
    },
    { immediate: true } // Fetch filtered tasks initially
  )

  watch(
    () => selectedProject.value,
    async () => {
      // If a project is selected, fetch paginated tasks for that project
      if (selectedProject.value) {
        await getTasksByProjectPaginated()
      }
    },
    { immediate: true } // Fetch filtered tasks initially
  )

  const editTask = async (taskId) => {
    try {
      dialogEditTask.value = true
      // Get the task data from Firestore
      const task = await dataStore.getTask(taskId)

      if (task) {
        // Assign the task data to dataStore.editedTask
        Object.assign(dataStore.editedTask, task)
      } else {
        console.error('Task not found')
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Helper function to fetch project data and get color
  const getProjectColor = async (projectName) => {
    // Fetch projects data only if it's not already loaded
    if (!dataStore.projectsData.value) {
      await dataStore.fetchCollection('projects', dataStore.projectsData)
    }

    // Find the project with the matching title
    const project = dataStore.projects.find((project) => project.title === projectName)

    // Get the project color
    return project ? project.color : 'default'
  }

  // Helper function to clean filters
  const resetFilters = () => {
    // Clear filters in the taskStore state (reactive variables) to reset the UI
    searchTaskTitle.value = null
    selectedProjects.value = []
    selectedPriorities.value = []
    selectedStatuses.value = []
    selectedLabels.value = []
    selectedEndDate.value = null

    // Clear pagination state to reset the UI
    firstVisibleTask.value = null
    lastVisibleTaskDoc.value = null
    hasNextPage.value = true
    hasPrevPage.value = false
    currentPage.value = 1
  }
  return {
    // State
    selectedProject,
    pageSize,
    firstVisibleTask,
    lastVisibleTaskDoc,
    hasNextPage,
    hasPrevPage,
    currentPage,
    allTasksProject,
    searchTaskTitle,
    selectedProjects,
    selectedPriorities,
    selectedStatuses,
    selectedLabels,
    selectedEndDate,
    filteredTasks,
    error,
    dialogEditTask,
    noResultsMessage,
    // Getters (computed properties)
    projects,
    tasks,
    labels,
    priorities,
    statuses,
    colors,
    isSelectedProject,
    tasksInSelectedProject,
    tasksInFilteredTasks,
    totalPagesInSelectedProject,
    totalPagesInFilteredTasks,
    completedTasks,
    pendingTasks,
    completedTasksInSelectedProject,
    pendingTasksInSelectedProject,
    projectColor,
    // Actions (methods)
    getTasksByProjectPaginated,
    setSelectedProject,
    completeTask,
    getFilteredTasksPaginated,
    // Helper functions
    editTask,
    getProjectColor,
    applyFilters,
    applyPagination,
    updateTaskArray,
    resetFilters
  }
})
