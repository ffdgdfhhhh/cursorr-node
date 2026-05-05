<template>
  <article
    class="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100"
  >
    <header class="flex items-start gap-3">
      <RouterLink :to="`/user/${post.author?.id}`" class="shrink-0">
        <img
          :src="avatarUrl(post.author)"
          alt=""
          class="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
        />
      </RouterLink>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <RouterLink
              :to="`/user/${post.author?.id}`"
              class="font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-brand-600 dark:hover:text-brand-400"
            >
              {{ post.author?.username || '用户' }}
            </RouterLink>
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatTime(post.created_at) }}</p>
          </div>
          <div class="relative">
            <button
              type="button"
              class="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="更多"
              @click.stop="menuOpen = !menuOpen"
            >
              ⋯
            </button>
            <div
              v-if="menuOpen"
              class="absolute right-0 mt-1 w-36 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-lg z-10"
            >
              <button
                type="button"
                class="block w-full px-3 py-2 text-left text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                @click="openReport"
              >
                举报
              </button>
              <button
                v-if="canDelete"
                type="button"
                class="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                @click="remove"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <RouterLink :to="`/post/${post.id}`" class="block mt-3">
      <h3 v-if="post.title" class="text-elevate-heading font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {{ post.title }}
      </h3>
      <p v-if="post.content" class="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
        {{ expanded ? post.content : shortContent }}
        <button
          v-if="post.content && post.content.length > 120"
          type="button"
          class="ml-1 text-brand-600 dark:text-brand-400 text-xs"
          @click.prevent.stop="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
        </button>
      </p>
    </RouterLink>

    <div v-if="videoSrc" class="mt-3">
      <VideoPlayer :src="videoSrc" />
    </div>
    <div v-if="imageUrls.length" class="mt-3">
      <ImageGrid :urls="imageUrls" />
    </div>

    <footer class="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <span class="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">{{
        post.channel
      }}</span>
      <LikeButton
        :liked="localLiked"
        :count="localLikes"
        @toggle="onToggleLike"
      />
      <RouterLink :to="`/post/${post.id}`" class="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
        💬 {{ post.comments_count ?? 0 }}
      </RouterLink>
      <button type="button" class="text-slate-400 dark:text-slate-500 text-xs" @click="share">分享</button>
    </footer>

    <ReportModal v-model="reportOpen" @confirm="onReportConfirm" />
  </article>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { resolveMediaUrl } from '../utils/media';
import { toggleLike, deletePost, reportPost } from '../api/posts';
import VideoPlayer from './VideoPlayer.vue';
import ImageGrid from './ImageGrid.vue';
import LikeButton from './LikeButton.vue';
import ReportModal from './ReportModal.vue';

const props = defineProps({
  post: { type: Object, required: true },
});

const emit = defineEmits(['removed', 'reported', 'like-updated']);

const router = useRouter();
const auth = useAuthStore();

const expanded = ref(false);
const menuOpen = ref(false);
const reportOpen = ref(false);

const localLiked = ref(!!props.post.liked_by_me);
const localLikes = ref(Number(props.post.likes_count || 0));

watch(
  () => props.post.liked_by_me,
  (v) => {
    localLiked.value = !!v;
  }
);
watch(
  () => props.post.likes_count,
  (v) => {
    localLikes.value = Number(v || 0);
  }
);

const shortContent = computed(() => {
  const t = props.post.content || '';
  return t.length > 120 ? `${t.slice(0, 120)}…` : t;
});

const mediaList = computed(() => {
  const m = props.post.media_urls;
  return Array.isArray(m) ? m : [];
});

const videoSrc = computed(() => {
  if (!mediaList.value.length) return '';
  if (props.post.type === 'video') return resolveMediaUrl(mediaList.value[0]);
  if (props.post.type === 'mixed') {
    const v = mediaList.value.find((u) => /\.(mp4|webm|mov)(\?|$)/i.test(u));
    return v ? resolveMediaUrl(v) : '';
  }
  return '';
});

const imageUrls = computed(() => {
  if (props.post.type === 'video') return [];
  return mediaList.value.filter((u) => !/\.(mp4|webm|mov)(\?|$)/i.test(u));
});

const canDelete = computed(() => auth.user?.id && props.post.user_id === auth.user.id);

function avatarUrl(author) {
  if (author?.avatar) return resolveMediaUrl(author.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author?.username || 'u')}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return d.toLocaleDateString();
}

function onDocClick() {
  menuOpen.value = false;
}

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));

function openReport() {
  menuOpen.value = false;
  if (!auth.isLoggedIn) {
    router.push('/login');
    return;
  }
  reportOpen.value = true;
}

async function onReportConfirm(payload) {
  try {
    const { data } = await reportPost(props.post.id, payload);
    if (!data.success) throw new Error(data.message || '举报失败');
    reportOpen.value = false;
    emit('reported', props.post.id);
  } catch (e) {
    alert(e.response?.data?.message || e.message || '举报失败');
  }
}

let likeLock = false;
async function onToggleLike() {
  if (!auth.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (likeLock) return;
  likeLock = true;
  const prevLiked = localLiked.value;
  const prevCount = localLikes.value;
  localLiked.value = !prevLiked;
  localLikes.value = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
  try {
    const { data } = await toggleLike(props.post.id);
    if (data.success && data.data) {
      localLiked.value = data.data.liked;
      localLikes.value = data.data.likes_count;
      emit('like-updated', props.post.id, data.data);
    }
  } catch {
    localLiked.value = prevLiked;
    localLikes.value = prevCount;
  } finally {
    likeLock = false;
  }
}

async function remove() {
  menuOpen.value = false;
  if (!confirm('确定删除该帖子？')) return;
  await deletePost(props.post.id);
  emit('removed', props.post.id);
}

function share() {
  const url = `${window.location.origin}/post/${props.post.id}`;
  if (navigator.share) {
    navigator.share({ title: props.post.title || '创享社区', url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
    alert('链接已复制');
  }
}
</script>
