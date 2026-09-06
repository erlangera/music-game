<script setup lang="ts">
import type { MidiNote } from '@/domain/pitch'
import { computed } from 'vue'
import { midiNote, scientificPitch } from '@/domain/pitch'

interface ScaleKeyLabel {
  midi: MidiNote
  label: string
  degree: number
}

const props = defineProps<{
  activeMidi?: MidiNote
  correctMidi?: MidiNote
  interactive?: boolean
  pressedMidi?: MidiNote
  scaleNotes?: readonly ScaleKeyLabel[]
  showLabels?: boolean
  wrongMidi?: MidiNote
}>()

const emit = defineEmits<{ choose: [midi: MidiNote] }>()
const blackPitchClasses = new Set([1, 3, 6, 8, 10])
const keys = computed(() => Array.from({ length: 24 }, (_, offset) => {
  const midi = midiNote(60 + offset)
  const pitchClass = midi % 12
  const black = blackPitchClasses.has(pitchClass)
  const whiteBefore = Array.from({ length: offset }, (__, index) => 60 + index)
    .filter(note => !blackPitchClasses.has(note % 12))
    .length
  return {
    midi,
    black,
    left: (black ? whiteBefore : whiteBefore) / 14 * 100,
    position: Array.from({ length: offset + 1 }, (__, index) => 60 + index)
      .filter(note => blackPitchClasses.has(note % 12) === black)
      .length,
    scaleLabel: props.scaleNotes?.find(note => note.midi === midi),
  }
}))

function state(midi: MidiNote) {
  if (props.correctMidi === midi) {
    return 'correct'
  }
  if (props.wrongMidi === midi) {
    return 'wrong'
  }
  if (props.activeMidi === midi) {
    return 'target'
  }
  if (props.pressedMidi === midi) {
    return 'pressed'
  }
  if (props.scaleNotes?.some(note => note.midi === midi)) {
    return 'scale'
  }
  return undefined
}

function accessibleLabel(midi: MidiNote) {
  const key = keys.value.find(item => item.midi === midi)!
  const scaleLabel = props.scaleNotes?.find(note => note.midi === midi)
  const identity = props.interactive && !props.showLabels
    ? `从左起第 ${key.position} 个${key.black ? '黑键' : '白键'}`
    : `${scaleLabel?.label ?? scientificPitch(midi)}${scaleLabel ? `，第 ${scaleLabel.degree} 级` : ''}`
  return `${identity}${props.activeMidi === midi ? '，当前目标' : ''}${props.correctMidi === midi ? '，正确琴键' : ''}${props.wrongMidi === midi ? '，错误琴键' : ''}`
}
</script>

<template>
  <div class="min-w-[620px]">
    <div class="relative isolate h-44 w-full sm:h-56" role="group" aria-label="两八度钢琴，从 C4 到 B5">
      <button
        v-for="key in keys" :key="key.midi" type="button" data-piano-key
        class="absolute top-0 flex min-w-0 items-end justify-center rounded-b-md border pb-2 transition-colors"
        :class="[key.black ? 'z-10 h-[60%] w-[4.8%] -translate-x-1/2 border-ink bg-ink text-white shadow-md' : 'h-full w-[7.142857%] border-line bg-white text-ink', { 'cursor-pointer': interactive }]"
        :style="{ left: `${key.left}%` }" :data-key-color="key.black ? 'black' : 'white'" :data-state="state(key.midi)"
        :disabled="!interactive" :aria-label="accessibleLabel(key.midi)"
        @click="emit('choose', key.midi)"
      >
        <span v-if="showLabels" class="flex flex-col items-center text-[9px] leading-tight font-extrabold sm:text-xs">
          <span>{{ key.scaleLabel?.label ?? scientificPitch(key.midi).replace(/\d+$/, '') }}</span>
          <span v-if="key.scaleLabel" class="mt-0.5 opacity-55">{{ key.scaleLabel.degree }}</span>
        </span>
        <span v-else-if="state(key.midi) === 'correct'" class="text-sm font-black" aria-hidden="true">✓</span>
        <span v-else-if="state(key.midi) === 'wrong'" class="text-sm font-black" aria-hidden="true">×</span>
        <span v-else-if="state(key.midi) === 'target'" class="text-sm font-black" aria-hidden="true">●</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
[data-state="scale"] { background: color-mix(in srgb, var(--color-brand-soft) 65%, white); }
[data-state="target"] { color: var(--color-brand-dark); background: var(--color-brand-soft); box-shadow: inset 0 0 0 3px var(--color-brand-dark); }
[data-state="correct"] { color: var(--color-brand-dark); background: var(--color-brand-soft); box-shadow: inset 0 0 0 3px var(--color-brand); }
[data-state="wrong"] { color: var(--color-error); background: var(--color-error-soft); box-shadow: inset 0 0 0 3px var(--color-error); }
[data-state="pressed"] { color: var(--color-ink); background: var(--color-lime); box-shadow: inset 0 0 0 3px var(--color-brand); transform: translateY(3px); }
[data-key-color="black"][data-state="scale"] { color: white; background: var(--color-brand-dark); box-shadow: inset 0 0 0 3px var(--color-lime), 0 4px 10px rgb(22 93 64 / 0.28); }
[data-key-color="black"][data-state="target"],
[data-key-color="black"][data-state="correct"] { color: white; background: var(--color-brand); box-shadow: inset 0 0 0 4px var(--color-lime), 0 4px 12px rgb(22 93 64 / 0.35); }
[data-key-color="black"][data-state="wrong"] { color: white; background: var(--color-error); box-shadow: inset 0 0 0 4px #ffc9c9, 0 4px 12px rgb(172 54 54 / 0.3); }
[data-key-color="black"][data-state="pressed"] { color: var(--color-ink); background: var(--color-lime); box-shadow: inset 0 0 0 3px white, 0 4px 12px rgb(22 93 64 / 0.35); }
[data-piano-key]:focus-visible { outline-offset: -4px; }
button { touch-action: manipulation; user-select: none; }
button:enabled:hover { box-shadow: inset 0 0 0 3px var(--color-brand); }
@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
}
</style>
