---
trigger: always_on
---

# Rule 02 — Pinia: Gestión de Estado

## Principios fundamentales

- Una store por dominio de negocio. No una store gigante ni una por componente.
- Las stores son la única fuente de verdad para el estado global.
- El estado local del componente (`ref`, `reactive`) existe para UI state efímero
  que no necesita persistir ni compartirse: un modal abierto, un input controlado.
- Las stores no conocen los componentes. Los componentes conocen las stores.
- Nunca importar una store desde otra store para mutar su estado directamente.
  Comunicación entre stores: acciones que coordinan, no mutaciones cruzadas.

---

## Estructura de una store (Setup Store — obligatorio)

Usar siempre **Setup Stores** (sintaxis con `setup()`), no Options Stores.
Son más alineadas con Composition API y más flexibles.

```js
// stores/use-[dominio].js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNombreStore = defineStore('nombre', () => {
  // ─── ESTADO ────────────────────────────────────────────
  const items = ref([])
  const selectedId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // ─── COMPUTADAS ────────────────────────────────────────
  const selectedItem = computed(() =>
    items.value.find(item => item.id === selectedId.value) ?? null
  )

  const hasItems = computed(() => items.value.length > 0)

  // ─── ACCIONES ──────────────────────────────────────────
  async function fetchItems() {
    isLoading.value = true
    error.value = null
    try {
      // lógica de fetching
    } catch (err) {
      error.value = err.message ?? 'Error desconocido'
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    items.value = []
    selectedId.value = null
    isLoading.value = false
    error.value = null
  }

  // ─── EXPOSE ────────────────────────────────────────────
  return {
    // Estado (solo exponer lo que los consumidores necesitan)
    items,
    selectedId,
    isLoading,
    error,
    // Computadas
    selectedItem,
    hasItems,
    // Acciones
    fetchItems,
    reset
  }
})
```

---

## Naming de stores

- Fichero: `use-[dominio].js` en kebab-case → `use-auth.js`, `use-invoice.js`
- Función exportada: `use` + PascalCase → `useAuthStore`, `useInvoiceStore`
- ID de la store (primer argumento de `defineStore`): kebab-case en minúsculas
  → `'auth'`, `'invoice'`, `'user-profile'`

---

## Estado

- Siempre inicializar con un valor por defecto explícito. Nunca `ref()` sin valor.
- Los tres estados del ciclo de vida son **obligatorios** en toda store que fetche datos:
  `isLoading`, `error`, `[datos]`.
- `error` almacena un string con el mensaje, nunca el objeto Error completo
  (no es serializable y no es útil para el template).
- No almacenar en el estado datos que se pueden derivar con `computed`.
- No duplicar estado que ya existe en otra store. Acceder a la otra store.

---

## Computadas (Getters)

- Todo valor derivado del estado es una `computed`, nunca un método que devuelve datos.
- Nombres descriptivos que expresen qué dato representan, no cómo se calculan.

```js
// ✅ Bien
const activeUsers = computed(() => users.value.filter(u => u.isActive))
const totalAmount = computed(() => items.value.reduce((sum, i) => sum + i.amount, 0))

// ❌ Mal — es un método que devuelve datos, debería ser computed
function getActiveUsers() { return users.value.filter(u => u.isActive) }
```

---

## Acciones

- Toda la lógica de negocio y acceso a datos vive en las acciones.
- Las acciones son async cuando interactúan con Firebase o cualquier API externa.
- Estructura obligatoria para acciones async:

```js
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // operación async
  } catch (err) {
    error.value = err.message ?? 'Ha ocurrido un error inesperado'
    // NO relanzar el error salvo que haya un motivo muy específico
  } finally {
    isLoading.value = false // siempre, incluso si hay error
  }
}
```

- Las acciones no deben saber nada de la UI (no muestran toasts, no navegan).
  Ese es trabajo del componente que llama a la acción.
  La acción comunica el resultado a través del estado (`error`, datos actualizados).

---

## Uso en componentes

```js
// En <script setup> — siempre con storeToRefs para reactividad
import { storeToRefs } from 'pinia'
import { useInvoiceStore } from '@/stores/use-invoice'

const invoiceStore = useInvoiceStore()

// Estado y computadas: storeToRefs() para mantener reactividad
const { items, isLoading, error, totalAmount } = storeToRefs(invoiceStore)

// Acciones: destructurar directo (no son reactivas, son funciones)
const { fetchItems, createItem, deleteItem } = invoiceStore
```

- Nunca acceder a `store.state` directamente. Siempre a través de las propiedades expuestas.
- Nunca mutar el estado de la store directamente desde el componente.
  Toda mutación pasa por una acción.

---

## Integración con Firebase (listeners en tiempo real)

Cuando una store maneja datos en tiempo real con `onSnapshot`:

```js
// El listener se guarda para poder cancelarlo
let unsubscribe = null

function subscribeToItems(userId) {
  // Cancelar suscripción anterior si existe
  if (unsubscribe) unsubscribe()

  isLoading.value = true
  unsubscribe = onSnapshot(
    query(collection(db, 'items'), where('userId', '==', userId)),
    (snapshot) => {
      items.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      isLoading.value = false
    },
    (err) => {
      error.value = err.message
      isLoading.value = false
    }
  )
}

// Limpiar al desmontar el componente que usa esta store,
// o exponer como acción de limpieza explícita
function unsubscribeFromItems() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}
```

- **El listener se cancela siempre.** Un listener no cancelado es una memory leak
  y un coste económico en Firebase.
- La limpieza se llama desde `onUnmounted` del componente o layout que inició la suscripción.

---

## Persistencia (si aplica)

- Usar `pinia-plugin-persistedstate` para persistir estado entre sesiones.
- Solo persistir lo estrictamente necesario: preferencias de usuario, tokens de sesión.
- Nunca persistir datos que deben ser frescos desde Firebase en cada sesión.
- Indicar explícitamente qué propiedades se persisten, nunca toda la store por defecto.

---

## Reset de stores

- Toda store expone una acción `reset()` que vuelve al estado inicial.
- Llamar a `reset()` al cerrar sesión en la store de auth, y en cascada
  a todas las stores que contienen datos del usuario autenticado.

---

## Lo que nunca se hace en Pinia

- Options Stores en código nuevo.
- Lógica de UI (navegación, toasts, modales) dentro de las acciones.
- Mutar estado directamente desde los componentes.
- Almacenar el objeto Error completo en el estado.
- Stores sin las tres propiedades de ciclo de datos: `isLoading`, `error`, `[datos]`.
- Listeners de Firebase sin función de cancelación expuesta.
- Desestructurar el estado sin `storeToRefs()`.