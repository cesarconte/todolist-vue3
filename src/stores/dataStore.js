//dataStore.js

import { defineStore } from 'pinia'
import { db } from '../firebase.js'
import { ref, onMounted, computed, onUnmounted, reactive } from 'vue'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  getDoc,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch
} from 'firebase/firestore'
import { useTaskStore } from './taskStore.js'
import { useUserStore } from './userStore.js'
import { useRouter } from 'vue-router'
import { validTaskForm } from '@/composables/validationFormRules.js'
import { validProjectForm } from '@/composables/validationFormRules.js'

export const useDataStore = defineStore('data', () => {
  const taskStore = useTaskStore()
  const userStore = useUserStore()
  const router = useRouter()
  // State
  const userData = ref([])
  const tasksData = ref([])
  const projectsData = ref([])
  const labelsData = ref([])
  const prioritiesData = ref([])
  const statusesData = ref([])
  const colorsData = ref([])
  const newTask = ref({
    title: '',
    description: '',
    project: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    endDate: null,
    completed: false,
    createdAt: null,
    createdBy: '',
    projectId: ''
  })
  const editedTask = reactive({
    title: '',
    description: '',
    project: '',
    label: '',
    priority: '',
    status: '',
    startDate: null,
    endDate: null,
    updatedAt: serverTimestamp()
  })
  const newProject = reactive({
    color: '',
    createdAt: '',
    icon: '',
    projectId: '',
    title: '',
    userId: ''
  })
  const editedProject = reactive({
    title: '',
    icon: '',
    color: ''
  })
  const isSaving = ref(false)
  // Listeners (store unsubscribe functions for each collection)
  const listeners = ref({
    tasks: null,
    projects: null,
    labels: null,
    priorities: null,
    statuses: null,
    colors: null
  })

  // Getters (computed properties for reactive data access)
  const tasks = computed(() => {
    return tasksData.value
  })
  const projects = computed(() => {
    return projectsData.value
  })
  const labels = computed(() => {
    return labelsData.value
  })
  const priorities = computed(() => {
    return prioritiesData.value
  })
  const statuses = computed(() => {
    return statusesData.value
  })
  const colors = computed(() => {
    return colorsData.value
  })
  const newTaskData = computed(() => {
    return newTask.value
  })
  const editedTaskData = computed(() => {
    return editedTask
  })
  const newProjectData = computed(() => {
    return newProject
  })
  const editedProjectData = computed(() => {
    return editedProject
  })
  const selectedProject = computed(() => {
    return taskStore.selectedProject
  })
  const selectedProjectId = computed(() => {
    const project = projects.value.find((project) => project.title === selectedProject.value)
    const projectId = project?.id || ''
    return projectId
  })
  const newTaskProjectId = computed(() => {
    const project = projects.value.find((project) => project.title === newTask.value.project)
    const projectId = project ? project.id : null
    return projectId
  })
  const projectItems = computed(() => {
    return projectsData.value.map((project) => ({
      value: project.title,
      title: project.title
    }))
  })
  const labelItems = computed(() => {
    return labelsData.value.map((label) => ({
      value: label.title,
      title: label.title
    }))
  })
  const priorityItems = computed(() => {
    return prioritiesData.value.map((priority) => ({
      value: priority.title,
      title: priority.title
    }))
  })
  const statusItems = computed(() => {
    return statusesData.value.map((status) => ({
      value: status.title,
      title: status.title
    }))
  })
  const colorItems = computed(() => {
    return colorsData.value.map((color) => ({
      value: color.title,
      title: color.title
    }))
  })

  // Actions

  // Fetch data for a collection, optionally filtering and unsubscribing after initial fetch
  const fetchCollection = async (collectionName, targetRef) => {
    subscribeToCollection(collectionName, targetRef, true)
  }

  const subscribeToCollection = (collectionName, targetRef) => {
    // Creamos una consulta a la colección especificada, ordenando los documentos por el campo
    // 'title' en orden ascendente.
    const collectionRef = query(collection(db, collectionName), orderBy('title', 'asc'))
    // Utilizamos onSnapshot para subscribirse a la colección.
    listeners.value[collectionName] = onSnapshot(collectionRef, (snapshot) => {
      try {
        if (!targetRef.value) {
          targetRef.value = []
        }
        // * Utilizamos docChanges() para obtener sólo los cambios en los documentos, lo que supone
        // una mejora en el rendimiento.
        // * Se itera sobre los cambios y se actualizan los arrays reactivos correspondientes
        // (added, modified, removed).
        snapshot.docChanges().forEach((change) => {
          const index = targetRef.value.findIndex((item) => item.id === change.doc.id)
          switch (change.type) {
            case 'added':
              // Check for duplicates before adding
              if (index === -1) {
                // Add the new document to the array
                targetRef.value.push({
                  id: change.doc.id,
                  ...change.doc.data()
                })
              }
              break
            case 'modified':
              if (index !== -1) {
                // Update the existing document in the array
                targetRef.value.splice(index, 1, {
                  id: change.doc.id,
                  ...change.doc.data()
                })
              }
              break
            case 'removed':
              //if (index !== -1) {
                // Remove the document from the array
                targetRef.value.splice(index, 1) // No need to check for index here
              //}
              break
          }
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        alert('Error fetching data')
      }
    })
  }

  // Get a single task from Firestore
  const getTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      if (taskDoc.exists()) {
        return {
          id: taskDoc.id,
          ...taskDoc.data()
        }
      } else {
        // Handle the case where the task doesn't exist
        console.error('Task not found:', taskId)
        return null
      }
    } catch (error) {
      console.error('Error getting task:', error)
      return null
    }
  }

  // Create a new task in Firestore
  const createTask = async (newTask) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a task.')
      alert('Please log in to edit a task.')
      return // Stop execution if not logged in
    }
    // Check if the user ID is defined
    if (!userStore.userId) {
      console.error('User ID is undefined. Please log in.')
      alert('User ID is undefined. Please log in.')
      return // Stop execution if user ID is undefined
    }
    // Check if the task is being created
    if (isSaving.value) {
      return // Prevent multiple submissions
    }
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validTaskForm(newTask)) {
        // Get the project color
        const projectColor = await taskStore.getProjectColor(newTask.project)
        const projectId = newTaskProjectId.value
        // Add the task to Firestore
        const taskDocRef = await addDoc(collection(db, 'tasks'), {
          ...newTask,
          startDate: new Date(newTask.startDate),
          endDate: new Date(newTask.endDate),
          createdAt: new Date(),
          updatedAt: new Date(),
          completed: false,
          color: projectColor,
          taskId: newTask.title.toLowerCase().replace(/ /g, '-'),
          createdBy: userStore.userId,
          projectId: projectId
        })
        // Get the taskId from the newly created document
        const taskId = taskDocRef.id

        // Update the user document with the taskId
        const userRef = doc(db, 'users', userStore.userId)
        await updateDoc(userRef, {
          createdTasks: arrayUnion(taskId) // Add the taskId to the array
        })
        // Display a success message
        console.log('Task created successfully')
        alert('Task created successfully')
        // Display a success message
      } else {
        // Display an error message
        throw new Error('All fields are required.')
      }
    } catch (error) {
      console.error('createTask: Error creating task:', error) // Imprime el error en la consola
      alert('An error occurred while creating the task. Please try again.')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Edit an existing task in Firestore
  const updateTask = async (taskId, editedTask) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a task.')
      alert('Please log in to edit a task.')
      return // Stop execution if not logged in
    }

    // Check if the task is being edited
    if (isSaving.value) {
      return
    }
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validTaskForm(editedTask) && editedTask.startDate <= editedTask.endDate) {
        // Get the project color
        const projectColor = await taskStore.getProjectColor(editedTask.project)
        const taskRef = doc(db, 'tasks', taskId)

        // Fetch the task from Firestore to check ownership
        const taskDoc = await getDoc(taskRef)
        const taskData = taskDoc.data()

        // Check if the user owns the task
        if (taskData.createdBy === userStore.userId) {
          // Update the task in Firestore
          await updateDoc(taskRef, {
            ...editedTask,
            startDate: new Date(editedTask.startDate),
            endDate: new Date(editedTask.endDate),
            updatedAt: new Date(),
            color: projectColor
          })

          // Display a success message
          console.log('Task updated successfully')
          alert('Task updated successfully')
        } else {
          // Handle unauthorized access (e.g., show an error message)
          console.error('Unauthorized access to task:', taskId)
          alert('You are not authorized to edit this task.')
        }
      } else {
        // Display an error message
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      // Display an error message
      console.error('Error updating task:', error)
      alert('An error occurred while updating the task. Please try again.')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Delete a task from Firestore
  const deleteTask = async (taskId) => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete a task.')
        alert('Please log in to delete a task.')
        return // Stop execution if not logged in
      }

      // Fetch the task from Firestore to check ownership
      const taskRef = doc(db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)
      const taskData = taskDoc.data()

      // Check if the user owns the task
      if (taskData.createdBy === userStore.userId) {
        // 1. Get the user's document reference
        const userRef = doc(db, 'users', userStore.userId)

        // 2. Update the user document to remove the taskId from createdTasks
        try {
          await updateDoc(userRef, {
            createdTasks: arrayRemove(taskId) // Use arrayRemove to delete specific element
          })
        } catch (updateError) {
          console.error('Error updating user document:', updateError)
        }

        // 3. Delete the task from Firestore
        await deleteDoc(taskRef)

        // 4. Display a success message
        alert('Task deleted successfully')
        console.log('Task deleted successfully')

        // 5. Redirect to '/' after deleting the task
        router.push('/')
      } else {
        // Handle unauthorized access (e.g., show an error message)
        console.error('Unauthorized access to task:', taskId)
        alert('You are not authorized to delete this task.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error deleting task:', error)
      alert('Error deleting task: ' + error + 'Please try again!')
    }
  }

  const deleteAllTasks = async () => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete tasks.')
        alert('Please log in to delete tasks.')
        return // Stop execution if not logged in
      }

      // Get the current user's ID
      const currentUserId = userStore.userId

      // Start a transaction
      await runTransaction(db, async (transaction) => {
        // 1. Get all tasks created by the user
        const tasksRef = collection(db, 'tasks')
        const querySnapshot = await getDocs(
          query(tasksRef, where('createdBy', '==', currentUserId))
        )

        // 2. Delete each task within the transaction
        querySnapshot.docs.forEach((doc) => {
          transaction.delete(doc.ref)
        })

        // 3. Clear the user's createdTasks array within the transaction
        const userRef = doc(db, 'users', currentUserId)
        transaction.update(userRef, { createdTasks: [] })
      })

      // 4. Display a success message if the transaction completes successfully
      console.log('All tasks deleted successfully')
      alert('All tasks deleted successfully')
    } catch (error) {
      // Display an error message if the transaction fails
      console.error('Error deleting tasks:', error)
      alert('Error deleting tasks: ' + error + 'Please try again!')
    }
  }

  // Delete all tasks in a project from Firestore
  const deleteAllTasksInProject = async () => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete tasks.')
        alert('Please log in to delete tasks.')
        return // Stop execution if not logged in
      }

      // Get the current user's ID
      const currentUserId = userStore.userId

      // Fetch the project from Firestore to check ownership
      const projectRef = doc(db, 'projects', selectedProjectId.value)
      const projectDoc = await getDoc(projectRef)

      if (projectDoc.exists()) {
        const projectData = projectDoc.data()

        // Check if the user owns the project
        if (projectData.userId === userStore.userId) {
          // 1. Create a query to get all tasks of the project
          const tasksRef = collection(db, 'tasks')
          const querySnapshot = await getDocs(
            query(tasksRef, where('projectId', '==', selectedProjectId.value))
          )

          // 2. Delete each task and update user's createdTasks
          const batch = writeBatch(db)
          querySnapshot.docs.forEach((taskDoc) => {
            const taskId = taskDoc.id
            batch.delete(taskDoc.ref)

            // 3. Remove taskId from user's createdTasks
            const userRef = doc(db, 'users', currentUserId)
            batch.update(userRef, {
              createdTasks: arrayRemove(taskId)
            })
          })

          await batch.commit()

          // 4. Display a success message
          console.log('All tasks in the project deleted successfully')
          alert('All tasks in the project deleted successfully')

          // 5. Redirect to '/' after deleting the task
          router.push('/')
        } else {
          // Handle unauthorized access
          console.error('Unauthorized access to project:', selectedProjectId)
          alert('You are not authorized to delete tasks from this project.')
        }
      } else {
        // Handle the case where the project is not found
        console.error('Project not found:', selectedProjectId)
        alert('The selected project was not found.')
      }
    } catch (error) {
      console.error('Error deleting tasks in project:', error)
      alert('Error deleting tasks in project: ' + error + ' Please try again')
    }
  }

  // Add a new project to Firestore
  const createProject = async (newProject) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to create a project.')
      alert('Please log in to create a project.')
      return // Stop execution if not logged in
    }

    // Check if the project is being created
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validProjectForm(newProject)) {
        // Add the project to Firestore
        const docRef = await addDoc(collection(db, 'projects'), {
          ...newProject,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: newProject.title.toLowerCase().replace(/\s/g, '-'),
          userId: userStore.userId,
          createdBy: userStore.userId // Add the user ID to the project data
        })
        // Display a success message
        console.log('Project with ID: ' + docRef.id + ' created successfully!')
        alert('Project with ID: ' + docRef.id + ' created successfully!')
      } else {
        // Display an error message
        throw new Error('All fields are required.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error creating project:', error, error.message, 'Please try again!')
      alert('Error creating project: ' + error.message + ' Please try again!')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Edit an existing project in Firestore
  const saveEditedProject = async (projectId, editedProject) => {
    // Check if a user is logged in
    if (!userStore.isLoggedIn) {
      console.error('User must be logged in to edit a project.')
      alert('Please log in to edit a project.')
      return // Stop execution if not logged in
    }

    // Check if the project is being edited
    if (isSaving.value) return
    isSaving.value = true
    try {
      // Check if all fields are filled
      if (validProjectForm(editedProject)) {
        // Fetch the project from Firestore to check ownership
        const projectRef = doc(db, 'projects', projectId)
        const projectDoc = await getDoc(projectRef)
        const projectData = projectDoc.data()

        // Check if the user owns the project
        if (projectData.createdBy === userStore.userId) {
          // Update the project in Firestore
          await updateDoc(projectRef, {
            ...editedProject,
            projectId: editedProject.title.toLowerCase().replace(/\s/g, '-')
          })
          // Display a success message
          console.log('Project with ID: ' + projectId + ' edited successfully')
          alert('Project with ID: ' + projectId + ' edited successfully')
        } else {
          // Handle unauthorized access (e.g., show an error message)
          console.error('Unauthorized access to project:', projectId)
          alert('You are not authorized to edit this project.')
        }
      } else {
        // Display an error message
        throw new Error('All fields are required. Please try again!')
      }
    } catch (error) {
      // Display an error message
      console.error('Error updating project:', error)
      alert('Error updating project: ' + error.message + ' Please try again!')
    } finally {
      // Reset isSaving flag
      isSaving.value = false
    }
  }

  // Delete a project from Firestore
  const deleteProject = async (projectId) => {
    try {
      // Check if a user is logged in
      if (!userStore.isLoggedIn) {
        console.error('User must be logged in to delete a project.')
        alert('Please log in to delete a project.')
        return // Stop execution if not logged in
      }

      // Fetch the project from Firestore to check ownership
      const projectRef = doc(db, 'projects', projectId)
      const projectDoc = await getDoc(projectRef)
      const projectData = projectDoc.data()

      // Check if the user owns the project
      if (projectData.userId === userStore.userId) {
        // Delete all tasks in the project
        await deleteAllTasksInProject(projectId)

        // Delete the project from Firestore
        await deleteDoc(projectRef)

        // Display a success message
        console.log('Project deleted successfully')
        alert('Project deleted successfully')

        // Update taskStore.selectedProject if it matches the deleted project
        if (selectedProject.value === projectId) {
          selectedProject.value = null
        }

        // Redirect to '/' after deleting the project
        router.push('/')
      } else {
        // Handle unauthorized access (e.g., show an error message)
        console.error('Unauthorized access to project:', projectId)
        alert('You are not authorized to delete this project.')
      }
    } catch (error) {
      // Display an error message
      console.error('Error deleting project:', error)
      alert('Error deleting project: ' + error.message + ' Please try again!')
    }
  }

  // Helper function to unsubscribe from a specific collection
  const unsubscribeFromCollection = (collectionName) => {
    if (listeners.value[collectionName]) {
      try {
        listeners.value[collectionName]()
        delete listeners.value[collectionName]
        console.log('Unsubscribed from listener:', collectionName)
      } catch (error) {
        console.error('Error unsubscribing from listener:', error)
      }
    }
  }

  // Helper function to unsubscribe from all listeners
  const unsubscribeAll = () => {
    for (const collectionName in listeners.value) {
      unsubscribeFromCollection(collectionName)
    }
    console.log('Unsubscribed from all listeners')
    listeners.value = {} // Reset listeners object
  }

  // Lifecycle hooks
  onMounted(() => {
    subscribeToCollection('users', userData)
    subscribeToCollection('tasks', tasksData)
    subscribeToCollection('projects', projectsData)
    subscribeToCollection('labels', labelsData)
    subscribeToCollection('priorities', prioritiesData)
    subscribeToCollection('statuses', statusesData)
    subscribeToCollection('colors', colorsData)
  })

  onUnmounted(unsubscribeAll)

  return {
    // State
    db,
    listeners,
    newTask,
    editedTask,
    newProject,
    editedProject,
    isSaving,

    // Getters
    tasks,
    projects,
    labels,
    priorities,
    statuses,
    colors,
    tasksData,
    projectsData,
    labelsData,
    prioritiesData,
    statusesData,
    colorsData,
    projectItems,
    labelItems,
    priorityItems,
    statusItems,
    colorItems,
    newTaskData,
    editedTaskData,
    newProjectData,
    editedProjectData,
    selectedProject,
    selectedProjectId,
    newTaskProjectId,
    // userId,

    // Actions
    fetchCollection,
    subscribeToCollection,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    deleteAllTasks,
    deleteAllTasksInProject,
    createProject,
    saveEditedProject,
    deleteProject,
    // Helper functions
    unsubscribeFromCollection,
    unsubscribeAll
  }
})
