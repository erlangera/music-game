export const pitchClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

export type PitchClass = typeof pitchClasses[number]

declare const midiNoteBrand: unique symbol
export type MidiNote = number & { readonly [midiNoteBrand]: true }

const scientificPitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export function midiNote(value: number): MidiNote {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError('MIDI note must be an integer from 0 to 127')
  }
  return value as MidiNote
}

export function midiNoteFromPitchClass(pitchClass: PitchClass, octave: number): MidiNote {
  if (!Number.isInteger(octave) || octave < -1 || octave > 9) {
    throw new RangeError('Octave must be an integer from -1 to 9')
  }
  return midiNote((octave + 1) * 12 + pitchClass)
}

export function scientificPitch(midi: MidiNote): string {
  const pitchClass = midi % 12
  const octave = Math.floor(midi / 12) - 1
  return `${scientificPitchNames[pitchClass]}${octave}`
}

export function pitchClassOf(midi: MidiNote): PitchClass {
  return (midi % 12) as PitchClass
}
