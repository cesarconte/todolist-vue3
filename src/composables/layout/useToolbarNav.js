// src/composables/useToolbarNav.js
import useThemeToggle from '@/composables/ui/useThemeToggle' // Importar el composable del tema

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
  // Helper para el título del usuario
  const getUserTitle = () => (userStore.isLoggedIn ? userStore.userName : 'User')

  // Usar el composable del tema
  const { isDarkMode, toggleTheme } = useThemeToggle()

  const navItems = [
    {
      title: getUserTitle(),
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
  ]

  // Elementos para el menú de puntos (dots) en la versión móvil
  // Reorganizados para mantener exactamente el mismo orden que en el VToolbar
  const dotsItems = [
    // 1. Notificaciones
    {
      title: 'Notifications',
      icon: 'mdi-bell-outline',
      action: handleNotificationsClick
    },
    // 2. Tema (mismo que el botón de tema en la barra)
    {
      title: isDarkMode.value ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDarkMode.value ? 'mdi-weather-sunny' : 'mdi-weather-night',
      action: toggleTheme
    },
    // 3. Settings (configuración)
    {
      title: 'Settings',
      icon: 'mdi-cog-outline',
      children: [
        {
          title: 'Notification Settings',
          icon: 'mdi-bell-cog-outline',
          action: handleNotificationsSettingsClick
        }
      ]
    },
    // 4. Login/Logout
    {
      title: loginLogoutText,
      icon: loginLogoutIcon.value,
      action: handleLoginLogout
    }
  ]

  return { navItems, dotsItems }
}
