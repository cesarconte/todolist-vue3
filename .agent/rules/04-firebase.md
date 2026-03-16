---
trigger: always_on
---

# Rule 04 — Firebase: Estándares de Uso

## Configuración e inicialización

### Centralización obligatoria

```
src/
  config/
    firebase.js     ← ÚNICA fuente de inicialización de Firebase
  services/
    auth.js         ← Lógica de autenticación
    firestore.js    ← Acceso a Firestore (colecciones, queries)
    storage.js      ← Firebase Storage (si aplica)
```

```js
// src/config/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

- Todas las variables de Firebase en `.env`. Nunca en el código fuente.
- `.env.example` con todas las claves documentadas (sin valores reales).
- Un único punto de inicialización. Nunca inicializar Firebase en más de un lugar.
- La `apiKey` de Firebase es pública por diseño — la seguridad la dan las Security Rules,
  no ocultar la key. No confundir esto con secrets reales.

---

## Firestore — Patrones de acceso a datos

### Capa de servicios (obligatorio)

Todo acceso a Firestore pasa por funciones en `src/services/`.
Nunca importar `db` directamente en stores o componentes.

```js
// src/services/firestore.js
import { db } from '@/config/firebase'
import {
  collection, doc, getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  onSnapshot, serverTimestamp
} from 'firebase/firestore'

// Operaciones CRUD con manejo de errores en la capa de servicio
export async function getDocument(collectionPath, docId) {
  const docRef = doc(db, collectionPath, docId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() }
}

export async function createDocument(collectionPath, data) {
  const docRef = await addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function updateDocument(collectionPath, docId, data) {
  const docRef = doc(db, collectionPath, docId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteDocument(collectionPath, docId) {
  await deleteDoc(doc(db, collectionPath, docId))
}
```

### Queries

```js
// Siempre limitar los resultados. Nunca colecciones completas sin límite.
const q = query(
  collection(db, 'invoices'),
  where('userId', '==', userId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(50)           // ← SIEMPRE definir un límite
)
```

- Índices compuestos: crear en Firebase Console antes de desplegar queries complejas.
  Una query con `where` + `orderBy` en campos distintos requiere índice compuesto.
- Paginación con `startAfter()` / `startAt()` para colecciones que pueden crecer.
- Proyección de campos con `select()` cuando solo se necesitan algunos campos de documentos grandes.

### Listeners en tiempo real

```js
// onSnapshot devuelve una función de cancelación — guardarla SIEMPRE
export function subscribeToCollection(collectionPath, queryConstraints, callback) {
  const q = query(collection(db, collectionPath), ...queryConstraints)

  const unsubscribe = onSnapshot(q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback({ data, error: null })
    },
    (error) => {
      callback({ data: null, error: error.message })
    }
  )

  return unsubscribe // el llamador es responsable de cancelar
}
```

- **Todo listener se cancela en `onUnmounted`.** Sin excepciones.
- Documentar en el componente o store dónde y cuándo se cancela el listener.
- Preferir `onSnapshot` para datos que el usuario necesita ver actualizados en tiempo real.
  Para datos que solo se necesitan una vez, usar `getDoc` / `getDocs` (más económico).

### Estructura de documentos

- `createdAt` y `updatedAt` con `serverTimestamp()` en todos los documentos.
  Nunca `new Date()` o `Date.now()` — los relojes de cliente no son fiables.
- IDs de documento: dejar que Firestore los genere automáticamente con `addDoc`
  salvo que haya una razón de negocio para un ID específico.
- Subcolecciones vs campos de array: usar subcolecciones cuando los ítems hijos
  tienen entidad propia y pueden superar los 100 elementos.
  Arrays para listas pequeñas y estáticas.
- Desnormalizar con criterio: Firestore no tiene JOINs.
  Duplicar datos relevantes si evita lecturas adicionales en pantallas de alta frecuencia.
  Documentar la desnormalización y el plan de actualización.

---

## Firebase Authentication

```js
// src/services/auth.js
import { auth } from '@/config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'

export async function signIn(email, password) {
  return await signInWithEmailAndPassword(auth, email, password)
}

export async function signUp(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password)
}

export async function logOut() {
  await signOut(auth)
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback)
  // Devuelve unsubscribe — el llamador debe cancelarlo
}
```

### Store de autenticación

```js
// stores/use-auth.js — patrón obligatorio
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(true) // true hasta que Firebase confirme el estado inicial
  let unsubscribeAuth = null

  function init() {
    unsubscribeAuth = subscribeToAuthState((firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false
    })
  }

  async function logout() {
    await logOut()
    user.value = null
    // Resetear todas las stores de datos del usuario aquí
  }

  function cleanup() {
    if (unsubscribeAuth) unsubscribeAuth()
  }

  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.uid ?? null)

  return { user, isLoading, isAuthenticated, userId, init, logout, cleanup }
})
```

- `init()` se llama una sola vez en el componente raíz (`App.vue`) en `onMounted`.
- `isLoading: true` mientras Firebase resuelve el estado de auth — imprescindible
  para no mostrar la pantalla de login en un flash antes de confirmar sesión activa.
- `cleanup()` se llama en `onUnmounted` de `App.vue`.

### Navigation Guards

```js
// router/index.js
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  // Esperar a que Firebase confirme el estado de auth
  if (authStore.isLoading) {
    await new Promise(resolve => {
      const unwatch = watch(
        () => authStore.isLoading,
        (loading) => { if (!loading) { unwatch(); resolve() } }
      )
    })
  }

  const requiresAuth = to.meta.requiresAuth ?? false
  const requiresGuest = to.meta.requiresGuest ?? false

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (requiresGuest && authStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})
```

---

## Security Rules — Principios (no negociables)

Las Security Rules son la última línea de defensa real.
Las validaciones client-side son para UX, no para seguridad.

```javascript
// firestore.rules — estructura base obligatoria
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Denegar todo por defecto — el acceso se concede explícitamente
    match /{document=**} {
      allow read, write: if false;
    }

    // Funciones helper reutilizables
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidTimestamp(field) {
      return request.resource.data[field] == request.time;
    }

    // Ejemplo de colección con reglas propias
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Los usuarios no se eliminan desde cliente
    }

    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

- **Denegar todo por defecto.** El acceso se concede de forma explícita y mínima.
- Nunca `allow read, write: if true` en producción.
- Las reglas validan que `userId` en el documento coincide con `request.auth.uid`.
- Validar también los datos con `request.resource.data` para evitar escrituras malformadas.
- Testear las Security Rules con el emulador local antes de desplegar.

---

## Control de costes en Firestore

El coste de Firestore se basa en lecturas, escrituras y eliminaciones.
Cada `onSnapshot` activo cuenta como una lectura por cada cambio.

- **Minimizar lecturas:** no suscribir con `onSnapshot` a datos que no cambian frecuentemente.
  Usar `getDoc`/`getDocs` para datos estáticos o de baja frecuencia de cambio.
- **Cancelar listeners inmediatamente** cuando el componente se desmonta.
- **Limitar queries** siempre con `limit()`. Una query sin límite en una colección
  que crece puede disparar costes inesperadamente.
- **Caché de Firestore:** habilitar persistencia offline solo si la UX lo justifica.
  La persistencia aumenta las lecturas del caché local y puede causar datos obsoletos.
- **No leer documentos completos** si solo se necesitan algunos campos.
  Usar `select()` en queries que devuelven muchos documentos con campos pesados.
- Monitorizar el dashboard de uso en Firebase Console regularmente durante el desarrollo.

---

## Emuladores locales (obligatorio en desarrollo)

```js
// src/config/firebase.js — conectar emuladores en desarrollo
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectAuthEmulator } from 'firebase/auth'

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}
```

- Nunca desarrollar o testear contra el proyecto de producción de Firebase.
- Los emuladores son gratuitos, instantáneos y sin límites de cuota.
- `firebase.json` y `.firebaserc` en el control de versiones (sin datos sensibles).
- Los tests de Security Rules se ejecutan contra el emulador, nunca contra producción.

---

## Lo que nunca se hace con Firebase

- Variables de configuración hardcodeadas en el código fuente.
- Acceder a Firestore directamente desde componentes o stores (saltarse la capa de servicios).
- Security Rules con `allow read, write: if true`.
- Queries sin `limit()` sobre colecciones que pueden crecer.
- Listeners `onSnapshot` que no se cancelan al desmontar.
- Usar `new Date()` en lugar de `serverTimestamp()` para timestamps.
- Desarrollar contra el proyecto de producción de Firebase.
- Escribir en Firestore desde las Security Rules del lado cliente sin validación de datos.
- Ignorar el dashboard de uso en Firebase — los costes pueden escalar silenciosamente.