import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useTheme } from 'vuetify'
import { useSettings } from '@/composables/settings/useSettings.js'

export default function useThemeToggle() {
  const theme = useTheme()
  const { themeSettings } = useSettings()

  const isDarkMode = ref(theme.global.current.value.dark)

  let mediaQuery = null

  const handleSystemThemeChange = (e) => {
    if (themeSettings.mode === 'system') {
      theme.global.name.value = e.matches ? 'dark' : 'light'
    }
  }

  const applyTheme = (mode) => {
    if (mode === 'system') {
      theme.global.name.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else if (mode === 'light' || mode === 'dark') {
      theme.global.name.value = mode
    }
  }

  const toggleTheme = () => {
    const newTheme = isDarkMode.value ? 'light' : 'dark'
    themeSettings.mode = newTheme
    theme.global.name.value = newTheme
  }

  watch(
    () => themeSettings.mode,
    (newMode) => {
      applyTheme(newMode)
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

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  })

  return {
    isDarkMode,
    toggleTheme,
    applyTheme
  }
}
