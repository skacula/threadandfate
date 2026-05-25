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
  app.use(router)

  // Restore session before the router guard runs
  const auth = useAuthStore()
  await auth.init()

  app.mount('#app')
}

bootstrap()
