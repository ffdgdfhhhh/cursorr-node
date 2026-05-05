<template>
  <div class="min-h-full pb-28 md:pb-8 md:pl-56 text-slate-900 dark:text-slate-100">
    <header
      class="ui-top-glass sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-2 py-3"
    >
      <button
        v-if="showHeaderBack"
        type="button"
        class="justify-self-start inline-flex items-center gap-1 rounded-lg py-2 pl-1 pr-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors min-h-[44px]"
        aria-label="返回上一页"
        @click="goBack"
      >
        <span class="text-xl leading-none" aria-hidden="true">←</span>
        <span class="text-sm font-medium">返回</span>
      </button>
      <span v-else class="w-[4.5rem] shrink-0 justify-self-start" aria-hidden="true" />

      <h1
        class="text-elevate-heading text-center text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg truncate min-w-0 px-1"
      >
        {{ pageTitle }}
      </h1>

      <span class="w-10 shrink-0 justify-self-end" aria-hidden="true" />
    </header>

    <section class="max-w-3xl mx-auto px-4 py-6">
      <div class="flex flex-col items-center text-center">
        <div class="relative">
          <img
            :src="avatarUrl(displayUser)"
            alt=""
            class="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 object-cover ring-4 ring-white dark:ring-slate-900 shadow"
            :class="{ 'opacity-55': isSelf && avatarUploading }"
          />
          <button
            v-if="isSelf"
            type="button"
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-medium text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-900 disabled:cursor-wait"
            :class="
              avatarUploading ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus-visible:opacity-100'
            "
            :disabled="avatarUploading"
            aria-label="更换头像"
            @click="triggerAvatarPick"
          >
            {{ avatarUploading ? '上传中…' : '更换头像' }}
          </button>
          <input
            v-if="isSelf"
            ref="avatarFileRef"
            type="file"
            class="sr-only"
            accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
            @change="onAvatarFileChange"
          />
        </div>
        <p v-if="isSelf && profileAvatarOk" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          {{ profileAvatarOk }}
        </p>
        <p v-if="isSelf && profileAvatarErr" class="mt-2 text-xs text-rose-600 dark:text-rose-400">
          {{ profileAvatarErr }}
        </p>
        <p
          v-if="isSelf && !profileAvatarOk && !profileAvatarErr && !avatarUploading"
          class="mt-2 text-[11px] text-slate-400 dark:text-slate-500"
        >
          点击头像上传，支持 jpg / png / gif / webp，最大 5MB
        </p>
        <h2 class="text-elevate-heading mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          {{ displayUser?.username }}
        </h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ displayUser?.bio || '这个人很懒，什么都没写～' }}</p>

        <RouterLink
          v-if="isSelf"
          to="/settings"
          class="mt-4 rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          编辑资料 / 设置
        </RouterLink>

        <div v-else class="mt-4 flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            class="rounded-full border px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            :class="
              followed
                ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                : 'border-brand-600 dark:border-brand-500 bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40'
            "
            :disabled="followLoading"
            @click="toggleFollow"
          >
            {{ followLoading ? '…' : followed ? '已关注' : '关注' }}
          </button>
          <RouterLink
            :to="`/messages/chat/${targetId}`"
            class="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            发私信
          </RouterLink>
        </div>
      </div>

      <div
        class="mt-8 flex justify-center gap-6 text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap"
      >
        <button
          type="button"
          class="pb-2 border-b-2 font-medium"
          :class="
            tab === 'posts'
              ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-brand-400'
              : 'border-transparent'
          "
          @click="tab = 'posts'"
        >
          {{ isSelf ? '我的帖子' : '动态' }}
        </button>
        <button
          v-if="isSelf"
          type="button"
          class="pb-2 border-b-2 font-medium"
          :class="
            tab === 'liked'
              ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-brand-400'
              : 'border-transparent'
          "
          @click="tab = 'liked'"
        >
          点赞过的
        </button>
        <button
          v-if="isSelf"
          type="button"
          class="pb-2 border-b-2 font-medium"
          :class="
            tab === 'reports'
              ? 'border-brand-600 dark:border-brand-500 text-brand-700 dark:text-brand-400'
              : 'border-transparent'
          "
          @click="tab = 'reports'"
        >
          举报记录
        </button>
      </div>

      <div class="mt-4 space-y-4">
        <template v-if="tab === 'posts'">
          <PostCard v-for="p in userPosts" :key="p.id" :post="p" @removed="() => loadPosts()" />
          <p v-if="!userPosts.length" class="text-center text-slate-400 dark:text-slate-500 text-sm py-10">暂无帖子</p>
        </template>
        <template v-else-if="tab === 'liked'">
          <PostCard v-for="p in likedPosts" :key="p.id" :post="p" />
          <p v-if="!likedPosts.length" class="text-center text-slate-400 dark:text-slate-500 text-sm py-10">暂无点赞</p>
        </template>
        <template v-else>
          <div
            v-for="r in reports"
            :key="r.id"
            class="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm"
          >
            <p class="font-medium text-slate-800 dark:text-slate-100">
              帖子 #{{ r.post_id }} · {{ r.reason }} · {{ r.status }}
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ r.Post?.title || '（无标题）' }}</p>
          </div>
          <p v-if="!reports.length" class="text-center text-slate-400 dark:text-slate-500 text-sm py-10">暂无举报记录</p>
        </template>
      </div>

      <div
        v-if="isSelf"
        class="mt-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800"
      >
        <RouterLink
          to="/following"
          class="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80"
        >
          <span>⭐ 我的关注</span>
          <span class="text-slate-300 dark:text-slate-600">›</span>
        </RouterLink>
        <RouterLink
          to="/settings"
          class="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80"
        >
          <span>⚙️ 设置</span>
          <span class="text-slate-300 dark:text-slate-600">›</span>
        </RouterLink>
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800/80"
        >
          <span>📊 关于我们</span>
          <span class="text-slate-300 dark:text-slate-600">›</span>
        </button>
      </div>
    </section>

    <BottomNav />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../components/BottomNav.vue';
import PostCard from '../components/PostCard.vue';
import { useAuthStore } from '../stores/auth';
import {
  fetchUser,
  fetchUserPosts,
  fetchMyLikedPosts,
  fetchMyReports,
  followUser,
  unfollowUser,
  updateAvatar,
} from '../api/users';
import { resolveMediaUrl } from '../utils/media';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const tab = ref('posts');
const profileUser = ref(null);
const userPosts = ref([]);
const likedPosts = ref([]);
const reports = ref([]);
const followed = ref(false);
const followLoading = ref(false);
const avatarFileRef = ref(null);
const avatarUploading = ref(false);
const profileAvatarOk = ref('');
const profileAvatarErr = ref('');

const targetId = computed(() => {
  if (route.name === 'user-profile') {
    const id = Number(route.params.userId);
    return Number.isFinite(id) ? id : null;
  }
  return auth.user?.id ?? null;
});

const isSelf = computed(() => !!(auth.user?.id && targetId.value === auth.user.id));

/** 他人空间始终返回；从私信点自己头像进「我的」也会带 from=dm，需显示返回 */
const showHeaderBack = computed(
  () =>
    route.name === 'user-profile' ||
    (route.name === 'profile' && route.query.from === 'dm')
);

const displayUser = computed(() => {
  if (isSelf.value) return profileUser.value || auth.user;
  return profileUser.value;
});

const pageTitle = computed(() => {
  if (isSelf.value) return '我的';
  const name = displayUser.value?.username;
  if (!name) return '用户主页';
  return `${name}的个人空间`;
});

async function toggleFollow() {
  if (!targetId.value || isSelf.value || followLoading.value) return;
  followLoading.value = true;
  try {
    if (followed.value) {
      const { data } = await unfollowUser(targetId.value);
      if (!data.success) throw new Error(data.message || '取消关注失败');
      followed.value = false;
    } else {
      const { data } = await followUser(targetId.value);
      if (!data.success) throw new Error(data.message || '关注失败');
      followed.value = true;
    }
    if (profileUser.value) profileUser.value.followed_by_me = followed.value;
  } catch (e) {
    alert(e.response?.data?.message || e.message || '操作失败');
  } finally {
    followLoading.value = false;
  }
}

function goBack() {
  if (route.query.from === 'dm') {
    const peer = route.query.peer;
    if (peer !== undefined && peer !== null && String(peer).trim() !== '') {
      router.push(`/messages/chat/${String(peer)}`);
      return;
    }
    if (route.name === 'user-profile' && targetId.value) {
      router.push(`/messages/chat/${targetId.value}`);
      return;
    }
    router.push('/messages');
    return;
  }
  router.back();
}

function avatarUrl(u) {
  if (u?.avatar) return resolveMediaUrl(u.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u?.username || 'me')}`;
}

function triggerAvatarPick() {
  if (avatarUploading.value) return;
  profileAvatarOk.value = '';
  profileAvatarErr.value = '';
  avatarFileRef.value?.click();
}

async function onAvatarFileChange(e) {
  const input = e.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !isSelf.value) return;
  profileAvatarOk.value = '';
  profileAvatarErr.value = '';
  avatarUploading.value = true;
  try {
    const fd = new FormData();
    fd.append('avatar', file);
    const { data } = await updateAvatar(fd);
    if (!data.success) throw new Error(data.message || '上传失败');
    await auth.loadMe();
    await loadProfile();
    profileAvatarOk.value = '头像已更新';
  } catch (err) {
    profileAvatarErr.value = err.response?.data?.message || err.message || '上传失败';
  } finally {
    avatarUploading.value = false;
  }
}

async function loadProfile() {
  if (!targetId.value) return;
  const { data } = await fetchUser(targetId.value);
  if (data.success) {
    profileUser.value = data.data;
    const self =
      !!(auth.user?.id && Number(targetId.value) === Number(auth.user.id));
    followed.value = self ? false : !!data.data.followed_by_me;
  }
}

async function loadPosts() {
  if (!targetId.value) return;
  const { data } = await fetchUserPosts(targetId.value, { page: 1, limit: 50 });
  if (data.success) userPosts.value = data.data || [];
}

async function loadLiked() {
  const { data } = await fetchMyLikedPosts({ page: 1, limit: 50 });
  if (data.success) likedPosts.value = data.data || [];
}

async function loadReports() {
  const { data } = await fetchMyReports();
  if (data.success) reports.value = data.data || [];
}

async function refresh() {
  profileAvatarOk.value = '';
  profileAvatarErr.value = '';
  tab.value = 'posts';
  profileUser.value = null;
  userPosts.value = [];
  if (!targetId.value) return;
  await loadProfile();
  await loadPosts();
  if (isSelf.value) {
    await loadLiked();
    await loadReports();
  } else {
    likedPosts.value = [];
    reports.value = [];
  }
}

watch(
  () => [route.name, route.params.userId, auth.user?.id],
  () => {
    refresh();
  },
  { immediate: true }
);

watch(tab, (t) => {
  if (t === 'liked' && isSelf.value) loadLiked();
  if (t === 'reports' && isSelf.value) loadReports();
});
</script>
