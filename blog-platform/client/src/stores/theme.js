import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'cx-theme';

/** 与 main.css 中最慢一层（delay + duration）对齐，略留余量 */
const THEME_SWITCH_CLEANUP_MS = 820;

let themeSwitchClearTimer = null;

export function applyThemeClass(mode, options = {}) {
  const { animate = false } = options;
  const root = document.documentElement;

  const apply = () => {
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  if (!animate) {
    if (themeSwitchClearTimer) {
      clearTimeout(themeSwitchClearTimer);
      themeSwitchClearTimer = null;
    }
    root.classList.remove('theme-switching');
    apply();
    return;
  }

  if (themeSwitchClearTimer) clearTimeout(themeSwitchClearTimer);
  root.classList.add('theme-switching');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      apply();
      themeSwitchClearTimer = window.setTimeout(() => {
        root.classList.remove('theme-switching');
        themeSwitchClearTimer = null;
      }, THEME_SWITCH_CLEANUP_MS);
    });
  });
}

/** 首屏前调用，避免浅色闪一下；与 index.html 内联脚本一致 */
export function hydrateThemeFromStorage() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const mode = v === 'dark' ? 'dark' : 'light';
    applyThemeClass(mode);
    return mode;
  } catch {
    applyThemeClass('light');
    return 'light';
  }
}

/** 底部栏快速连点时合并为一次切换（尾焰防抖 + 奇偶合并） */
const TOGGLE_DEBOUNCE_MS = 140;

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  let toggleDebounceTimer = null;
  let burstStartMode = null;
  let burstClicks = 0;

  function clearToggleDebounce() {
    if (toggleDebounceTimer) {
      clearTimeout(toggleDebounceTimer);
      toggleDebounceTimer = null;
    }
    burstStartMode = null;
    burstClicks = 0;
  }

  function commitMode(m, opts = { animate: true }) {
    mode.value = m;
    applyThemeClass(m, { animate: opts.animate });
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }

  /** 显式设置主题（如设置页）：立即生效并取消未完成的防抖切换 */
  function setMode(m) {
    clearToggleDebounce();
    commitMode(m, { animate: true });
  }

  function toggle() {
    if (burstStartMode === null) burstStartMode = mode.value;
    burstClicks += 1;
    clearTimeout(toggleDebounceTimer);
    toggleDebounceTimer = window.setTimeout(() => {
      const odd = burstClicks % 2 === 1;
      const target = odd ? (burstStartMode === 'dark' ? 'light' : 'dark') : burstStartMode;
      burstClicks = 0;
      burstStartMode = null;
      toggleDebounceTimer = null;
      commitMode(target, { animate: true });
    }, TOGGLE_DEBOUNCE_MS);
  }

  return { mode, setMode, toggle };
});
