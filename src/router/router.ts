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
    component: () => import('../views/dnd/DndBasic.vue'),
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
    path: '/basic/select',
    component: () => import('../views/basic/Select.vue'),
    meta: { title: '查询元素', description: '查询所有元素，并生成配置文件' },
  },
  {
    path: '/editor/simple',
    component: () => import('../views/editor/SimpleEditor.vue'),
    meta: { title: '简单编辑器', description: '通过拖拽完成界面。无法保存数据' },
  },
  {
    path: '/editor/store',
    component: () => import('../views/editor/StoreEditor.vue'),
    meta: { title: '编辑器', description: '通过拖拽完成界面。可保存数据' },
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
