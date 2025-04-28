// useThemeToggle.js
import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'

export default function useThemeToggle() {
  const theme = useTheme()
  const isDarkMode = ref(false)

  // Toggle entre tema claro y oscuro
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    theme.global.name.value = isDarkMode.value ? 'myCustomDarkTheme' : 'myCustomLightTheme'
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', isDarkMode.value)
  }

  // Actualiza isDarkMode cuando cambia el tema
  watch(
    () => theme.global.name.value,
    (newTheme) => {
      isDarkMode.value = newTheme === 'myCustomDarkTheme'
    }
  )

  // Inicializar el tema basado en la preferencia guardada
  onMounted(() => {
    // Recuperar la preferencia guardada del usuario
    const savedMode = localStorage.getItem('darkMode')

    if (savedMode !== null) {
      // Convertir string a booleano
      isDarkMode.value = savedMode === 'true'
      theme.global.name.value = isDarkMode.value ? 'myCustomDarkTheme' : 'myCustomLightTheme'
    } else {
      // Si no hay preferencia guardada, usar la preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
      theme.global.name.value = prefersDark ? 'myCustomDarkTheme' : 'myCustomLightTheme'
    }
  })

  return {
    isDarkMode,
    toggleTheme
  }
}
