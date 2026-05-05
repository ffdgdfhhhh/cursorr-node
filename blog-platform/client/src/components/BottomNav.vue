<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/50 bg-white/70 pb-safe shadow-[0_-14px_48px_-14px_rgba(15,23,42,0.13)] backdrop-blur-xl backdrop-saturate-150 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-[0_-12px_40px_-14px_rgba(0,0,0,0.42)] md:left-0 md:top-0 md:right-auto md:h-full md:w-56 md:border-t-0 md:border-r md:border-slate-200/40 md:shadow-[6px_0_40px_-16px_rgba(15,23,42,0.12)] md:dark:border-slate-700 md:dark:shadow-[6px_0_28px_-12px_rgba(0,0,0,0.4)] md:flex md:flex-col md:justify-start md:gap-0 md:px-0 md:py-6 md:backdrop-blur-xl text-slate-900 dark:text-slate-100 max-md:ring-1 max-md:ring-inset max-md:ring-white/40 dark:max-md:ring-white/5"
    aria-label="主导航"
  >
    <div
      class="hidden md:flex items-center gap-2 px-5 pb-6 mb-2 border-b border-slate-100 dark:border-slate-800"
    >
      <span class="text-elevate-brand text-xl font-bold text-brand-600 dark:text-brand-400">创享社区</span>
    </div>

    <div class="flex flex-row md:flex-col md:flex-1 md:min-h-0 w-full">
      <div
        class="order-2 md:order-1 flex flex-1 justify-around md:flex-col md:gap-1 md:justify-start md:px-3 md:flex-1 md:min-h-0"
      >
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex flex-col md:flex-row md:items-center md:gap-3 items-center py-2 px-2 md:px-4 md:rounded-xl text-xs md:text-sm md:font-medium transition-colors"
          active-class="text-brand-600 bg-brand-50 md:bg-brand-50 dark:text-brand-400 dark:bg-brand-950/45 dark:md:bg-brand-950/45"
          :class="inactiveClass"
        >
          <span class="text-lg md:text-xl" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="themeStore.mode === 'dark'"
        class="order-1 md:order-2 flex shrink-0 w-14 md:w-auto md:max-w-none flex-col items-center justify-center gap-1.5 border-r border-slate-200 dark:border-slate-700 py-2 md:flex-row md:justify-between md:gap-3 md:border-r-0 md:border-t md:border-slate-200 md:dark:border-slate-700 md:mt-auto md:mx-3 md:mb-1 md:px-4 md:py-3 rounded-none md:rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200/80 dark:active:bg-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        :aria-label="themeStore.mode === 'dark' ? '切换为浅色模式' : '切换为深色模式'"
        @click="themeStore.toggle()"
      >
        <span class="text-center text-[10px] font-medium leading-tight md:text-sm">
          <span class="md:hidden">{{ themeStore.mode === 'dark' ? '深色' : '浅色' }}</span>
          <span class="hidden md:inline">{{ themeStore.mode === 'dark' ? '深色模式' : '浅色模式' }}</span>
        </span>
        <span
          class="relative inline-flex h-7 w-[3.25rem] shrink-0 rounded-full border border-slate-300/90 bg-slate-300/90 transition-colors dark:border-slate-500/80 dark:bg-slate-700"
          aria-hidden="true"
        >
          <!-- 太阳（左）：浅色主题为选中态 -->
          <svg
            class="pointer-events-none absolute left-[3px] top-1/2 z-[1] h-[11px] w-[11px] -translate-y-1/2 text-amber-500 transition-opacity duration-200 motion-reduce:transition-none"
            :class="themeStore.mode === 'dark' ? 'opacity-35' : 'opacity-100'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
            />
          </svg>
          <!-- 月亮（右）：深色主题为选中态 -->
          <svg
            class="pointer-events-none absolute right-[3px] top-1/2 z-[1] h-[11px] w-[11px] -translate-y-1/2 text-slate-500 transition-opacity duration-200 motion-reduce:transition-none dark:text-sky-100"
            :class="themeStore.mode === 'dark' ? 'opacity-100' : 'opacity-35'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
              clip-rule="evenodd"
            />
          </svg>
          <span
            class="pointer-events-none absolute left-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none dark:translate-x-[1.75rem]"
          />
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();

const items = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/following', label: '关注', icon: '⭐' },
  { to: '/messages', label: '私信', icon: '💬' },
  { to: '/profile', label: '我的', icon: '👤' },
];

const inactiveClass =
  'text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400';
</script>
