import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import Home from './views/Home.vue'
import CharacterView from './views/CharacterView.vue'
import NewCharacter from './views/NewCharacter.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login',         component: () => import('./views/Login.vue'),       name: 'login' },
    { path: '/share/:token',  component: () => import('./views/ShareView.vue'),   name: 'share' },
    { path: '/',              component: Home,          name: 'home',      meta: { requiresAuth: true } },
    { path: '/new',           component: NewCharacter,  name: 'new',       meta: { requiresAuth: true } },
    { path: '/character/:id', component: CharacterView, name: 'character', meta: { requiresAuth: true } },
    {
      path: '/gm',
      component: () => import('./views/GmDashboard.vue'),
      name: 'gm',
      meta: { requiresAuth: true, requiresGM: true }
    },
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) return { name: 'login' }
  if (to.name === 'login' && auth.user) return { name: 'home' }
  if (to.meta.requiresGM && !auth.isGM) return { name: 'home' }
})

export default router
