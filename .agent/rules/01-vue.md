---
trigger: always_on
---

# Rule 01 — Vue 3: Estándares y Patrones

## Versión y API

- Vue 3 exclusivamente. Composition API con `<script setup>` en todos los componentes.
- Nunca Options API en código nuevo. Si se hereda código con Options API, migrarlo
  al refactorizar, no convivir con ambas en el mismo componente.
- `defineComponent` solo cuando se necesite tipado avanzado fuera de SFC.

---

## Estructura de un componente (orden obligatorio)

```vue
<script setup>
// 1. Imports externos (Vue, librerías)
// 2. Imports internos (composables, stores, utils, componentes)
// 3. Props y emits
// 4. Stores (Pinia)
// 5. Estado local (ref, reactive)
// 6. Computadas (computed)
// 7. Watchers (watch, watchEffect) — justificar siempre su uso
// 8. Lifecycle hooks
// 9. Funciones y handlers
// 10. Expose (solo si el componente necesita API pública)
</script>

<template>
  <!-- Un único elemento raíz salvo que sea intencionadamente un Fragment -->
</template>

<style scoped>
/* Scoped siempre salvo utilidades globales explícitamente justificadas */
</style>
```

---

## Componentes

### Naming

- Componentes: PascalCase en la definición y en el template — `<UserCard />`.
- Nunca nombres de una sola palabra — riesgo de colisión con HTML nativo.
- Nombres descriptivos del propósito: `AppHeader`, `UserProfileCard`, `InvoiceLineItem`.
- Componentes base (genéricos y reutilizables): prefijo `Base` — `BaseButton`, `BaseModal`.
- Componentes de una sola instancia (layout): prefijo `The` — `TheHeader`, `TheSidebar`.
- Componentes hijos de un contexto: prefijo del padre — `UserCard`, `UserCardAvatar`.

### Tamaño y responsabilidad

- Un componente = una responsabilidad.
- Más de 200 líneas de template → señal de que hay que dividir.
- Más de 150 líneas en `<script setup>` → extraer lógica a composables.
- Nunca lógica de negocio directamente en el template. Solo expresiones simples.

### Props

```js
// Siempre definir con tipo, required y default explícitos
const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger'].includes(v)
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})
```

- Props como contrato inmutable. Nunca mutar una prop directamente.
- Validadores (`validator`) obligatorios en props con valores enumerados.
- Si una prop puede ser null o undefined, declararlo explícito en el tipo.
- Props de solo datos (no comportamiento). El comportamiento se comunica con emits.

### Emits

```js
// Siempre declarar con defineEmits — habilita validación y autocompletado
const emit = defineEmits({
  'update:modelValue': (value) => value !== undefined,
  'submit': (payload) => payload && typeof payload === 'object',
  'cancel': null // null = sin validación
})
```

- Nombres de eventos en kebab-case.
- Patrón `update:propName` para v-model personalizado.
- Nunca emitir eventos sin declararlos.

---

## Composables

- Toda lógica reutilizable o compleja se extrae a un composable.
- Naming obligatorio: prefijo `use` + descripción en camelCase — `useAuth`, `useInvoiceList`.
- Fichero en kebab-case: `use-auth.js`, `use-invoice-list.js`.
- Un composable = una responsabilidad. Si hace demasiado, dividir.
- Siempre retornar un objeto con propiedades nombradas, nunca un array
  (salvo convención establecida como useState).
- Los composables que suscriben listeners, watchers o intervalos
  **deben limpiarlos en `onUnmounted`**.

```js
// Estructura mínima de un composable
export function useNombreComposable(params) {
  // Estado
  const data = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Lógica

  // Limpieza obligatoria si hay suscripciones
  onUnmounted(() => {
    // unsubscribe(), clearInterval(), etc.
  })

  return { data, isLoading, error }
}
```

---

## Reactividad

- `ref()` para valores primitivos y referencias a objetos que se reasignan.
- `reactive()` solo para objetos complejos que nunca se reasignan completamente.
  Preferir `ref()` en caso de duda — más predecible.
- `computed()` para todo valor derivado del estado. Nunca recalcular en template.
- `watch()` es un último recurso. Antes de usarlo, preguntarse:
  ¿se puede resolver con computed? Si la respuesta es sí, usar computed.
- `watchEffect()` solo cuando la dependencia de los reactivos no es obvia y se
  quiere rastreo automático. Documentar por qué se usa.
- Nunca desestructurar directamente objetos reactivos — se pierde la reactividad.
  Usar `toRefs()` o `storeToRefs()` (Pinia).

---

## Template

- Directivas en orden consistente: `v-if` / `v-else-if` / `v-else` antes que `v-for`.
- `v-for` siempre con `:key` único, estable y significativo. Nunca usar el índice
  como key salvo que el orden sea completamente estático.
- `v-if` y `v-for` nunca en el mismo elemento. Usar `<template>` como wrapper.
- Expresiones en template: solo acceso a propiedades y llamadas simples.
  Cualquier lógica va a una computed o a un método.
- Handlers de evento: nombrar con prefijo `handle` — `@click="handleSubmit"`.
- Props booleanas: `:disabled="true"` → simplificar a `disabled` cuando el valor
  es siempre true. `:disabled="condicion"` cuando es dinámico.

---

## Lifecycle hooks

Usar solo los necesarios. Orden de uso preferente:

1. `onMounted` — inicialización, peticiones iniciales, subscripciones.
2. `onUnmounted` — limpieza de suscripciones, listeners, timers. **Obligatorio**
   si se añadió algo en `onMounted` que necesite limpieza.
3. `onBeforeUnmount` — solo si se necesita acceso al DOM antes de desmontar.
4. `onUpdated` — raro. Justificar siempre. Preferir watchers si se necesita
   reaccionar a cambios específicos.

---

## Provide / Inject

- Usar solo para contexto de árbol de componentes profundo (plugin-level, layout-level).
- Nunca como sustituto de Pinia para estado global.
- Siempre con una clave Symbol tipada para evitar colisiones.
- Documentar en el componente proveedor qué se está inyectando y por qué.

---

## Routing (Vue Router)

- Rutas definidas como objetos con `name` siempre — nunca navegar por path string.
- `name` de ruta en PascalCase o kebab-case consistente a lo largo del proyecto.
- Lazy loading obligatorio para todas las vistas:
  `component: () => import('@/views/UserProfile.vue')`
- Navigation guards en el router, nunca en los componentes, salvo casos locales
  muy específicos con `onBeforeRouteLeave`.
- Los parámetros de ruta son strings. Convertirlos al tipo correcto en el composable
  o en la store, no en el componente.

---

## Convenciones de ficheros y estructura

```
src/
  assets/           # Estáticos: imágenes, fuentes, iconos
  components/       # Componentes reutilizables
    base/           # Componentes base (BaseButton, BaseModal…)
    [feature]/      # Componentes específicos de feature
  composables/      # Composables (use-*.js)
  layouts/          # Layouts (TheDefault, TheAuth…)
  router/           # Definición de rutas
  stores/           # Stores Pinia (una por dominio)
  services/         # Lógica de acceso a datos / Firebase
  utils/            # Funciones utilitarias puras
  views/            # Vistas/páginas (una por ruta)
  constants/        # Constantes globales del proyecto
  config/           # Configuración centralizada (firebase, env…)
```

---

## Lo que nunca se hace en Vue

- Mutar props directamente.
- Acceder al DOM con `document.querySelector` — usar template refs (`ref=""`).
- Lógica de negocio en el template.
- Componentes sin nombre (dificulta debugging en Vue DevTools).
- `v-html` con contenido no sanitizado.
- Stores de Pinia importadas directamente en el template sin pasar por `<script setup>`.
- Watchers sin comentario que explique por qué no se pudo resolver con computed.
- Lifecycle hooks sin limpiar sus suscripciones.