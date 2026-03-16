import { initializeApp } from 'firebase/app'
import { getFirestore, serverTimestamp, FieldValue } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { env } from './env.js'

/**
 * Instancia centralizada de Firebase.
 */
const firebaseApp = initializeApp(env.firebase)

/**
 * Servicios de Firebase exportados.
 */
export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)
export const storage = getStorage(firebaseApp)

/**
 * Helpers y utilidades de Firestore.
 */
export const serverTimestampField = serverTimestamp()
export { serverTimestamp, FieldValue }

export default firebaseApp
