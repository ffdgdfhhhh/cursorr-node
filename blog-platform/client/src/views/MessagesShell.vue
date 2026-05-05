<template>
  <div
    class="flex min-h-0 flex-1 flex-col md:pl-56 text-slate-900 dark:text-slate-100"
  >
    <!-- 底部留白勿放在本层：flex 子项撑满视口后，padding 会落在内容下方并透出外层背景。改为列自身 pb，让侧栏白底 / 会话区灰底延伸到底栏上方 -->
    <div class="flex min-h-0 flex-1 flex-row items-stretch">
      <aside
        class="flex min-h-0 w-full shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] motion-safe:md:transition-[width] motion-safe:md:duration-500 motion-safe:md:ease-in-out motion-reduce:md:transition-none md:pb-0"
        :class="asideWidthClass"
      >
        <header class="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            v-if="isChatRoute"
            type="button"
            class="hidden md:flex w-full items-center justify-center py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 motion-safe:transition-colors motion-safe:duration-200 border-b border-slate-100 dark:border-slate-800"
            aria-label="退出聊天，返回会话列表"
            @click="exitChat"
          >
            <span class="text-xl leading-none">←</span>
          </button>
          <h1
            class="text-elevate-heading text-center text-lg font-semibold text-slate-900 dark:text-slate-100 py-3 px-2"
            :class="isChatRoute ? 'md:hidden' : ''"
          >
            私信
          </h1>
        </header>

        <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <p
            v-if="errorMsg"
            class="p-2 md:p-3 text-xs md:text-sm text-rose-600 leading-snug"
          >
            {{ errorMsg }}
          </p>
          <RouterLink
            v-for="c in items"
            :key="c.id"
            :to="`/messages/chat/${c.peer.id}`"
            :active-class="linkActiveClass"
            class="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 border-l-4 border-l-transparent motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out motion-reduce:transition-colors"
            :class="linkLayoutClass"
          >
            <div class="relative shrink-0 motion-safe:transition-all motion-safe:duration-300">
              <img
                :src="avatarUrl(c.peer)"
                alt=""
                class="rounded-full bg-slate-100 dark:bg-slate-800 object-cover h-11 w-11 motion-safe:transition-all motion-safe:duration-300"
                :class="isChatRoute ? 'md:h-10 md:w-10' : 'md:h-11 md:w-11'"
              />
              <span
                v-if="c.unread_count > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center px-0.5 md:min-w-[14px] md:h-[14px] md:text-[8px]"
              >
                {{ c.unread_count > 99 ? '99+' : c.unread_count }}
              </span>
            </div>
            <div class="min-w-0 flex-1 md:flex-none" :class="isChatRoute ? 'md:w-full' : ''">
              <div
                class="flex justify-between gap-2"
                :class="isChatRoute ? 'md:block md:text-center' : 'md:items-start'"
              >
                <span
                  class="font-medium text-slate-900 dark:text-slate-100 truncate motion-safe:transition-all motion-safe:duration-300"
                  :class="nameClass"
                  :title="c.peer.username"
                >
                  {{ c.peer.username }}
                </span>
                <span
                  class="text-xs text-slate-400 dark:text-slate-500 shrink-0 motion-safe:transition-opacity motion-safe:duration-300"
                  :class="isChatRoute ? 'md:hidden' : 'md:inline'"
                >
                  {{ formatTime(c.updated_at) }}
                </span>
              </div>
              <p
                class="text-sm text-slate-500 dark:text-slate-400 truncate motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out"
                :class="previewClass"
              >
                {{ c.last_message || '暂无消息' }}
              </p>
            </div>
          </RouterLink>
          <p
            v-if="!loading && !items.length"
            class="text-center text-slate-400 dark:text-slate-500 py-12 px-4 text-sm md:px-3"
          >
            暂无会话，去首页互动看看吧～
          </p>
        </div>
      </aside>

      <section
        class="min-h-0 min-w-0 flex-1 flex-col bg-slate-100 dark:bg-slate-950 max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] motion-safe:transition-[flex-grow] motion-safe:duration-500 motion-safe:ease-in-out motion-reduce:transition-none md:pb-0"
        :class="isChatRoute ? 'flex' : 'hidden md:flex'"
      >
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <router-view v-slot="{ Component }">
            <transition name="dm-chat" mode="out-in">
              <component
                :is="Component"
                :key="route.fullPath"
                class="flex min-h-0 w-full flex-1 flex-col"
              />
            </transition>
          </router-view>
        </div>
      </section>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../components/BottomNav.vue';
import { fetchConversations } from '../api/messages';
import { resolveMediaUrl } from '../utils/media';

const route = useRoute();
const router = useRouter();
const items = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const isChatRoute = computed(() => route.name === 'messages-chat');

const asideWidthClass = computed(() =>
  isChatRoute.value ? 'hidden md:flex md:w-[5.25rem]' : 'flex md:w-80'
);

const linkActiveClass = computed(() =>
  isChatRoute.value
    ? '!bg-brand-50 !border-l-brand-600 md:!border-l-transparent md:!border-r-brand-600 dark:!bg-brand-950/40 dark:!border-l-brand-500 md:dark:!border-r-brand-500'
    : '!bg-brand-50 !border-l-brand-600 md:!border-r-transparent dark:!bg-brand-950/40 dark:!border-l-brand-500'
);

const linkLayoutClass = computed(() =>
  isChatRoute.value
    ? 'md:flex-col md:items-center md:gap-1.5 md:px-1.5 md:py-3 md:border-l-0 md:border-r-4 md:border-r-transparent'
    : 'md:flex-row md:items-center md:gap-3 md:px-4 md:py-3 md:border-r-0 md:border-l-4 md:border-l-transparent'
);

const nameClass = computed(() =>
  isChatRoute.value
    ? 'md:truncate-none md:text-[11px] md:leading-snug md:line-clamp-2 md:break-words md:text-center md:font-medium'
    : 'md:text-sm md:font-semibold md:text-slate-900 dark:md:text-slate-100'
);

const previewClass = computed(() =>
  isChatRoute.value ? 'mt-0.5 md:hidden' : 'mt-0.5 md:block'
);

function exitChat() {
  router.push('/messages');
}

function avatarUrl(peer) {
  if (peer?.avatar) return resolveMediaUrl(peer.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peer?.username || 'u')}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 86400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString();
}

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data } = await fetchConversations();
    if (!data.success) throw new Error(data.message || '加载失败');
    items.value = data.data || [];
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.dm-chat-enter-active,
.dm-chat-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.dm-chat-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.dm-chat-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .dm-chat-enter-active,
  .dm-chat-leave-active {
    transition: none;
  }

  .dm-chat-enter-from,
  .dm-chat-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
