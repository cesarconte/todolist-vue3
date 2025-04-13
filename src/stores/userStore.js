// userStore.js
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { signInWithPopup, GoogleAuthProvider, signOut, onIdTokenChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useRouter } from 'vue-router'
import { useDataStore } from './dataStore.js'
import { useTaskStore } from './taskStore.js'
import { useProjectStore } from './projectStore.js'
import { useNotificationsStore } from './notificationsStore.js'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const router = useRouter()
  const notificationsStore = useNotificationsStore()
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

  // Helpers
  const getTimePeriod = () => {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  }

  const timeEmojis = {
    morning: '☕',
    afternoon: '🌞',
    evening: '🌙'
  }

  const getTimeEmoji = () => timeEmojis[getTimePeriod()]

  // Unified Error Configuration
  const errorConfigurations = {
    'auth/popup-closed-by-user': {
      message: 'Login cancelled - popup closed ❌',
      icon: 'mdi-window-close',
      level: 'warning',
      simpleMessage: 'Login cancelled - popup closed'
    },
    'auth/network-request-failed': {
      message: 'Network error - check connection 🌐',
      icon: 'mdi-wifi-off',
      level: 'error',
      simpleMessage: 'Network error - check connection 🌐'
    },
    'auth/too-many-requests': {
      message: 'Too many attempts - try later 🚦',
      icon: 'mdi-timer-sand',
      level: 'warning',
      simpleMessage: 'Too many attempts - try later 🚦'
    },
    'auth/cancelled-popup-request': {
      message: 'Login process already in progress ⚠️',
      icon: 'mdi-alert',
      level: 'info',
      simpleMessage: 'Login process already in progress'
    },
    'auth/invalid-credential': {
      message: 'Session expired - please login again 🔄',
      icon: 'mdi-account-sync',
      level: 'error',
      simpleMessage: 'Session expired'
    },
    default: {
      message: (error) => `Authentication error: ${error.message}`,
      icon: 'mdi-alert-circle',
      level: 'error',
      simpleMessage: (error) => `Error: ${error.message}`
    }
  }

  const getErrorConfiguration = (error, type = 'full') => {
    const config = errorConfigurations[error.code] || errorConfigurations.default
    return {
      full: {
        message: typeof config.message === 'function' ? config.message(error) : config.message,
        icon: config.icon,
        level: config.level
      },
      simple:
        typeof config.simpleMessage === 'function'
          ? config.simpleMessage(error)
          : config.simpleMessage
    }[type]
  }

  // Auth Listener
  const setupAuthListener = () => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        user.value = currentUser
        token.value = await currentUser.getIdToken()

        try {
          await createUserDocument(currentUser)
        } catch (error) {
          const { message, icon, level } = getErrorConfiguration(error, 'full')
          notificationsStore.displaySnackbar(message, level, icon)
          console.error('Sync error:', error)
        }
      } else {
        user.value = null
        token.value = null
      }
    })
    return unsubscribe // Return the unsubscribe function
  }

  // Initialize Auth Listener
  // This is called when the component is mounted
  // to ensure the listener is active
  // when the component is in use
  let unsubscribeAuth = setupAuthListener()
  // Cleanup on component unmount
  // and re-setup on component mount
  // to ensure the listener is active
  // when the component is in use
  // and cleaned up when not in use
  // This is important to avoid memory leaks
  // and ensure the listener is not active
  // when the component is not in use
  onMounted(() => {
    unsubscribeAuth = setupAuthListener()
  })
  // Cleanup the listener when the component is unmounted
  // to avoid memory leaks
  onUnmounted(() => unsubscribeAuth?.())

  // Error Handling
  const handleAuthError = (error) => {
    const { message, icon, level } = getErrorConfiguration(error, 'full')
    notificationsStore.displaySnackbar(message, level, icon)
    console.error('Auth Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }

  // Auth Actions
  const logInWithGoogle = async (actionType = 'signin') => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      provider.setCustomParameters({
        prompt: actionType === 'signup' ? 'select_account' : 'none'
      })

      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      const { isNewUser } = await createUserDocument(firebaseUser)

      notificationsStore.displaySnackbar(
        generateWelcomeMessage(firebaseUser, actionType, isNewUser),
        'success',
        isNewUser ? 'mdi-account-star' : 'mdi-account-check'
      )

      handlePostLoginNavigation()
    } catch (error) {
      handleAuthError(error)
      throw error
    }
  }

  // Welcome Message
  const generateWelcomeMessage = (user, actionType, isNew) => {
    const name = user.displayName || user.email.split('@')[0]
    const emoji = getTimeEmoji()

    if (isNew) return `Welcome aboard, ${name}! 🚀`
    return actionType === 'signup'
      ? `Welcome back, ${name}! ${emoji}`
      : `Good ${getTimePeriod()} ${name}! ${emoji}`
  }

  // Firestore Operations
  const createUserDocument = async (user) => {
    const userRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userRef)

    const userData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date(),
      loginCount: (userDoc.data()?.loginCount || 0) + 1
    }

    if (userDoc.exists()) {
      await updateDoc(userRef, userData)
      return { isNewUser: false }
    }

    await setDoc(userRef, {
      ...userData,
      uid: user.uid,
      createdTasks: [],
      firstLogin: new Date()
    })
    return { isNewUser: true }
  }

  // Logout
  const logOut = async () => {
    try {
      const userName = user.value?.displayName || 'Guest'
      await signOut(auth)

      // Clear data in all stores
      dataStore.clearUserData()
      // taskStore.resetFilters()
      // taskStore.allTasksProject = []
      // taskStore.tasksData = []
      taskStore.clearTaskStore()
      projectStore.clearProjectsData()

      notificationsStore.displaySnackbar(
        generateFarewellMessage(userName),
        'success',
        'mdi-account-arrow-left'
      )

      handlePostLogoutNavigation()
    } catch (error) {
      const simpleMessage = getErrorConfiguration(error, 'simple')
      notificationsStore.displaySnackbar(
        `Logout failed: ${simpleMessage}`,
        'error',
        'mdi-account-alert'
      )
      console.error('Logout error:', error)
    }
  }

  const generateFarewellMessage = (name) => {
    const messages = [
      `See you soon, ${name}! 👋`,
      `Until next time, ${name}! 👋`,
      `Have a great ${getTimePeriod()}, ${name}! ${getTimeEmoji()}`
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Navigation Handlers
  const handlePostLoginNavigation = (isNewUser) => {
    const redirectPath = isNewUser ? '/' : router.currentRoute.value.query.redirect || '/'

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
