<template>
  <div class="min-h-full pb-28 md:pb-8 md:pl-56 text-slate-900 dark:text-slate-100">
    <header
      class="ui-top-glass sticky top-0 z-20 px-4 py-4"
    >
      <h1 class="text-elevate-heading text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
        我的关注
      </h1>
      <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">共 {{ total }} 人</p>
    </header>

    <main class="max-w-xl mx-auto px-3 py-4">
      <p v-if="errorMsg" class="text-sm text-rose-600 text-center py-4">{{ errorMsg }}</p>
      <ul v-if="items.length" class="space-y-2">
        <li
          v-for="u in items"
          :key="u.id"
          class="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm"
        >
          <RouterLink :to="`/user/${u.id}`" class="shrink-0">
            <img
              :src="avatarUrl(u)"
              alt=""
              class="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover ring-2 ring-slate-50 dark:ring-slate-800"
            />
          </RouterLink>
          <div class="min-w-0 flex-1">
            <RouterLink
              :to="`/user/${u.id}`"
              class="font-semibold text-slate-900 dark:text-slate-100 truncate block hover:text-brand-600 dark:hover:text-brand-400"
            >
              {{ u.username }}
            </RouterLink>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ u.bio || '暂无简介' }}</p>
          </div>
          <div class="flex flex-col gap-1 shrink-0">
            <RouterLink
              :to="`/messages/chat/${u.id}`"
              class="text-xs text-center rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 px-3 py-1.5 font-medium hover:bg-brand-100 dark:hover:bg-brand-900/40"
            >
              私信
            </RouterLink>
            <button
              type="button"
              class="text-xs rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              :disabled="removingId === u.id"
              @click="unfollow(u)"
            >
              {{ removingId === u.id ? '…' : '取消关注' }}
            </button>
          </div>
        </li>
      </ul>
      <p v-else-if="!loading" class="text-center text-slate-400 dark:text-slate-500 text-sm py-16">
        还没有关注任何人，去首页逛逛吧～
      </p>
      <p v-if="loading" class="text-center text-slate-400 dark:text-slate-500 text-sm py-12">加载中…</p>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import BottomNav from '../components/BottomNav.vue';
import { fetchMyFollowing, unfollowUser } from '../api/users';
import { resolveMediaUrl } from '../utils/media';

const items = ref([]);
const total = ref(0);
const loading = ref(true);
const errorMsg = ref('');
const removingId = ref(null);

function avatarUrl(u) {
  if (u?.avatar) return resolveMediaUrl(u.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u?.username || 'u')}`;
}

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data } = await fetchMyFollowing({ page: 1, limit: 100 });
    if (!data.success) throw new Error(data.message || '加载失败');
    items.value = data.data || [];
    total.value = data.meta?.total ?? items.value.length;
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

async function unfollow(u) {
  removingId.value = u.id;
  try {
    const { data } = await unfollowUser(u.id);
    if (!data.success) throw new Error(data.message || '操作失败');
    items.value = items.value.filter((x) => x.id !== u.id);
    total.value = Math.max(0, total.value - 1);
  } catch (e) {
    alert(e.response?.data?.message || e.message || '取消关注失败');
  } finally {
    removingId.value = null;
  }
}

onMounted(load);
</script>
