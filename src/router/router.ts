import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import UI from '../views/ui/UI.vue';

Vue.use(VueRouter);

export const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: '/home',
    meta: { display: false, title: '', description: '' },
  },
  {
    path: '/home',
    component: () => import('../views/home/Home.vue'),
    meta: { display: false, title: '首页', description: '卡片列表' },
  },
  {
    path: '/ui',
    component: UI,
    meta: { title: 'UI设计', description: '界面样式，包括舞台样式、节点样式' },
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
