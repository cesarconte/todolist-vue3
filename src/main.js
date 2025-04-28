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
import * as directives from 'vuetify/directives'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VCalendar } from 'vuetify/labs/VCalendar'
import { VTimePicker } from 'vuetify/lib/labs/components.mjs'
import { VTreeview } from 'vuetify/labs/VTreeview'

// Define M3 themes with more roles
const myCustomLightTheme = {
  dark: false,
  colors: {
    primary: '#6750A4', // Example M3 Purple
    'on-primary': '#FFFFFF',
    'primary-container': '#EADDFF',
    'on-primary-container': '#21005D',
    secondary: '#625B71',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#E8DEF8',
    'on-secondary-container': '#1D192B',
    tertiary: '#7D5260',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFD8E4',
    'on-tertiary-container': '#31111D',
    error: '#B3261E',
    'on-error': '#FFFFFF',
    'error-container': '#F9DEDC',
    'on-error-container': '#410E0B',
    background: '#FFFBFE', // MD3 recommended
    'on-background': '#1C1B1F',
    surface: '#FFFFFF', // MD3 recommended (different from background)
    'on-surface': '#1C1B1F',
    'surface-variant': '#E7E0EC',
    'on-surface-variant': '#49454F',
    outline: '#79747E',
    'outline-variant': '#CAC4D0', // Added for M3
    shadow: '#000000', // Added for M3
    scrim: '#000000', // Added for M3
    'inverse-surface': '#313033', // Added for M3
    'inverse-on-surface': '#F4EFF4', // Added for M3
    'inverse-primary': '#D0BCFF' // Added for M3
  }
}

const myCustomDarkTheme = {
  dark: true,
  colors: {
    primary: '#D0BCFF', // Example M3 Purple
    'on-primary': '#381E72',
    'primary-container': '#4F378B',
    'on-primary-container': '#EADDFF',
    secondary: '#CCC2DC',
    'on-secondary': '#332D41',
    'secondary-container': '#4A4458',
    'on-secondary-container': '#E8DEF8',
    tertiary: '#EFB8C8',
    'on-tertiary': '#492532',
    'tertiary-container': '#633B48',
    'on-tertiary-container': '#FFD8E4',
    error: '#F2B8B5',
    'on-error': '#601410',
    'error-container': '#8C1D18',
    'on-error-container': '#F9DEDC',
    background: '#1C1B1F', // MD3 recommended
    'on-background': '#E6E1E5',
    surface: '#222127', // Slightly lighter than background for separation
    'on-surface': '#E6E1E5',
    'surface-variant': '#49454F',
    'on-surface-variant': '#CAC4D0',
    outline: '#938F99',
    'outline-variant': '#49454F', // Added for M3
    shadow: '#000000', // Added for M3
    scrim: '#000000', // Added for M3
    'inverse-surface': '#E6E1E5', // Added for M3
    'inverse-on-surface': '#313033', // Added for M3
    'inverse-primary': '#6750A4' // Added for M3
  }
}

const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput,
    VCalendar,
    VTimePicker,
    VTreeview
  },
  directives,
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
      myCustomDarkTheme
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(firebaseApp)

app.mount('#app')
