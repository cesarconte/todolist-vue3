---
description: Workflow — Operación Firestore
---

Diseña e implementa una operación sobre Firestore siguiendo la arquitectura
de servicios del proyecto. Ninguna operación de Firestore se escribe
directamente en un componente o store.

---

## Paso 1 — Entender la operación

Antes de escribir código, responder:

- ¿Qué colección/es están involucradas?
- ¿Es una lectura única, una lista, o una suscripción en tiempo real?
- ¿La operación involucra más de un documento? (¿necesita batch o transaction?)
- ¿Qué filtros, ordenaciones y paginación aplican?
- ¿Qué datos del documento son necesarios realmente? (no overfetch)
- ¿Qué campos deben validarse antes de escribir?

---

## Paso 2 — Modelado del documento

Documentar el esquema antes de implementar:

```javascript
/**
 * Colección: [nombre-coleccion]
 *
 * Esquema del documento:
 * {
 *   id:          string    — generado por Firestore (no se almacena en el doc)
 *   ownerId:     string    — uid del usuario propietario
 *   title:       string    — requerido, max 100 chars
 *   description: string    — opcional
 *   status:      string    — 'active' | 'inactive' | 'archived'
 *   tags:        string[]  — max 10 elementos
 *   metadata: {
 *     source:    string    — origen del registro
 *   }
 *   createdAt:   Timestamp — serverTimestamp() en creación
 *   updatedAt:   Timestamp — serverTimestamp() en cada escritura
 * }
 *
 * Colecciones relacionadas:
 * - /users/{ownerId} — referencia al propietario
 *
 * Índices compuestos necesarios:
 * - ownerId ASC + createdAt DESC (para listar por usuario ordenado)
 * - status ASC + createdAt DESC (para filtrar por estado)
 */
```

---

## Paso 3 — Implementar la operación en el servicio

### Lectura de un documento

```javascript
/**
 * Obtiene un documento por su ID.
 * @param {string} id
 * @returns {Promise<Object|null>} el documento o null si no existe
 * @throws {Error} si falla la lectura
 */
export async function getById(id) {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, id))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() }
  } catch (err) {
    console.error(`[${COLLECTION}Service] getById (${id}):`, err)
    throw new Error('No se pudo cargar el elemento. Inténtalo de nuevo.')
  }
}
```

### Lectura de una lista con filtros y paginación por cursor

```javascript
/**
 * Obtiene una página de documentos con filtros opcionales.
 * @param {Object} options
 * @param {string} [options.ownerId] - filtrar por propietario
 * @param {string} [options.status] - filtrar por estado
 * @param {string} [options.orderField='createdAt'] - campo de ordenación
 * @param {'asc'|'desc'} [options.orderDirection='desc']
 * @param {number} [options.pageSize=25]
 * @param {DocumentSnapshot|null} [options.cursor] - último doc de la página anterior
 * @returns {Promise<{items: Array, cursor: DocumentSnapshot|null, hasMore: boolean}>}
 */
export async function getList({
  ownerId,
  status,
  orderField = 'createdAt',
  orderDirection = 'desc',
  pageSize = 25,
  cursor = null
} = {}) {
  try {
    const constraints = [orderBy(orderField, orderDirection), limit(pageSize + 1)]

    if (ownerId) constraints.push(where('ownerId', '==', ownerId))
    if (status) constraints.push(where('status', '==', status))
    if (cursor) constraints.push(startAfter(cursor))

    const q = query(collection(db, COLLECTION), ...constraints)
    const snapshot = await getDocs(q)

    const docs = snapshot.docs
    const hasMore = docs.length > pageSize
    const items = docs.slice(0, pageSize).map(d => ({ id: d.id, ...d.data() }))
    const newCursor = hasMore ? docs[pageSize - 1] : null

    return { items, cursor: newCursor, hasMore }
  } catch (err) {
    console.error(`[${COLLECTION}Service] getList:`, err)
    throw new Error('No se pudieron cargar los elementos.')
  }
}
```

### Escritura — Creación

```javascript
/**
 * Crea un nuevo documento validando los datos de entrada.
 * @param {Object} data - datos del documento (sin id ni timestamps)
 * @param {string} data.ownerId
 * @param {string} data.title
 * @returns {Promise<string>} ID del documento creado
 */
export async function create(data) {
  // Validar antes de escribir
  const parsed = EntitySchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message)
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...parsed.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (err) {
    console.error(`[${COLLECTION}Service] create:`, err)
    throw new Error('No se pudo crear el elemento. Inténtalo de nuevo.')
  }
}
```

### Escritura — Actualización parcial

```javascript
/**
 * Actualiza campos específicos de un documento.
 * @param {string} id
 * @param {Partial<Entity>} data - solo los campos a actualizar
 */
export async function update(id, data) {
  try {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.error(`[${COLLECTION}Service] update (${id}):`, err)
    throw new Error('No se pudo actualizar el elemento. Inténtalo de nuevo.')
  }
}
```

### Operación atómica — Batch (múltiples documentos, sin dependencia entre ellos)

```javascript
/**
 * Actualiza el estado de múltiples documentos en una operación atómica.
 * @param {string[]} ids
 * @param {string} newStatus
 */
export async function bulkUpdateStatus(ids, newStatus) {
  if (!ids.length) return

  try {
    const batch = writeBatch(db)
    ids.forEach(id => {
      const ref = doc(db, COLLECTION, id)
      batch.update(ref, { status: newStatus, updatedAt: serverTimestamp() })
    })
    await batch.commit()
  } catch (err) {
    console.error(`[${COLLECTION}Service] bulkUpdateStatus:`, err)
    throw new Error('No se pudo actualizar el estado de los elementos.')
  }
}
```

### Operación atómica — Transaction (lectura + escritura dependiente)

```javascript
/**
 * Incrementa el contador de un documento verificando un límite máximo.
 * @param {string} id
 * @param {number} maxCount
 */
export async function incrementCount(id, maxCount) {
  try {
    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, COLLECTION, id)
      const docSnap = await transaction.get(docRef)

      if (!docSnap.exists()) throw new Error('El elemento no existe.')

      const currentCount = docSnap.data().count ?? 0
      if (currentCount >= maxCount) throw new Error('Se ha alcanzado el límite máximo.')

      transaction.update(docRef, {
        count: currentCount + 1,
        updatedAt: serverTimestamp()
      })
    })
  } catch (err) {
    console.error(`[${COLLECTION}Service] incrementCount (${id}):`, err)
    throw err // re-lanzar con el mensaje específico si es de negocio
  }
}
```

### Suscripción en tiempo real

```javascript
/**
 * Suscripción en tiempo real a los documentos de un usuario.
 * @param {string} ownerId
 * @param {Function} onData - (items: Array) => void
 * @param {Function} onError - (err: Error) => void
 * @returns {Function} unsubscribe — llamar en onUnmounted
 */
export function subscribeByOwner(ownerId, onData, onError) {
  const q = query(
    collection(db, COLLECTION),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      onData(items)
    },
    (err) => {
      console.error(`[${COLLECTION}Service] subscribeByOwner (${ownerId}):`, err)
      onError(new Error('Se perdió la conexión en tiempo real. Recargando...'))
    }
  )
}
```

---

## Paso 4 — Security Rules para la operación

Para cada operación nueva, definir o verificar las Security Rules correspondientes:

```javascript
match /[coleccion]/{docId} {
  // ¿Quién puede leer? ¿Solo el propietario? ¿Usuarios autenticados? ¿Público?
  allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;

  // ¿Quién puede crear? Validar campos obligatorios y tipos
  allow create: if request.auth != null
    && request.resource.data.ownerId == request.auth.uid
    && request.resource.data.title is string
    && request.resource.data.title.size() > 0
    && request.resource.data.title.size() <= 100;

  // ¿Quién puede actualizar? ¿Qué campos son inmutables?
  allow update: if request.auth != null
    && resource.data.ownerId == request.auth.uid
    && request.resource.data.ownerId == resource.data.ownerId // ownerId inmutable
    && request.resource.data.createdAt == resource.data.createdAt; // timestamp inmutable

  // ¿Quién puede borrar?
  allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
}
```

---

## Paso 5 — Tests del servicio

```javascript
// Testear contra el Firebase Local Emulator, no contra producción
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

describe('[Entity]Service', () => {
  it('debería devolver null cuando el documento no existe', async () => { })
  it('debería crear un documento con timestamps de servidor', async () => { })
  it('debería actualizar solo los campos especificados', async () => { })
  it('debería lanzar error con mensaje legible cuando Firestore falla', async () => { })
  it('debería paginar correctamente usando el cursor', async () => { })
})
```

---

## Entrega

1. Función(es) implementadas en `src/services/[entity].service.js`
2. Security Rules para las operaciones nuevas
3. Tests en `src/services/__tests__/[entity].service.test.js`
4. Si la operación requiere un índice compuesto nuevo en Firestore, documentarlo
   con el comando `firebase deploy --only firestore:indexes` o el `firestore.indexes.json`.