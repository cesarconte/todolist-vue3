// src/composables/useToolbarNav.js
import { computed } from 'vue'
import useThemeToggle from '@/composables/ui/useThemeToggle'

export function useToolbarNav({
  userStore,
  router,
  showSnackbar,
  openDialog,
  handleLoginLogout,
  handleNotificationsClick,
  handleNotificationsSettingsClick,
  loginLogoutText,
  loginLogoutIcon
}) {
  // Usar el composable del tema
  const { isDarkMode, toggleTheme } = useThemeToggle()

  // Helper para el título del usuario
  const userTitle = computed(() => (userStore.isLoggedIn ? userStore.userName : 'User'))

  const navItems = computed(() => [
    {
      title: userTitle.value,
      value: 'user',
      color: 'blue-accent-4',
      permission: 'user',
      function: () => {
        if (userStore.isLoggedIn) {
          router.push({ name: 'profile', params: { userId: userStore.userId } })
        } else {
          showSnackbar('Please log in to view your profile.', 'info', 'mdi-account-arrow-right')
          router.push({ path: '/login' })
        }
      }
    },
    {
      title: 'Add Task',
      value: 'add task',
      icon: 'mdi-plus-circle',
      color: 'green-accent-4',
      permission: 'add_task',
      function: () => openDialog('add task')
    },
    {
      title: 'Search',
      value: 'search',
      icon: 'mdi-magnify',
      color: 'orange-accent-4',
      permission: 'search_task',
      function: () => router.push({ name: 'search' })
    },
    {
      title: 'Filter & Labels',
      value: 'filter and labels',
      icon: 'mdi-filter-variant',
      color: 'purple-accent-4',
      permission: 'filter_task',
      function: () => router.push({ name: 'filter-and-labels' })
    }
  ])

  // Elementos para el menú de puntos (dots) en la versión móvil
  const dotsItems = computed(() => [
    // 1. Notificaciones
    {
      title: 'Notifications',
      icon: 'mdi-bell-outline',
      handler: handleNotificationsClick
    },
    // 2. Tema
    {
      title: isDarkMode.value ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDarkMode.value ? 'mdi-weather-sunny' : 'mdi-weather-night',
      handler: toggleTheme
    },
    // 3. Settings (configuración)
    {
      title: 'Settings',
      icon: 'mdi-cog-outline',
      children: [
        {
          title: 'Notification Settings',
          icon: 'mdi-bell-cog-outline',
          handler: handleNotificationsSettingsClick
        }
      ]
    },
    // 4. Login/Logout
    {
      title: loginLogoutText.value,
      icon: loginLogoutIcon.value,
      handler: handleLoginLogout
    }
  ])

  return { navItems, dotsItems }
}
