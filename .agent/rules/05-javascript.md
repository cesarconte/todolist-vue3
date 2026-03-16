---
trigger: always_on
---

# Rule 05 — JavaScript: Estándares del Stack

## Contexto

Este proyecto usa JavaScript (no TypeScript). Eso no es licencia para código menos riguroso.
Las prácticas de este documento compensan la ausencia de tipado estático con
convenciones claras, validación en runtime y documentación explícita.

---

## JSDoc — Obligatorio en funciones públicas

Sin TypeScript, JSDoc es la única forma de documentar contratos de forma que los IDEs
puedan dar autocompletado y advertencias. Es obligatorio en:

- Todos los composables (exportados).
- Todos los servicios (Firebase, etc.).
- Todas las utilidades exportadas.
- Funciones de más de 10 líneas que no sean triviales.

```js
/**
 * Obtiene el listado de facturas de un usuario con filtros opcionales.
 *
 * @param {string} userId - UID del usuario autenticado.
 * @param {Object} [options={}] - Opciones de filtrado.
 * @param {'pending'|'paid'|'cancelled'} [options.status] - Filtrar por estado.
 * @param {number} [options.limit=20] - Número máximo de resultados.
 * @returns {Promise<Array<InvoiceItem>>} Lista de facturas.
 * @throws {Error} Si userId está vacío o la query falla.
 *
 * @example
 * const invoices = await getInvoices('user123', { status: 'pending', limit: 10 })
 */
export async function getInvoices(userId, options = {}) { ... }
```

### Typedef para objetos de negocio

```js
/**
 * @typedef {Object} InvoiceItem
 * @property {string} id - ID del documento en Firestore.
 * @property {string} userId - UID del propietario.
 * @property {number} amount - Importe total en céntimos.
 * @property {'pending'|'paid'|'cancelled'} status - Estado de la factura.
 * @property {import('firebase/firestore').Timestamp} createdAt - Fecha de creación.
 */
```

- Definir typedefs para todos los objetos de negocio en un fichero `src/types/index.js`.
  Importarlos con `@import` en los ficheros que los usan.

---

## Validación de datos externos — Obligatorio

Sin TypeScript, los datos que llegan de fuera (Firestore, formularios, API, URL params)
deben validarse en runtime. Opciones:

### Validación manual estructurada (mínimo exigido)

```js
// src/utils/validators.js

/**
 * Valida que un objeto tiene la forma esperada de InvoiceItem.
 * @param {unknown} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateInvoice(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Los datos no son un objeto válido'] }
  }

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('userId debe ser un string no vacío')
  }

  if (typeof data.amount !== 'number' || data.amount < 0) {
    errors.push('amount debe ser un número positivo')
  }

  const validStatuses = ['pending', 'paid', 'cancelled']
  if (!validStatuses.includes(data.status)) {
    errors.push(`status debe ser uno de: ${validStatuses.join(', ')}`)
  }

  return { valid: errors.length === 0, errors }
}
```

### Alternativa recomendada: Valibot o Zod

Si el proyecto crece, migrar a una librería de validación en runtime.
Evaluar según tamaño del bundle y complejidad de los esquemas.

---

## Constantes y enumeraciones

Sin TypeScript no hay enums nativos. Compensar con objetos constantes:

```js
// src/constants/invoice.js

/** @readonly */
export const INVOICE_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled'
})

/** @readonly */
export const INVOICE_STATUS_LABELS = Object.freeze({
  [INVOICE_STATUS.PENDING]: 'Pendiente',
  [INVOICE_STATUS.PAID]: 'Pagada',
  [INVOICE_STATUS.CANCELLED]: 'Cancelada'
})

/** @readonly */
export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  INVOICES: 'invoices',
  PRODUCTS: 'products'
})
```

- `Object.freeze()` en todos los objetos de constantes para evitar mutación accidental.
- Importar siempre desde las constantes, nunca repetir el string literal.
- Un fichero de constantes por dominio.

---

## Manejo de errores

### Errores de Firebase — mapeo a mensajes de usuario

Firebase lanza errores con códigos como `auth/user-not-found` que nunca deben
llegar al usuario sin traducir.

```js
// src/utils/firebase-error-messages.js

const FIREBASE_ERROR_MESSAGES = Object.freeze({
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo de nuevo más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'permission-denied': 'No tienes permisos para realizar esta acción.',
  'not-found': 'El recurso solicitado no existe.',
  'unavailable': 'El servicio no está disponible. Inténtalo más tarde.'
})

/**
 * Convierte un error de Firebase en un mensaje legible para el usuario.
 * @param {import('firebase/app').FirebaseError} error
 * @returns {string}
 */
export function getFirebaseErrorMessage(error) {
  return FIREBASE_ERROR_MESSAGES[error.code]
    ?? 'Ha ocurrido un error inesperado. Inténtalo de nuevo.'
}
```

### Patrón Result para operaciones críticas

En operaciones donde el llamador necesita saber si tuvo éxito o no:

```js
/**
 * @template T
 * @typedef {Object} Result
 * @property {boolean} success
 * @property {T|null} data
 * @property {string|null} error
 */

/**
 * @returns {Promise<Result<string>>}
 */
export async function createInvoice(invoiceData) {
  try {
    const id = await createDocument(COLLECTIONS.INVOICES, invoiceData)
    return { success: true, data: id, error: null }
  } catch (err) {
    return { success: false, data: null, error: getFirebaseErrorMessage(err) }
  }
}
```

---

## Patrones async

```js
// ✅ async/await con try/catch explícito
async function loadUser(userId) {
  try {
    const user = await getDocument(COLLECTIONS.USERS, userId)
    return user
  } catch (error) {
    console.error('[loadUser]', error)
    throw error // re-lanzar si el llamador necesita manejarlo
  }
}

// ✅ Operaciones paralelas independientes
async function loadDashboardData(userId) {
  const [invoices, products] = await Promise.all([
    getInvoices(userId),
    getProducts(userId)
  ])
  return { invoices, products }
}

// ❌ Nunca promesas encadenadas cuando async/await es más claro
getUser(id).then(user => getInvoices(user.id)).then(...)
```

- `Promise.all` para operaciones async independientes — no hacer secuencial lo que puede ser paralelo.
- `Promise.allSettled` cuando se necesitan todos los resultados aunque alguno falle.
- Nunca `.then()` encadenado cuando `async/await` es posible.

---

## Utilidades puras

```js
// src/utils/formatters.js

/**
 * Formatea un número como moneda en euros.
 * @param {number} amountInCents - Importe en céntimos.
 * @returns {string} Importe formateado (ej: "1.234,56 €")
 */
export function formatCurrency(amountInCents) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountInCents / 100)
}

/**
 * Convierte un Timestamp de Firestore a fecha legible.
 * @param {import('firebase/firestore').Timestamp} timestamp
 * @returns {string}
 */
export function formatFirestoreDate(timestamp) {
  if (!timestamp?.toDate) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(timestamp.toDate())
}
```

- Todas las utilidades son funciones puras: mismo input → mismo output, sin efectos secundarios.
- Usar `Intl` para formateo de fechas, números y monedas — no instalar moment.js ni date-fns
  para formateos básicos.
- Testear todas las utilidades con casos válidos, inválidos y límite.

---

## Variables de entorno (Vite)

```js
// ✅ Correcto — variables de entorno en un único lugar
// src/config/env.js
export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
}
```

- Solo las variables con prefijo `VITE_` son expuestas al cliente por Vite.
- Centralizar todo `import.meta.env` en `src/config/env.js`.
  Nunca esparcir `import.meta.env` por el código.
- Nunca exponer secrets reales via `VITE_` — estas variables son públicas en el bundle.

---

## Lo que nunca se hace en este stack JS

- `var`. Solo `const` y `let`.
- `==` (igualdad débil). Solo `===`.
- Funciones públicas sin JSDoc.
- Objetos de dominio sin typedef documentado.
- Strings literales de colecciones de Firestore fuera de las constantes.
- Códigos de error de Firebase expuestos directamente al usuario.
- `any` implícito — aunque no sea TypeScript, los JSDoc types son contratos.
- `console.log` en código que se va a commitear (salvo `console.error` con nivel y contexto).