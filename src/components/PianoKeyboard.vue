<script setup lang="ts">
import type { NamedPitch, Pitch } from '@/domain/piano'
import { pianoKeys, pitchNames } from '@/domain/piano'

const props = defineProps<{
  compact?: boolean
  interactive?: boolean
  target?: Pitch
  correct?: NamedPitch
  wrong?: NamedPitch
  pressed?: readonly Pitch[]
  showLabels?: boolean
}>()
const emit = defineEmits<{
  choose: [pitch: Pitch]
  press: [pitch: Pitch]
  release: [pitch: Pitch]
}>()
function label(key: typeof pianoKeys[number]) {
  const kind = key.black ? '黑键' : '白键'
  const position = pianoKeys.filter(item => item.black === key.black).findIndex(item => item.pitch === key.pitch) + 1
  return `从左起第 ${position} 个${kind}${props.interactive ? `，快捷键 ${key.shortcut.toUpperCase()}` : ''}${props.target === key.pitch ? '，正在展示' : ''}${props.correct?.pitch === key.pitch ? `，正确答案 ${props.correct.label}` : ''}${props.wrong?.pitch === key.pitch ? `，你的选择 ${props.wrong.label}` : ''}`
}

function handlePointerDown(event: PointerEvent, pitch: Pitch) {
  if (!props.interactive) {
    return
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  emit('press', pitch)
}

function handlePointerEnd(pitch: Pitch) {
  if (props.interactive) {
    emit('release', pitch)
  }
}
</script>

<template>
  <div class="relative isolate w-full" :class="compact ? 'h-28 sm:h-48' : 'h-48 sm:h-60'" role="group" aria-label="一个八度钢琴，七个白键和五个黑键">
    <button
      v-for="key in pianoKeys" :key="key.pitch" type="button" data-piano-key
      class="absolute top-0 flex min-w-0 items-end justify-center rounded-b-md border pb-3 transition-colors"
      :class="[key.black ? 'z-10 h-[60%] w-[10%] -translate-x-1/2 border-ink bg-ink text-white shadow-md' : 'h-full w-[14.285714%] border-line bg-white text-ink', { 'cursor-pointer': interactive }]"
      :style="{ left: `${key.left}%` }"
      :data-state="correct?.pitch === key.pitch ? 'correct' : wrong?.pitch === key.pitch ? 'wrong' : target === key.pitch ? 'target' : pressed?.includes(key.pitch) ? 'pressed' : undefined"
      :disabled="!interactive" :aria-label="showLabels ? `${pitchNames[key.pitch]![0]}，快捷键 ${key.shortcut.toUpperCase()}` : label(key)"
      :aria-pressed="showLabels ? pressed?.includes(key.pitch) : undefined"
      @click="emit('choose', key.pitch)" @pointerdown="handlePointerDown($event, key.pitch)"
      @pointerup="handlePointerEnd(key.pitch)" @pointercancel="handlePointerEnd(key.pitch)"
    >
      <span v-if="correct?.pitch === key.pitch || wrong?.pitch === key.pitch" class="flex flex-col items-center text-xs font-extrabold sm:text-lg">
        <span>{{ correct?.pitch === key.pitch ? '✓' : '×' }}</span>{{ correct?.pitch === key.pitch ? correct.label : wrong?.label }}
      </span>
      <span v-else-if="target === key.pitch" class="text-xl" aria-hidden="true">●</span>
      <span v-else-if="showLabels" class="flex flex-col items-center text-[10px] leading-tight font-extrabold sm:text-sm">
        <span>{{ pitchNames[key.pitch]![0] }}</span>
        <span class="mt-0.5 opacity-55">{{ key.shortcut.toUpperCase() }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
[data-piano-key]:focus-visible { outline-offset: -4px; }
[data-piano-key] { touch-action: none; user-select: none; }
[data-piano-key]:enabled:hover { box-shadow: inset 0 0 0 3px var(--color-brand); }
[data-state="target"] { background: var(--color-brand-soft); color: var(--color-brand-dark); box-shadow: inset 0 0 0 3px var(--color-brand); animation: identify 600ms ease-out; }
[data-state="correct"] { background: var(--color-brand-soft); color: var(--color-brand-dark); box-shadow: inset 0 0 0 3px var(--color-brand); }
[data-state="wrong"] { background: var(--color-error-soft); color: var(--color-error); box-shadow: inset 0 0 0 3px var(--color-error); }
[data-state="pressed"] { background: var(--color-lime); color: var(--color-ink); box-shadow: inset 0 0 0 3px var(--color-brand); transform: translateY(3px); }
@keyframes identify {
  0%, 33% { background: var(--color-brand); color: white; }
  100% { background: var(--color-brand-soft); color: var(--color-brand-dark); }
}
@media (prefers-reduced-motion: reduce) {
  [data-state="target"] { animation: none; }
  [data-piano-key] { transition: none; }
}
</style>
