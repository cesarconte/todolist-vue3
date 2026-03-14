// useThemeToggle.js
import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'

export default function useThemeToggle() {
  const theme = useTheme()
  const isDarkMode = ref(false)

  // Toggle entre tema claro y oscuro
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    // Actualizado para seguir la recomendación de Vuetify UPGRADE
    if (typeof theme.change === 'function') {
      theme.change(isDarkMode.value ? 'dark' : 'light')
    } else {
      theme.global.name.value = isDarkMode.value ? 'dark' : 'light'
    }
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', isDarkMode.value)
  }

  // Actualiza isDarkMode cuando cambia el tema
  watch(
    () => theme.global.name.value,
    (newTheme) => {
      isDarkMode.value = newTheme === 'dark'
    }
  )

  // Inicializar el tema basado en la preferencia guardada
  onMounted(() => {
    // Recuperar la preferencia guardada del usuario
    const savedMode = localStorage.getItem('darkMode')

    if (savedMode !== null) {
      // Convertir string a booleano
      isDarkMode.value = savedMode === 'true'
      const target = isDarkMode.value ? 'dark' : 'light'
      if (typeof theme.change === 'function') {
        theme.change(target)
      } else {
        theme.global.name.value = target
      }
    } else {
      // Si no hay preferencia guardada, usar la preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
      const target = prefersDark ? 'dark' : 'light'
      if (typeof theme.change === 'function') {
        theme.change(target)
      } else {
        theme.global.name.value = target
      }
    }
  })

  return {
    isDarkMode,
    toggleTheme
  }
}
