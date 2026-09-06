<script setup lang="ts">
import type { PianoKeyMark, PianoKeyShortcut } from '@/domain/piano'
import type { MidiNote } from '@/domain/pitch'
import { computed, ref } from 'vue'
import { createPianoKeyboardKeys, pitchNames, resolvePianoKeyState } from '@/domain/piano'
import { midiNote, scientificPitch } from '@/domain/pitch'

const props = defineProps<{
  compact?: boolean
  depressedNotes?: readonly MidiNote[]
  from?: MidiNote
  interactive?: boolean
  marks?: readonly PianoKeyMark[]
  minimumWhiteKeyWidth?: number
  shortcuts?: readonly PianoKeyShortcut[]
  showLabels?: boolean
  to?: MidiNote
}>()

const emit = defineEmits<{
  noteOn: [midi: MidiNote]
  noteOff: [midi: MidiNote]
  select: [midi: MidiNote]
}>()

const pointerDepressedNotes = ref<MidiNote[]>([])
const from = computed(() => props.from ?? midiNote(60))
const to = computed(() => props.to ?? midiNote(71))
const keys = computed(() => createPianoKeyboardKeys(from.value, to.value))
const whiteKeyCount = computed(() => keys.value.filter(key => !key.black).length)
const marksByMidi = computed(() => {
  const result = new Map<MidiNote, PianoKeyMark[]>()
  for (const mark of props.marks ?? []) {
    result.set(mark.midi, [...result.get(mark.midi) ?? [], mark])
  }
  return result
})
const shortcutsByMidi = computed(() => new Map((props.shortcuts ?? []).map(item => [item.midi, item.key])))
const keyboardLabel = computed(() => {
  const whiteKeys = keys.value.filter(key => !key.black).length
  const blackKeys = keys.value.length - whiteKeys
  return `${scientificPitch(from.value)} 到 ${scientificPitch(to.value)} 的钢琴，${whiteKeys} 个白键和 ${blackKeys} 个黑键`
})
const keyboardStyle = computed(() => props.minimumWhiteKeyWidth
  ? { minWidth: `${whiteKeyCount.value * props.minimumWhiteKeyWidth}px` }
  : undefined)

function marksFor(midi: MidiNote) {
  return marksByMidi.value.get(midi) ?? []
}

function state(midi: MidiNote) {
  return resolvePianoKeyState(marksFor(midi))
}

function annotation(midi: MidiNote) {
  return marksFor(midi).find(mark => mark.label || mark.detail)
}

function shortcut(midi: MidiNote) {
  return shortcutsByMidi.value.get(midi)
}

function primaryLabel(midi: MidiNote) {
  return annotation(midi)?.label ?? pitchNames[midi % 12]![0]
}

function secondaryLabel(midi: MidiNote) {
  return annotation(midi)?.detail ?? shortcut(midi)?.toUpperCase()
}

function accessibleDetail(midi: MidiNote) {
  const detail = annotation(midi)?.detail
  return detail && /^\d+$/.test(detail) ? `第 ${detail} 级` : detail
}

function isDepressed(midi: MidiNote) {
  return pointerDepressedNotes.value.includes(midi) || props.depressedNotes?.includes(midi)
}

function accessibleLabel(midi: MidiNote) {
  const key = keys.value.find(item => item.midi === midi)!
  const keyAnnotation = annotation(midi)
  const detail = accessibleDetail(midi)
  const identity = props.showLabels
    ? `${primaryLabel(midi)}${detail ? `，${detail}` : ''}`
    : `从左起第 ${key.position} 个${key.black ? '黑键' : '白键'}`
  const keyShortcut = props.interactive && shortcut(midi) ? `，快捷键 ${shortcut(midi)!.toUpperCase()}` : ''
  const stateLabels = {
    active: '，当前高亮',
    correct: `，正确琴键${keyAnnotation?.label ? ` ${keyAnnotation.label}` : ''}`,
    member: '，音阶成员',
    wrong: `，错误琴键${keyAnnotation?.label ? ` ${keyAnnotation.label}` : ''}`,
  }
  const keyState = state(midi)
  const stateText = keyState ? stateLabels[keyState] : ''
  return `${identity}${keyShortcut}${stateText}`
}

function handlePointerDown(event: PointerEvent, midi: MidiNote) {
  if (!props.interactive) {
    return
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pointerDepressedNotes.value = [...pointerDepressedNotes.value, midi]
  emit('noteOn', midi)
}

function handlePointerEnd(midi: MidiNote) {
  if (props.interactive) {
    pointerDepressedNotes.value = pointerDepressedNotes.value.filter(item => item !== midi)
    emit('noteOff', midi)
  }
}
</script>

<template>
  <div :style="keyboardStyle">
    <div
      class="relative isolate w-full" :class="compact ? 'h-28 sm:h-48' : 'h-48 sm:h-60'"
      role="group" :aria-label="keyboardLabel"
    >
      <button
        v-for="key in keys" :key="key.midi" type="button" data-piano-key
        class="absolute top-0 flex min-w-0 items-end justify-center rounded-b-md border pb-3"
        :class="[key.black ? 'z-10 h-[60%] -translate-x-1/2 border-ink bg-ink text-white shadow-md' : 'h-full border-line bg-white text-ink', { 'cursor-pointer': interactive }]"
        :style="{ left: `${key.left}%`, width: `${key.width}%` }"
        :data-key-color="key.black ? 'black' : 'white'" :data-state="state(key.midi)"
        :data-depressed="isDepressed(key.midi) || undefined"
        :disabled="!interactive" :aria-label="accessibleLabel(key.midi)"
        :aria-pressed="interactive ? isDepressed(key.midi) : undefined"
        @click="emit('select', key.midi)" @pointerdown="handlePointerDown($event, key.midi)"
        @pointerup="handlePointerEnd(key.midi)" @pointercancel="handlePointerEnd(key.midi)"
      >
        <span v-if="showLabels" class="flex flex-col items-center text-[9px] leading-tight font-extrabold sm:text-sm">
          <span>{{ primaryLabel(key.midi) }}</span>
          <span v-if="secondaryLabel(key.midi)" class="mt-0.5 opacity-60">{{ secondaryLabel(key.midi) }}</span>
        </span>
        <span v-else-if="state(key.midi) === 'correct'" class="flex flex-col items-center text-xs font-extrabold sm:text-lg">
          <span aria-hidden="true">✓</span>{{ annotation(key.midi)?.label }}
        </span>
        <span v-else-if="state(key.midi) === 'wrong'" class="flex flex-col items-center text-xs font-extrabold sm:text-lg">
          <span aria-hidden="true">×</span>{{ annotation(key.midi)?.label }}
        </span>
        <span v-else-if="state(key.midi) === 'active'" class="text-xl" aria-hidden="true">●</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
[data-piano-key] {
  touch-action: none;
  user-select: none;
  transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease, filter 150ms ease, transform 90ms ease;
}
[data-piano-key]:focus-visible { outline-offset: -4px; }
[data-piano-key]:enabled:hover { filter: brightness(0.97); }
[data-key-color="white"][data-state="member"] { background: color-mix(in srgb, var(--color-brand-soft) 62%, white); box-shadow: inset 0 0 0 2px rgb(31 122 85 / 0.25); }
[data-key-color="black"][data-state="member"] { color: white; background: color-mix(in srgb, var(--color-ink) 82%, var(--color-brand-dark)); box-shadow: inset 0 0 0 2px var(--color-brand), 0 4px 10px rgb(23 34 29 / 0.24); }
[data-key-color="white"][data-state="active"] { color: var(--color-ink); background: var(--color-lime); box-shadow: inset 0 0 0 3px var(--color-brand); }
[data-key-color="black"][data-state="active"] { color: white; background: var(--color-ink); box-shadow: inset 0 0 0 4px var(--color-lime), 0 4px 12px rgb(22 93 64 / 0.32); }
[data-key-color="white"][data-state="correct"] { color: var(--color-brand-dark); background: var(--color-brand-soft); box-shadow: inset 0 0 0 3px var(--color-brand); }
[data-key-color="black"][data-state="correct"] { color: white; background: var(--color-brand); box-shadow: inset 0 0 0 4px var(--color-brand-soft), 0 4px 12px rgb(22 93 64 / 0.32); }
[data-key-color="white"][data-state="wrong"] { color: var(--color-error); background: var(--color-error-soft); box-shadow: inset 0 0 0 3px var(--color-error); }
[data-key-color="black"][data-state="wrong"] { color: white; background: var(--color-error); box-shadow: inset 0 0 0 4px var(--color-error-soft), 0 4px 12px rgb(172 54 54 / 0.28); }
[data-depressed="true"] { transform: translateY(3px); }
@media (prefers-reduced-motion: reduce) {
  [data-piano-key] { transition: none; }
}
</style>
