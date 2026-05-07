<template>
  <div class="flex flex-1 min-h-0 flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header
      class="ui-top-glass sticky top-0 z-20 flex shrink-0 items-center gap-3 px-3 py-3"
    >
      <button
        type="button"
        class="text-xl px-2 md:hidden text-slate-800 dark:text-slate-100"
        aria-label="返回会话列表"
        @click="$router.push('/messages')"
      >
        ←
      </button>
      <button
        type="button"
        class="relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 hover:opacity-90 transition-opacity"
        aria-label="查看对方个人主页"
        @click="goPeerProfile"
      >
        <img
          :src="peerAvatarSrc"
          alt=""
          class="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover ring-2 ring-slate-100 dark:ring-slate-700 pointer-events-none"
        />
      </button>
      <div class="min-w-0 flex-1">
        <p class="text-elevate-heading font-semibold text-slate-900 dark:text-slate-100 truncate">
          {{ peer?.username || '聊天' }}
        </p>
        <p class="text-xs text-slate-400 dark:text-slate-500">实时私信 · Socket.io</p>
      </div>
    </header>

    <main ref="scrollEl" class="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 max-w-3xl mx-auto w-full">
      <div v-for="m in messages" :key="m.id" class="flex" :class="m.sender_id === selfId ? 'justify-end' : 'justify-start'">
        <div class="flex items-end gap-2 max-w-[85%]" :class="m.sender_id === selfId ? 'flex-row-reverse' : ''">
          <button
            type="button"
            class="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 hover:opacity-90 transition-opacity self-end"
            :aria-label="m.sender_id === selfId ? '查看我的个人主页' : '查看对方个人主页'"
            @click.stop="onBubbleAvatarClick(m)"
          >
            <img
              :src="avatarUrl(m.sender)"
              alt=""
              class="h-8 w-8 rounded-full bg-white dark:bg-slate-800 object-cover pointer-events-none"
            />
          </button>
          <div
            class="rounded-2xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap break-words"
            :class="
              m.sender_id === selfId
                ? 'bg-brand-600 text-white rounded-br-md'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
            "
          >
            {{ m.content }}
          </div>
        </div>
      </div>
      <p v-if="!messages.length && !loading" class="text-center text-slate-400 dark:text-slate-500 text-sm py-10">
        打个招呼吧～
      </p>
    </main>

    <footer
      class="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-3 py-3 max-w-3xl mx-auto w-full shrink-0"
    >
      <form class="flex gap-2" @submit.prevent="send">
        <input
          v-model="text"
          class="flex-1 rounded-full border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50"
          placeholder="输入消息…"
          maxlength="2000"
        />
        <button
          type="submit"
          class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="!text.trim() || sending"
        >
          发送
        </button>
      </form>
    </footer>
  </div>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { io } from 'socket.io-client';
import {
  openConversation,
  fetchConversationMessages,
  markConversationRead,
} from '../api/messages';
import { useAuthStore } from '../stores/auth';
import { fetchUser } from '../api/users';
import { resolveMediaUrl } from '../utils/media';
import { getToken } from '../utils/authStorage';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const peerId = computed(() => Number(route.params.userId));
const selfId = computed(() => auth.user?.id);

const peer = ref(null);
const conversationId = ref(null);
const messages = ref([]);
const text = ref('');
const sending = ref(false);
const loading = ref(true);
const scrollEl = ref(null);

let socket;

function avatarUrl(sender) {
  if (sender?.avatar) return resolveMediaUrl(sender.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sender?.username || 'u')}`;
}

const peerAvatarSrc = computed(() => {
  if (peer.value) return avatarUrl(peer.value);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(peerId.value || 'peer'))}`;
});

function profileFromDm(userId) {
  router.push({ path: `/user/${userId}`, query: { from: 'dm' } });
}

function goPeerProfile() {
  const id = peerId.value;
  if (!Number.isFinite(id)) return;
  profileFromDm(id);
}

function onBubbleAvatarClick(m) {
  if (!m?.sender_id) return;
  if (m.sender_id === selfId.value) {
    const pid = peerId.value;
    if (Number.isFinite(pid)) {
      router.push({ path: '/profile', query: { from: 'dm', peer: String(pid) } });
    } else {
      router.push('/profile');
    }
    return;
  }
  profileFromDm(m.sender_id);
}

function scrollBottom() {
  nextTick(() => {
    const el = scrollEl.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

async function bootstrap() {
  loading.value = true;
  try {
    socket?.disconnect();

    const { data: u } = await fetchUser(peerId.value);
    if (u.success) peer.value = u.data;

    const { data: conv } = await openConversation({ userId: peerId.value });
    if (!conv.success) throw new Error(conv.message || '无法打开会话');
    conversationId.value = conv.data.id;

    const { data: msgs } = await fetchConversationMessages(conversationId.value, {
      page: 1,
      limit: 100,
    });
    if (msgs.success) messages.value = msgs.data || [];

    await markConversationRead(conversationId.value);

    const url =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const token = getToken();
    socket = io(url, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      socket.emit('join_conversation', { conversationId: conversationId.value });
      socket.emit('mark_read', { conversationId: conversationId.value });
    });

    socket.on('receive_message', (payload) => {
      if (!payload?.message) return;
      if (payload.message.conversation_id !== conversationId.value) return;
      messages.value.push(payload.message);
      scrollBottom();
      socket.emit('mark_read', { conversationId: conversationId.value });
    });

    scrollBottom();
  } catch (e) {
    alert(e.response?.data?.message || e.message || '加载聊天失败');
    messages.value = [];
  } finally {
    loading.value = false;
  }
}

function send() {
  const v = text.value.trim();
  if (!v || !socket || !conversationId.value) return;
  sending.value = true;
  socket.emit(
    'send_message',
    { conversationId: conversationId.value, content: v },
    (resp) => {
      sending.value = false;
      if (resp && resp.success === false) {
        alert(resp.message || '发送失败');
      }
    }
  );
  text.value = '';
  scrollBottom();
}

watch(
  () => route.params.userId,
  () => {
    bootstrap();
  },
  { immediate: true }
);

onUnmounted(() => {
  socket?.disconnect();
});
</script>
