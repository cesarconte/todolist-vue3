---
trigger: always_on
---

# Rule 03 — Vuetify: Estándares de Uso y Theming

## Versión y configuración

- Vuetify 3 exclusivamente (compatible con Vue 3).
- La configuración del tema es la fuente única de verdad para colores, tipografía
  y breakpoints. Nunca hardcodear valores que ya están en el tema.
- El plugin de Vuetify se configura una sola vez en `src/plugins/vuetify.js`.

---

## Theming — Sistema de tokens

### Configuración del tema (estructura obligatoria)

```js
// src/plugins/vuetify.js
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          // Colores semánticos — NUNCA usar nombres de color literal
          primary: '#1E40AF',
          secondary: '#64748B',
          accent: '#F59E0B',
          error: '#DC2626',
          warning: '#F59E0B',
          info: '#3B82F6',
          success: '#16A34A',
          // Colores de superficie
          background: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-variant': '#F1F5F9',
          // Colores de texto
          'on-primary': '#FFFFFF',
          'on-background': '#0F172A',
          'on-surface': '#1E293B',
        }
      },
      dark: {
        dark: true,
        colors: {
          // Mismas claves semánticas, valores adaptados para dark mode
        }
      }
    }
  },
  defaults: {
    // Defaults globales para componentes — evitar repetición de props comunes
    VBtn: { variant: 'elevated', rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VCard: { rounded: 'lg', elevation: 1 }
  }
})
```

### Uso de colores en componentes

```vue
<!-- ✅ Bien — usar nombres semánticos del tema -->
<v-btn color="primary">Guardar</v-btn>
<v-alert type="error">Error en el formulario</v-alert>
<v-chip color="success">Activo</v-chip>

<!-- ❌ Mal — valores hardcodeados -->
<v-btn color="#1E40AF">Guardar</v-btn>
<v-btn style="background: blue">Guardar</v-btn>
```

### Variables CSS de Vuetify

```css
/* Usar las variables CSS que Vuetify expone en lugar de valores propios */
.mi-clase {
  color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}
```

---

## Grid y Layout

- Sistema de 12 columnas con `v-container`, `v-row`, `v-col`.
- Mobile-first obligatorio: definir `cols` (base móvil) y escalar con `sm`, `md`, `lg`, `xl`.
- `v-container` con `fluid` solo cuando el diseño lo requiere explícitamente.

```vue
<v-container>
  <v-row>
    <!-- Mobile: 12 cols (full). Tablet: 6 cols. Desktop: 4 cols -->
    <v-col cols="12" sm="6" md="4"
      v-for="item in items"
      :key="item.id"
    >
      <ItemCard :item="item" />
    </v-col>
  </v-row>
</v-container>
```

- `v-spacer` para separar elementos en `v-row` o toolbars.
- `v-divider` para separación visual semántica.
- `dense` / `density` para reducir espaciado en secciones de alta densidad de información.

---

## Formularios

### Estructura y validación

```vue
<v-form ref="formRef" @submit.prevent="handleSubmit">
  <v-text-field
    v-model="form.email"
    label="Correo electrónico"
    type="email"
    :rules="emailRules"
    required
    autocomplete="email"
  />

  <v-btn type="submit" :loading="isLoading" :disabled="isLoading">
    Enviar
  </v-btn>
</v-form>
```

```js
const formRef = ref(null)

const emailRules = [
  v => !!v || 'El correo electrónico es obligatorio',
  v => /.+@.+\..+/.test(v) || 'Introduce una dirección de correo válida'
]

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  // proceder
}
```

- Siempre usar el sistema de `rules` de Vuetify para validación de formularios.
- Mensajes de error en español, orientados a la acción, sin jerga técnica.
- El botón de submit muestra estado de carga (`:loading`) y se deshabilita durante el proceso.
- `autocomplete` en todos los inputs donde aplique (mejora UX y accesibilidad).
- Usar `v-form` con `ref` para poder llamar a `.validate()` y `.reset()` programáticamente.

### Campos obligatorios

```vue
<!-- Indicar required tanto en la prop como en el label -->
<v-text-field
  label="Nombre *"
  required
  :rules="[v => !!v || 'El nombre es obligatorio']"
/>
```

---

## Componentes de uso frecuente — patrones correctos

### v-btn

```vue
<!-- Acción principal de la vista -->
<v-btn color="primary" :loading="isLoading" @click="handleAction">
  Guardar cambios
</v-btn>

<!-- Acción destructiva — siempre con confirmación antes de ejecutar -->
<v-btn color="error" variant="outlined" @click="handleDelete">
  Eliminar
</v-btn>

<!-- Navegación — usar component="RouterLink" -->
<v-btn color="primary" variant="text" :to="{ name: 'UserProfile' }">
  Ver perfil
</v-btn>
```

- Nunca usar `v-btn` para navegación con `@click` + `router.push`. Usar `:to`.
- Acciones destructivas siempre con `variant="outlined"` o `variant="text"` para
  distinguirlas visualmente de las acciones principales.

### v-dialog (modales)

```vue
<v-dialog v-model="isOpen" max-width="600" persistent>
  <v-card>
    <v-card-title>Título del modal</v-card-title>
    <v-card-text>Contenido</v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="isOpen = false">Cancelar</v-btn>
      <v-btn color="primary" @click="handleConfirm">Confirmar</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

- `persistent` en diálogos de confirmación o formularios (evita cierre accidental).
- `max-width` siempre definido.
- El foco se gestiona automáticamente por Vuetify, pero verificar que el primer
  elemento focusable es lógico (generalmente el botón de cancelar o el primer campo).

### v-data-table

```vue
<v-data-table
  :headers="headers"
  :items="items"
  :loading="isLoading"
  :items-per-page="20"
  density="comfortable"
  hover
>
  <!-- Skeleton loader durante la carga -->
  <template v-slot:loader>
    <v-skeleton-loader type="table-row@5" />
  </template>

  <!-- Estado vacío -->
  <template v-slot:no-data>
    <v-empty-state
      title="Sin resultados"
      text="No se encontraron elementos."
    />
  </template>
</v-data-table>
```

- Paginación obligatoria. `items-per-page` siempre definido. Nunca tablas sin paginar
  con datos que pueden crecer.
- Definir `headers` fuera del template como constante o computed.
- Siempre implementar los slots `loader` y `no-data`.

### v-snackbar (feedback al usuario)

- Usar un composable global `useNotification` que gestione un único `v-snackbar`.
- No instanciar `v-snackbar` en cada componente.
- Colores semánticos: `color="success"`, `color="error"`, `color="warning"`, `color="info"`.
- Timeout razonable: éxito → 3000ms, error → 5000ms (más tiempo para leer el mensaje).

---

## Iconografía

- Usar MDI (Material Design Icons) — ya incluido con Vuetify.
- Iconos usados más de una vez en la app → definirlos como constantes en `src/constants/icons.js`.
- Todo icono que actúa como botón o tiene significado funcional necesita `aria-label`.

```vue
<!-- ✅ Icono decorativo -->
<v-icon icon="mdi-account" aria-hidden="true" />

<!-- ✅ Icono con significado — label obligatorio -->
<v-btn icon="mdi-delete" aria-label="Eliminar elemento" @click="handleDelete" />
```

---

## Accesibilidad con Vuetify

Vuetify gestiona mucho de ARIA internamente, pero hay que asegurarse de:

- Todos los `v-text-field`, `v-select`, `v-textarea` tienen `label` (no solo placeholder).
- Los `v-btn` de icono tienen `aria-label` descriptivo.
- Los `v-dialog` tienen título visible (para el árbol de accesibilidad).
- Los `v-data-table` tienen `caption` o `aria-label` descriptivo de su contenido.
- Los estados de error en formularios son leídos por lectores de pantalla
  (Vuetify lo hace si se usan las `rules` correctamente).

---

## Rendimiento con Vuetify

- Importar solo los componentes que se usan (tree-shaking habilitado por defecto en Vuetify 3).
- No registrar todos los componentes globalmente si el proyecto es pequeño —
  usar auto-import con el plugin oficial.
- `v-skeleton-loader` en lugar de spinners genéricos para componentes con contenido rico.
- Evitar anidar `v-container` dentro de `v-container` innecesariamente.

---

## Lo que nunca se hace con Vuetify

- Sobreescribir estilos internos de Vuetify con `!important`.
- Hardcodear colores hex/rgb cuando existen tokens semánticos en el tema.
- Usar `style=""` inline en componentes Vuetify para ajustes de diseño.
- Crear componentes de formulario propios que repliquen lo que Vuetify ya ofrece.
- Instanciar múltiples `v-snackbar` en lugar de un sistema de notificaciones centralizado.
- Tablas sin paginación con fuentes de datos no acotadas.