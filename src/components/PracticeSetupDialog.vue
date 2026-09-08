<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

withDefaults(defineProps<{
  title: string
  description: string
  cancelLabel?: string
}>(), { cancelLabel: '返回首页' })
const emit = defineEmits<{ start: [], cancel: [] }>()
const dialog = ref<HTMLDialogElement>()
const titleElement = ref<HTMLElement>()
const titleId = useId()
const descriptionId = useId()
let previousOverflow = ''

onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  titleElement.value?.focus()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[660px] overflow-hidden rounded-[28px] border border-line bg-white p-0 text-ink shadow-[0_26px_80px_rgb(15_42_28/0.24)] backdrop:bg-ink/35 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[30px]" :aria-labelledby="titleId" :aria-describedby="descriptionId" @cancel.prevent="emit('cancel')">
      <form class="flex max-h-[calc(100dvh-1.5rem-2px)] flex-col sm:max-h-[calc(100dvh-3rem-2px)]" @submit.prevent="emit('start')">
        <div class="shrink-0 border-b border-line p-4 sm:p-5">
          <div class="flex items-start gap-3 sm:gap-4">
            <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-xl font-black text-brand sm:size-12" aria-hidden="true">♪</span>
            <div class="min-w-0 flex-1">
              <h1 :id="titleId" ref="titleElement" tabindex="-1" class="text-lg font-black tracking-tight outline-none sm:text-2xl">
                {{ title }}
              </h1>
              <p :id="descriptionId" class="mt-1 text-xs font-bold text-muted sm:text-sm">
                {{ description }}
              </p>
            </div>
            <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-xl text-muted transition hover:bg-canvas hover:text-ink" :aria-label="`关闭并${cancelLabel}`" @click="emit('cancel')">
              ×
            </button>
          </div>
        </div>
        <div class="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <slot />
        </div>
        <div class="grid shrink-0 grid-cols-[1fr_1.7fr] gap-3 border-t border-line bg-white p-4 sm:px-5">
          <button type="button" class="min-h-12 rounded-2xl border border-line bg-white px-2 text-sm font-extrabold text-ink transition hover:bg-canvas" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button type="submit" class="min-h-12 rounded-2xl bg-brand px-3 text-sm font-extrabold text-white shadow-[0_8px_20px_rgb(31_122_85/0.18)] transition hover:bg-brand-dark">
            开始训练 →
          </button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>
