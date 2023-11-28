import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

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
    component: () => import('../views/ui/UI.vue'),
    meta: { title: 'UI设计', description: '界面样式，包括舞台样式、节点样式' },
  },
  {
    path: '/dnd/basic',
    component: () => import('../views/dnd/Basic.vue'),
    meta: { title: 'DND-基础', description: '使用 interactjs 完成拖拽组件到画布上' },
  },
  {
    path: '/basic/register',
    component: () => import('../views/basic/Register.vue'),
    meta: { title: '注册元素', description: '将元素纳入 jsPlumb 管理' },
  },
  {
    path: '/basic/connector',
    component: () => import('../views/basic/Connector.vue'),
    meta: { title: '连接元素', description: '连接两个元素' },
  },
  {
    path: '/editor',
    component: () => import('../views/editor/Editor.vue'),
    meta: { title: '编辑器', description: '通过拖拽完成界面' },
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
