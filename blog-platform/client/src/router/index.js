import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/messages',
      component: () => import('../views/MessagesShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'messages-index',
          component: () => import('../views/MessagesEmpty.vue'),
        },
        {
          path: 'chat/:userId',
          name: 'messages-chat',
          component: () => import('../views/ChatRoom.vue'),
        },
      ],
    },
    {
      path: '/chat/:userId',
      redirect: (to) => `/messages/chat/${to.params.userId}`,
    },
    {
      path: '/following',
      name: 'following',
      component: () => import('../views/Following.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, _from, next) => {
        const uid = to.query.uid;
        if (uid !== undefined && uid !== null && String(uid).trim() !== '') {
          next({ path: `/user/${String(uid)}`, replace: true });
          return;
        }
        next();
      },
    },
    {
      path: '/user/:userId',
      name: 'user-profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetail.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  if (!auth.loaded) {
    auth.restoreFromStorage();
    await auth.loadMe();
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
  // 不再拦截已登录用户访问 /login：本地 token 会保留，否则重启后无法打开登录页换账号
  return next();
});

export default router;
