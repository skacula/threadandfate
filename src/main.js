import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'
import './style.css'
import { useAuthStore } from './stores/auth.js'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // Init auth BEFORE attaching the router so the navigation guard
  // sees the restored session on the very first navigation.
  const auth = useAuthStore()
  await auth.init()

  app.use(router)
  app.mount('#app')
}

bootstrap()
