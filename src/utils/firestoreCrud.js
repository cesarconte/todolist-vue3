import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

export async function getDocument(ref) {
  const docSnap = await getDoc(ref)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export async function getCollection(q) {
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function addDocument(ref, data) {
  return await addDoc(ref, data)
}

export async function updateDocument(ref, data) {
  return await updateDoc(ref, data)
}

export async function deleteDocument(ref) {
  return await deleteDoc(ref)
}

export function subscribeToCollection(q, callback, errorCallback) {
  return onSnapshot(q, callback, errorCallback)
}
