import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useUserStore } from '../stores/userStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/task/:taskId',
      name: 'task-detail',
      component: () => import('../views/TaskDetailView.vue'),
      props: true
    },
    {
      path: '/project/:projectId',
      name: 'task-by-project',
      component: () => import('../views/TasksByProjectView.vue'),
      props: true
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      props: true
    },
    {
      path: '/filter-and-labels',
      name: 'filter-and-labels',
      component: () => import('../views/FilterAndLabelsView.vue'),
      props: true
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/profile/:userId',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'not-found',
    //   component: () => import('../views/NotFoundView.vue')
    // }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const userStore = useUserStore() // Access the user store

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // Route requires authentication and user is not logged in
    next('/login') // Redirect to login page
  } else {
    // Route doesn't require authentication or user is logged in
    next() // Proceed to the requested route
  }
})

export default router
