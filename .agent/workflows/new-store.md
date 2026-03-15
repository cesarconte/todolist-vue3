---
description: Workflow — Nueva Pinia Store
---

Genera una Pinia store completa con Setup Store syntax para este stack.
Una store = un dominio de negocio. Definir el dominio antes de escribir código.

---

## Paso 1 — Definir el dominio

Responder antes de escribir:

- ¿Qué entidad de negocio gestiona esta store? (usuarios, productos, pedidos…)
- ¿Qué datos necesitan ser compartidos entre componentes no relacionados?
- ¿Hay una store existente que ya cubra parte de esto? (evitar duplicar estado)
- ¿Qué operaciones de Firebase necesitará? (¿qué colección/es?)
- ¿Algún estado necesita persistirse entre sesiones?

---

## Paso 2 — Diseñar el estado

Definir el estado mínimo necesario. Nunca guardar en la store datos derivables
de otros datos ya presentes.

Por cada entidad de datos, el patrón estándar es siempre tres refs:

```javascript
const items = ref([])           // los datos
const isLoading = ref(false)    // estado de la operación en curso
const error = ref(null)         // error de la última operación (null = sin error)
```

Si hay operaciones independientes (ej: cargar lista + crear item),
cada operación tiene su propio `isLoading` si los estados son visibles por separado.

---

## Paso 3 — Diseñar los getters

Computed que derivan datos del estado. Identificar:
- ¿Qué datos se calculan a partir de los existentes? (totales, filtrados, ordenados)
- ¿Qué búsquedas por ID se necesitan? (getter parametrizado)
- ¿Qué datos de otra store se necesitan combinar?

```javascript
// Getter simple
const totalItems = computed(() => items.value.length)

// Getter parametrizado
const getById = computed(() => (id) => items.value.find(i => i.id === id))

// Getter que cruza con otra store (importar dentro del computed, no en el módulo)
const enrichedItems = computed(() => {
  const otherStore = useOtherStore()
  return items.value.map(item => ({ ...item, extra: otherStore.getById(item.refId) }))
})
```

---

## Paso 4 — Implementar las actions

Cada action sigue el patrón obligatorio:

```javascript
async function fetchItems(filters = {}) {
  // 1. Estado de inicio
  isLoading.value = true
  error.value = null

  try {
    // 2. Llamada al servicio (nunca a Firebase directamente)
    const result = await itemService.getAll(filters)

    // 3. Actualizar estado en éxito
    items.value = result

  } catch (err) {
    // 4. Registrar y exponer error
    error.value = err.message
    console.error('[ItemStore] fetchItems:', err)
    throw err // re-lanzar para que el componente pueda reaccionar

  } finally {
    // 5. Limpiar estado de carga siempre
    isLoading.value = false
  }
}
```

Actions a implementar sistemáticamente para un CRUD estándar:
- `fetchItems(filters)` — lista con filtros y paginación
- `fetchItemById(id)` — detalle
- `createItem(data)` — creación
- `updateItem(id, data)` — actualización parcial
- `deleteItem(id)` — borrado (con soft delete si el dominio lo requiere)
- `resetState()` — limpiar el estado (necesario al hacer logout)

Para datos en tiempo real (onSnapshot), el patrón es diferente:
```javascript
let unsubscribeFn = null

function subscribeToItems(userId) {
  // Cancelar suscripción previa si existe
  unsubscribeFn?.()

  isLoading.value = true
  unsubscribeFn = itemService.subscribe(
    userId,
    (data) => {
      items.value = data
      isLoading.value = false
    },
    (err) => {
      error.value = err.message
      isLoading.value = false
    }
  )
}

function unsubscribe() {
  unsubscribeFn?.()
  unsubscribeFn = null
}
```

---

## Paso 5 — Definir el servicio asociado

La store no llama a Firebase. Llama al servicio.
Generar el esqueleto del servicio correspondiente si no existe:

```javascript
// src/services/[entity].service.js

/**
 * Esquema de la colección en Firestore:
 * {
 *   id: string (generado por Firestore)
 *   [campo]: tipo — descripción
 *   createdAt: Timestamp
 *   updatedAt: Timestamp
 * }
 */

const COLLECTION = '[nombre-colección]'
const collectionRef = collection(db, COLLECTION)

export async function getAll(filters = {}) { }
export async function getById(id) { }
export async function create(data) { }
export async function update(id, data) { }
export async function remove(id) { }
export function subscribe(filters, onData, onError) { }
```

---

## Paso 6 — Persistencia (si aplica)

Si parte del estado debe sobrevivir a un refresh de página:

```javascript
export const useItemStore = defineStore('items', () => {
  // ...setup store...
}, {
  persist: {
    key: 'app-items',        // prefijo claro para no colisionar
    storage: localStorage,
    paths: ['selectedId']    // solo lo estrictamente necesario
  }
})
```

Justificar qué se persiste y por qué. No persistir datos sensibles ni tokens.

---

## Paso 7 — Tests de la store

```javascript
// src/stores/__tests__/[entity].test.js
import { setActivePinia, createPinia } from 'pinia'
import { useItemStore } from '../[entity]'
import * as itemService from '@/services/[entity].service'

vi.mock('@/services/[entity].service')

describe('useItemStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  describe('fetchItems', () => {
    it('debería cargar items y actualizar el estado correctamente', async () => {
      // Arrange
      const mockItems = [{ id: '1', name: 'Item 1' }]
      itemService.getAll.mockResolvedValue(mockItems)
      const store = useItemStore()

      // Act
      await store.fetchItems()

      // Assert
      expect(store.items).toEqual(mockItems)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('debería registrar el error cuando el servicio falla', async () => {
      itemService.getAll.mockRejectedValue(new Error('Error de red'))
      const store = useItemStore()
      await expect(store.fetchItems()).rejects.toThrow()
      expect(store.error).toBe('Error de red')
      expect(store.isLoading).toBe(false)
    })
  })
})
```

Cubrir obligatoriamente:
- Estado inicial correcto.
- Happy path de cada action (datos actualizados, isLoading false, error null).
- Estado de error (error registrado, isLoading false).
- `resetState` limpia todo el estado.

---

## Entrega

Archivos a generar:
1. `src/stores/[entity].js` — la store completa
2. `src/services/[entity].service.js` — el servicio (si no existe)
3. `src/stores/__tests__/[entity].test.js` — los tests

Documentar en un comentario al inicio de la store:
- Dominio que gestiona.
- Stores relacionadas.
- Qué colección/es de Firestore usa.