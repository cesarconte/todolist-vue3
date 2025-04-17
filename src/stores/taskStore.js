// taskStore.js

// 1. Imports
import { defineStore } from 'pinia'
import { computed, reactive, watch, ref } from 'vue'
import { db } from '../firebase.js'
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  collectionGroup,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { useNotificationsStore } from './notificationsStore.js'
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'
import { buildFirestoreFilters } from '@/utils/firestoreFilters.js'
import { buildPaginationQuery, getLastPageCount, getPaginationFlags } from '@/utils/pagination.js'
import { mapFirestoreTask } from '@/utils/taskMappers.js'
import {
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/utils/firestoreCrud.js'
import { combineDateTime } from '@/utils/taskUtils.js'

// 2. Store principal
export const useTaskStore = defineStore('tasks', () => {
  // 2. Instancias de otras stores
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  // 3. Estado reactivo
  const state = reactive({
    tasks: [],
    filteredTasks: [],
    currentPage: 1,
    pageSize: 6,
    totalTasks: 0,
    lastVisible: null,
    firstVisible: null,
    hasNextPage: false,
    hasPrevPage: false,
    isLoading: false,
    error: null,
    // Filtros
    searchTerm: '',
    selectedProjects: [],
    selectedPriorities: [],
    selectedStatuses: [],
    selectedLabels: [],
    selectedEndDate: null,
    // Edición
    editingTask: null,
    isEditing: false,
    dialogEditTask: false,
    editedTask: null,
    newTask: {
      projectId: '',
      title: '',
      description: '',
      label: '',
      priority: '',
      status: '',
      startDate: null,
      endDate: null,
      completed: false,
      color: null
    }
  })

  // Estado para saber si estamos en la última página
  const isLastPageMode = ref(false)

  // Computadas
  const totalPages = computed(() => Math.max(1, Math.ceil(state.totalTasks / state.pageSize)))

  const currentFilters = computed(() => ({
    projects: state.selectedProjects,
    priorities: state.selectedPriorities,
    statuses: state.selectedStatuses,
    labels: state.selectedLabels,
    endDate: state.selectedEndDate,
    searchTerm: state.searchTerm
  }))

  const tasksData = computed(() => state.tasks)

  const dialogEditTask = computed({
    get: () => state.dialogEditTask,
    set: (val) => {
      state.dialogEditTask = val
    }
  })
  const editedTask = computed({
    get: () => state.editedTask,
    set: (val) => {
      state.editedTask = val
    }
  })

  // Getter y setter reactivo para newTask
  const newTask = computed({
    get: () => state.newTask,
    set: (val) => {
      state.newTask = val
    }
  })

  // --- Mejor solución: Getters reactivos para tareas del proyecto seleccionado ---
  const selectedProjectTitle = computed(() => state.selectedProjects[0] || null)

  const tasksInSelectedProject = computed(() => {
    if (!selectedProjectTitle.value) return []
    // Usar filteredTasks si hay filtros activos, sino tasks
    const source = state.filteredTasks.length > 0 ? state.filteredTasks : state.tasks
    // Filtrar por projectId o por project.title según cómo estén mapeadas las tareas
    const project = projectStore.projects.find((p) => p.title === selectedProjectTitle.value)
    if (!project) return []
    return source.filter((task) => task.projectId === project.id)
  })

  const completedTasksInSelectedProject = computed(() =>
    tasksInSelectedProject.value.filter((task) => task.completed)
  )

  const pendingTasksInSelectedProject = computed(() =>
    tasksInSelectedProject.value.filter((task) => !task.completed)
  )

  // 5. Métodos principales (CRUD, helpers)
  const buildQuery = (cursorType = 'first', noLimit = false) => {
    let q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))

    // Aplica todos los filtros de una vez
    const filterConditions = buildFirestoreFilters(state)
    filterConditions.forEach((cond) => {
      q = query(q, cond)
    })

    // Ordenamiento SIEMPRE ascendente para paginación correcta
    q = query(q, orderBy('endDate', 'asc'), orderBy('title', 'asc'))

    // Centraliza la query de paginación
    return buildPaginationQuery({ baseQuery: q, cursorType, state, noLimit })
  }

  const fetchTasks = async (direction = 'first') => {
    try {
      state.isLoading = true
      state.error = null

      // Reinicia la página actual al cambiar de filtro
      if (direction === 'first') {
        state.currentPage = 1
      }

      // Obtener conteo total (sin limit)
      const countQuery = buildQuery('first', true)
      const countSnapshot = await getCollection(countQuery)
      state.totalTasks = countSnapshot.length

      // Calcular totalPages después de actualizar totalTasks
      const totalPagesValue = Math.ceil(state.totalTasks / state.pageSize)
      console.log(
        '[Paginación] totalTasks:',
        state.totalTasks,
        'pageSize:',
        state.pageSize,
        'totalPages:',
        totalPagesValue
      )
      console.log('[Paginación] currentPage:', state.currentPage, 'direction:', direction)

      // Construir query paginada
      const tasksQuery = buildQuery(direction)
      const snapshot = await getDocs(tasksQuery)

      if (snapshot.empty) {
        state.filteredTasks = []
        // Actualiza flags de paginación
        state.hasNextPage = false
        state.hasPrevPage = false
        console.log('[Paginación] snapshot vacío, no hay tareas en esta página')
        return
      }

      // Si vamos a la última página, filtrar solo los documentos de la última página
      let docs = snapshot.docs
      if (direction === 'last') {
        isLastPageMode.value = true
        const lastPageCount = getLastPageCount(state.totalTasks, state.pageSize)
        docs = docs.slice(-lastPageCount)
      } else {
        isLastPageMode.value = false
      }

      state.filteredTasks = docs.map((doc) => mapFirestoreTask(doc, projectStore.getProjectById))

      // Después de cargar las tareas (por ejemplo, tras loadAllUserTasks o fetchTasks)
      console.log(
        '[Paginación] projectId de las tareas:',
        state.tasks.map((t) => t.projectId)
      )

      // Actualizar cursores
      state.lastVisible = docs[docs.length - 1]
      state.firstVisible = docs[0]

      // Actualizar número de página ANTES de los logs
      if (direction === 'next') state.currentPage++
      if (direction === 'prev') state.currentPage--
      if (direction === 'first') state.currentPage = 1
      if (direction === 'last') state.currentPage = totalPagesValue || 1

      // Mostrar los IDs de las tareas que se muestran en la página actual (después de actualizar currentPage)
      console.log(
        `[Paginación] Mostrando tareas en página ${state.currentPage}:`,
        state.filteredTasks.map((t) => t.id)
      )

      // Actualizar estado de paginación con el valor actualizado
      const flags = getPaginationFlags(state.currentPage, totalPagesValue)
      state.hasNextPage = flags.hasNextPage
      state.hasPrevPage = flags.hasPrevPage
      console.log('[Paginación] hasNextPage:', state.hasNextPage, 'hasPrevPage:', state.hasPrevPage)
      console.log('[Paginación] filteredTasks.length:', state.filteredTasks.length)
      console.log('[Paginación] currentPage después de cambio:', state.currentPage)
    } catch (error) {
      state.error = error.message
      notificationsStore.displaySnackbar('Error loading tasks', 'error')
    } finally {
      state.isLoading = false
    }
  }

  // Acciones de paginación
  const nextPage = async () => {
    if (state.hasNextPage) {
      await fetchTasks('next')
    }
  }

  const prevPage = async () => {
    if (state.hasPrevPage) {
      // Si venimos de la última página, salimos del modo especial y navegamos normal
      if (isLastPageMode.value) {
        isLastPageMode.value = false
        await fetchTasks('prev')
      } else {
        await fetchTasks('prev')
      }
    }
  }

  const firstPage = async () => {
    await fetchTasks('first')
  }

  const lastPage = async () => {
    await fetchTasks('last')
    state.currentPage = totalPages.value || 1
  }

  const editTask = (taskId) => {
    const task = state.tasks.find((t) => t.id === taskId)
    if (task) {
      state.editedTask = { ...task }
      state.dialogEditTask = true
    }
  }

  const updateTask = async () => {
    try {
      const task = state.editedTask
      if (!task || !task.id || !task.projectId) throw new Error('Datos de tarea incompletos')
      const taskRef = doc(
        db,
        'users',
        userStore.userId,
        'projects',
        task.projectId,
        'tasks',
        task.id
      )
      const taskData = { ...task }
      delete taskData.id
      delete taskData.project

      // Combina fecha y hora si los campos de hora existen
      if (task.startDate && task.startDateHour) {
        taskData.startDate = combineDateTime(task.startDate, task.startDateHour)
      }
      if (task.endDate && task.endDateHour) {
        taskData.endDate = combineDateTime(task.endDate, task.endDateHour)
      }

      // Determinar si el estado es "Done" y actualizar el campo "completed"
      const isCompleted = task.status === 'Done'
      taskData.completed = isCompleted

      await updateDocument(taskRef, { ...taskData, updatedAt: serverTimestamp() })

      // Actualizar en el array reactivo
      const idx = state.tasks.findIndex((t) => t.id === task.id)
      if (idx !== -1) {
        state.tasks[idx] = { ...task }
        state.tasks[idx].completed = isCompleted
        // Actualizar también las fechas en el array reactivo
        if (taskData.startDate) state.tasks[idx].startDate = taskData.startDate
        if (taskData.endDate) state.tasks[idx].endDate = taskData.endDate
      }

      state.dialogEditTask = false
      notificationsStore.displaySnackbar('Task updated!', 'success', 'mdi-check-circle')
    } catch (error) {
      notificationsStore.displaySnackbar(error.message, 'error', 'mdi-alert-circle')
    }
  }

  const resetFilters = () => {
    state.selectedProjects = []
    state.selectedPriorities = []
    state.selectedStatuses = []
    state.selectedLabels = []
    state.selectedEndDate = null
    state.searchTerm = ''
  }

  const createTask = async (newTaskData) => {
    try {
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      if (!newTaskData.projectId) throw new Error('projectId es obligatorio')

      const tasksRef = collection(
        db,
        'users',
        userStore.userId,
        'projects',
        newTaskData.projectId,
        'tasks'
      )

      const task = {
        ...newTaskData,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userStore.userId
      }

      const docRef = await addDocument(tasksRef, task)
      notificationsStore.displaySnackbar('Task created!', 'success', 'mdi-check-circle')
      return docRef.id
    } catch (error) {
      notificationsStore.displaySnackbar(error.message, 'error', 'mdi-alert-circle')
      throw error
    }
  }

  const loadAllUserTasks = async () => {
    try {
      state.isLoading = true
      state.error = null
      state.tasks = []
      if (!userStore.userId) {
        console.log('[loadAllUserTasks] No userId, aborting')
        return
      }
      const q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))
      const docs = await getCollection(q)
      console.log('[loadAllUserTasks] docs.length:', docs.length)
      state.tasks = docs.map((doc) =>
        mapFirestoreTask({ data: () => doc, id: doc.id }, projectStore.getProjectById)
      )
      console.log('[loadAllUserTasks] state.tasks:', state.tasks)
    } catch (error) {
      state.error = error.message
      notificationsStore.displaySnackbar('Error loading all tasks', 'error')
      console.error('[loadAllUserTasks] error:', error)
    } finally {
      state.isLoading = false
    }
  }

  const clearTaskStore = () => {
    state.tasks = []
    state.filteredTasks = []
    state.currentPage = 1
    state.totalTasks = 0
    state.lastVisible = null
    state.firstVisible = null
    state.hasNextPage = false
    state.hasPrevPage = false
    state.isLoading = false
    state.error = null
    state.searchTerm = ''
    state.selectedProjects = []
    state.selectedPriorities = []
    state.selectedStatuses = []
    state.selectedLabels = []
    state.selectedEndDate = null
    state.editingTask = null
    state.isEditing = false
  }

  // Método para completar una tarea
  const completeTask = async (projectId, taskId) => {
    try {
      if (!projectId || !taskId) {
        console.error('Project ID or Task ID is undefined')
        notificationsStore.displaySnackbar(
          'Project ID or Task ID is undefined',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)
      const taskDoc = await getDocument(taskRef)

      if (!taskDoc) {
        throw new Error('Task not found')
      }

      const currentStatus = taskDoc.completed
      const newStatus = !currentStatus

      await updateDocument(taskRef, {
        completed: newStatus,
        status: newStatus ? 'Done' : 'In Progress',
        updatedAt: serverTimestamp()
      })

      notificationsStore.displaySnackbar(
        `Task marked as ${newStatus ? 'completed' : 'in progress'}`,
        'success',
        newStatus ? 'mdi-check-circle' : 'mdi-progress-clock'
      )

      // Actualizar la tarea en el array reactivo
      const taskIndex = state.tasks.findIndex((task) => task.id === taskId)
      if (taskIndex !== -1) {
        state.tasks[taskIndex].completed = newStatus
        state.tasks[taskIndex].status = newStatus ? 'Done' : 'In Progress'
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Status update failed',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Método para eliminar una tarea
  const deleteTask = async (projectId, taskId) => {
    try {
      if (!projectId || !taskId) {
        console.error('Project ID or Task ID is undefined')
        notificationsStore.displaySnackbar(
          'Project ID or Task ID is undefined',
          'error',
          'mdi-alert-circle'
        )
        return
      }

      const taskRef = doc(db, 'users', userStore.userId, 'projects', projectId, 'tasks', taskId)

      // Verificar si la tarea existe antes de eliminarla
      const taskDoc = await getDocument(taskRef)
      if (!taskDoc) {
        throw new Error('Task not found')
      }

      // Eliminar la tarea de Firestore
      await deleteDocument(taskRef)

      // Eliminar la tarea del array reactivo
      state.tasks = state.tasks.filter((task) => task.id !== taskId)

      notificationsStore.displaySnackbar('Task deleted successfully', 'success', 'mdi-check-circle')
    } catch (error) {
      console.error('Error deleting task:', error)
      notificationsStore.displaySnackbar(
        error.message || 'Error deleting task',
        'error',
        'mdi-close-circle'
      )
    }
  }

  // Añadir método para seleccionar un proyecto desde la UI
  const setSelectedProject = (projectTitle) => {
    if (!projectTitle) {
      console.warn('No project title provided to setSelectedProject')
      state.selectedProjects = []
      return
    }

    const project = projectStore.projects.find((p) => p.title === projectTitle)
    if (!project) {
      console.warn('Project not found:', projectTitle)
      state.selectedProjects = []
      return
    }

    state.selectedProjects = [projectTitle]
  }

  // Watcher para cambios en filtros
  watch(
    () => ({ ...currentFilters.value }),
    async () => {
      // Detecta si hay algún filtro activo
      const hasAnyFilter =
        state.selectedProjects.length > 0 ||
        state.selectedPriorities.length > 0 ||
        state.selectedStatuses.length > 0 ||
        state.selectedLabels.length > 0 ||
        !!state.selectedEndDate ||
        !!state.searchTerm

      if (hasAnyFilter) {
        await fetchTasks('first')
      } else {
        // Resetear paginación y tareas si no hay filtros activos
        state.filteredTasks = []
        state.totalTasks = 0
        state.currentPage = 1
        state.hasNextPage = false
        state.hasPrevPage = false
      }
    },
    { deep: true }
  )

  // 6. Return
  return {
    state,
    totalPages,
    currentFilters,
    tasksData,
    dialogEditTask,
    editedTask,
    newTask,
    tasksInSelectedProject,
    completedTasksInSelectedProject,
    pendingTasksInSelectedProject,
    selectedProjectTitle,
    isLastPageMode,
    buildQuery,
    fetchTasks,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    editTask,
    updateTask,
    resetFilters,
    createTask,
    loadAllUserTasks,
    clearTaskStore,
    completeTask,
    deleteTask,
    setSelectedProject
  }
})
