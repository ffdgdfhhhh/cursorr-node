<template>
  <div
    class="theme-bg-layer theme-page-shell flex min-h-0 flex-1 flex-col text-slate-900 transition-colors duration-200 dark:text-slate-100"
  >
    <div class="flex min-h-0 flex-1 flex-col">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.restoreFromStorage();
  auth.loadMe();
});
</script>
