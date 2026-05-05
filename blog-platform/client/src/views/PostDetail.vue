<template>
  <div class="min-h-full pb-28 md:pb-8 md:pl-56 bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
    <header
      class="ui-top-glass sticky top-0 z-20 flex items-center gap-2 px-3 py-3"
    >
      <button type="button" class="text-xl px-2 text-slate-800 dark:text-slate-100" @click="$router.back()">←</button>
      <h1 class="text-elevate-heading text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
        帖子详情
      </h1>
    </header>

    <main v-if="post" class="flex-1 max-w-3xl mx-auto w-full px-3 py-4 space-y-4 overflow-y-auto">
      <PostCard :post="post" @removed="() => $router.replace('/')" @reported="() => $router.replace('/')" />

      <section class="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-3">评论 {{ post.comments_count }}</h3>
        <CommentList :comments="comments" @reply="onReply" />
      </section>
    </main>

    <p v-else-if="errorMsg" class="p-6 text-center text-sm text-rose-600">{{ errorMsg }}</p>

    <footer
      v-if="post && auth.isLoggedIn"
      class="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-3 py-3 pb-safe max-w-3xl mx-auto w-full"
    >
      <p v-if="replyTarget" class="text-xs text-slate-500 dark:text-slate-400 mb-1">
        回复 @{{ replyTarget.author?.username }}
        <button type="button" class="text-brand-600 dark:text-brand-400 ml-2" @click="replyTarget = null">取消</button>
      </p>
      <form class="flex gap-2" @submit.prevent="submitComment">
        <input
          v-model="commentText"
          class="flex-1 rounded-full border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50"
          placeholder="写评论…"
          maxlength="2000"
        />
        <button
          type="submit"
          class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="!commentText.trim() || submitting"
        >
          发送
        </button>
      </form>
    </footer>
    <footer
      v-else-if="post && !auth.isLoggedIn"
      class="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-3 py-3 text-center text-sm"
    >
      <RouterLink to="/login" class="text-brand-600 dark:text-brand-400 font-medium">登录后参与评论</RouterLink>
    </footer>

    <BottomNav />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BottomNav from '../components/BottomNav.vue';
import PostCard from '../components/PostCard.vue';
import CommentList from '../components/CommentList.vue';
import { fetchPost, fetchComments, addComment } from '../api/posts';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();

const post = ref(null);
const comments = ref([]);
const errorMsg = ref('');
const commentText = ref('');
const replyTarget = ref(null);
const submitting = ref(false);

async function load() {
  errorMsg.value = '';
  const id = route.params.id;
  try {
    const { data } = await fetchPost(id);
    if (!data.success) throw new Error(data.message || '加载失败');
    post.value = data.data;
    const { data: c } = await fetchComments(id);
    if (c.success) comments.value = c.data || [];
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '加载失败';
    post.value = null;
  }
}

function onReply(c) {
  replyTarget.value = c;
}

async function submitComment() {
  const text = commentText.value.trim();
  if (!text) return;
  submitting.value = true;
  try {
    const { data } = await addComment(route.params.id, {
      content: text,
      parent_id: replyTarget.value?.id || null,
    });
    if (!data.success) throw new Error(data.message || '发送失败');
    commentText.value = '';
    replyTarget.value = null;
    const { data: c } = await fetchComments(route.params.id);
    if (c.success) comments.value = c.data || [];
    if (post.value) post.value.comments_count = (post.value.comments_count || 0) + 1;
  } catch (e) {
    alert(e.response?.data?.message || e.message || '发送失败');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => route.params.id,
  () => load()
);

onMounted(load);
</script>
