<template>
  <div class="relative rounded-xl overflow-hidden bg-black aspect-video group">
    <video
      ref="videoRef"
      class="w-full h-full object-contain"
      :src="src"
      playsinline
      preload="metadata"
      @click="toggle"
      @timeupdate="onTime"
      @loadedmetadata="onMeta"
    />
    <button
      v-if="!playing"
      type="button"
      class="absolute inset-0 flex items-center justify-center bg-black/30"
      aria-label="播放"
      @click="play"
    >
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl shadow-lg"
        >▶</span
      >
    </button>
    <div
      class="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white pointer-events-none"
    >
      {{ durationLabel }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
});

const videoRef = ref(null);
const playing = ref(false);
const duration = ref(0);
const current = ref(0);

const durationLabel = computed(() => {
  const d = duration.value || 0;
  const c = current.value || 0;
  return `${format(c)} / ${format(d)}`;
});

function format(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function play() {
  const el = videoRef.value;
  if (!el) return;
  el.play();
  playing.value = true;
}

function toggle() {
  const el = videoRef.value;
  if (!el) return;
  if (el.paused) {
    el.play();
    playing.value = true;
  } else {
    el.pause();
    playing.value = false;
  }
}

function onMeta() {
  const el = videoRef.value;
  duration.value = el?.duration || 0;
}

function onTime() {
  const el = videoRef.value;
  current.value = el?.currentTime || 0;
}
</script>
