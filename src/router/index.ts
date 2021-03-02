import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

Vue.use(VueRouter)

export const routes: Array<RouteConfig> = [
  {
    path: '/guiedit',
    name: 'GuiEditor',
    component: () => import('@/views/GuiEditor')
  },
  {
    path: '/project/:project_code/:page_code',
    name: 'Home',
    component: () => import('@/views/Home'),
    props: route => ({
      history: route.path
    })
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
