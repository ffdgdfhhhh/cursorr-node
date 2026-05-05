<template>
  <div class="space-y-4">
    <div v-for="c in comments" :key="c.id" class="flex gap-3">
      <img
        :src="avatarUrl(c.author)"
        alt=""
        class="h-9 w-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
      />
      <div class="min-w-0 flex-1">
        <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/80 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ c.author?.username }}</span>
            <span class="text-xs text-slate-400 dark:text-slate-500">{{ formatTime(c.created_at) }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ c.content }}</p>
        </div>
        <button
          v-if="canReply"
          type="button"
          class="mt-1 text-xs text-brand-600 dark:text-brand-400"
          @click="$emit('reply', c)"
        >
          回复
        </button>
        <div v-if="c.replies?.length" class="mt-3 space-y-3 border-l-2 border-slate-100 dark:border-slate-700 pl-3">
          <div v-for="r in c.replies" :key="r.id" class="flex gap-2">
            <img
              :src="avatarUrl(r.author)"
              alt=""
              class="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
            />
            <div
              class="min-w-0 flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-100">{{ r.author?.username }}</span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ formatTime(r.created_at) }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ r.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-if="!comments.length" class="text-center text-sm text-slate-400 dark:text-slate-500 py-6">暂无评论，快来抢沙发～</p>
  </div>
</template>

<script setup>
import { resolveMediaUrl } from '../utils/media';

defineProps({
  comments: { type: Array, default: () => [] },
  canReply: { type: Boolean, default: true },
});

defineEmits(['reply']);

function avatarUrl(author) {
  if (author?.avatar) return resolveMediaUrl(author.avatar);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author?.username || 'u')}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}
</script>
