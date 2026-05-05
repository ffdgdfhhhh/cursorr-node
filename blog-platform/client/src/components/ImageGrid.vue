<template>
  <div
    class="grid gap-1 rounded-xl overflow-hidden"
    :class="gridClass"
  >
    <button
      v-for="(url, idx) in urls"
      :key="idx"
      type="button"
      class="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden"
      @click="openPreview(idx)"
    >
      <img
        :src="resolveMediaUrl(url)"
        :alt="`图片${idx + 1}`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
    </button>
  </div>
  <Teleport to="body">
    <div
      v-if="preview !== null"
      class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
      @click.self="preview = null"
    >
      <button type="button" class="absolute top-4 right-5 text-white text-2xl" @click="preview = null">
        ✕
      </button>
      <img :src="resolveMediaUrl(urls[preview])" class="max-h-full max-w-full object-contain" alt="" />
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { resolveMediaUrl } from '../utils/media';

const props = defineProps({
  urls: { type: Array, default: () => [] },
});

const preview = ref(null);

const gridClass = computed(() => {
  const n = props.urls.length;
  if (n <= 1) return 'grid-cols-1';
  if (n === 2) return 'grid-cols-2';
  if (n <= 4) return 'grid-cols-2';
  return 'grid-cols-3';
});

function openPreview(idx) {
  preview.value = idx;
}
</script>
