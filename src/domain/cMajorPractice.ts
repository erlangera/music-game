import type { MidiNote, PitchClass } from './pitch.ts'
import { midiNote, pitchClassOf } from './pitch.ts'
import { shuffle } from './solfegePractice.ts'

export const degrees = [1, 2, 3, 4, 5, 6, 7] as const
export type Degree = typeof degrees[number]
export type MappingDirection = 'degree-to-key' | 'key-to-degree'
export interface MappingSettings {
  direction: MappingDirection
  mode: 'fixed' | 'infinite'
  sequenceLength: number
}
export interface MappingNote {
  degree: Degree
  pitch: PitchClass
  midi: MidiNote
  name: string
}
const offsets = [0, 2, 4, 5, 7, 9, 11] as const
const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export const cMajorNotes: readonly MappingNote[] = degrees.map((degree, index) => ({
  degree,
  pitch: offsets[index]!,
  midi: midiNote(60 + offsets[index]!),
  name: names[index]!,
}))
export interface MappingQuestion {
  direction: MappingDirection
  sequence: readonly MappingNote[]
}
export interface MappingAnswer {
  index: number
  status: 'answering' | 'correct' | 'wrong'
  selected?: MidiNote
}
export function answerMapping(question: MappingQuestion, answer: MappingAnswer, selected: MidiNote): MappingAnswer {
  const expected = question.sequence[answer.index]
  if (answer.status !== 'answering' || !expected) {
    return answer
  }
  if (pitchClassOf(selected) !== expected.pitch) {
    return { index: answer.index, status: 'wrong', selected }
  }
  const index = answer.index + 1
  return { index, status: index === question.sequence.length ? 'correct' : 'answering', selected }
}

export function createMappingGenerator(settings: MappingSettings, random = Math.random) {
  const { direction, sequenceLength } = settings
  if (!Number.isInteger(sequenceLength) || sequenceLength < 1 || sequenceLength > 12) {
    throw new RangeError('Sequence length must be an integer from 1 to 12')
  }
  let bag: MappingNote[] = []
  let last: Degree | undefined
  function nextNote() {
    if (!bag.length) {
      bag = shuffle(cMajorNotes, random)
      if (bag[0]!.degree === last) {
        [bag[0], bag[1]] = [bag[1]!, bag[0]!]
      }
    }
    const note = bag.shift()!
    last = note.degree
    return note
  }
  return (): MappingQuestion => ({ direction, sequence: Array.from({ length: sequenceLength }, nextNote) })
}
