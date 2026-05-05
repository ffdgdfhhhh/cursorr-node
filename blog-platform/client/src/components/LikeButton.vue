<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm transition-transform active:scale-95"
    :class="liked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'"
    @click="onClick"
  >
    <span
      class="inline-block transition-transform duration-200"
      :class="{ 'scale-125': burst }"
      >{{ liked ? '❤️' : '🤍' }}</span
    >
    <span>{{ count }}</span>
  </button>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  liked: Boolean,
  count: { type: Number, default: 0 },
});

const emit = defineEmits(['toggle']);

const burst = ref(false);
let timer;

watch(
  () => props.liked,
  () => {
    burst.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      burst.value = false;
    }, 220);
  }
);

function onClick() {
  emit('toggle');
}
</script>
