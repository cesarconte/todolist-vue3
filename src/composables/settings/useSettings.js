import { reactive, watch } from 'vue'

const STORAGE_KEY = 'app-settings'

const defaultSettings = {
  display: {
    defaultView: 'calendar',
    defaultOrder: 'date',
    showCompletedTasks: true,
    tasksPerPage: 20
  },
  taskBehavior: {
    confirmOnDelete: true,
    autoArchiveDays: 7,
    showReminderOnComplete: true
  },
  theme: {
    mode: 'system',
    accentColor: 'primary'
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Asegurar que defaultView tenga el valor correcto si no existe en saved
      if (!parsed.display) {
        parsed.display = {}
      }
      if (!parsed.display.defaultView) {
        parsed.display.defaultView = 'calendar'
      }
      return { ...defaultSettings, ...parsed }
    }
  } catch (e) {
    console.error('Error loading settings:', e)
  }
  return { ...defaultSettings }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Error saving settings:', e)
  }
}

// Singleton - se crea una sola vez y se comparte entre todos los componentes
const settings = reactive(loadSettings())

watch(
  () => settings,
  (newSettings) => {
    saveSettings(newSettings)
  },
  { deep: true }
)

const displaySettings = reactive({
  defaultView: settings.display.defaultView || 'calendar',
  defaultOrder: settings.display.defaultOrder,
  showCompletedTasks: settings.display.showCompletedTasks,
  tasksPerPage: settings.display.tasksPerPage
})

watch(
  () => settings.display,
  (newDisplay) => {
    Object.assign(displaySettings, newDisplay)
  },
  { deep: true }
)

const taskBehavior = reactive({
  confirmOnDelete: settings.taskBehavior.confirmOnDelete,
  autoArchiveDays: settings.taskBehavior.autoArchiveDays,
  showReminderOnComplete: settings.taskBehavior.showReminderOnComplete
})

watch(
  () => settings.taskBehavior,
  (newBehavior) => {
    Object.assign(taskBehavior, newBehavior)
  },
  { deep: true }
)

const themeSettings = reactive({
  mode: settings.theme.mode,
  accentColor: settings.theme.accentColor
})

watch(
  () => settings.theme,
  (newTheme) => {
    Object.assign(themeSettings, newTheme)
  },
  { deep: true }
)

export function useSettings() {
  const resetToDefaults = () => {
    Object.assign(settings, JSON.parse(JSON.stringify(defaultSettings)))
  }

  return {
    settings,
    displaySettings,
    taskBehavior,
    themeSettings,
    resetToDefaults
  }
}
