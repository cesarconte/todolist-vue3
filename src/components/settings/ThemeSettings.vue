<script setup>
import { computed, reactive, watch } from 'vue'
import { useSettings } from '@/composables/settings/useSettings.js'
import { useDisplay, useTheme } from 'vuetify'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { settings, themeSettings } = useSettings()
const { xs } = useDisplay()
const theme = useTheme()

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tempSettings = reactive({
  mode: themeSettings.mode,
  accentColor: themeSettings.accentColor
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      tempSettings.mode = themeSettings.mode
      tempSettings.accentColor = themeSettings.accentColor
      applyTheme(tempSettings.mode)
    }
  }
)

const modeOptions = [
  { title: 'Light', value: 'light', icon: 'mdi-white-balance-sunny' },
  { title: 'Dark', value: 'dark', icon: 'mdi-moon-waning-crescent' },
  { title: 'System', value: 'system', icon: 'mdi-laptop' }
]

const accentColors = [
  { title: 'Primary (Blue)', value: 'primary', color: '#1976D2' },
  { title: 'Secondary (Purple)', value: 'secondary', color: '#9C27B0' },
  { title: 'Teal', value: 'teal', color: '#009688' },
  { title: 'Amber', value: 'amber', color: '#FFC107' },
  { title: 'Red', value: 'error', color: '#F44336' },
  { title: 'Green', value: 'success', color: '#4CAF50' }
]

const applyTheme = (mode) => {
  let target = mode

  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    target = prefersDark ? 'dark' : 'light'
  }

  if (typeof theme.change === 'function') {
    theme.change(target)
  } else {
    theme.global.name.value = target
  }
}

const applyAccentColor = (color) => {
  const currentTheme = theme.global.name.value
  if (theme.themes.value[currentTheme]) {
    const newThemes = { ...theme.themes.value }
    newThemes[currentTheme] = {
      ...newThemes[currentTheme],
      colors: {
        ...newThemes[currentTheme].colors,
        primary: accentColors.find((c) => c.value === color)?.color || '#1976D2'
      }
    }
    theme.themes.value = newThemes
  }
}

watch(
  () => tempSettings.mode,
  (newMode) => {
    applyTheme(newMode)
  }
)

watch(
  () => tempSettings.accentColor,
  (newColor) => {
    applyAccentColor(newColor)
  }
)

const closeDialog = () => {
  settings.theme.mode = tempSettings.mode
  settings.theme.accentColor = tempSettings.accentColor
  emit('update:modelValue', false)
}

const cancelDialog = () => {
  applyTheme(settings.theme.mode)
  applyAccentColor(settings.theme.accentColor)
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    v-model="showDialog"
    :max-width="xs ? 'calc(100vw - 32px)' : '37.5rem'"
    :width="xs ? undefined : undefined"
    @click:outside="cancelDialog"
  >
    <v-card
      class="settings-card rounded-lg elevation-2 d-flex flex-column"
      color="surface"
      density="comfortable"
    >
      <v-card-title
        :class="
          xs
            ? 'd-flex align-center justify-space-between px-2 py-3'
            : 'd-flex align-center justify-space-between px-6 py-4'
        "
      >
        <span class="text-h6 text-on-surface font-weight-medium">Theme Settings</span>
        <v-btn icon @click="cancelDialog" variant="text" color="on-surface-variant">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle :class="xs ? 'px-2 py-3' : 'px-6 py-4'">
        <v-icon icon="mdi-palette-outline" size="small" class="mr-1"></v-icon>
        Customize the app's appearance
      </v-card-subtitle>

      <v-divider class="my-4" />

      <v-card-text :class="xs ? 'px-2 pt-0 pb-2' : 'px-6 pt-0 pb-2'">
        <p class="text-subtitle-2 mb-2">Mode</p>
        <v-btn-toggle
          v-model="tempSettings.mode"
          mandatory
          rounded="lg"
          color="primary"
          class="mb-6 d-flex"
          style="gap: 8px"
        >
          <v-btn
            v-for="option in modeOptions"
            :key="option.value"
            :value="option.value"
            class="flex-grow-1"
            height="48"
          >
            <v-icon :icon="option.icon" class="mr-2" />
            {{ option.title }}
          </v-btn>
        </v-btn-toggle>

        <p class="text-subtitle-2 mb-2">Accent Color</p>
        <v-item-group
          v-model="tempSettings.accentColor"
          mandatory
          class="d-flex flex-wrap"
          style="gap: 8px"
        >
          <v-item
            v-for="color in accentColors"
            :key="color.value"
            :value="color.value"
            v-slot="{ isSelected, toggle }"
          >
            <v-btn
              :color="color.color"
              :variant="isSelected ? 'flat' : 'outlined'"
              :class="isSelected ? 'text-white' : ''"
              rounded="lg"
              size="small"
              @click="toggle"
              height="40"
              width="auto"
              min-width="100"
            >
              <v-icon v-if="isSelected" icon="mdi-check" class="mr-1" />
              {{ color.title.split(' ')[0] }}
            </v-btn>
          </v-item>
        </v-item-group>
      </v-card-text>

      <v-divider class="my-4" />

      <v-card-actions :class="xs ? 'justify-end px-2 pb-3' : 'justify-end px-6 pb-4'">
        <v-btn variant="text" @click="cancelDialog"> Cancel </v-btn>
        <v-btn color="primary" variant="tonal" rounded size="large" @click="closeDialog">
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
