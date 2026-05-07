<template>
  <div
    class="min-h-full flex items-center justify-center px-4 py-10 bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100"
  >
    <div
      class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800"
    >
      <h1 class="text-elevate-heading text-center text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
        创享社区
      </h1>
      <p class="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">记录生活 · 分享灵感</p>

      <div
        v-if="sessionExpired"
        class="mb-5 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      >
        登录已过期或令牌失效，请重新登录。
      </div>

      <div
        v-if="auth.isLoggedIn"
        class="mb-5 rounded-xl border border-brand-200/80 bg-brand-50/90 px-4 py-3 text-sm dark:border-brand-900/40 dark:bg-brand-950/35"
      >
        <p class="mb-3 text-slate-700 dark:text-slate-200">
          当前已登录：<span class="font-semibold text-slate-900 dark:text-white">{{ auth.user?.username || '…' }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            @click="goHomeFromLogin"
          >
            进入首页
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            @click="logoutToSwitch"
          >
            退出并切换账号
          </button>
        </div>
      </div>

      <div class="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6">
        <button
          type="button"
          class="flex-1 rounded-lg py-2 text-sm font-medium transition"
          :class="
            tab === 'login'
              ? 'bg-white dark:bg-slate-900 shadow text-brand-700 dark:text-brand-400'
              : 'text-slate-500 dark:text-slate-400'
          "
          @click="tab = 'login'"
        >
          登录
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg py-2 text-sm font-medium transition"
          :class="
            tab === 'register'
              ? 'bg-white dark:bg-slate-900 shadow text-brand-700 dark:text-brand-400'
              : 'text-slate-500 dark:text-slate-400'
          "
          @click="tab = 'register'"
        >
          注册
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <template v-if="tab === 'login'">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">邮箱</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="username"
              required
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">密码</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              minlength="6"
              required
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 outline-none"
            />
          </div>
        </template>
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">邮箱</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">密码</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 outline-none"
            />
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">至少 6 位字符</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">确认密码</label>
            <input
              v-model="form.passwordConfirm"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 outline-none"
            />
          </div>
        </template>
        <p v-if="errorMsg" class="text-sm text-rose-600">{{ errorMsg }}</p>
        <button
          type="submit"
          class="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
        >
          {{ tab === 'login' ? '登录' : '注册' }}
        </button>
      </form>

      <p
        v-if="tab === 'login'"
        class="mt-4 text-center text-xs text-slate-500 dark:text-slate-400"
      >
        没有账号？
        <button
          type="button"
          class="font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
          @click="tab = 'register'"
        >
          去注册
        </button>
      </p>

      <p class="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        测试账号：user1@example.com / 123456
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const tab = ref('login');
const loading = ref(false);
const errorMsg = ref('');

const sessionExpired = computed(() => route.query.expired === '1');

const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
});

watch(tab, () => {
  errorMsg.value = '';
  form.passwordConfirm = '';
});

function goHomeFromLogin() {
  router.replace('/');
}

function logoutToSwitch() {
  auth.logout();
  errorMsg.value = '';
}

async function submit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      errorMsg.value = '邮箱格式不正确';
      return;
    }
    if (form.password.length < 6) {
      errorMsg.value = '密码至少 6 位';
      return;
    }
    let res;
    if (tab.value === 'login') {
      res = await auth.login({ email: form.email, password: form.password });
    } else {
      if (form.password !== form.passwordConfirm) {
        errorMsg.value = '两次输入的密码不一致';
        return;
      }
      res = await auth.register({
        email: form.email,
        password: form.password,
      });
    }
    if (!res.success) {
      errorMsg.value = res.message || '请求失败';
      return;
    }
    router.replace('/');
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '网络错误';
  } finally {
    loading.value = false;
  }
}
</script>
