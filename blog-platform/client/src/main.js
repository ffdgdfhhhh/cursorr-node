import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { hydrateThemeFromStorage } from './stores/theme';
import './assets/main.css';

hydrateThemeFromStorage();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
