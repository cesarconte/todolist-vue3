import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useSettings } from '@/composables/settings/useSettings.js'

export default function useThemeToggle() {
  const theme = useTheme()
  const { themeSettings } = useSettings()
  const isDarkMode = ref(false)

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

  const toggleTheme = () => {
    if (themeSettings.mode === 'system' || themeSettings.mode === 'manual') {
      themeSettings.mode = isDarkMode.value ? 'light' : 'dark'
    } else {
      themeSettings.mode = isDarkMode.value ? 'light' : 'dark'
    }
  }

  watch(
    () => themeSettings.mode,
    (newMode) => {
      applyTheme(newMode)
      isDarkMode.value = theme.global.name.value === 'dark'
    }
  )

  watch(
    () => theme.global.name.value,
    (newTheme) => {
      isDarkMode.value = newTheme === 'dark'
    }
  )

  onMounted(() => {
    applyTheme(themeSettings.mode)
    isDarkMode.value = theme.global.name.value === 'dark'
  })

  return {
    isDarkMode,
    toggleTheme,
    applyTheme
  }
}
