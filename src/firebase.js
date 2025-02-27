// firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore, serverTimestamp, FieldValue } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAWGSnO42lGE8oAQzZm6MwTLyHuuHkd6lA',
  authDomain: 'todo-list-1bba9.firebaseapp.com',
  projectId: 'todo-list-1bba9',
  storageBucket: 'todo-list-1bba9.firebasestorage.app',
  messagingSenderId: '125100747049',
  appId: '1:125100747049:web:395d2b89526fffcbc8af38'
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)
const storage = getStorage(firebaseApp)
const serverTimestampField = serverTimestamp()

export { firebaseApp, db, auth, storage, serverTimestampField, serverTimestamp, FieldValue }
