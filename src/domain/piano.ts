import type { MidiNote, PitchClass } from './pitch.ts'
import { midiNote, midiNoteFromPitchClass, pitchClasses } from './pitch.ts'

export const pitches = pitchClasses
export type Pitch = PitchClass

export interface NamedPitch {
  pitch: Pitch
  label: string
}

export type PianoKeyState = 'member' | 'active' | 'correct' | 'wrong'

export interface PianoKeyMark {
  midi: MidiNote
  state: PianoKeyState
  label?: string
  detail?: string
}

export interface PianoKeyShortcut {
  midi: MidiNote
  key: string
}

export interface PianoKeyboardKey {
  midi: MidiNote
  pitch: PitchClass
  black: boolean
  left: number
  width: number
  position: number
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

const blackPitchClasses = new Set<PitchClass>([1, 3, 6, 8, 10])

export const pianoKeys = pitches.map(pitch => ({
  pitch,
  midi: midiNoteFromPitchClass(pitch, 4),
  shortcut: ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'][pitch]!,
  black: blackPitchClasses.has(pitch),
}))

export const pianoKeyShortcuts: readonly PianoKeyShortcut[] = pianoKeys.map(key => ({
  midi: key.midi,
  key: key.shortcut,
}))

export function createPianoKeyboardKeys(from: MidiNote, to: MidiNote): PianoKeyboardKey[] {
  if (to < from) {
    throw new RangeError('Piano keyboard end note must not precede its start note')
  }
  const notes = Array.from({ length: to - from + 1 }, (_, offset) => midiNote(from + offset))
  const whiteCount = notes.filter(note => !blackPitchClasses.has((note % 12) as PitchClass)).length
  if (!whiteCount) {
    throw new RangeError('Piano keyboard range must contain at least one white key')
  }
  let whiteBefore = 0
  let blackPosition = 0
  return notes.map((note) => {
    const pitch = (note % 12) as PitchClass
    const black = blackPitchClasses.has(pitch)
    if (black) {
      blackPosition++
    }
    const position = black ? blackPosition : whiteBefore + 1
    const key = {
      midi: note,
      pitch,
      black,
      left: whiteBefore / whiteCount * 100,
      width: (black ? 0.68 : 1) / whiteCount * 100,
      position,
    }
    if (!black) {
      whiteBefore++
    }
    return key
  })
}

const pianoKeyStatePriority: readonly PianoKeyState[] = ['wrong', 'correct', 'active', 'member']

export function resolvePianoKeyState(marks: readonly PianoKeyMark[]): PianoKeyState | undefined {
  return pianoKeyStatePriority.find(state => marks.some(mark => mark.state === state))
}

export function namedPitch(pitch: Pitch, random = Math.random): NamedPitch {
  const names = pitchNames[pitch]!
  return { pitch, label: names[Math.floor(random() * names.length)]! }
}
