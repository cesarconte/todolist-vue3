<script setup>
import { ref, watch, computed, onMounted, reactive } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { useProjectStore } from '@/stores/projectStore.js'
import { useTaskStore } from '@/stores/taskStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useSubmitNewTask } from '@/composables/forms/useSubmitNewTask'
import { useFormBtnActions } from '@/composables/forms/useFormBtnActions'
import { useMaxLengthRule } from '@/composables/forms/validationFormRules.js'
import { useResetForm } from '@/composables/forms/useResetForm'
import { getEmptyTask, getEmptyProject } from '@/composables/tasks/useTaskHelpers'
import { useDialogCleanup } from '@/composables/ui/useDialogCleanup'
import { useAddNewProject } from '@/composables/projects/useAddNewProject'
import { useToolbarNav } from '@/composables/layout/useToolbarNav'
import useThemeToggle from '@/composables/ui/useThemeToggle' // Importar el composable para alternar el tema
import VActionButtons from '@/components/tasks/VActionButtons.vue'
import VNotificationSettings from '@/components/notifications/VNotificationSettings.vue'
import VNotificationsList from '@/components/notifications/VNotificationsList.vue'
import VTaskForm from '@/components/tasks/VTaskForm.vue'
import VProjectForm from '@/components/projects/VProjectForm.vue'
import VBaseSnackbar from '@/components/notifications/VBaseSnackbar.vue'

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

/************************************
 * Refs
 ************************************/
const loginParagraph = ref(null) // Reference to the login paragraph

const dialogAddTask = ref(false)
const dialogAddProject = ref(false)
const dialogNotificationsList = ref(false)
const dialogNotificationsSettings = ref(false)

const forms = reactive({
  addTask: ref(null),
  addProject: ref(null)
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
  if (!userStore.isLoggedIn) return 'Sign in to view notifications'
  if (!notificationsStore.notificationSettings.enabled) return 'Notifications are disabled'
  if (unreadNotificationsCount.value > 0)
    return `${unreadNotificationsCount.value} unread notification${unreadNotificationsCount.value !== 1 ? 's' : ''}`
  return 'Notifications enabled'
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
        showSnackbar('Failed to load notifications', 'error', 'mdi-alert')
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
  () => projectStore.selectedProjectId, // Ahora observamos el id del proyecto seleccionado
  (newProjectId) => {
    if (dialogAddTask.value) {
      // Buscar el objeto de proyecto por id
      const newProject = projectStore.projects.find((p) => p.id === newProjectId)
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

const resetNewTaskFormState = () => {
  // Limpia el modelo reactivo de la nueva tarea
  Object.assign(taskStore.newTask, getEmptyTask())
}

const { reset: resetAddTaskForm } = useResetForm(
  forms.addTask,
  'Add Task Form has been reset',
  'info',
  'mdi-information',
  resetNewTaskFormState
)

const { reset: resetAddProjectFormUnified } = useResetForm(
  forms.addProject,
  'Add Project Form has been reset',
  'info',
  'mdi-information',
  () => {
    projectStore.newProject = getEmptyProject()
  }
)

// Pass a function to close the drawer instead of the ref itself
const { addNewProject } = useAddNewProject(resetAddProjectFormUnified, dialogAddProject, () => {
  menus.drawer = false
})

// Changed parameter from project object to projectId string
const handleProjectClick = async (projectId) => {
  // Selecciona el proyecto en el store de tareas usando el ID
  taskStore.setSelectedProject(projectId)
  // Carga la primera página de tareas filtradas por ese proyecto (si es necesario, descomentar)
  // taskStore.fetchTasks('first')
  // Navega a la vista de tareas por proyecto usando projectId
  router.push({ name: 'task-by-project', params: { projectId: projectId } })
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
    showSnackbar('Failed to load notifications', 'error', 'mdi-alert')
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
const { xs, smAndUp, mdAndDown, mdAndUp, mobile } = useDisplay() // Accesses display breakpoints from Vuetify

/************************************
 * Theme Toggle
 ************************************/
const { isDarkMode, toggleTheme } = useThemeToggle() // Usando el composable

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

// Configure the submit button for creating a new task - note index [2] is for Submit in new order
btnsForm[2].text = 'Create Task' // Botón primario de confirmación (ahora en índice 2)
btnsForm[2].icon = 'mdi-plus-circle' // Icono más distintivo para crear, consistente con Add Project

const btnsFormAddProject = [
  // Según MD3, los botones en diálogos deben organizarse en este orden:
  // Cancelación (menos prominente) -> Acción secundaria -> Acción primaria (más prominente)
  {
    type: 'button',
    height: '2.5rem',
    text: 'Cancel',
    icon: 'mdi-close',
    function: () => (dialogAddProject.value = false),
    color: 'on-surface-variant', // Color neutro para cancelación (MD3)
    variant: 'text' // Variante menos prominente para cancelación (MD3)
  },
  {
    type: 'button',
    height: '2.5rem',
    text: 'Reset',
    icon: 'mdi-refresh',
    function: resetAddProjectFormUnified,
    color: 'secondary', // Color secundario para acción alternativa (MD3)
    variant: 'tonal' // Variante intermedia para acción secundaria (MD3)
  },
  {
    type: 'submit',
    height: '2.5rem',
    text: 'Create Project', // Texto más claro y consistente (MD3)
    icon: 'mdi-plus-circle', // Icono más distintivo para crear (MD3)
    function: addNewProject,
    color: 'primary', // Color primario para acción principal (MD3)
    variant: 'elevated' // La variante más prominente para acción principal (MD3)
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
  // Loads notification settings on mount
  if (userStore.isLoggedIn) {
    notificationsStore.loadSettings()
  }
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
  <v-app-bar app flat color="primary" class="header" elevation="2">
    <v-btn
      icon
      aria-label="Open main menu"
      @click.stop="menus.drawer = !menus.drawer"
      class="menu-btn"
      color="on-primary"
    >
      <v-icon class="menu-btn icon">mdi-menu</v-icon>
      <v-tooltip activator="parent" location="bottom" class="menu-btn tooltip">
        {{ tooltipText }}
      </v-tooltip>
    </v-btn>

    <v-sheet
      @click="$router.push('/')"
      class="d-flex align-center cursor-pointer"
      aria-label="Go to home page"
      role="button"
      tabindex="0"
      @keyup.enter="$router.push('/')"
      @keyup.space="$router.push('/')"
      color="transparent"
      rounded="0"
      elevation="0"
    >
      <v-app-bar-title class="text-on-primary">
        <h1 class="text-h6 font-weight-medium d-flex align-center mb-0">
          Todolist
          <v-icon color="on-primary" class="app-bar-title icon ml-1"
            >mdi-checkbox-marked-circle-auto-outline</v-icon
          >
        </h1>
        <v-tooltip activator="parent" location="bottom"> Home </v-tooltip>
      </v-app-bar-title>
    </v-sheet>

    <v-spacer></v-spacer>
    <template v-if="userStore.isLoggedIn">
      <v-avatar class="mr-2" size="24">
        <v-img
          v-if="userStore.userProfilePicture"
          :src="userStore.userProfilePicture"
          alt="Profile Picture"
          cover
        />
        <v-icon v-if="!userStore.userProfilePicture" color="on-primary">mdi-account-circle</v-icon>
      </v-avatar>
      <span v-if="mdAndUp" class="text-on-primary mr-2">{{ userStore.userName }}</span>
    </template>
    <template v-if="mdAndUp">
      <!-- Botón para alternar entre modo claro y oscuro -->
      <v-btn
        icon
        aria-label="Toggle dark/light mode"
        @click="toggleTheme"
        color="on-primary"
        class="mr-2"
      >
        <v-icon>{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ isDarkMode ? 'Switch to light mode' : 'Switch to dark mode' }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        aria-label="Login or Logout"
        @click="handleLoginLogout"
        class="login-btn"
        color="on-primary"
      >
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
              :disabled="!userStore.isLoggedIn || !notificationsStore.notificationSettings.enabled"
              class="notifications-btn"
              color="on-primary"
            >
              <template v-if="notificationsStore.notificationSettings.enabled">
                <v-badge
                  :dot="unreadNotificationsCount === 0"
                  :content="unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined"
                  :color="unreadNotificationsCount > 0 ? 'error' : 'inverse-primary'"
                  overlap
                >
                  <v-icon icon="mdi-bell-outline" color="on-primary"></v-icon>
                </v-badge>
              </template>
              <template v-else>
                <v-icon icon="mdi-bell-off-outline" color="on-primary"></v-icon>
              </template>
            </v-btn>
          </div>
        </template>
        <span>{{ notificationTooltipText }}</span>
      </v-tooltip>
      <v-menu v-model="menus.settings">
        <template v-slot:activator="{ props }">
          <v-btn icon aria-label="Settings" v-bind="props" color="on-primary">
            <v-icon>mdi-cog-outline</v-icon>
            <v-tooltip activator="parent" location="bottom" class="settings-btn tooltip"
              >Settings</v-tooltip
            >
          </v-btn>
        </template>
        <v-list density="compact" class="pa-2" bg-color="surface">
          <v-list-item
            @click="handleNotificationsSettingsClick"
            :ripple="true"
            class="rounded-lg mb-2"
            rounded="pill"
            color="primary"
            base-color="on-surface"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-bell-cog-outline" class="mr-3"></v-icon>
            </template>

            <v-list-item-title class="font-weight-bold"> Notification Settings </v-list-item-title>

            <v-list-item-subtitle class="text-caption text-on-surface-variant">
              Manage your notification preferences
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-icon icon="mdi-chevron-right" color="on-surface-variant"></v-icon>
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
        color="on-primary"
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
    color="surface"
  >
    <v-list nav class="navigation-drawer-list" density="compact">
      <v-list-subheader class="subheader text-on-surface-variant">MENU</v-list-subheader>
      <v-divider></v-divider>
      <v-list-item
        v-for="(item, i) in navItems"
        :key="i"
        :value="item.value"
        :title="i === 0 && userStore.isLoggedIn ? userStore.userName : item.title"
        class="item"
        nav
        @click="item.function"
        rounded="lg"
        color="primary"
        base-color="on-surface"
      >
        <template v-slot:prepend>
          <v-icon v-if="i !== 0" :icon="item.icon" class="icon"> </v-icon>

          <template v-if="i === 0">
            <v-icon v-if="!userStore.isLoggedIn" :icon="item.icon" class="icon"></v-icon>
            <v-avatar v-else class="mr-4" size="24">
              <v-img
                v-if="userStore.userProfilePicture"
                :src="userStore.userProfilePicture"
                alt="Profile Picture"
                cover
              />
              <v-icon v-if="!userStore.userProfilePicture" color="on-surface"
                >mdi-account-circle</v-icon
              >
            </v-avatar>
          </template>
        </template>
      </v-list-item>
      <v-list-item> </v-list-item>
      <v-list-subheader class="subheader text-on-surface-variant">PROJECTS</v-list-subheader>
      <v-divider></v-divider>
      <template v-if="userStore.isLoggedIn">
        <v-list-group value="My Projects">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="My Projects" rounded="lg" base-color="on-surface">
              <template v-slot:prepend>
                <v-icon icon="mdi-folder" color="primary" class="icon"></v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list-item
            v-for="(project, i) in projectStore.projects"
            :key="i"
            :value="project.id"
            @click="handleProjectClick(project.id)"
            link
            class="item project-item"
            rounded="lg"
            color="primary"
            base-color="on-surface"
          >
            <template v-slot:prepend>
              <v-icon :icon="project.icon" :color="project.color || 'primary'"></v-icon>
            </template>
            <v-list-item-title>{{ project.title }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="!projectStore.projects.length" base-color="on-surface-variant">
            <v-list-item-title>No projects yet</v-list-item-title>
          </v-list-item>
          <v-list-group value="Actions">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" title="Actions" rounded="lg" base-color="on-surface">
                <template v-slot:prepend>
                  <v-icon icon="mdi-cogs" class="icon"></v-icon>
                </template>
              </v-list-item>
            </template>
            <v-list-item
              v-for="(item, i) in cruds"
              :key="i"
              :value="item.title"
              :title="item.title"
              @click="openDialog(item.value)"
              rounded="lg"
              color="primary"
              base-color="on-surface"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
            </v-list-item>
          </v-list-group>
        </v-list-group>
      </template>
      <template v-else>
        <div class="pa-3">
          <p ref="loginParagraph" class="login-paragraph text-on-surface-variant">
            Log in to see your projects
            <v-tooltip text="Login with Google" location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon
                  v-bind="props"
                  class="ml-4 rounded-pill"
                  color="primary"
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
    scrollable
  >
    <v-card class="card card-create-task pa-4" color="surface">
      <v-card-title
        class="card-title card-title-create-task text-on-surface"
        :class="mobile ? 'px-1' : ''"
      >
        <span class="text-h6">Add new task</span>
      </v-card-title>
      <v-card-text :class="mobile ? 'px-0' : ''">
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
      <v-card-actions class="justify-end px-4 pb-4">
        <VActionButtons :buttons="btnsForm" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog
    v-model="dialogAddProject"
    :max-width="xs ? '100vw' : smAndUp ? '600px' : ''"
    class="dialog dialog-add-project"
    scrollable
  >
    <v-card class="card card-add-project pa-4" color="surface">
      <v-card-title class="card-title card-title-add-project text-on-surface">
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

      <v-card-actions class="justify-end px-4 pb-4">
        <VActionButtons :buttons="btnsFormAddProject" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-navigation-drawer
    v-model="menus.drawerDots"
    temporary
    location="right"
    :width="360"
    class="navigation-drawer drawer-dots"
    color="surface"
  >
    <v-list density="compact" base-color="on-surface">
      <template v-for="item in dotsItems" :key="item.title">
        <!-- Items without children (single items) -->
        <v-list-item v-if="!item.children" @click="item.action" rounded="lg" color="primary">
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          {{ item.title }}
        </v-list-item>

        <!-- Items with children (groups) -->
        <v-list-group v-else>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" rounded="lg">
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              {{ item.title }}
            </v-list-item>
          </template>

          <!-- Sub-items within the group -->
          <v-list-item
            v-for="child in item.children"
            :key="child.title"
            @click="child.action"
            rounded="lg"
            color="primary"
          >
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

<style scoped></style>
