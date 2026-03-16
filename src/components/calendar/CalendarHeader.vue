<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  },
  currentView: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:currentDate',
  'update:currentView',
  'go-to-today',
  'prev-year',
  'prev-month',
  'next-month',
  'next-year'
])

const { xs, sm } = useDisplay()

const CALENDAR_VIEW_TYPES = [
  { text: 'Month View', value: 'month' },
  { text: 'Week View', value: 'week' },
  { text: 'Day View', value: 'day' }
]

const formattedTitle = computed(() => {
  if (!props.currentDate) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    props.currentDate
  )
})

const updateView = (value) => emit('update:currentView', value)
</script>

<template>
  <v-row class="ma-0 mb-4">
    <v-col cols="12" :class="xs || sm ? 'pa-1' : 'pa-4'">
      <v-sheet border rounded="xl" class="bg-surface overflow-hidden px-4 py-4">
        <!-- Desktop (md+): Single row -->
        <v-row no-gutters align="center" :class="xs || sm ? 'd-none' : 'd-flex'">
          <!-- Left: Navigation Buttons -->
          <v-col class="d-flex align-center">
            <v-sheet border rounded="pill" class="d-flex align-center bg-surface overflow-hidden">
              <v-btn
                variant="text"
                icon
                size="small"
                @click="emit('prev-year')"
                aria-label="Previous Year"
              >
                <v-icon>mdi-chevron-double-left</v-icon>
                <v-tooltip activator="parent" location="top">Previous Year</v-tooltip>
              </v-btn>
              <v-divider vertical class="my-1" />
              <v-btn
                variant="text"
                icon
                size="small"
                @click="emit('prev-month')"
                aria-label="Previous Month"
              >
                <v-icon>mdi-chevron-left</v-icon>
                <v-tooltip activator="parent" location="top">Previous Month</v-tooltip>
              </v-btn>
              <v-divider vertical class="my-1" />
              <v-btn
                variant="text"
                class="text-none font-weight-bold text-primary px-4"
                rounded="0"
                @click="emit('go-to-today')"
              >
                Today
                <v-tooltip activator="parent" location="bottom">Go to today's date</v-tooltip>
              </v-btn>
              <v-divider vertical class="my-1" />
              <v-btn
                variant="text"
                icon
                size="small"
                @click="emit('next-month')"
                aria-label="Next Month"
              >
                <v-icon>mdi-chevron-right</v-icon>
                <v-tooltip activator="parent" location="top">Next Month</v-tooltip>
              </v-btn>
              <v-divider vertical class="my-1" />
              <v-btn
                variant="text"
                icon
                size="small"
                @click="emit('next-year')"
                aria-label="Next Year"
              >
                <v-icon>mdi-chevron-double-right</v-icon>
                <v-tooltip activator="parent" location="top">Next Year</v-tooltip>
              </v-btn>
            </v-sheet>
          </v-col>

          <!-- Center: Month Title -->
          <v-col class="d-flex justify-center">
            <v-sheet border rounded="pill" class="d-flex align-center px-5 py-2 bg-surface">
              <v-icon icon="mdi-calendar-month" color="primary" class="me-2" size="small" />
              <span class="font-weight-black text-on-surface text-h6">{{ formattedTitle }}</span>
            </v-sheet>
          </v-col>

          <!-- Right: View Selector -->
          <v-col class="d-flex justify-end align-center">
            <v-select
              :model-value="currentView"
              :items="CALENDAR_VIEW_TYPES"
              item-title="text"
              item-value="value"
              label="VIEW MODE"
              hide-details
              density="compact"
              variant="outlined"
              rounded="lg"
              bg-color="surface"
              class="font-weight-bold"
              style="min-width: 160px"
              @update:model-value="updateView"
            />
          </v-col>
        </v-row>

        <!-- Mobile (xs, sm): Three rows -->
        <v-row :class="xs || sm ? 'd-flex' : 'd-none'" class="ma-0" no-gutters>
          <!-- Row 1: Navigation + Title -->
          <v-col cols="12" class="d-flex align-center justify-space-between mb-4">
            <v-btn variant="text" icon size="small" @click="emit('prev-year')">
              <v-icon>mdi-chevron-double-left</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="small" @click="emit('prev-month')">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <span class="font-weight-black text-on-surface text-subtitle-1 flex-grow-1 text-center">
              {{ formattedTitle }}
            </span>
            <v-btn variant="text" icon size="small" @click="emit('next-month')">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn variant="text" icon size="small" @click="emit('next-year')">
              <v-icon>mdi-chevron-double-right</v-icon>
            </v-btn>
          </v-col>
          <v-divider class="mb-4" />
          <!-- Row 2: Today Button -->
          <v-col cols="12" class="mb-4">
            <v-btn
              block
              rounded="lg"
              color="primary"
              class="text-none font-weight-bold"
              @click="emit('go-to-today')"
            >
              <v-icon start icon="mdi-calendar-today" class="me-2" />
              Today
            </v-btn>
          </v-col>
          <!-- Row 3: View Selector -->
          <v-col cols="12">
            <v-select
              :model-value="currentView"
              :items="CALENDAR_VIEW_TYPES"
              item-title="text"
              item-value="value"
              label="VIEW MODE"
              hide-details
              density="compact"
              variant="outlined"
              rounded="lg"
              bg-color="surface"
              class="font-weight-bold"
              @update:model-value="updateView"
            />
          </v-col>
        </v-row>
      </v-sheet>
    </v-col>
  </v-row>
</template>
