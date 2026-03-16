# Rule — Sistema de Diseño · Material Design 3 + Vuetify

> **Referencia oficial:** https://m3.material.io (siempre la versión más reciente publicada)
> **Versión actual:** Material Design 3 / Material You · evolución M3 Expressive (2025)
> **Implementación:** Vuetify 3 (última versión estable)

Todo diseño e implementación de interfaz sigue las directrices de **Material Design 3**
como sistema de referencia. Vuetify es la implementación de ese sistema en este proyecto.
Ante cualquier duda de diseño, la fuente de verdad es m3.material.io.

---

## 1. BREAKPOINTS Y LAYOUT ADAPTATIVO

Mobile First es el orden de trabajo. Se diseña desde el breakpoint más pequeño
y se escala hacia arriba. Nunca al revés.

### Breakpoints del proyecto

| Nombre  | Rango       | Vuetify | Diseño de referencia  |
|---------|-------------|---------|-----------------------|
| Mobile  | 0 – 599px   | `xs`    | Teléfono (320px mín.) |
| Tablet  | 600 – 959px | `sm`    | Tablet / foldable     |
| Laptop  | 960 – 1279px| `md`    | Portátil              |
| Desktop | 1280px+     | `lg/xl` | Monitor escritorio    |

### Layouts adaptativos por breakpoint (MD3)

**Mobile (xs) — Layout de 4 columnas:**
```vue
<VContainer>
  <VRow>
    <VCol cols="12">        <!-- bloque completo -->
    <VCol cols="6">         <!-- mitad en mobile -->
  </VRow>
</VContainer>
```
- Navegación: bottom navigation bar (`VBottomNavigation`)
- Menú lateral: drawer modal (oculto por defecto)
- Contenido: una columna, sin sidebars
- FAB: esquina inferior derecha, nunca tapa contenido relevante

**Tablet (sm) — Layout de 8 columnas:**
```vue
<VCol cols="12" sm="6">    <!-- 2 columnas en tablet -->
<VCol cols="12" sm="4">    <!-- 3 columnas en tablet -->
```
- Navegación: navigation rail lateral (`VNavigationDrawer` en modo mini)
- El drawer puede mostrarse como rail permanente
- El contenido principal empieza a tener dos columnas

**Laptop/Desktop (md/lg) — Layout de 12 columnas:**
```vue
<VCol cols="12" sm="6" md="4" lg="3"> <!-- 4 columnas en desktop -->
```
- Navegación: navigation drawer lateral expandido y permanente
- Layouts de dos o tres columnas para contenido + detalle
- Máximo ancho de contenido recomendado: 1440px con `VContainer` (no `fluid`)

### Reglas de layout obligatorias

- Nunca usar `VContainer fluid` en vistas de contenido principal.
  Solo en vistas de fondo completo (landing, hero sections).
- El padding del `VContainer` no se sobreescribe. Es parte del sistema.
- Los `VRow` tienen `gutter` por defecto (24px). No usar `no-gutters` salvo justificación.
- El mínimo de ancho de pantalla soportado es **320px**. Verificar siempre.
- Touch targets mínimos: **48×48px** en todos los elementos interactivos en mobile.

---

## 2. SISTEMA DE COLOR (MD3)

MD3 usa un sistema de **roles de color**, no valores hexadecimales sueltos.
Cada color tiene un rol semántico. Se usa el rol, no el valor.

### Roles de color principales

```javascript
// src/plugins/vuetify.js — definición completa del tema
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // ── Primario ───────────────────────────────────────────────────────
          'primary':               '#[valor]',  // acciones principales, CTA
          'on-primary':            '#[valor]',  // texto/icono sobre primary
          'primary-container':     '#[valor]',  // contenedores con acento primario
          'on-primary-container':  '#[valor]',  // texto sobre primary-container

          // ── Secundario ────────────────────────────────────────────────────
          'secondary':             '#[valor]',  // acciones secundarias
          'on-secondary':          '#[valor]',
          'secondary-container':   '#[valor]',
          'on-secondary-container':'#[valor]',

          // ── Terciario ─────────────────────────────────────────────────────
          'tertiary':              '#[valor]',  // acentos complementarios
          'on-tertiary':           '#[valor]',
          'tertiary-container':    '#[valor]',
          'on-tertiary-container': '#[valor]',

          // ── Error ─────────────────────────────────────────────────────────
          'error':                 '#B3261E',
          'on-error':              '#FFFFFF',
          'error-container':       '#F9DEDC',
          'on-error-container':    '#410E0B',

          // ── Superficie ────────────────────────────────────────────────────
          'surface':               '#FFFBFE',  // fondo de componentes (cards, etc.)
          'on-surface':            '#1C1B1F',  // texto principal
          'surface-variant':       '#E7E0EC',  // variante para inputs, chips
          'on-surface-variant':    '#49454F',  // texto secundario
          'surface-container':     '#F3EDF7',  // contenedores anidados
          'surface-container-high':'#ECE6F0',
          'surface-container-highest': '#E6E0E9',

          // ── Outline ───────────────────────────────────────────────────────
          'outline':               '#79747E',  // bordes de inputs, dividers
          'outline-variant':       '#CAC4D0',  // dividers sutiles

          // ── Fondo ─────────────────────────────────────────────────────────
          'background':            '#FFFBFE',
          'on-background':         '#1C1B1F',

          // ── Semánticos de estado (alias sobre los roles) ──────────────────
          'success':               '#146C2E',
          'on-success':            '#FFFFFF',
          'success-container':     '#C3EFCD',
          'warning':               '#7D5700',
          'on-warning':            '#FFFFFF',
          'warning-container':     '#FFDEA7',
          'info':                  '#00639B',
          'on-info':               '#FFFFFF',
          'info-container':        '#C9E6FF',
        }
      },
      dark: {
        // El tema dark es obligatorio desde el inicio, aunque no se active de momento.
        // MD3 genera automáticamente los tonos dark a partir de los mismos tonal palettes.
        colors: {
          'primary':               '#[valor-dark]',
          // ... completar con los valores dark correspondientes
        }
      }
    }
  }
})
```

### Reglas de uso del color

- **Nunca** usar un color hexadecimal directamente en un componente. Siempre el rol.
  ```vue
  <!-- ✅ Correcto -->
  <VBtn color="primary">Guardar</VBtn>
  <VAlert color="error-container">...</VAlert>

  <!-- ❌ Incorrecto -->
  <VBtn color="#1A56DB">Guardar</VBtn>
  ```

- En CSS custom, referenciar los tokens de Vuetify/MD3:
  ```css
  .mi-elemento {
    background-color: rgb(var(--v-theme-primary-container));
    color: rgb(var(--v-theme-on-primary-container));
  }
  ```

- **Contraste mínimo obligatorio** (WCAG 2.1 AA):
  - Texto normal: 4.5:1
  - Texto grande (18px+ o 14px+ bold): 3:1
  - Componentes UI (bordes, iconos activos): 3:1

- El color **nunca** es el único diferenciador de estado.
  Siempre acompañar con icono, texto o patrón adicional.

- Modo oscuro: los roles de color se invierten automáticamente.
  Nunca hardcodear colores que solo funcionen en light.

---

## 3. TIPOGRAFÍA (MD3 Type Scale)

MD3 define una escala tipográfica de **15 estilos** en 5 categorías.
Vuetify los expone como clases de utilidad.

### Escala tipográfica completa

| Categoría | Tamaño | Clase Vuetify          | Uso                                      |
|-----------|--------|------------------------|------------------------------------------|
| Display L | 57px   | `text-display-large`   | Titulares hero muy prominentes           |
| Display M | 45px   | `text-display-medium`  | Titulares hero secundarios               |
| Display S | 36px   | `text-display-small`   | Titulares de sección grandes             |
| Headline L| 32px   | `text-h1` / `text-headline-large`  | Título principal de vista  |
| Headline M| 28px   | `text-h2` / `text-headline-medium` | Título de sección          |
| Headline S| 24px   | `text-h3` / `text-headline-small`  | Subtítulo de sección       |
| Title L   | 22px   | `text-h4` / `text-title-large`     | Título de componente       |
| Title M   | 16px   | `text-h5` / `text-title-medium`    | Título de card / label     |
| Title S   | 14px   | `text-h6` / `text-title-small`     | Título pequeño             |
| Body L    | 16px   | `text-body-1`          | Cuerpo de texto principal                |
| Body M    | 14px   | `text-body-2`          | Cuerpo de texto secundario               |
| Body S    | 12px   | `text-body-2`          | Texto de apoyo                           |
| Label L   | 14px   | `text-button`          | Texto de botones y etiquetas prominentes |
| Label M   | 12px   | `text-caption`         | Etiquetas de campo, chips                |
| Label S   | 11px   | `text-overline`        | Overlines, metadatos                     |

### Reglas de tipografía

- Nunca más de **3 tamaños distintos** en una misma vista.
- La jerarquía debe ser inmediatamente legible sin leer el contenido.
- Tamaño mínimo de cuerpo de texto: **16px (Body L)**. En móvil especialmente.
- Peso tipográfico para énfasis: `font-weight-medium` (500) o `font-weight-bold` (700).
  Nunca `font-weight-black` (900) en cuerpo de texto.
- Line-height: respetar siempre los valores de la escala MD3. No comprimir.
- KPIs y métricas numéricas: `text-display-small` o `text-headline-large` + `font-weight-bold`.
- Etiquetas de campo en formularios: `text-caption` (Label M), nunca en mayúsculas
  salvo `text-overline` para metadatos y categorías.

---

## 4. SISTEMA DE FORMA (MD3 Shape Scale)

MD3 define 6 niveles de redondez que dan personalidad a los componentes.

| Nivel       | Radio    | Aplicación típica                          |
|-------------|----------|--------------------------------------------|
| None        | 0px      | Divisores, elementos de tabla              |
| Extra Small | 4px      | Chips pequeños, tooltips                   |
| Small       | 8px      | Botones, campos de texto, snackbars        |
| Medium      | 12px     | Cards pequeñas, menús                      |
| Large       | 16px     | Cards estándar, bottom sheets              |
| Extra Large | 28px     | FAB, cards destacadas, dialogs             |
| Full        | 50%      | Botones circulares, avatares, FAB pequeños |

```javascript
// En vuetify.js — configuración del shape scale
defaults: {
  VBtn: { rounded: 'xl' },          // Full (pill) para botones estándar MD3
  VCard: { rounded: 'lg' },         // Large para cards
  VTextField: { rounded: 'sm' },    // Small para inputs
  VChip: { rounded: 'sm' },         // Small para chips
  VDialog: { rounded: 'xl' },       // Extra Large para dialogs
  VSheet: { rounded: 'md' },        // Medium como base
}
```

### Reglas de forma

- La consistencia del shape scale es parte de la identidad visual.
  No mezclar radios arbitrarios con los del sistema.
- En mobile, los radio más generosos (Large, Extra Large) mejoran
  la percepción táctil y la sensación de modernidad.
- Bottom sheets siempre con radio en las esquinas superiores (Large o Extra Large).
- Cards en modo compacto (listas densas): Medium. Cards standalone: Large.

---

## 5. ELEVACIÓN Y SUPERFICIE (MD3)

MD3 usa **elevación tonal** (tinte de color, no solo sombra) para indicar profundidad.
El color de superficie se mezcla con el color primario a diferentes opacidades.

| Nivel | Sombra | Tinte primary | Uso                              |
|-------|--------|---------------|----------------------------------|
| 0     | 0dp    | 0%            | Fondo base, surface              |
| 1     | 1dp    | 5%            | Cards en reposo                  |
| 2     | 3dp    | 8%            | Menús desplegables               |
| 3     | 6dp    | 11%           | FAB en reposo, navigation drawer |
| 4     | 8dp    | 12%           | AppBar al hacer scroll           |
| 5     | 12dp   | 14%           | FAB al hacer hover, dialogs      |

```vue
<!-- En Vuetify, la elevación se controla con la prop elevation -->
<VCard elevation="1">       <!-- Card estándar en reposo -->
<VCard elevation="3">       <!-- Card destacada o en hover -->
<VAppBar elevation="0">     <!-- Sin elevación inicial, se añade al scroll -->
```

### Reglas de elevación

- No acumular más de **3 niveles de elevación** visibles simultáneamente en una vista.
- La elevación comunica interactividad: los elementos en hover suben un nivel.
- En modo oscuro, la elevación se expresa principalmente con el tinte de color
  (surface tint), no con sombras intensas.
- No usar `elevation="24"` ni valores extremos. El máximo útil es `elevation="5"`.

---

## 6. MOTION Y ANIMACIÓN (MD3)

MD3 define un sistema de **easing curves** y **duration tokens**.
Las animaciones comunican relaciones espaciales y jerarquía. No son decoración.

### Easing curves

| Curva                    | CSS                              | Uso                                    |
|--------------------------|----------------------------------|----------------------------------------|
| Emphasized               | `cubic-bezier(0.2, 0, 0, 1)`    | Transiciones de elementos principales  |
| Emphasized Decelerate    | `cubic-bezier(0.05, 0.7, 0.1, 1)`| Elementos que entran en pantalla      |
| Emphasized Accelerate    | `cubic-bezier(0.3, 0, 0.8, 0.15)`| Elementos que salen de pantalla       |
| Standard                 | `cubic-bezier(0.2, 0, 0, 1)`    | Transiciones de estado internas        |
| Standard Decelerate      | `cubic-bezier(0, 0, 0, 1)`      | Entrada de overlays                    |
| Standard Accelerate      | `cubic-bezier(0.3, 0, 1, 1)`    | Salida de overlays                     |

### Duration tokens

| Token    | Duración | Uso                                           |
|----------|----------|-----------------------------------------------|
| Short 1  | 50ms     | Micro-feedback (ripple inicio)                |
| Short 2  | 100ms    | Hover states, pequeños cambios de color       |
| Short 3  | 150ms    | Chips, checkboxes, switches                   |
| Short 4  | 200ms    | Botones, iconos, tooltips                     |
| Medium 1 | 250ms    | Cards, searchbars                             |
| Medium 2 | 300ms    | Dialogs pequeños, menús                       |
| Medium 3 | 350ms    | Bottom sheets, navigation drawer              |
| Medium 4 | 400ms    | Transiciones de ruta estándar                 |
| Long 1   | 450ms    | Transiciones de página complejas              |
| Long 2   | 500ms    | Transiciones de layout (panel lateral)        |

```css
/* Variables CSS de motion — definir en :root */
:root {
  --md-motion-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-motion-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --md-motion-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --md-duration-short4: 200ms;
  --md-duration-medium2: 300ms;
  --md-duration-medium4: 400ms;
}

/* Uso en componentes */
.mi-card {
  transition: transform var(--md-duration-short4) var(--md-motion-emphasized),
              box-shadow var(--md-duration-short4) var(--md-motion-emphasized);
}
```

### Reglas de motion

- **Siempre** respetar `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Las transiciones de ruta entre páginas usan Medium 4 (400ms) como máximo.
- Los estados hover/focus usan Short 2–4 (100–200ms).
- Nunca animar propiedades que causen layout reflow (`width`, `height`, `margin`).
  Solo `transform` y `opacity` para animaciones fluidas en GPU.
- Los elementos que entran en pantalla usan Emphasized Decelerate.
  Los que salen usan Emphasized Accelerate.

---

## 7. COMPONENTES — PATRONES MD3 EN VUETIFY

### Botones — jerarquía obligatoria

MD3 define 5 tipos de botón con jerarquía visual clara:

```vue
<!-- 1. Filled — acción principal, máximo 1 por sección -->
<VBtn color="primary" variant="elevated">Guardar</VBtn>

<!-- 2. Filled Tonal — acción secundaria importante -->
<VBtn color="secondary-container" variant="elevated">Previsualizar</VBtn>

<!-- 3. Outlined — acción alternativa o cancelar -->
<VBtn variant="outlined">Cancelar</VBtn>

<!-- 4. Text — acción terciaria, navegación inline -->
<VBtn variant="text">Ver más</VBtn>

<!-- 5. Elevated — igual que filled pero con sombra (uso moderado) -->
<VBtn variant="elevated" color="surface">Opción</VBtn>

<!-- FAB — acción principal de la pantalla, máximo 1 por vista -->
<VBtn
  icon="mdi-plus"
  color="primary-container"
  size="large"
  elevation="3"
  aria-label="Crear nuevo producto"
/>
```

**Reglas de botones:**
- Máximo **1 botón Filled** por sección o formulario (la acción principal).
- Los botones llevan `:loading="true"` durante operaciones async. Sin excepción.
- Touch target mínimo en mobile: **48×48px** aunque visualmente sea más pequeño.
- Botones de acción destructiva: color `error`, variante `outlined` o `text`.
  El Filled rojo solo en confirmación final dentro de un dialog.
- Grupos de botones relacionados: usar `VBtnGroup`.

### Cards — estructura y variantes

```vue
<!-- Card estándar en reposo (elevation 1) -->
<VCard rounded="lg" elevation="1">
  <VCardItem>
    <VCardTitle>Título</VCardTitle>
    <VCardSubtitle>Subtítulo / metadata</VCardSubtitle>
  </VCardItem>
  <VCardText>
    Contenido principal de la card.
  </VCardText>
  <VCardActions>
    <VSpacer />
    <VBtn variant="text">Secundaria</VBtn>
    <VBtn color="primary" variant="tonal">Principal</VBtn>
  </VCardActions>
</VCard>

<!-- Card interactiva (hover eleva a nivel 2) -->
<VCard
  rounded="lg"
  elevation="1"
  hover
  @click="handleSelect"
  role="button"
  :aria-label="`Seleccionar ${item.title}`"
>
  <!-- contenido -->
</VCard>

<!-- Card con imagen -->
<VCard rounded="lg" elevation="1">
  <VImg
    :src="product.imageUrl"
    :alt="product.title"
    aspect-ratio="16/9"
    cover
  />
  <VCardItem>
    <!-- ... -->
  </VCardItem>
</VCard>
```

**Reglas de cards:**
- En grids de cards: mismo alto usando `height="100%"` o CSS grid `align-items: stretch`.
- Las cards interactivas tienen estado hover visible (`hover` prop o CSS).
- `VCardActions` siempre alineado a la derecha con `VSpacer` antes de los botones.
- Cards en listas: `elevation="0"` con border, no sombra (menos ruido visual).

### Formularios — implementación MD3

```vue
<VForm ref="formRef" @submit.prevent="handleSubmit" novalidate>

  <!-- Input estándar MD3: outlined + comfortable -->
  <VTextField
    v-model="form.email"
    label="Correo electrónico"
    type="email"
    variant="outlined"
    density="comfortable"
    :rules="emailRules"
    :error-messages="serverErrors.email"
    prepend-inner-icon="mdi-email-outline"
    autocomplete="email"
    required
    class="mb-4"
  />

  <!-- Select -->
  <VSelect
    v-model="form.category"
    label="Categoría"
    :items="categoryOptions"
    item-title="label"
    item-value="value"
    variant="outlined"
    density="comfortable"
    :rules="[requiredRule]"
    class="mb-4"
  />

  <!-- Textarea -->
  <VTextarea
    v-model="form.description"
    label="Descripción"
    variant="outlined"
    rows="4"
    auto-grow
    counter="500"
    :rules="descriptionRules"
    class="mb-4"
  />

  <!-- Checkbox con label accesible -->
  <VCheckbox
    v-model="form.acceptTerms"
    :rules="[v => !!v || 'Debes aceptar los términos']"
    color="primary"
  >
    <template #label>
      Acepto los
      <RouterLink to="/terms" class="ml-1">términos y condiciones</RouterLink>
    </template>
  </VCheckbox>

  <!-- Botones de formulario -->
  <VRow class="mt-4">
    <VCol cols="12" sm="auto" class="ml-sm-auto">
      <VBtn
        variant="outlined"
        block
        class="mb-2 mb-sm-0 mr-sm-2"
        @click="handleCancel"
      >
        Cancelar
      </VBtn>
    </VCol>
    <VCol cols="12" sm="auto">
      <VBtn
        type="submit"
        color="primary"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        block
      >
        Guardar cambios
      </VBtn>
    </VCol>
  </VRow>

</VForm>
```

**Reglas de formularios MD3:**
- Variante `outlined` siempre. No `underlined` ni `plain` salvo uso decorativo.
- Density `comfortable` por defecto. `compact` solo en tablas y listas densas.
- Los botones de formulario en mobile son `block` (ancho completo). En desktop, auto.
- El orden de los botones: **Cancel izquierda, Confirmar derecha** (convención MD3).
- Campos de password: siempre con icono de toggle visibilidad.
- Feedback de validación: verde en éxito no es obligatorio en MD3. El rojo en error sí.

### Navegación — patrones por breakpoint

```vue
<!-- App.vue — navegación adaptativa -->
<template>
  <!-- Mobile: Bottom Navigation -->
  <VBottomNavigation
    v-if="isMobile"
    v-model="activeRoute"
    color="primary"
    grow
  >
    <VBtn value="home">
      <VIcon>mdi-home-outline</VIcon>
      <span>Inicio</span>
    </VBtn>
    <!-- máximo 5 items en bottom nav -->
  </VBottomNavigation>

  <!-- Tablet: Navigation Rail -->
  <VNavigationDrawer
    v-else-if="isTablet"
    :rail="true"
    permanent
  >
    <!-- items con solo iconos + tooltip -->
  </VNavigationDrawer>

  <!-- Desktop: Navigation Drawer expandido -->
  <VNavigationDrawer
    v-else
    permanent
    width="256"
  >
    <!-- items con icono + etiqueta -->
  </VNavigationDrawer>
</template>

<script setup>
import { useDisplay } from 'vuetify'
const { xs, smAndDown } = useDisplay()
const isMobile  = xs          // 0-599px
const isTablet  = smAndDown   // 600-959px
</script>
```

### Diálogos y bottom sheets

```vue
<!-- Dialog estándar MD3 -->
<VDialog
  v-model="isOpen"
  :max-width="smAndDown ? '100%' : '560px'"
  :fullscreen="xs"
  rounded="xl"
  persistent
>
  <VCard rounded="xl">
    <!-- Icon opcional en dialogs de confirmación -->
    <VCardItem class="text-center pt-6">
      <VIcon size="24" color="error" class="mb-2">mdi-alert-outline</VIcon>
      <VCardTitle class="text-title-large">¿Eliminar producto?</VCardTitle>
    </VCardItem>
    <VCardText class="text-body-medium text-on-surface-variant">
      Esta acción no se puede deshacer.
    </VCardText>
    <VCardActions class="px-6 pb-6">
      <VSpacer />
      <VBtn variant="text" @click="isOpen = false">Cancelar</VBtn>
      <VBtn color="error" variant="tonal" :loading="isLoading" @click="confirm">
        Eliminar
      </VBtn>
    </VCardActions>
  </VCard>
</VDialog>

<!-- Bottom Sheet — preferida sobre Dialog en mobile para acciones -->
<VBottomSheet v-model="isSheetOpen">
  <VCard rounded="t-xl" elevation="0">
    <VCardTitle class="pt-4">Opciones</VCardTitle>
    <!-- lista de acciones -->
  </VCard>
</VBottomSheet>
```

**Regla:** En mobile (`xs`), preferir `VBottomSheet` sobre `VDialog` para menús
de opciones y acciones secundarias. El dialog se reserva para confirmaciones críticas.

### Lists y elementos de lista

```vue
<VList lines="two" density="comfortable">
  <VListItem
    v-for="item in items"
    :key="item.id"
    :title="item.title"
    :subtitle="item.subtitle"
    rounded="lg"
    class="mb-1"
  >
    <template #prepend>
      <VAvatar color="primary-container" rounded="md">
        <VIcon color="on-primary-container">{{ item.icon }}</VIcon>
      </VAvatar>
    </template>
    <template #append>
      <VChip size="small" :color="getStatusColor(item.status)">
        {{ item.status }}
      </VChip>
    </template>
  </VListItem>
</VList>
```

---

## 8. ESPACIADO Y DENSIDAD

MD3 usa una cuadrícula base de **4dp** para todo el espaciado.

### Escala de espaciado

| Token | Valor | Clase Vuetify | Uso típico                         |
|-------|-------|---------------|------------------------------------|
| 1     | 4px   | `ma-1` / `pa-1` | Espaciado mínimo entre elementos  |
| 2     | 8px   | `ma-2` / `pa-2` | Gap entre iconos y texto          |
| 3     | 12px  | `ma-3` / `pa-3` | Padding interno de chips          |
| 4     | 16px  | `ma-4` / `pa-4` | Padding estándar de componentes   |
| 5     | 20px  | `ma-5` / `pa-5` | Gap entre campos de formulario    |
| 6     | 24px  | `ma-6` / `pa-6` | Padding de cards, spacing secciones|
| 8     | 32px  | `ma-8` / `pa-8` | Separación entre secciones        |
| 10    | 40px  | `ma-10`/ `pa-10`| Espaciado grande entre bloques    |
| 12    | 48px  | `ma-12`/ `pa-12`| Padding de vistas / hero sections |
| 16    | 64px  | `ma-16`/ `pa-16`| Espaciado entre secciones grandes |

### Densidad por contexto

```vue
<!-- density="default"    → para vistas con poco contenido, landing pages -->
<!-- density="comfortable" → para vistas de trabajo, formularios (por defecto) -->
<!-- density="compact"    → para tablas, listas densas de datos -->

<VTextField density="comfortable" />  <!-- estándar -->
<VDataTable density="compact" />      <!-- tablas de datos -->
<VList density="comfortable" />       <!-- listas de navegación -->
```

---

## 9. ICONOGRAFÍA

El proyecto usa **Material Symbols / Material Design Icons (MDI)** exclusivamente.

```vue
<!-- Icono standalone informativo: siempre con aria-label -->
<VIcon icon="mdi-check-circle" color="success" aria-label="Completado" />

<!-- Icono decorativo (junto a texto): aria-hidden -->
<VIcon icon="mdi-email-outline" aria-hidden="true" />
<span>Correo electrónico</span>

<!-- Botón de icono: aria-label obligatorio -->
<VBtn icon="mdi-delete-outline" aria-label="Eliminar producto" color="error" variant="text" />
```

**Tamaños de icono (MD3):**
- `size="16"` → iconos inline en texto pequeño
- `size="20"` → iconos en botones de texto, chips
- `size="24"` → tamaño estándar (por defecto en Vuetify)
- `size="40"` → iconos en empty states, ilustraciones
- `size="48"` → iconos hero en onboarding o estados vacíos prominentes

---

## 10. MODO OSCURO

El modo oscuro no es opcional. Se diseña desde el inicio.

```javascript
// Detección automática de preferencia del sistema
const vuetify = createVuetify({
  theme: {
    defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  }
})
```

```vue
<!-- Toggle manual en la app -->
<script setup>
import { useTheme } from 'vuetify'
const theme = useTheme()
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
```

**Reglas de modo oscuro:**
- Los colores dark los genera MD3 Theme Builder a partir del mismo seed color.
  No inventar colores dark manualmente.
- En modo oscuro, la elevación se expresa con **surface tint** (mezcla de primary),
  no con sombras más intensas.
- Las imágenes con fondo blanco en light mode pueden necesitar un ajuste de opacidad
  en dark mode. Usar `VImg` con clase condicional.
- Nunca usar `#000000` puro como fondo en dark mode. MD3 usa `#141218` como surface.

---

## 11. LO QUE EL AGENTE NUNCA HACE EN DISEÑO

- Usar valores hexadecimales de color directamente en componentes.
- Mezclar radios de borde arbitrarios con los del shape scale.
- Crear más de un botón Filled por sección.
- Diseñar solo para desktop y adaptar a mobile al final.
- Ignorar el toque mínimo de 48×48px en mobile.
- Animar propiedades que causan layout reflow.
- Usar más de 3 tamaños tipográficos en una misma vista.
- Ignorar el modo oscuro argumentando que "se añade después".
- Usar `elevation` > 5 sin justificación.
- Crear dialogs en mobile cuando un bottom sheet sería más apropiado.
- Diseñar estados de "solo poblado" ignorando loading, vacío y error.
- Usar `!important` para sobreescribir estilos de Vuetify.