import { createApp } from 'vue';

import { router } from './router/router';

import './commons/styles/style.scss';
import App from './App.vue';

createApp(App)
  .use(router)
  .mount('#app');
