<script setup>
import { ref, watch, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSubmitNewTask } from '@/composables/useSubmitNewTask'
import { useFormBtnActions } from '@/composables/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/validationFormRules.js'
import { useResetForm } from '@/composables/useResetForm'
import { getEmptyTask } from '@/composables/useTaskHelpers'
import { useDialogCleanup } from '@/composables/useDialogCleanup'
import { useAddNewProject } from '@/composables/useAddNewProject'
import { useToolbarNav } from '@/composables/useToolbarNav'
import { useDataInitialization } from '@/composables/useDataInitialization'
import VActionButtons from './VActionButtons.vue'
import VNotificationSettings from './VNotificationSettings.vue'
import VNotificationsList from './VNotificationsList.vue'
import VTaskForm from './VTaskForm.vue'
import VProjectForm from './VProjectForm.vue'
import VBaseSnackbar from './VBaseSnackbar.vue'

/************************************
 * Stores
 ************************************/
const dataStore = useDataStore() // Accesses the data store
const projectStore = useProjectStore() // Accesses the project store
const taskStore = useTaskStore() // Accesses the task store
const userStore = useUserStore() // Accesses the user store
const notificationsStore = useNotificationsStore() // Accesses the notifications store

const { submitNewTask } = useSubmitNewTask() // Accesses the submitNewTask function

/************************************
 * Router
 ************************************/
const router = useRouter() // Accesses the Vue Router

/************************************
 * Composables
 ************************************/
const rules = useMaxLengthRule() // Accesses validation rules

const { initializeData, cleanup } = useDataInitialization()

/************************************
 * Refs
 ************************************/
const loginParagraph = ref(null) // Reference to the login paragraph

const dialogAddTask = ref(false)
const dialogAddProject = ref(false)
const dialogNotificationsList = ref(false)
const dialogNotificationsSettings = ref(false)

const forms = reactive({
  addTask: null,
  addProject: null
})
const menus = reactive({
  drawer: false,
  drawerDots: false,
  settings: false,
  group: null
})
const snackbarGroup = reactive({
  show: false,
  message: '',
  color: '',
  icon: ''
})

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
  return menus.drawer ? 'Hide Menu' : 'Show Menu'
})

const loginLogoutIcon = computed(() => {
  // Determines the login/logout button icon
  return userStore.isLoggedIn ? 'mdi-account-check-outline' : 'mdi-account-arrow-right-outline'
})

const loginLogoutText = computed(() => {
  // Determines the login/logout button text
  return userStore.isLoggedIn ? 'Logout' : 'Login with Google'
})

/************************************
 * Watchers
 ************************************/
watch(
  () => menus.group,
  () => {
    // Watch for changes in the group variable
    // Closes the drawer when a group is selected
    menus.drawer = false
  }
)

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

watch(
  () => projectStore.selectedProject, // Esto es un string: el título del proyecto seleccionado
  (newProjectTitle) => {
    if (dialogAddTask.value) {
      // Buscar el objeto de proyecto por título
      const newProject = projectStore.projects.find((p) => p.title === newProjectTitle)
      // 1. Si el proyecto ya no existe, cierra el diálogo y muestra mensaje
      if (!newProject) {
        dialogAddTask.value = false
        showSnackbar(
          'El proyecto seleccionado ya no existe. El formulario se ha cerrado para evitar inconsistencias.',
          'warning',
          'mdi-alert'
        )
        return
      }
      // 2. Si el proyecto cambió, resetea el formulario y actualiza el campo projectId
      if (forms.addTask && forms.addTask.reset) {
        forms.addTask.reset()
      }
      if (taskStore.newTask) {
        taskStore.newTask.projectId = newProject.id
      }
      showSnackbar(
        'El proyecto ha cambiado. El formulario se ha actualizado para reflejar el nuevo contexto.',
        'info',
        'mdi-information'
      )
    }
  }
)

/************************************
 * Methods / Functions
 ************************************/
const showSnackbar = (message, color, icon) => {
  snackbarGroup.message = message
  snackbarGroup.color = color
  snackbarGroup.icon = icon
  snackbarGroup.show = true
}

const handleLoginLogout = () => {
  // Handles login/logout actions
  if (userStore.isLoggedIn) {
    userStore.logOut() // Log out if user is logged in
  } else {
    router.push({ path: '/login' }) // Navigate to login if not logged in
  }
}

const openDialog = (value) => {
  if (value === 'add task' && !userStore.isLoggedIn) {
    showSnackbar('Please log in to add a task.', 'info', 'mdi-account-arrow-right')
    router.push({ path: '/login' })
    return
  }
  switch (value) {
    case 'add task': {
      const currentProject = projectStore.projects.find(
        (p) => p.title === taskStore.selectedProjectTitle
      )
      taskStore.newTask = getEmptyTask(currentProject)
      dialogAddTask.value = true
      break
    }
    case 'add project':
      dialogAddProject.value = true
      break
    default:
      console.error('Invalid value, not found:', value)
      break
  }
}

const { reset: resetAddTaskForm } = useResetForm(
  forms.addTask,
  'Add Task Form has been reset',
  'success',
  'mdi-refresh'
)

const { reset: resetAddProjectFormFn } = useResetForm(
  forms.addProject,
  'Add Project Form has been reset',
  'success',
  'mdi-refresh'
)

const { addNewProject } = useAddNewProject(resetAddProjectFormFn, dialogAddProject, menus.drawer)

const handleProjectClick = async (project) => {
  // Selecciona el proyecto en el store de tareas
  taskStore.setSelectedProject(project.id)
  // Carga la primera página de tareas filtradas por ese proyecto
  // taskStore.fetchTasks('first')
  // Navega a la vista de tareas por proyecto (ajusta el nombre de la ruta si es necesario)
  router.push({ name: 'task-by-project', params: { projectName: project.title } })
  // Cierra el drawer
  menus.drawer = false
}

const handleNotificationsClick = async () => {
  // Handles the click on the notifications button.
  // Loads notifications from the store and toggles the notifications list visibility.
  try {
    await notificationsStore.loadNotifications()
    dialogNotificationsList.value = !dialogNotificationsList.value
  } catch (error) {
    console.error('Error loading notifications:', error)
    notificationsStore.showSnackbar = {
      show: true,
      message: 'Failed to load notifications'
    }
  }
}

const handleNotificationsSettingsClick = () => {
  // Handles the click on the notifications settings
  dialogNotificationsSettings.value = true
}

const handleDotsClick = () => {
  // Handles the click on the dots button
  menus.drawerDots = !menus.drawerDots
}

const handleInvalidProject = () => {
  showSnackbar(
    'El proyecto seleccionado ya no existe o es inválido. El formulario se ha actualizado.',
    'warning',
    'mdi-alert'
  )
  // Opcional: dialogAddTask.value = false // para cerrar el diálogo si prefieres
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

const { btnsForm } = useFormBtnActions(
  submitNewTask,
  resetAddTaskForm,
  () => (dialogAddTask.value = false)
)

// Configure the submit button for creating a new task
btnsForm[0].text = 'Create Task' // Set the text for the submit button
btnsForm[0].icon = 'mdi-plus' // Set the icon for the submit button

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
    function: resetAddProjectFormFn
  },
  {
    type: 'button',
    height: '3rem',
    text: 'Close',
    icon: 'mdi-close',
    function: () => (dialogAddProject.value = false)
  }
]

const { navItems, dotsItems } = useToolbarNav({
  userStore,
  router,
  showSnackbar,
  openDialog,
  handleLoginLogout,
  handleNotificationsClick,
  handleNotificationsSettingsClick,
  loginLogoutText,
  loginLogoutIcon
})

/************************************
 * Lifecycle Hooks
 ************************************/
onMounted(() => {
  initializeData()
  // Loads notification settings on mount
  if (userStore.isLoggedIn) {
    notificationsStore.loadSettings()
  }
})

onUnmounted(() => {
  cleanup()
})

// Corrige: pasar el ref directamente, no una función
useDialogCleanup(dialogAddTask, () => {
  if (forms.addTask) forms.addTask.reset()
  taskStore.newTask = getEmptyTask()
})

useDialogCleanup(dialogAddProject, () => {
  if (forms.addProject) forms.addProject.reset()
  // Lógica adicional si es necesario para resetear el proyecto
})

const getTooltipTextForSnackbarIcon = (iconName) => {
  switch (iconName) {
    case 'mdi-account-arrow-right':
      return 'Log in to proceed'
    // Add more cases for other icons if needed
    default:
      return ''
  }
}
</script>

<template>
  <v-app-bar app flat color="red-darken-2" class="header">
    <v-btn
      icon
      aria-label="Open main menu"
      @click.stop="menus.drawer = !menus.drawer"
      class="menu-btn"
    >
      <v-icon class="menu-btn icon">mdi-menu</v-icon>
      <v-tooltip activator="parent" location="bottom" class="menu-btn tooltip">
        {{ tooltipText }}
      </v-tooltip>
    </v-btn>
    <v-btn router to="/" class="app-bar-title" color="transparent" aria-label="Go to home page">
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
      <v-btn icon aria-label="Login or Logout" @click="handleLoginLogout" class="login-btn">
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
              aria-label="Open notifications"
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
      <v-menu v-model="menus.settings">
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
      <v-btn
        icon="mdi-dots-vertical"
        variant="text"
        aria-label="Open more options"
        @click="handleDotsClick"
      ></v-btn>
    </template>
  </v-app-bar>

  <VNotificationSettings v-model="dialogNotificationsSettings" />

  <VNotificationsList v-model="dialogNotificationsList" />

  <v-navigation-drawer
    v-model="menus.drawer"
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
                <v-icon icon="mdi-folder" color="amber-accent-4" class="icon"></v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list-item
            v-for="(project, i) in projectStore.projects"
            :key="i"
            :prepend-icon="project.icon"
            :value="project.title"
            :title="project.title"
            @click="handleProjectClick(project)"
          >
            <template v-slot:prepend>
              <v-icon :color="project.color">{{ project.icon }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item v-if="!projectStore.projects.length">
            <v-list-item-title>No projects yet</v-list-item-title>
          </v-list-item>
          <v-list-group value="Actions">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" title="Actions">
                <template v-slot:prepend>
                  <v-icon icon="mdi-cogs" color="amber-accent-3" class="icon"></v-icon>
                </template>
              </v-list-item>
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
      <v-card-text :class="mobile ? 'px-0' : ''" max-height="70vh" scrollable>
        <VTaskForm
          v-model="taskStore.newTask"
          :projects="projectStore.projects"
          :labels="dataStore.labels"
          :priorities="dataStore.priorities"
          :statuses="dataStore.statuses"
          :rules="rules"
          ref="forms.addTask"
          @submit="submitNewTask"
          @invalid-project="handleInvalidProject"
        >
        </VTaskForm>
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
        <VProjectForm
          v-model="projectStore.newProject"
          :projectTemplates="dataStore.projectTemplates"
          :icons="dataStore.icons"
          :colors="dataStore.colors"
          ref="forms.addProject"
          @submit="addNewProject"
        ></VProjectForm>
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
          class="text-none text-button"
          color="red-darken-2"
          @click="btn.function"
        >
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-navigation-drawer
    v-model="menus.drawerDots"
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

  <VBaseSnackbar
    v-model="snackbarGroup.show"
    :message="snackbarGroup.message"
    :color="snackbarGroup.color"
    :append-icon="snackbarGroup.icon"
    :append-icon-tooltip-text="
      snackbarGroup.icon ? getTooltipTextForSnackbarIcon(snackbarGroup.icon) : ''
    "
  >
  </VBaseSnackbar>
</template>

<style scoped>
.notification-list-card {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
