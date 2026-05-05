<template>
  <div class="min-h-full pb-10 md:pl-56 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header
      class="ui-top-glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3"
    >
      <button type="button" class="text-xl px-2 text-slate-800 dark:text-slate-100" @click="$router.back()">←</button>
      <h1 class="text-elevate-heading text-lg font-semibold text-slate-900 dark:text-slate-100">设置</h1>
    </header>

    <main class="max-w-lg mx-auto px-4 py-6 space-y-6">
      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
        <h2 class="px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80">
          账号与安全
        </h2>
        <form class="p-4 space-y-3 border-t border-slate-50 dark:border-slate-800" @submit.prevent="changePwd">
          <p class="text-xs text-slate-500 dark:text-slate-400">修改密码</p>
          <input
            v-model="pwd.current"
            type="password"
            class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
            placeholder="当前密码"
            autocomplete="current-password"
          />
          <input
            v-model="pwd.next"
            type="password"
            class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
            placeholder="新密码（≥6位）"
            autocomplete="new-password"
          />
          <button
            type="submit"
            class="w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-2 text-sm font-semibold text-white dark:text-slate-900 disabled:opacity-50"
            :disabled="pwdLoading"
          >
            保存新密码
          </button>
          <p v-if="pwdMsg" class="text-xs text-rose-600">{{ pwdMsg }}</p>
          <p v-if="pwdOk" class="text-xs text-emerald-600">{{ pwdOk }}</p>
        </form>
      </section>

      <section
        class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800"
      >
        <div class="px-4 py-3 flex justify-between items-center opacity-60">
          <span>隐私设置</span>
          <span class="text-xs text-slate-400 dark:text-slate-500">演示占位</span>
        </div>
        <div class="px-4 py-3 flex justify-between items-center opacity-60">
          <span>通知设置</span>
          <span class="text-xs text-slate-400 dark:text-slate-500">演示占位</span>
        </div>
        <button
          type="button"
          class="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          @click="clearCache"
        >
          <span>清除缓存</span>
          <span class="text-xs text-slate-400 dark:text-slate-500">›</span>
        </button>
      </section>

      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
        <p class="text-sm font-medium mb-2">头像上传</p>
        <input type="file" accept="image/*" @change="onAvatar" />
        <p v-if="avatarMsg" class="text-xs mt-2 text-emerald-600">{{ avatarMsg }}</p>
      </section>

      <button
        type="button"
        class="w-full rounded-2xl bg-rose-600 py-3 text-sm font-semibold text-white"
        @click="logout"
      >
        退出登录
      </button>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { changePassword, updateAvatar } from '../api/users';

const router = useRouter();
const auth = useAuthStore();

const pwd = reactive({ current: '', next: '' });
const pwdLoading = ref(false);
const pwdMsg = ref('');
const pwdOk = ref('');
const avatarMsg = ref('');

async function changePwd() {
  pwdMsg.value = '';
  pwdOk.value = '';
  pwdLoading.value = true;
  try {
    const { data } = await changePassword({
      currentPassword: pwd.current,
      newPassword: pwd.next,
    });
    if (!data.success) {
      pwdMsg.value = data.message || '修改失败';
      return;
    }
    pwdOk.value = data.message || '已更新';
    pwd.current = '';
    pwd.next = '';
  } catch (e) {
    pwdMsg.value = e.response?.data?.message || '修改失败';
  } finally {
    pwdLoading.value = false;
  }
}

function clearCache() {
  localStorage.removeItem('cx_cache_v1');
  alert('本地演示缓存已清除');
}

async function onAvatar(e) {
  avatarMsg.value = '';
  const file = e.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('avatar', file);
  try {
    const { data } = await updateAvatar(fd);
    if (!data.success) throw new Error(data.message || '上传失败');
    avatarMsg.value = '头像已更新';
    await auth.loadMe();
  } catch (err) {
    alert(err.response?.data?.message || err.message || '上传失败');
  }
}

function logout() {
  auth.logout();
  router.replace('/login');
}
</script>
