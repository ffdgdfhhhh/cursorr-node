<template>
  <div
    class="ui-top-glass sticky top-0 z-30"
  >
    <div
      ref="scrollEl"
      class="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide touch-pan-x"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <button
        v-for="c in channels"
        :key="c.id ?? c.name"
        type="button"
        class="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition shrink-0"
        :class="
          model === c.name
            ? 'bg-brand-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        "
        @click="select(c.name)"
      >
        {{ c.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  channels: { type: Array, default: () => [] },
  modelValue: { type: String, default: '推荐' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const model = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => {
    model.value = v;
  }
);
const scrollEl = ref(null);
let touchStartX = 0;

function select(name) {
  model.value = name;
  emit('update:modelValue', name);
  emit('change', name);
}

function onTouchStart(e) {
  touchStartX = e.changedTouches[0].clientX;
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 60) return;
  const names = props.channels.map((c) => c.name);
  const i = names.indexOf(model.value);
  if (i < 0) return;
  if (dx < 0 && i < names.length - 1) select(names[i + 1]);
  if (dx > 0 && i > 0) select(names[i - 1]);
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
