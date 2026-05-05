<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 dark:text-slate-100 p-4 shadow-xl border border-slate-100 dark:border-slate-800"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">举报内容</h3>
          <button type="button" class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" @click="close">✕</button>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">请选择原因并补充说明（可选）。</p>
        <div class="space-y-2 mb-3">
          <label v-for="opt in reasons" :key="opt.value" class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
            <input v-model="reason" type="radio" name="reason" :value="opt.value" />
            {{ opt.label }}
          </label>
        </div>
        <textarea
          v-model="description"
          rows="3"
          maxlength="500"
          class="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm mb-4"
          placeholder="详细描述（可选）"
        />
        <div class="flex gap-2 justify-end">
          <button type="button" class="rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300" @click="close">
            取消
          </button>
          <button
            type="button"
            class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="submitting"
            @click="submit"
          >
            提交举报
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const reasons = [
  { value: 'spam', label: '垃圾广告' },
  { value: 'harassment', label: '辱骂骚扰' },
  { value: 'copyright', label: '侵权内容' },
  { value: 'other', label: '其他' },
];

const reason = ref('spam');
const description = ref('');
const submitting = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      reason.value = 'spam';
      description.value = '';
      submitting.value = false;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

async function submit() {
  submitting.value = true;
  try {
    emit('confirm', {
      reason: reason.value,
      description: description.value.trim(),
    });
  } finally {
    submitting.value = false;
  }
}
</script>
