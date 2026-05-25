import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import CharacterView from './views/CharacterView.vue'
import NewCharacter from './views/NewCharacter.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',               component: Home,          name: 'home' },
    { path: '/new',            component: NewCharacter,  name: 'new' },
    { path: '/character/:id',  component: CharacterView, name: 'character' },
  ]
})
