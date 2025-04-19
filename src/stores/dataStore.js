//dataStore.js
import { defineStore } from 'pinia'
import { db } from '../firebase.js'
import { ref, computed, watch, reactive } from 'vue'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useUserStore } from './userStore.js'
import { useNotificationsStore } from './notificationsStore.js'
// import { getCollection } from '@/utils/firestoreCrud.js'

// Puedes usar getCollection en fetchCollection si en algún momento necesitas obtener los datos de una colección de forma puntual (sin suscripción en tiempo real)
// Por ahora, la lógica principal de dataStore.js usa onSnapshot para suscripción en tiempo real, que es lo más eficiente para colecciones de datos de referencia.
// Si en el futuro necesitas una carga puntual (sincrónica) de una colección, puedes usar getCollection(collectionRef) y asignar el resultado al array reactivo correspondiente.

export const useDataStore = defineStore('data', () => {
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  // State
  const projectTemplatesData = ref([])
  const labelsData = ref([])
  const prioritiesData = ref([])
  const statusesData = ref([])
  const colorsData = ref([])
  const iconsData = ref([])
  const isSaving = ref(false)
  // Listeners (store unsubscribe functions for each collection)
  const listeners = reactive({})

  const collections = {
    // Centralize collections
    projectTemplates: projectTemplatesData,
    labels: labelsData,
    priorities: prioritiesData,
    statuses: statusesData,
    colors: colorsData,
    icons: iconsData
  }

  // Getters (computed properties for reactive data access)
  const projectTemplates = computed(() => {
    return projectTemplatesData.value
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
  const icons = computed(() => {
    return iconsData.value
  })
  const projectTemplateItems = computed(() => {
    return projectTemplatesData.value.map((projectTemplate) => ({
      value: projectTemplate.title,
      title: projectTemplate.title
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
  const iconItems = computed(() => {
    return iconsData.value.map((icon) => ({
      value: icon.title,
      title: icon.displayName
    }))
  })

  // Actions
  // Fetch data for a collection, optionally filtering and unsubscribing after initial fetch
  const fetchCollection = async (collectionName, targetRef) => {
    subscribeToCollection(collectionName, targetRef, true)
  }
  // Subscribe to a collection and listen for real-time updates
  const subscribeToCollection = (collectionName) => {
    const targetRef = collections[collectionName]
    if (!targetRef) return

    // Creamos una consulta a la colección especificada, ordenando los documentos por el campo
    // 'title' en orden ascendente.
    const collectionRef = query(collection(db, collectionName), orderBy('title', 'asc'))
    // Utilizamos onSnapshot para subscribirse a la colección.
    listeners[collectionName] = onSnapshot(collectionRef, (snapshot) => {
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
              // Remove the document from the array
              targetRef.value.splice(index, 1)
              break
          }
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        notificationsStore.displaySnackbar('Error fetching data', 'error', 'mdi-close-circle')
      }
    })
  }

  const clearUserData = () => {
    for (const collectionName in collections) {
      collections[collectionName].value = []
    }
  }

  // Helper function to unsubscribe from a specific collection
  const unsubscribeFromCollection = (collectionName) => {
    if (listeners[collectionName]) {
      try {
        listeners[collectionName]()
        delete listeners[collectionName]
      } catch (error) {
        console.error('Error unsubscribing from listener:', error)
      }
    }
  }

  // Helper function to unsubscribe from all listeners
  const unsubscribeAll = () => {
    Object.values(listeners).forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })
    Object.keys(listeners).forEach((key) => (listeners[key] = null))
  }

  // Watch for changes in the user store
  // and subscribe/unsubscribe to collections accordingly
  // This is important to ensure that the data store is reactive to user changes
  // and that the data is cleared when the user logs out
  // This is important to avoid memory leaks
  // and ensure the listener is not active
  // when the component is not in use
  watch(
    () => userStore.user,
    (newUser) => {
      if (newUser) {
        for (const collectionName in collections) {
          subscribeToCollection(collectionName)
        }
      } else {
        unsubscribeAll()
        clearUserData()
      }
    },
    { immediate: true }
  )

  return {
    // State
    db,
    listeners,
    isSaving,

    // Getters
    projectTemplates,
    labels,
    priorities,
    statuses,
    colors,
    icons,
    projectTemplatesData,
    labelsData,
    prioritiesData,
    statusesData,
    colorsData,
    iconsData,
    projectTemplateItems,
    labelItems,
    priorityItems,
    statusItems,
    colorItems,
    iconItems,

    // Actions
    fetchCollection,
    subscribeToCollection,
    clearUserData,

    // Helper functions
    unsubscribeFromCollection,
    unsubscribeAll
  }
})
