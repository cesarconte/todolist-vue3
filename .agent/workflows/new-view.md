---
description: Workflow — Nueva Vista Completa (View)
---

Genera una vista completa de Vue Router: componente de página, integración con stores,
layout con Vuetify y configuración de ruta.
Una vista = una URL. No mezclar responsabilidades de múltiples páginas.

---

## Paso 1 — Definir la vista

Antes de escribir código, tener claro:

- ¿Cuál es la URL y los parámetros de ruta? (`/users/:id`, `/products?category=x`)
- ¿Requiere autenticación?
- ¿Qué datos necesita? ¿De qué stores los consume?
- ¿Qué acciones puede realizar el usuario en esta vista?
- ¿Hay estados de carga y error a nivel de vista completa?
- ¿Es una vista de lista, detalle, formulario, o mixta?

---

## Paso 2 — Configuración de la ruta

```javascript
// En src/router/routes.js — añadir la ruta con lazy loading
{
  path: '/[ruta]/:param?',
  name: '[NombreVista]',            // nombre descriptivo en PascalCase
  component: () => import('@/views/[NombreVista]View.vue'),
  meta: {
    requiresAuth: true,             // si necesita autenticación
    title: 'Título de la página',   // para el <title> del documento
    // roles: ['admin']            // si hay control de acceso por rol
  }
}
```

Guard de autenticación en `router/index.js`:
```javascript
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Esperar a que Firebase confirme el estado de auth
  if (!authStore.isAuthReady) {
    await new Promise(resolve => {
      const stop = watch(() => authStore.isAuthReady, ready => {
        if (ready) { stop(); resolve() }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
})
```

---

## Paso 3 — Estructura del componente de vista

```vue
<!-- src/views/[NombreVista]View.vue -->
<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEntityStore } from '@/stores/entity'
import { useNotificationStore } from '@/stores/notifications'
// Componentes específicos de esta vista

const route = useRoute()
const router = useRouter()
const entityStore = useEntityStore()
const notificationStore = useNotificationStore()

// ── Cargar datos al montar ────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await entityStore.fetchItems()
  } catch {
    // El error ya está en entityStore.error
    // No duplicar la gestión del error aquí
  }
})

// ── Handlers de acciones ──────────────────────────────────────────────────────
async function handleCreate(data) {
  try {
    await entityStore.createItem(data)
    notificationStore.success('Elemento creado correctamente.')
    // Navegar si corresponde
  } catch {
    notificationStore.error('No se pudo crear el elemento. Inténtalo de nuevo.')
  }
}

async function handleDelete(id) {
  try {
    await entityStore.deleteItem(id)
    notificationStore.success('Elemento eliminado.')
  } catch {
    notificationStore.error('No se pudo eliminar el elemento.')
  }
}
</script>

<template>
  <VContainer>
    <!-- Cabecera de la vista -->
    <VRow class="mb-4" align="center">
      <VCol>
        <h1 class="text-h4">Título de la vista</h1>
        <p class="text-body-2 text-medium-emphasis">Descripción opcional</p>
      </VCol>
      <VCol cols="auto">
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Crear nuevo
        </VBtn>
      </VCol>
    </VRow>

    <!-- Estado de error a nivel de vista -->
    <VAlert
      v-if="entityStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
    >
      {{ entityStore.error }}
      <template #append>
        <VBtn variant="text" @click="entityStore.fetchItems()">Reintentar</VBtn>
      </template>
    </VAlert>

    <!-- Contenido principal -->
    <!-- Aquí van los componentes de la vista -->

  </VContainer>
</template>
```

---

## Paso 4 — Gestión de estados de la vista

**Estado de carga inicial:**
```vue
<template>
  <!-- Skeleton para la carga inicial de la vista completa -->
  <template v-if="entityStore.isLoading && !entityStore.items.length">
    <VSkeletonLoader v-for="n in 5" :key="n" type="list-item-two-line" class="mb-2" />
  </template>

  <!-- Contenido cuando hay datos (incluso durante recargas) -->
  <template v-else>
    <!-- ... -->
  </template>
</template>
```

**Diferencia entre carga inicial y recarga:**
- Primera carga (sin datos): skeleton de página completa.
- Recarga con datos existentes: indicador sutil (barra de progreso, overlay ligero).
- Nunca bloquear la UI completa en una recarga si ya hay datos visibles.

---

## Paso 5 — Actualización del `<title>` del documento

```javascript
// En el guard del router o en la vista con useHead (si se usa @vueuse/head)
import { useHead } from '@vueuse/head'

useHead({
  title: computed(() => `${entityStore.currentItem?.name ?? 'Cargando...'} — App`)
})
```

---

## Paso 6 — Accesibilidad de la vista

- `<h1>` único por vista con el título de la página.
- Anunciar cambios dinámicos de contenido con `aria-live` si corresponde.
- Al navegar a esta vista, el foco debe estar en el `<main>` o en el `<h1>`.
- Los breadcrumbs (si los hay) usan `<nav aria-label="Breadcrumb">`.

---

## Paso 7 — Meta SEO / Open Graph (si es una app pública)

```javascript
useHead({
  title: 'Título de la página — Nombre de la App',
  meta: [
    { name: 'description', content: 'Descripción de la vista' },
    { property: 'og:title', content: 'Título para redes sociales' },
    { property: 'og:description', content: 'Descripción para redes' }
  ]
})
```

---

## Paso 8 — Tests de la vista

```javascript
// src/views/__tests__/[NombreVista]View.test.js
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import NombreVistaView from '../NombreVistaView.vue'

describe('NombreVistaView', () => {
  it('debería llamar a fetchItems al montarse', async () => { })
  it('debería mostrar el skeleton loader durante la carga inicial', () => { })
  it('debería mostrar el error con opción de reintento cuando falla la carga', () => { })
  it('debería redirigir al login si el usuario no está autenticado', () => { })
})
```

---

## Entrega

Archivos a generar:
1. `src/views/[NombreVista]View.vue` — la vista completa
2. Fragmento de ruta para añadir en `src/router/routes.js`
3. `src/views/__tests__/[NombreVista]View.test.js` — tests

Si la vista requiere componentes nuevos: aplicar el workflow `/new-component` para cada uno.