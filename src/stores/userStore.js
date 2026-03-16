// userStore.js
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from './dataStore.js'
import { useTaskStore } from './taskStore.js'
import { useProjectStore } from './projectStore.js'
import * as userService from '@/services/userService.js'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const router = useRouter()
  const dataStore = useDataStore()
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?.uid || null)
  const userName = computed(() => {
    return user.value?.displayName || user.value?.email?.split('@')[0] || 'Guest'
  })
  const userProfilePicture = computed(() => user.value?.photoURL || '')

  // Auth Listener
  const setupAuthListener = () => {
    const unsubscribe = userService.subscribeToAuth(async (currentUser) => {
      if (currentUser) {
        user.value = currentUser
        token.value = await currentUser.getIdToken()

        try {
          await userService.createUserDocument(currentUser)
        } catch (error) {
          console.error('Sync error:', error)
        }
      } else {
        user.value = null
        token.value = null
      }
    })
    return unsubscribe
  }

  let unsubscribeAuth = setupAuthListener()

  onUnmounted(() => unsubscribeAuth?.())

  // Auth Actions
  const logInWithGoogle = async (actionType = 'signin') => {
    await userService.loginWithGoogle(actionType)
    handlePostLoginNavigation()
  }

  // Logout
  const logOut = async () => {
    try {
      await userService.logout()

      // Clear data in all stores
      dataStore.clearUserData()
      taskStore.clearTaskStore()
      projectStore.clearProjectsData()
      taskStore.state.selectedProjects = []

      handlePostLogoutNavigation()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Navigation Handlers
  const handlePostLoginNavigation = () => {
    const redirectPath = router.currentRoute.value.query.redirect || '/'
    setTimeout(() => router.push(redirectPath), 1000)
  }

  const handlePostLogoutNavigation = () => {
    if (router.currentRoute.value.path !== '/') {
      setTimeout(() => router.push('/'), 1000)
    }
  }

  return {
    // State
    user,
    token,

    // Getters
    isLoggedIn,
    userId,
    userName,
    userProfilePicture,

    // Actions
    logInWithGoogle,
    logOut
  }
})
