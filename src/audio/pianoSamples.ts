import type { MidiNote } from '../domain/pitch.ts'
import { midiNote } from '../domain/pitch.ts'

export interface PianoSampleDefinition {
  note: MidiNote
  file: string
}

/**
 * Sparse samples for C4–B4. The next C keeps every generated pitch within one
 * semitone of a recorded sample and can become the first anchor of the next tier.
 */
export const pianoSamples: readonly PianoSampleDefinition[] = [
  { note: midiNote(60), file: 'C4.mp3' },
  { note: midiNote(63), file: 'Ds4.mp3' },
  { note: midiNote(66), file: 'Fs4.mp3' },
  { note: midiNote(69), file: 'A4.mp3' },
  { note: midiNote(72), file: 'C5.mp3' },
]
