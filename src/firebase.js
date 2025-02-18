// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp, FieldValue } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: 'AIzaSyD08TD_QQTg1HLA_vTTDO5Gq5znXiVtDwk',
  authDomain: 'todolist-vue3.firebaseapp.com',
  projectId: 'todolist-vue3',
  storageBucket: 'todolist-vue3.appspot.com',
  messagingSenderId: '132009458157',
  appId: '1:132009458157:web:7190bb37ed277b0885cfe4'
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);
const serverTimestampField = serverTimestamp();

export {
  firebaseApp,
  db,
  auth,
  storage,
  serverTimestampField,
  serverTimestamp,
  FieldValue,
};
