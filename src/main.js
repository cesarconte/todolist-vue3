import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { firebaseApp } from './firebase'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VCalendar } from 'vuetify/labs/VCalendar'
import { VTimePicker } from 'vuetify/lib/labs/components.mjs'
import { VTreeview } from 'vuetify/labs/VTreeview'

const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput,
    VCalendar,
    VTimePicker,
    VTreeview
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // YouTube usa fondo blanco principal y elementos secundarios en gris claro
          'surface-container': '#f2f2f2',        // Gris claro para elementos secundarios/chips/botones
          'surface-container-low': '#f9f9f9',    // Muy sutilmente gris para hover states
          'surface-container-high': '#e5e5e5',   // Gris más oscuro para bordes/divisores
          'surface-container-highest': '#d9d9d9', // Gris oscuro para elementos de mayor énfasis
          'on-surface-container': '#212121',      // Texto sobre elementos grises
        }
      },
      dark: {
        colors: {
          // Versiones oscuras equivalentes
          'surface-container': '#303030',        // grey-darken-3
          'surface-container-low': '#212121',    // grey-darken-4
          'surface-container-high': '#424242',   // grey-darken-2
          'surface-container-highest': '#616161', // grey-darken-1
          'on-surface-container': '#f5f5f5',      // grey-lighten-4
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(firebaseApp)

app.mount('#app')
