import { createRouter, createWebHistory  } from 'vue-router';

export const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('../views/home/Home.vue') },
  { path: '/structure', component: () => import('../views/structure/Structure.vue') },
  { path: '/basic', component: () => import('../views/basic/Basic.vue') }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

