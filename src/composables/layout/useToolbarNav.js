// src/composables/useToolbarNav.js
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

  const dotsItems = [
    {
      title: 'Notifications',
      icon: 'mdi-bell-outline',
      action: handleNotificationsClick
    },
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
    {
      title: loginLogoutText.value,
      icon: loginLogoutIcon.value,
      action: handleLoginLogout
    }
  ]

  return { navItems, dotsItems }
}
