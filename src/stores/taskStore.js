// taskStore.js
import { defineStore } from 'pinia'

// Import local store modules
// import { useDataStore } from './dataStore.js'
import { useNotificationsStore } from './notificationsStore.js'
import { useProjectStore } from './projectStore.js'
import { useUserStore } from './userStore.js'

// Import composables
// import { validTaskForm } from '@/composables/validationFormRules.js'

// Import Firebase modules
import { db } from '../firebase.js'
import {
  doc,
  // updateDoc,
  getDoc,
  addDoc,
  getDocs,
  // writeBatch,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  // onSnapshot,
  endBefore,
  limitToLast,
  collectionGroup,
  getCountFromServer
} from 'firebase/firestore'

// Import Vue core utilities
import { ref, computed, watch, reactive } from 'vue'

// Import local utility functions
import {
  convertTimestamp
  // combineDateTime,
  // getStartAndEndOfDay,
  // createTaskData
} from './taskUtils.js'

export const useTaskStore = defineStore('tasks', () => {
  // const dataStore = useDataStore()
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  // Estado reactivo
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
    isEditing: false
  })

  // Estado para saber si estamos en la última página
  const isLastPageMode = ref(false)
  // Pila de cursores para navegación hacia atrás
  const pageCursors = ref([])

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

  // Getter para exponer tasksData (array principal de tareas)
  const tasksData = computed(() => state.tasks)

  // Métodos principales
  const buildQuery = (cursorType = 'first', noLimit = false) => {
    let q = query(collectionGroup(db, 'tasks'), where('createdBy', '==', userStore.userId))

    // Aplicar filtros
    if (state.selectedProjects.length > 0) {
      q = query(q, where('projectId', 'in', state.selectedProjects))
    }
    if (state.selectedPriorities.length > 0) {
      q = query(q, where('priority', 'in', state.selectedPriorities))
    }
    if (state.selectedStatuses.length > 0) {
      q = query(q, where('status', 'in', state.selectedStatuses))
    }
    if (state.selectedLabels.length > 0) {
      q = query(q, where('label', 'in', state.selectedLabels))
    }
    if (state.selectedEndDate) {
      const date = new Date(state.selectedEndDate)
      const start = new Date(date.setHours(0, 0, 0, 0))
      const end = new Date(date.setHours(23, 59, 59, 999))
      q = query(q, where('endDate', '>=', start), where('endDate', '<=', end))
    }
    if (state.searchTerm) {
      q = query(
        q,
        where('title', '>=', state.searchTerm),
        where('title', '<=', state.searchTerm + '\uf8ff')
      )
    }

    // Ordenamiento
    let orderDirection = 'asc'
    if (cursorType === 'last') {
      orderDirection = 'desc'
    }
    q = query(q, orderBy('endDate', orderDirection), orderBy('title', orderDirection))

    // Paginación solo si no es noLimit
    if (!noLimit) {
      switch (cursorType) {
        case 'next':
          return query(q, startAfter(state.lastVisible), limit(state.pageSize))
        case 'prev':
          return query(q, endBefore(state.firstVisible), limitToLast(state.pageSize))
        case 'last':
          return query(q, limit(state.pageSize))
        default:
          return query(q, limit(state.pageSize))
      }
    }
    return q
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
      const countSnapshot = await getCountFromServer(countQuery)
      state.totalTasks = countSnapshot.data().count

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

      // Si vamos a la última página, invertir resultados y marcar modo
      let docs = snapshot.docs
      if (direction === 'last') {
        docs = [...snapshot.docs].reverse()
        isLastPageMode.value = true
      } else {
        isLastPageMode.value = false
      }

      // Guardar cursor para navegación hacia atrás
      if (direction === 'next' || direction === 'first') {
        pageCursors.value[state.currentPage] = docs[0]
      }
      if (direction === 'last') {
        pageCursors.value[totalPages.value] = docs[0]
      }

      state.filteredTasks = docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          endDate: convertTimestamp(data.endDate),
          startDate: convertTimestamp(data.startDate),
          project: projectStore.getProjectById(data.projectId)
        }
      })

      // Después de cargar las tareas (por ejemplo, tras loadAllUserTasks o fetchTasks)
      console.log(
        'projectId de las tareas:',
        state.tasks.map((t) => t.projectId)
      )

      // Actualizar cursores
      state.lastVisible = docs[docs.length - 1]
      state.firstVisible = docs[0]

      // Actualizar número de página ANTES de los flags
      if (direction === 'next') state.currentPage++
      if (direction === 'prev') state.currentPage--
      if (direction === 'first') state.currentPage = 1
      if (direction === 'last') state.currentPage = totalPagesValue || 1

      // Actualizar estado de paginación con el valor actualizado
      state.hasNextPage = state.currentPage < totalPagesValue
      state.hasPrevPage = state.currentPage > 1
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
    // Refuerza la lógica para evitar errores de cursor
    if (state.hasPrevPage) {
      // Si venimos de la última página, forzar modo normal y usar cursor guardado
      if (isLastPageMode.value) {
        const prevCursor = pageCursors.value[state.currentPage - 1]
        console.log('[Paginación] prevPage desde última página, prevCursor:', prevCursor)
        if (prevCursor) {
          isLastPageMode.value = false
          state.currentPage = totalPages.value - 1
          state.lastVisible = prevCursor
          await fetchTasks('next')
        } else {
          // Si no hay cursor, vuelve a la primera página
          console.warn('[Paginación] prevPage: cursor no encontrado, volviendo a la primera página')
          await fetchTasks('first')
        }
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

  // Watcher para cambios en filtros
  watch(
    () => ({ ...currentFilters.value }),
    async () => {
      console.log('selectedProjects:', state.selectedProjects)
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
        console.log('[Paginación] Sin filtros activos: totalTasks=0, totalPages=0')
      }
    },
    { deep: true }
  )

  // Métodos existentes (editTask, deleteTask, etc...)
  const editTask = async (taskId) => {
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId))
      if (taskDoc.exists()) {
        state.editingTask = { id: taskId, ...taskDoc.data() }
        state.isEditing = true
      }
    } catch (error) {
      state.error = error.message
      notificationsStore.displaySnackbar('Error editing task', 'error')
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

  /**
   * Crea una nueva tarea en Firestore bajo el proyecto y usuario actual
   * @param {Object} newTaskData - Datos de la nueva tarea
   */
  const createTask = async (newTaskData) => {
    try {
      if (!userStore.userId) throw new Error('Usuario no autenticado')
      if (!newTaskData.projectId) throw new Error('projectId es obligatorio')

      // Referencia a la colección de tareas del proyecto
      const tasksRef = collection(
        db,
        'users',
        userStore.userId,
        'projects',
        newTaskData.projectId,
        'tasks'
      )

      // Construir el objeto de la tarea
      const task = {
        ...newTaskData,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userStore.userId
      }

      // Guardar en Firestore
      const docRef = await addDoc(tasksRef, task)
      // Opcional: notificar éxito
      notificationsStore.displaySnackbar('Task created!', 'success', 'mdi-check-circle')
      return docRef.id
    } catch (error) {
      notificationsStore.displaySnackbar(error.message, 'error', 'mdi-alert-circle')
      throw error
    }
  }

  /**
   * Carga todas las tareas del usuario autenticado usando collectionGroup
   */
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
      const snapshot = await getDocs(q)
      console.log('[loadAllUserTasks] snapshot.docs.length:', snapshot.docs.length)
      state.tasks = snapshot.docs.map((doc) => {
        const data = doc.data()
        // Log para ver los datos de cada tarea
        console.log('[loadAllUserTasks] task doc:', doc.id, data)
        return {
          id: doc.id,
          ...data,
          endDate: convertTimestamp(data.endDate),
          startDate: convertTimestamp(data.startDate),
          project: projectStore.getProjectById(data.projectId)
        }
      })
      console.log('[loadAllUserTasks] state.tasks:', state.tasks)
    } catch (error) {
      state.error = error.message
      notificationsStore.displaySnackbar('Error loading all tasks', 'error')
      console.error('[loadAllUserTasks] error:', error)
    } finally {
      state.isLoading = false
    }
  }

  // Limpia el estado de la store de tareas al hacer logout
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

  return {
    state,
    totalPages,
    currentFilters,
    tasksData,
    fetchTasks,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    editTask,
    resetFilters,
    createTask,
    loadAllUserTasks,
    clearTaskStore
    // ... otros métodos necesarios
  }
})
