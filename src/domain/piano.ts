import type { PitchClass } from './pitch.ts'
import { midiNoteFromPitchClass, pitchClasses } from './pitch.ts'

export const pitches = pitchClasses
export type Pitch = PitchClass

export interface NamedPitch {
  pitch: Pitch
  label: string
}

export const pitchNames: readonly (readonly string[])[] = [
  ['C'],
  ['C♯', 'D♭'],
  ['D'],
  ['D♯', 'E♭'],
  ['E'],
  ['F'],
  ['F♯', 'G♭'],
  ['G'],
  ['G♯', 'A♭'],
  ['A'],
  ['A♯', 'B♭'],
  ['B'],
]

export const pianoKeys = pitches.map(pitch => ({
  pitch,
  midi: midiNoteFromPitchClass(pitch, 4),
  shortcut: ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'][pitch]!,
  black: [1, 3, 6, 8, 10].includes(pitch),
  left: [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6][pitch]! / 7 * 100,
}))

export function namedPitch(pitch: Pitch, random = Math.random): NamedPitch {
  const names = pitchNames[pitch]!
  return { pitch, label: names[Math.floor(random() * names.length)]! }
}
