import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VCalendar } from 'vuetify/labs/VCalendar'
import { VTimePicker } from "vuetify/labs/VTimePicker"

export default createVuetify({
  components: {
    VDateInput,
    VCalendar,
    VTimePicker
  }
})