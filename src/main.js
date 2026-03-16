import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { VDateInput } from 'vuetify/labs/VDateInput'

// Important: CSS for labs or complex components must be imported manually if not using the vite-plugin
import 'vuetify/dist/vuetify-labs.css'

const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput
  },
  defaults: {
    VBtn: { rounded: 'xl' },
    VCard: { rounded: 'lg' },
    VTextField: { rounded: 'sm' },
    VChip: { rounded: 'sm' },
    VDialog: { rounded: 'xl' },
    VSheet: { rounded: 'md' }
  },
  theme: {
    defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    themes: {
      light: {
        colors: {
          'surface-container': '#f2f2f2',
          'surface-container-low': '#f9f9f9',
          'surface-container-high': '#e5e5e5',
          'surface-container-highest': '#d9d9d9',
          'on-surface-container': '#212121',
          'warning-container': '#FFF3E0',
          'error-container': '#FFEBEE',
          'success-container': '#E8F5E9',
          'info-container': '#E3F2FD'
        }
      },
      dark: {
        colors: {
          'surface-container': '#303030',
          'surface-container-low': '#212121',
          'surface-container-high': '#424242',
          'surface-container-highest': '#616161',
          'on-surface-container': '#f5f5f5',
          'warning-container': '#3E2723',
          'error-container': '#4E342E',
          'success-container': '#1B5E20',
          'info-container': '#0D47A1'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
