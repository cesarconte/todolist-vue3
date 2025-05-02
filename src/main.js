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
      light: {},
      dark: {}
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(firebaseApp)

app.mount('#app')
