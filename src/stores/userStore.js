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
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useDataStore } from './dataStore.js'

export const useUserStore = defineStore('user', () => {
  // State
  const dataStore = useDataStore()
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

  const logInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      /* Firebase Authentication's default persistence behavior:
       Firebase Authentication uses 'browserLocalPersistence' by default in web applications.
       This means the user's session is stored in the browser's local storage,
       allowing the user to remain logged in even after closing and reopening the browser.
       If you wish to change this behavior (e.g., to 'browserSessionPersistence' or 'inMemoryPersistence'),
       you must use the 'setPersistence' function before 'signInWithPopup'. */
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const currentUser = auth.currentUser

      // Create or update the user document in Firestore
      await createUserDocument(user)

      // Set userId inmediately after succesful login
      userId.value = currentUser.uid

      // Redirect to '/' after successful login
      router.push('/')
    } catch (error) {
      // console.error('Error logging in with Google:', error)
      alert('Error logging in with Google. Please try again.')
    }
  }

  const createUserDocument = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        // User document exists, update it (only if there's a new task to add)
        if (dataStore.newTask.taskId) {
          await updateDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdTasks: arrayUnion(dataStore.newTask.taskId)
          })
          alert('User document updated')
        }
      } else {
        // User document doesn't exist, create it
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdTasks: [] // Initialize createdTasks as an empty array
        })
        alert('User document created')
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error)
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
      user.value = null
      userId.value = null
      token.value = null
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Error logging out. Please try again.')
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
