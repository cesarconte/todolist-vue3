// userStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  getAuth
} from 'firebase/auth'
import { db } from '../firebase.js'
// import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
// import { useDataStore } from './dataStore.js'
import { useNotificationsStore } from './notificationsStore.js'

export const useUserStore = defineStore('user', () => {
  // State
  // const dataStore = useDataStore()
  const notificationsStore = useNotificationsStore()
  const auth = getAuth()
  const user = ref(null)
  const userId = ref(null)
  const token = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!user.value)

  // Computed properties for user name and profile picture
  const userName = computed(() => {
    if (isLoggedIn.value) {
      return user.value.displayName || user.value.email
    } else {
      return ''
    }
  })

  const userProfilePicture = computed(() => {
    if (isLoggedIn.value) {
      return user.value.photoURL
    } else {
      return ''
    }
  })

  // Actions
  const router = useRouter()

  // userStore.js - logInWithGoogle action
  // const logInWithGoogle = async () => {
  //   try {
  //     const provider = new GoogleAuthProvider()
  //     const result = await signInWithPopup(auth, provider)
  //     const user = result.user
  //     const currentUser = auth.currentUser

  //     // Create/update user document in Firestore
  //     await createUserDocument(user)

  //     // Update local state
  //     userId.value = currentUser.uid
  //     user.value = currentUser

  //     // Personalized welcome message
  //     const userName = user.displayName || user.email.split('@')[0]
  //     const welcomeMessage = userProfilePicture.value
  //       ? `Welcome back, ${userName}! 🎉`
  //       : `First time? Welcome ${userName}! 👋`

  //     notificationsStore.displaySnackbar(welcomeMessage, 'success', 'mdi-account-check')

  //     // Redirect to home with slight delay for better UX
  //     setTimeout(() => {
  //       router.push('/')
  //     }, 1500)
  //   } catch (error) {
  //     // Error handling with contextual message
  //     const errorType =
  //       error.code === 'auth/popup-closed-by-user'
  //         ? 'Login cancelled - popup closed'
  //         : `Login failed: ${error.message}`

  //     notificationsStore.displaySnackbar(errorType, 'error', 'mdi-account-cancel')

  //     // Technical logging (non-user facing)
  //     console.error('Auth error details:', {
  //       code: error.code,
  //       message: error.message,
  //       email: error.email,
  //       credential: error.credential
  //     })
  //   }
  // }
  const logInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const currentUser = auth.currentUser

      // 1. Create/update user document y detectar si es nuevo
      const { isNewUser, profileUpdated } = await createUserDocument(user)

      // 2. Actualizar estado local
      userId.value = currentUser.uid
      user.value = currentUser

      // 3. Determinar mensaje según contexto
      const userName = user.displayName || user.email.split('@')[0]
      const currentHour = new Date().getHours()
      let welcomeMessage

      if (isNewUser) {
        welcomeMessage = `Welcome aboard, ${userName}! 🚀`
      } else if (profileUpdated) {
        welcomeMessage = `New look, same excellence ${userName}! ✨`
      } else if (currentHour < 12) {
        welcomeMessage = `Good morning, ${userName}! ☕`
      } else {
        welcomeMessage = `Welcome back, ${userName}! 👋`
      }

      // 4. Mostrar notificación
      notificationsStore.displaySnackbar(
        welcomeMessage,
        'success',
        isNewUser ? 'mdi-account-star' : 'mdi-account-check'
      )

      // 5. Redirección con delay optimizado
      setTimeout(() => router.push('/'), 1500)
    } catch (error) {
      // 6. Manejo de errores mejorado
      const errorMessage =
        error.code === 'auth/popup-closed-by-user'
          ? 'Login cancelled - popup closed ❌'
          : `Login failed: ${error.message} ⚠️`

      notificationsStore.displaySnackbar(errorMessage, 'error', 'mdi-account-remove')

      // 7. Logging detallado
      console.error('Authentication Error:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Función modificada createUserDocument
  const createUserDocument = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      let isNewUser = false
      let profileUpdated = false

      if (userDoc.exists()) {
        // Verificar cambios en el perfil
        const previousData = userDoc.data()
        profileUpdated =
          previousData.displayName !== user.displayName || previousData.photoURL !== user.photoURL

        await updateDoc(userRef, {
          lastLogin: new Date(),
          loginCount: (previousData.loginCount || 0) + 1,
          ...(profileUpdated && {
            displayName: user.displayName,
            photoURL: user.photoURL
          })
        })
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdTasks: [],
          firstLogin: new Date(),
          loginCount: 1
        })
        isNewUser = true
      }

      return { isNewUser, profileUpdated }
    } catch (error) {
      console.error('Document Error:', error)
      return { isNewUser: false, profileUpdated: false }
    }
  }
  // Create or update user document in Firestore
  // const createUserDocument = async (user) => {
  //   try {
  //     const userRef = doc(db, 'users', user.uid)
  //     const userDoc = await getDoc(userRef)

  //     if (userDoc.exists()) {
  //       // User document exists, update it (only if there's a new task to add)
  //       if (dataStore.newTask.taskId) {
  //         await updateDoc(userRef, {
  //           displayName: user.displayName,
  //           email: user.email,
  //           photoURL: user.photoURL,
  //           createdTasks: arrayUnion(dataStore.newTask.taskId)
  //         })
  //         notificationsStore.displaySnackbar(
  //           'User profile updated successfully',
  //           'success',
  //           'mdi-account-sync'
  //         )
  //       }
  //     } else {
  //       // User document doesn't exist, create it
  //       await setDoc(userRef, {
  //         uid: user.uid,
  //         displayName: user.displayName,
  //         email: user.email,
  //         photoURL: user.photoURL,
  //         createdTasks: [] // Initialize createdTasks as an empty array
  //       })
  //       notificationsStore.displaySnackbar(
  //         'New user profile created',
  //         'success',
  //         'mdi-account-plus'
  //       )
  //     }
  //   } catch (error) {
  //     console.error('Error creating/updating user document:', error)
  //     notificationsStore.displaySnackbar(
  //       `Profile update failed: ${error.message}`,
  //       'error',
  //       'mdi-account-alert'
  //     )
  //   }
  // }
  // Logout function with personalized message
  const logOut = async () => {
    try {
      // 1. Capturar datos del usuario antes de cerrar sesión
      const userNameBeforeLogout = userName.value || 'Guest'

      // 2. Ejecutar logout técnico
      await signOut(auth)

      // 3. Mensaje contextual con inteligencia temporal
      const getFarewellMessage = () => {
        const hour = new Date().getHours()
        const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
        const emojiMap = {
          morning: '🌅',
          afternoon: '☀️',
          evening: '🌙'
        }

        const messages = [
          `Have a great ${timeOfDay}, ${userNameBeforeLogout}! ${emojiMap[timeOfDay]}`,
          `System logout: Success - Come back anytime, ${userNameBeforeLogout}!`,
          `Successfully logged out - Until next time, ${userNameBeforeLogout}! 👋`
        ]

        return messages[Math.floor(Math.random() * messages.length)]
      }

      // 4. Mostrar notificación con delay para mejor percepción
      setTimeout(() => {
        notificationsStore.displaySnackbar(
          getFarewellMessage(),
          'success',
          'mdi-account-arrow-left'
        )
      }, 500)

      // 5. Resetear estado local
      user.value = null
      userId.value = null
      token.value = null

      // 6. Redirección opcional con delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      // 7. Manejo de errores con detalles contextuales
      const errorMessage = `Logout failed${userName.value ? ` for ${userName.value}` : ''}: ${error.message}`

      notificationsStore.displaySnackbar(errorMessage, 'error', 'mdi-account-alert')

      // 8. Log técnico completo
      console.error('Logout error details:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Initialize user state on component mount
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser
      userId.value = currentUser.uid
      currentUser.getIdToken().then((idToken) => {
        token.value = idToken
      })
    } else {
      user.value = null
      userId.value = null
      token.value = null
      return
    }
  })

  return {
    // State
    user,
    userId,
    isLoggedIn,
    token,
    // Getters
    userName,
    userProfilePicture,
    // Actions
    logInWithGoogle,
    createUserDocument,
    logOut
  }
})
