<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useRouter } from 'vue-router'
import VActionButtons from './VActionButtons.vue'
import { useDisplay } from 'vuetify'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import VNotificationSettings from './VNotificationSettings.vue'
import VNotificationsList from './VNotificationsList.vue'

/************************************
 * Stores
 ************************************/
const dataStore = useDataStore() // Accesses the data store
const taskStore = useTaskStore() // Accesses the task store
const userStore = useUserStore() // Accesses the user store
const notificationsStore = useNotificationsStore() // Accesses the notifications store

/************************************
 * Router
 ************************************/
const router = useRouter() // Accesses the Vue Router

/************************************
 * Composables
 ************************************/
const rules = useMaxLengthRule() // Accesses validation rules

/************************************
 * Refs
 ************************************/
const drawer = ref(false) // Controls the navigation drawer
const drawerDots = ref(false) // Controls the dots menu drawer
const group = ref(null) // Tracks the selected group in the drawer
const dialogAddTask = ref(false) // Controls the add task dialog
const dialogAddProject = ref(false) // Controls the add project dialog
const showNotificationsList = ref(false) // Controls the notifications list dialog
const showNotificationsSettings = ref(false) // Controls the notifications settings dialog
const settingsMenu = ref(false) // Controls the settings menu
const form = ref(null) // Reference to the form
const menuStart = ref(false) // Controls the start time picker menu
const menuEnd = ref(false) // Controls the end time picker menu
const loginParagraph = ref(null) // Reference to the login paragraph

/************************************
 * Computed Properties
 ************************************/
const unreadNotificationsCount = computed(() => notificationsStore.unreadCount) // Calculates unread notifications count

const notificationTooltipText = computed(() => {
  // Generates tooltip text for notifications
  if (!userStore.isLoggedIn) return 'Sign in to view notifications'

  if (!notificationsStore.notificationSettings.enabled)
    return 'Notifications are disabled in settings'

  return unreadNotificationsCount.value === 0
    ? 'No unread notifications'
    : `${unreadNotificationsCount.value} unread notification${unreadNotificationsCount.value !== 1 ? 's' : ''}`
})

const tooltipText = computed(() => {
  // Generates tooltip text for the menu button
  return drawer.value ? 'Hide Menu' : 'Show Menu'
})

const loginLogoutIcon = computed(() => {
  // Determines the login/logout button icon
  return userStore.isLoggedIn ? 'mdi-account-check-outline' : 'mdi-account-arrow-right-outline'
})

const loginLogoutText = computed(() => {
  // Determines the login/logout button text
  return userStore.isLoggedIn ? 'Logout' : 'Login with Google'
})

const navItems = computed(() => [
  // Defines the navigation items
  {
    title: userStore.isLoggedIn ? userStore.userName : 'User', // Set the title based on login status
    value: 'user', // Value for the navigation item
    icon: userStore.isLoggedIn ? userStore.userProfilePicture : 'mdi-alpha-c-circle', // Set the icon based on login status
    color: 'blue-accent-4', // Color for the icon
    permission: 'user', // Permission required for this item
    function: () => {
      // Function to execute when the item is clicked
      if (userStore.isLoggedIn) {
        router.push({ name: 'profile', params: { userId: userStore.userId } }) // Navigate to the user's profile if logged in
      } else {
        // Show alert
        alert('Please log in to view your profile.')
        // Redirect the user to the login page or show a message
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

const dotsItems = computed(() => [
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
])

/************************************
 * Watchers
 ************************************/
watch(group, () => {
  // Watch for changes in the group variable
  // Closes the drawer when a group is selected
  drawer.value = false
})

watch(
  // Watcher para manejar cambios de autenticación
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      // Handles changes in user authentication status
      try {
        await notificationsStore.loadSettings() // Ya incluye la suscripción
      } catch (error) {
        console.error('Error loading notifications:', error)
        notificationsStore.showSnackbar = {
          show: true,
          message: 'Failed to load notifications'
        }
      }
    } else {
      notificationsStore.unsubscribe()
      notificationsStore.clearTimeouts()
      notificationsStore.clearNotifications()
    }
  },
  { immediate: true, flush: 'post' }
)

/************************************
 * Methods / Functions
 ************************************/
const handleLoginLogout = () => {
  // Handles login/logout actions
  if (userStore.isLoggedIn) {
    userStore.logOut() // Log out if user is logged in
  } else {
    router.push({ path: '/login' }) // Navigate to login if not logged in
  }
}

const openDialog = (value) => {
  // Define the openDialog function based on the value parameter
  // Check if the user is logged in before opening the "add task" dialog
  if (value === 'add task' && !userStore.isLoggedIn) {
    // Show alert
    alert('Please log in to add a task.')
    // Redirect to login:
    router.push({ path: '/login' })
    return // Stop further execution of the function
  }

  switch (value) {
    case 'add task':
      dialogAddTask.value = true
      break
    case 'add project':
      dialogAddProject.value = true
      break
    default:
      console.error('Invalid value, not found:', value)
      break
  }
}

const formatDate = (date) => {
  // Formats a date object into yyyy-mm-dd format
  if (!date) return null
  const d = new Date(date)
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  const year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

const createNewTask = async () => {
  // Define the createNewTask function
  try {
    // Format the start and end dates
    const formattedStartDate = formatDate(dataStore.newTask.startDate)
    const formattedEndDate = formatDate(dataStore.newTask.endDate)
    // Create a new object with the formatted dates
    const newTaskData = {
      ...dataStore.newTask,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }
    // Save the new task to Firestore
    await dataStore.createTask(newTaskData)
    // Reset the form
    form.value.reset()
    // Close the dialog
    dialogAddTask.value = false
    // Close the drawer
    drawer.value = false
  } catch (error) {
    console.error('Error creating task:', console.error)
    alert('An error ocurred while creating the task.')
  }
}

const reset = () => {
  // Resets the form
  form.value.reset()
  alert('Form has been reset')
}

const addNewProject = async () => {
  // Define the addNewProject function to create a new project
  try {
    await dataStore.createProject(dataStore.newProject)
    // Reset the form
    form.value.reset()
    // Close the dialog
    dialogAddProject.value = false
    // Close the drawer
    drawer.value = false
    // Optionally display a success message
    alert('Project ' + dataStore.newProject.title + ' added successfully!')
  } catch (error) {
    // Handle errors, e.g., display an error message
    console.error('Error adding project:', error)
    alert('An error occurred while adding the project.')
  }
}

const handleProjectClick = (project) => {
  // Handles the click on a project item in the navigation drawer.
  // Sets the selected project in the task store, fetches tasks for that project,
  // navigates to the project's task list, and closes the drawer.
  taskStore.setSelectedProject(project.title)
  taskStore.getTasksByProjectPaginated()
  router.push({ name: 'task-by-project', params: { projectName: project.title } })
  drawer.value = false
}

const handleNotificationsClick = async () => {
  // Handles the click on the notifications button.
  // Loads notifications from the store and toggles the notifications list visibility.
  try {
    await notificationsStore.loadNotifications()
    showNotificationsList.value = !showNotificationsList.value
  } catch (error) {
    console.error('Error loading notifications:', error)
    notificationsStore.showSnackbar = {
      show: true,
      message: 'Failed to load notifications'
    }
  }
}

// const handleSettingsClick = () => {
//   // Handles the click on the settings button
//   settingsMenu.value = !settingsMenu.value
// }

const handleNotificationsSettingsClick = () => {
  // Handles the click on the notifications settings
  showNotificationsSettings.value = true
}

const handleDotsClick = () => {
  // Handles the click on the dots button
  drawerDots.value = !drawerDots.value
}

/************************************
 * Vuetify Display
 ************************************/
const { xs, sm, smAndDown, smAndUp, mdAndDown, mdAndUp, mobile } = useDisplay() // Accesses display breakpoints from Vuetify

/************************************
 * Data
 ************************************/
const cruds = [
  // Defines the CRUD actions for projects
  {
    title: 'Add Project',
    value: 'add project',
    icon: 'mdi-plus',
    function: () => openDialog('add project')
  }
]

const btnsForm = [
  // Defines the buttons for the add task form
  {
    type: 'submit',
    height: '3rem',
    text: 'Add Task',
    icon: 'mdi-plus',
    function: createNewTask
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Reset Form',
    icon: 'mdi-refresh',
    function: reset
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Close',
    icon: 'mdi-close',
    function: () => (dialogAddTask.value = false)
  }
]

const btnsFormAddProject = [
  // Defines the buttons for the add project form
  {
    type: 'submit',
    height: '3rem',
    text: 'Add Project',
    icon: 'mdi-plus',
    function: addNewProject
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Reset Form',
    icon: 'mdi-refresh',
    function: reset
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Close',
    icon: 'mdi-close',
    function: () => (dialogAddProject.value = false)
  }
]

/************************************
 * Lifecycle Hooks
 ************************************/
onMounted(async () => {
  // Loads notification settings on mount
  if (userStore.isLoggedIn) {
    await notificationsStore.loadSettings()
  }
})
</script>

<template>
  <v-app-bar app flat color="red-darken-2" class="header">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer" aria-label="Menu" class="menu-btn">
      <v-icon class="menu-btn icon">mdi-menu</v-icon>
      <v-tooltip activator="parent" location="bottom" class="menu-btn tooltip">
        {{ tooltipText }}
      </v-tooltip>
    </v-app-bar-nav-icon>
    <v-btn router to="/" class="app-bar-title" color="transparent" aria-label="Home">
      <v-app-bar-title class="app-bar-title text-white">
        Todolist
        <v-icon color="white" class="app-bar-title icon"
          >mdi-checkbox-marked-circle-auto-outline</v-icon
        >
        <v-tooltip activator="parent" location="bottom" class="app-bar-title tooltip">
          Home
        </v-tooltip>
      </v-app-bar-title>
    </v-btn>
    <v-spacer></v-spacer>
    <template v-if="userStore.isLoggedIn">
      <v-avatar class="mr-2" size="24">
        <v-img
          v-if="userStore.userProfilePicture"
          :src="userStore.userProfilePicture"
          alt="Profile Picture"
          cover
          color="white"
        />
      </v-avatar>
      <span v-if="mdAndUp" class="text-white mr-2">{{ userStore.userName }}</span>
    </template>
    <template v-if="mdAndUp">
      <v-btn icon aria-label="Login/Logout" @click="handleLoginLogout" class="login-btn">
        <v-icon :icon="loginLogoutIcon" class="login-btn icon"></v-icon>
        <v-tooltip activator="parent" location="bottom" class="login-btn tooltip">
          {{ loginLogoutText }}
        </v-tooltip>
      </v-btn>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <div v-bind="props">
            <v-btn
              icon
              aria-label="Notifications"
              @click="handleNotificationsClick"
              :disabled="!userStore.isLoggedIn"
              class="notifications-btn"
            >
              <v-icon icon="mdi-bell-outline"></v-icon>
              <v-badge
                v-if="unreadNotificationsCount > 0"
                :content="unreadNotificationsCount"
                color="blue-accent-4"
                class="badge"
              />
            </v-btn>
          </div>
        </template>
        <span>{{ notificationTooltipText }}</span>
      </v-tooltip>
      <v-menu v-model="settingsMenu">
        <template v-slot:activator="{ props }">
          <v-btn icon aria-label="Settings" v-bind="props">
            <v-icon>mdi-cog-outline</v-icon>
            <v-tooltip activator="parent" location="bottom" class="settings-btn tooltip"
              >Settings</v-tooltip
            >
          </v-btn>
        </template>
        <v-list density="compact" class="pa-2">
          <v-list-item
            @click="handleNotificationsSettingsClick"
            :ripple="true"
            class="rounded-lg mb-2"
            rounded="pill"
            color="red-darken-2"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-bell-cog-outline" color="red-darken-2" class="mr-3"></v-icon>
            </template>

            <v-list-item-title class="font-weight-bold text-red-darken-2">
              Notification Settings
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              Manage your notification preferences
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-icon icon="mdi-chevron-right" color="grey-darken-1"></v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <template v-else>
      <v-btn icon="mdi-dots-vertical" variant="text" @click="handleDotsClick"></v-btn>
    </template>
  </v-app-bar>

  <VNotificationSettings v-model="showNotificationsSettings" />

  <VNotificationsList v-model="showNotificationsList" />

  <v-navigation-drawer
    v-model="drawer"
    :location="mobile ? 'bottom' : undefined"
    temporary
    class="navigation-drawer drawer"
    width="300"
  >
    <v-list nav class="navigation-drawer-list">
      <v-list-subheader class="subheader">MENU</v-list-subheader>
      <v-divider></v-divider>
      <v-list-item
        v-for="(item, i) in navItems"
        :key="i"
        :value="item.value"
        :title="item.title"
        class="item"
        nav
        @click="item.function"
      >
        <template v-slot:prepend>
          <v-icon v-if="i !== 0" :icon="item.icon" :color="item.color" class="icon"> </v-icon>

          <template v-if="i === 0">
            <v-icon
              v-if="!userStore.isLoggedIn"
              :icon="item.icon"
              :color="item.color"
              class="icon"
            ></v-icon>
            <v-avatar v-else class="mr-4" size="24">
              <v-img
                :src="userStore.userProfilePicture"
                alt="Profile Picture"
                cover
                color="white"
              />
            </v-avatar>
          </template>
        </template>
      </v-list-item>
      <v-list-item> </v-list-item>
      <v-list-subheader class="subheader">PROJECTS</v-list-subheader>
      <v-divider></v-divider>
      <template v-if="userStore.isLoggedIn">
        <v-list-group value="My Projects">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="My Projects">
              <template v-slot:prepend>
                <v-icon icon="mdi-folder" color="amber-accent-4" class="icon"></v-icon> </template
            ></v-list-item>
          </template>
          <v-list-item
            v-for="(project, i) in dataStore.projects"
            :key="i"
            :prepend-icon="project.icon"
            :value="project.title"
            :title="project.title"
            @click="handleProjectClick(project)"
          >
          </v-list-item>
          <v-list-group value="Actions">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" title="Actions">
                <template v-slot:prepend>
                  <v-icon icon="mdi-cogs" color="amber-accent-3" class="icon"></v-icon> </template
              ></v-list-item>
            </template>
            <v-list-item
              v-for="(item, i) in cruds"
              :key="i"
              :prepend-icon="item.icon"
              :value="item.title"
              :title="item.title"
              @click="openDialog(item.value)"
            >
            </v-list-item>
          </v-list-group>
        </v-list-group>
      </template>
      <template v-else>
        <div class="pa-3">
          <p ref="loginParagraph" class="login-paragraph">
            Log in to see your projects
            <v-tooltip text="Login with Google" location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon
                  v-bind="props"
                  class="ml-4 rounded-pill"
                  color="red-darken-2"
                  @click="handleLoginLogout"
                  >mdi-account-arrow-right</v-icon
                >
              </template>
            </v-tooltip>
          </p>
        </div>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-dialog
    v-model="dialogAddTask"
    :max-width="xs ? '100vw' : smAndUp ? '600px' : mdAndDown ? '800px' : '1000px'"
    class="dialog dialog-create-task"
  >
    <v-card class="card card-create-task pa-4">
      <v-card-title class="card-title card-title-create-task" :class="mobile ? 'px-1' : ''">
        <span class="text-h6">Add new task</span>
      </v-card-title>
      <v-card-text :class="mobile ? 'px-0' : ''">
        <v-form class="form form-create-task" ref="form" @submit.prevent>
          <v-text-field
            v-model="dataStore.newTask.title"
            label="Title"
            placeholder="Enter title"
            prepend-inner-icon="mdi-format-title"
            type="text"
            variant="plain"
            color="red-darken-2"
            :rules="rules"
            counter
            clearable
            required
          ></v-text-field>
          <v-divider class="mb-4"></v-divider>
          <v-textarea
            v-model="dataStore.newTask.description"
            label="Description"
            placeholder="Enter description"
            prepend-inner-icon="mdi-text"
            type="text"
            variant="plain"
            color="red-darken-2"
            required
            counter
            :rules="rules"
            clearable
          ></v-textarea>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newTask.project"
            label="Project"
            prepend-inner-icon="mdi-folder-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.projects"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newTask.label"
            label="Label"
            prepend-inner-icon="mdi-label-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.labels"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newTask.priority"
            label="Priority"
            prepend-inner-icon="mdi-alert-circle-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.priorities"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newTask.status"
            label="Status"
            prepend-inner-icon="mdi-checkbox-marked-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.statuses"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-date-input
            v-model="dataStore.newTask.startDate"
            label="Start Date"
            required
            clearable
            variant="plain"
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            color="red-darken-2"
            class="date-create-task"
          >
          </v-date-input>
          <v-divider class="mb-4"></v-divider>
          <v-date-input
            v-model="dataStore.newTask.endDate"
            label="Due Date"
            required
            clearable
            variant="plain"
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            color="red-darken-2"
            class="date-create-task"
          >
          </v-date-input>
          <v-divider class="mb-4"></v-divider>
          <v-text-field
            v-model="dataStore.newTask.startDateHour"
            label="Start Hour"
            placeholder="hh:mm"
            prepend-inner-icon="mdi-clock-time-four-outline"
            variant="plain"
            readonly
            clearable
            :active="menuStart"
            :focused="menuStart"
            color="red-darken-2"
            @click="menuStart = true"
          >
            <v-menu
              v-model="menuStart"
              :close-on-content-click="false"
              activator="parent"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <v-time-picker
                v-if="menuStart"
                v-model="dataStore.newTask.startDateHour"
                format="24hr"
                full-width
                color="red-darken-2"
                scrollable
                required
                class="time-create-task justify-center w-100"
                :class="xs ? 'px-0' : ''"
                @click:minute="$nextTick(() => (menuStart = false))"
              ></v-time-picker>
            </v-menu>
          </v-text-field>
          <v-divider class="mb-4"></v-divider>
          <v-text-field
            v-model="dataStore.newTask.endDateHour"
            label="Due Hour"
            placeholder="hh:mm"
            prepend-inner-icon="mdi-clock-time-four-outline"
            variant="plain"
            readonly
            clearable
            :active="menuEnd"
            :focused="menuEnd"
            @click="menuEnd = true"
          >
            <v-menu
              v-model="menuEnd"
              :close-on-content-click="false"
              activator="parent"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <v-time-picker
                v-if="menuEnd"
                v-model="dataStore.newTask.endDateHour"
                format="24hr"
                full-width
                color="red-darken-2"
                scrollable
                required
                class="time-create-task justify-center w-100"
                :class="xs ? 'px-0' : ''"
                @click:minute="$nextTick(() => (menuEnd = false))"
              ></v-time-picker>
            </v-menu>
          </v-text-field>
          <v-divider class="mb-4"></v-divider>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-center">
        <VActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog
    v-model="dialogAddProject"
    :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
    class="dialog dialog-add-project"
  >
    <v-card class="card card-add-project pa-4">
      <v-card-title class="card-title card-title-add-project">
        <span class="text-h6">Add new project</span>
      </v-card-title>
      <v-card-text>
        <v-form class="form form-add-project" ref="form" @submit.prevent="addNewProject">
          <v-select
            v-model="dataStore.newProject.title"
            label="Project Title"
            prepend-inner-icon="mdi-format-title"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.projectTemplates"
          ></v-select>
          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newProject.icon"
            label="Project Icon"
            prepend-inner-icon="mdi-symbol"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.icons"
            item-title="displayName"
            item-value="title"
          >
            <template v-slot:selection="{ item }">
              <v-icon class="mr-2">{{ item.value }}</v-icon>
              {{ item.title }}
            </template>

            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon>{{ item.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-divider class="mb-4"></v-divider>
          <v-select
            v-model="dataStore.newProject.color"
            label="Project Color"
            prepend-inner-icon="mdi-palette-outline"
            variant="plain"
            color="red-darken-2"
            clearable
            required
            :items="dataStore.colors"
          ></v-select>
        </v-form>
      </v-card-text>

      <v-card-actions
        :class="
          smAndDown ? 'd-flex flex-column align-center' : 'd-flex flex-wrap justify-space-around'
        "
      >
        <v-btn
          v-for="(btn, i) in btnsFormAddProject"
          :key="i"
          :type="btn.type"
          :text="btn.text"
          :class="smAndDown ? 'mb-3' : 'mb-3 mr-3'"
          :style="{ marginInlineStart: '0' }"
          :width="sm ? '66%' : '10rem'"
          :height="btn.height"
          :block="xs"
          :prepend-icon="btn.icon"
          variant="tonal"
          size="large"
          rounded
          class="text-none"
          color="red-darken-2"
          @click="btn.function"
        >
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-navigation-drawer
    v-model="drawerDots"
    temporary
    location="right"
    :width="360"
    class="navigation-drawer drawer-dots"
  >
    <v-list>
      <template v-for="item in dotsItems" :key="item.title">
        <!-- Items without children (single items) -->
        <v-list-item v-if="!item.children" @click="item.action">
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          {{ item.title }}
        </v-list-item>

        <!-- Items with children (groups) -->
        <v-list-group v-else>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              {{ item.title }}
            </v-list-item>
          </template>

          <!-- Sub-items within the group -->
          <v-list-item v-for="child in item.children" :key="child.title" @click="child.action">
            <template v-slot:prepend>
              <v-icon :icon="child.icon"></v-icon>
            </template>
            {{ child.title }}
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.notification-list-card {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
