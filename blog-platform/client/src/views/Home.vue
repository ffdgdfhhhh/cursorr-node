<template>
  <div class="min-h-full pb-28 md:pb-8 md:pl-56">
    <header class="ui-top-glass sticky top-0 z-20 overflow-visible">
      <div class="flex items-center gap-3 overflow-visible px-4 py-3">
        <span class="text-elevate-brand text-lg font-bold text-brand-600 dark:text-brand-400 shrink-0">创享</span>
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="搜索标题、正文、作者…"
            autocomplete="off"
            class="w-full rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 border-0"
          />
        </div>

        <div
          ref="dmWrapRef"
          class="relative shrink-0"
          @mouseenter="onDmWrapEnter"
          @mouseleave="onDmWrapLeave"
        >
          <button
            type="button"
            class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="私信"
            :aria-expanded="dmDropdownVisible"
            aria-haspopup="true"
            @click.stop="onDmBtnClick"
          >
            💬
            <span
              v-if="auth.isLoggedIn && dmTotalUnread > 0"
              class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900"
            >
              {{ dmTotalUnread > 99 ? '99+' : dmTotalUnread }}
            </span>
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <!-- 绝对定位脱离文档流，不撑高导航行；pt-2 作图标与面板的悬停桥接 -->
            <div
              v-if="dmDropdownVisible"
              class="absolute right-0 top-full z-[60] flex w-[min(calc(100vw-2rem),17.5rem)] flex-col pt-2"
              role="presentation"
              @click.stop
            >
              <div
                class="overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
                role="menu"
              >
              <div class="max-h-[min(22rem,calc(100dvh-8rem))] overflow-y-auto py-1">
                <p
                  v-if="dmShowLoadingPlaceholder"
                  class="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  加载中…
                </p>
                <template v-else-if="!dmConversations.length">
                  <p class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无私信</p>
                </template>
                <template v-else>
                  <RouterLink
                    v-for="c in dmPreviewList"
                    :key="c.id"
                    :to="`/messages/chat/${c.peer.id}`"
                    role="menuitem"
                    class="dm-dropdown-row flex items-center gap-3 px-3 py-2.5 text-left outline-none hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    @click="onDmRowNavigate"
                  >
                    <img
                      :src="dmAvatarUrl(c.peer)"
                      alt=""
                      class="h-10 w-10 shrink-0 rounded-full bg-slate-100 object-cover dark:bg-slate-800"
                    />
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ c.peer.username }}
                    </span>
                    <span
                      v-if="c.unread_count > 0"
                      class="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white"
                    >
                      {{ c.unread_count > 99 ? '99+' : c.unread_count }}
                    </span>
                  </RouterLink>
                </template>
              </div>
              <RouterLink
                v-if="dmConversations.length"
                to="/messages"
                class="dm-dropdown-row block border-t border-slate-100 px-3 py-2.5 text-center text-xs font-medium text-brand-600 dark:border-slate-800 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                @click="onDmRowNavigate"
              >
                {{
                  dmConversations.length > DM_PREVIEW_LIMIT
                    ? `查看全部私信（${dmConversations.length}）`
                    : '进入私信'
                }}
              </RouterLink>
              </div>
            </div>
          </Transition>
        </div>

        <div
          v-if="auth.isLoggedIn"
          class="relative shrink-0"
          @mouseenter="onProfileWrapEnter"
          @mouseleave="onProfileWrapLeave"
        >
          <button
            type="button"
            class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition-shadow hover:ring-brand-300 dark:bg-slate-800 dark:ring-slate-600 dark:hover:ring-brand-500/60"
            aria-label="我的账户"
            :aria-expanded="profileMenuVisible"
            aria-haspopup="true"
          >
            <img
              :src="meAvatarUrl"
              alt=""
              class="h-full w-full min-h-[2.5rem] min-w-[2.5rem] object-cover"
              @error="onMeAvatarError"
            />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="profileMenuVisible"
              class="absolute right-0 top-full z-[60] flex w-44 flex-col pt-2"
              role="presentation"
              @click.stop
            >
              <div
                class="overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 py-1 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
                role="menu"
              >
                <RouterLink
                  to="/profile"
                  role="menuitem"
                  class="dm-dropdown-row block px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100"
                  @click="closeProfileMenu"
                >
                  个人中心
                </RouterLink>
                <RouterLink
                  to="/settings"
                  role="menuitem"
                  class="dm-dropdown-row block border-t border-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 dark:border-slate-800 dark:text-slate-100"
                  @click="closeProfileMenu"
                >
                  设置
                </RouterLink>
                <button
                  type="button"
                  role="menuitem"
                  class="dm-dropdown-row block w-full border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-rose-600 dark:border-slate-800 dark:text-rose-400"
                  @click="onLogoutClick"
                >
                  登出
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      <TopChannels v-model="channel" :channels="channels" @change="reload" />
    </header>

    <main ref="mainEl" class="max-w-3xl mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100">
      <p v-if="errorMsg" class="text-center text-sm text-rose-600">{{ errorMsg }}</p>
      <p
        v-if="searchQuery.trim() && posts.length && !filteredPosts.length"
        class="text-center text-sm text-slate-400 py-8"
      >
        没有匹配的帖子，换个关键词试试
      </p>
      <PostCard
        v-for="p in filteredPosts"
        :key="p.id"
        :post="p"
        @removed="onRemoved"
        @reported="onReported"
      />
      <div ref="sentinel" class="h-8 flex justify-center items-center text-slate-400 text-sm">
        <span v-if="loadingMore">加载中…</span>
        <span v-else-if="!hasMore && posts.length">没有更多了</span>
      </div>
    </main>

    <button
      v-if="auth.isLoggedIn"
      type="button"
      class="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white text-2xl shadow-lg hover:bg-brand-700"
      aria-label="发布"
      @click="composeOpen = true"
    >
      +
    </button>

    <BottomNav />

    <Teleport to="body">
      <div
        v-if="composeOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/60 p-4"
        @click.self="composeOpen = false"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 dark:text-slate-100 p-4 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800"
        >
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold text-lg">发布帖子</h3>
            <button type="button" class="text-slate-400 dark:text-slate-500" @click="composeOpen = false">✕</button>
          </div>
          <form class="space-y-3" @submit.prevent="submitPost">
            <input
              v-model="draft.title"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
              placeholder="标题（可选）"
            />
            <textarea
              v-model="draft.content"
              rows="4"
              class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm"
              placeholder="分享你的想法…"
            />
            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="draft.channel"
                class="rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-2 py-2 text-sm"
              >
                <option v-for="c in channels" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
              <select
                v-model="draft.type"
                class="rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-2 py-2 text-sm"
              >
                <option value="text">文字</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="mixed">图文混合</option>
              </select>
            </div>
            <input type="file" multiple accept="image/*,video/*" @change="onFiles" />
            <p class="text-xs text-slate-400 dark:text-slate-500">图片≤5MB，视频≤100MB，可多选</p>
            <button
              type="submit"
              class="w-full rounded-xl bg-brand-600 py-3 text-white text-sm font-semibold disabled:opacity-50"
              :disabled="submitting"
            >
              发布
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import TopChannels from '../components/TopChannels.vue';
import BottomNav from '../components/BottomNav.vue';
import PostCard from '../components/PostCard.vue';
import { fetchChannels } from '../api/channels';
import { fetchPosts, createPost } from '../api/posts';
import { fetchConversations } from '../api/messages';
import { useAuthStore } from '../stores/auth';
import { resolveMediaUrl } from '../utils/media';

const DM_PREVIEW_LIMIT = 8;

const auth = useAuthStore();
const router = useRouter();

const searchQuery = ref('');
const channels = ref([{ id: 0, name: '推荐' }]);
const channel = ref('推荐');
const posts = ref([]);
const page = ref(1);
const hasMore = ref(true);
const loadingMore = ref(false);
const errorMsg = ref('');
const mainEl = ref(null);
const sentinel = ref(null);

const composeOpen = ref(false);
const submitting = ref(false);
const draft = ref({
  title: '',
  content: '',
  channel: '推荐',
  type: 'text',
});
const files = ref([]);

const dmWrapRef = ref(null);
const dmConversations = ref([]);
/** 仅在「无缓存数据」时展示占位加载，避免列表 hover 时整页闪 loading */
const dmLoading = ref(false);
const dmHovering = ref(false);
const dmExpanded = ref(false);

const DM_BRIEF_MIN_INTERVAL_MS = 20000;
const DM_ENTER_DEBOUNCE_MS = 120;
const DM_LEAVE_DELAY_MS = 320;

let dmLeaveTimer;
let dmEnterDebounceTimer;
/** 合并并发请求，避免 mouseenter 风暴 */
let dmBriefInFlight = null;
let dmBriefLastSuccessAt = 0;

let observer;

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return posts.value;
  return posts.value.filter((p) => {
    const blob = [p.title, p.content, p.channel, p.author?.username]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return blob.includes(q);
  });
});

const dmSortedConversations = computed(() => {
  const arr = [...dmConversations.value];
  arr.sort((a, b) => {
    const ua = Number(a.unread_count) || 0;
    const ub = Number(b.unread_count) || 0;
    if (ua !== ub) return ub - ua;
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });
  return arr;
});

const dmPreviewList = computed(() => dmSortedConversations.value.slice(0, DM_PREVIEW_LIMIT));

const dmTotalUnread = computed(() =>
  dmConversations.value.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0)
);

const dmDropdownVisible = computed(
  () => auth.isLoggedIn && (dmHovering.value || dmExpanded.value)
);

const dmShowLoadingPlaceholder = computed(
  () => dmLoading.value && dmConversations.value.length === 0
);

const profileHovering = ref(false);
let profileLeaveTimer;

const profileMenuVisible = computed(() => auth.isLoggedIn && profileHovering.value);

/** 自定义头像地址失效时回退到 DiceBear，避免顶栏空白 */
const meAvatarForceDicebear = ref(false);

const meAvatarUrl = computed(() => {
  const u = auth.user;
  const dicebear = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u?.username || 'me')}`;
  if (meAvatarForceDicebear.value || !u?.avatar) return dicebear;
  return resolveMediaUrl(u.avatar);
});

function onMeAvatarError() {
  meAvatarForceDicebear.value = true;
}

watch(
  () => [auth.user?.id, auth.user?.avatar],
  () => {
    meAvatarForceDicebear.value = false;
  }
);

function onProfileWrapEnter() {
  clearTimeout(profileLeaveTimer);
  profileHovering.value = true;
}

function onProfileWrapLeave() {
  profileLeaveTimer = setTimeout(() => {
    profileHovering.value = false;
  }, DM_LEAVE_DELAY_MS);
}

function closeProfileMenu() {
  profileHovering.value = false;
}

function onLogoutClick() {
  closeProfileMenu();
  auth.logout();
  router.push('/login');
}

async function loadDmBrief(options = {}) {
  const force = options.force === true;
  if (!auth.isLoggedIn) {
    dmConversations.value = [];
    dmLoading.value = false;
    dmBriefInFlight = null;
    return;
  }

  const now = Date.now();
  const hasCache = dmConversations.value.length > 0;
  const emptyKnown = dmBriefLastSuccessAt > 0 && dmConversations.value.length === 0;

  if (!force) {
    if (hasCache && now - dmBriefLastSuccessAt < DM_BRIEF_MIN_INTERVAL_MS) return;
    /* 已知「暂无会话」时短时内不再反复打接口，避免鼠标在下拉里晃动时闪烁 */
    if (emptyKnown && now - dmBriefLastSuccessAt < 8000) return;
  }
  if (dmBriefInFlight) {
    return dmBriefInFlight;
  }

  if (!hasCache) dmLoading.value = true;

  dmBriefInFlight = (async () => {
    try {
      const { data } = await fetchConversations();
      dmConversations.value = data.success ? data.data || [] : [];
      dmBriefLastSuccessAt = Date.now();
    } catch {
      if (!hasCache) dmConversations.value = [];
    } finally {
      dmLoading.value = false;
      dmBriefInFlight = null;
    }
  })();

  return dmBriefInFlight;
}

function dmAvatarUrl(peer) {
  if (peer?.avatar) return resolveMediaUrl(peer.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peer?.username || 'u')}`;
}

function onDmWrapEnter() {
  if (!auth.isLoggedIn) return;
  clearTimeout(dmLeaveTimer);
  clearTimeout(dmEnterDebounceTimer);
  dmHovering.value = true;
  dmEnterDebounceTimer = setTimeout(() => {
    loadDmBrief({ force: false });
  }, DM_ENTER_DEBOUNCE_MS);
}

function onDmWrapLeave() {
  clearTimeout(dmEnterDebounceTimer);
  dmLeaveTimer = setTimeout(() => {
    dmHovering.value = false;
  }, DM_LEAVE_DELAY_MS);
}

function onDmBtnClick() {
  if (!auth.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: '/' } });
    return;
  }
  const next = !dmExpanded.value;
  dmExpanded.value = next;
  if (next) loadDmBrief({ force: true });
}

function closeDmDropdown() {
  dmExpanded.value = false;
  dmHovering.value = false;
}

/** 仅收起面板，路由交给 RouterLink（SPA，无整页刷新） */
function onDmRowNavigate() {
  closeDmDropdown();
}

function onDmDocClick(e) {
  if (!dmWrapRef.value?.contains(e.target)) dmExpanded.value = false;
}

async function loadChannels() {
  try {
    const { data } = await fetchChannels();
    if (data.success && data.data?.length) {
      channels.value = data.data;
      if (!channels.value.find((c) => c.name === channel.value)) {
        channel.value = channels.value[0].name;
      }
      draft.value.channel = channel.value;
    }
  } catch {
    errorMsg.value = '频道加载失败';
  }
}

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 1;
    posts.value = [];
    hasMore.value = true;
  }
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  errorMsg.value = '';
  try {
    const { data } = await fetchPosts({
      channel: channel.value,
      page: page.value,
      limit: 10,
    });
    if (!data.success) throw new Error(data.message || '加载失败');
    const chunk = data.data || [];
    posts.value = reset ? chunk : posts.value.concat(chunk);
    const totalPages = data.meta?.totalPages ?? 1;
    hasMore.value = page.value < totalPages;
    if (chunk.length) page.value += 1;
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '加载失败';
  } finally {
    loadingMore.value = false;
  }
}

function reload() {
  loadPosts(true);
}

function onRemoved(id) {
  posts.value = posts.value.filter((p) => p.id !== id);
}

function onReported(id) {
  posts.value = posts.value.filter((p) => p.id !== id);
}

function onFiles(e) {
  files.value = Array.from(e.target.files || []);
}

async function submitPost() {
  if (!draft.value.content.trim() && !files.value.length) {
    alert('请填写内容或选择文件');
    return;
  }
  submitting.value = true;
  try {
    const fd = new FormData();
    fd.append('title', draft.value.title);
    fd.append('content', draft.value.content);
    fd.append('channel', draft.value.channel);
    fd.append('type', draft.value.type);
    files.value.forEach((f) => fd.append('files', f));
    const { data } = await createPost(fd);
    if (!data.success) throw new Error(data.message || '发布失败');
    composeOpen.value = false;
    draft.value = { title: '', content: '', channel: channel.value, type: 'text' };
    files.value = [];
    await loadPosts(true);
  } catch (e) {
    alert(e.response?.data?.message || e.message || '发布失败');
  } finally {
    submitting.value = false;
  }
}

function setupObserver() {
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) loadPosts(false);
      });
    },
    { root: null, threshold: 0.1 }
  );
  if (sentinel.value) observer.observe(sentinel.value);
}

onMounted(async () => {
  await loadChannels();
  await loadPosts(true);
  await loadDmBrief({ force: true });
  await nextTick();
  setupObserver();
  document.addEventListener('click', onDmDocClick);
});

watch(sentinel, () => setupObserver());

watch(() => auth.isLoggedIn, (logged) => {
  closeDmDropdown();
  closeProfileMenu();
  clearTimeout(profileLeaveTimer);
  clearTimeout(dmEnterDebounceTimer);
  if (logged) {
    dmBriefLastSuccessAt = 0;
    loadDmBrief({ force: true });
  } else {
    dmConversations.value = [];
    dmBriefInFlight = null;
    dmLoading.value = false;
  }
});

onUnmounted(() => {
  observer?.disconnect();
  clearTimeout(dmLeaveTimer);
  clearTimeout(dmEnterDebounceTimer);
  clearTimeout(profileLeaveTimer);
  document.removeEventListener('click', onDmDocClick);
});
</script>

<style scoped>
.dm-dropdown-row {
  transition: background-color 0.12s ease;
}
@media (prefers-reduced-motion: reduce) {
  .dm-dropdown-row {
    transition: none;
  }
}
</style>
