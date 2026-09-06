import type { MajorScaleDefinition, MajorScaleId } from './majorScale.ts'
import type { MidiNote } from './pitch.ts'
import { majorScaleIds, majorScales, scaleMidiNotes } from './majorScale.ts'
import { midiNote } from './pitch.ts'

export const relativePitchCategories = ['tonic', 'degree', 'relationship', 'dictation'] as const
export type RelativePitchCategory = typeof relativePitchCategories[number]
export type RelativePitchMode = 'fixed' | 'infinite'
export type TonalHint = 'scale' | 'triad' | 'cadence' | 'tonic'
export type TonicExercise = 'choice' | 'piano'

export interface RelativePitchAudioStep {
  notes: readonly MidiNote[]
  durationMilliseconds: number
  gapMilliseconds: number
}

export interface TonicQuestion {
  id: string
  type: TonicExercise
  scale: MajorScaleDefinition
  tonicMidi: MidiNote
  distractorDegree: number
  candidateMidi: readonly [MidiNote, MidiNote]
  correctCandidateIndex: 0 | 1
}

export const tonalHintLabels: Record<TonalHint, string> = {
  scale: '完整音阶',
  triad: '主和弦分解',
  cadence: 'I–V–I 终止式',
  tonic: '只播放主音',
}

export const relativePitchCategoryCopy: Record<RelativePitchCategory, { title: string, description: string }> = {
  tonic: { title: '主音感', description: '找到“1”，感受稳定与回家的位置' },
  degree: { title: '音级听辨', description: '从 1、3、5 开始认识七个功能音级' },
  relationship: { title: '音级关系', description: '连接主动找音、两音关系与短音型' },
  dictation: { title: '旋律听写', description: '把短旋律听成有方向的音级序列' },
}

/** Curated patterns reserved for the later relationship practice. */
export const curatedRelativePitchMotifs = [
  [1, 2, 3],
  [3, 2, 1],
  [1, 3, 5],
  [5, 3, 1],
  [5, 6, 5],
  [3, 4, 3],
  [1, 2, 1],
  [2, 3, 2],
  [7, 1],
  [4, 3],
  [6, 5],
] as const

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

function single(note: MidiNote, gapMilliseconds = 80, durationMilliseconds = 500): RelativePitchAudioStep {
  return { notes: [note], durationMilliseconds, gapMilliseconds }
}

function chord(notes: readonly MidiNote[], gapMilliseconds = 180, durationMilliseconds = 650): RelativePitchAudioStep {
  return { notes, durationMilliseconds, gapMilliseconds }
}

export function scaleDegreeMidi(scale: MajorScaleDefinition, degree: number): MidiNote {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new RangeError('Scale degree must be an integer from 1 to 7')
  }
  return scaleMidiNotes(scale)[degree - 1]!
}

export function tonalContextSteps(scale: MajorScaleDefinition, hint: TonalHint): RelativePitchAudioStep[] {
  const notes = scaleMidiNotes(scale)
  if (hint === 'scale') {
    return notes.map((note, index) => single(note, index === notes.length - 1 ? 600 : 80))
  }
  if (hint === 'triad') {
    return [notes[0]!, notes[2]!, notes[4]!, notes[7]!]
      .map((note, index, sequence) => single(note, index === sequence.length - 1 ? 600 : 80))
  }
  if (hint === 'cadence') {
    return [
      chord([notes[0]!, notes[2]!, notes[4]!]),
      chord([notes[1]!, notes[4]!, notes[6]!]),
      chord([notes[0]!, notes[2]!, notes[4]!], 600),
    ]
  }
  return [single(notes[0]!, 600, 700)]
}

export function tonicQuestionSteps(question: TonicQuestion, hint: TonalHint): RelativePitchAudioStep[] {
  const context = tonalContextSteps(question.scale, hint)
  if (question.type === 'choice') {
    return [
      ...context,
      single(question.candidateMidi[0], 500, 700),
      single(question.candidateMidi[1], 0, 700),
    ]
  }
  const melodyDegrees = [3, 5, 6, 5, 2]
  return [
    ...context,
    ...melodyDegrees.map((degree, index) => single(
      scaleDegreeMidi(question.scale, degree),
      index === melodyDegrees.length - 1 ? 0 : 80,
      500,
    )),
  ]
}

export function tonicResolutionSteps(question: TonicQuestion): RelativePitchAudioStep[] {
  return [
    single(scaleDegreeMidi(question.scale, 5), 120, 600),
    single(question.tonicMidi, 0, 800),
  ]
}

export function isTonicChoiceAnswer(question: TonicQuestion, candidateIndex: number) {
  return question.type === 'choice' && candidateIndex === question.correctCandidateIndex
}

export function isTonicPianoAnswer(question: TonicQuestion, answer: MidiNote) {
  return question.type === 'piano' && answer === question.tonicMidi
}

export function createTonicQuestionGenerator(random = Math.random): () => TonicQuestion {
  let serial = 0
  let scaleQueue: MajorScaleId[] = []
  let exerciseQueue: TonicExercise[] = []
  let distractorQueue: number[] = []

  function nextScale() {
    if (!scaleQueue.length) {
      scaleQueue = shuffle(majorScaleIds, random)
    }
    return majorScales[scaleQueue.shift()!]
  }

  function nextExercise() {
    if (!exerciseQueue.length) {
      exerciseQueue = shuffle<TonicExercise>(['choice', 'piano'], random)
    }
    return exerciseQueue.shift()!
  }

  function nextDistractorDegree() {
    if (!distractorQueue.length) {
      distractorQueue = shuffle([2, 3, 4, 5, 6, 7], random)
    }
    return distractorQueue.shift()!
  }

  return () => {
    const scale = nextScale()
    const type = nextExercise()
    const distractorDegree = nextDistractorDegree()
    const tonicMidi = scale.lowTonicMidi
    const distractorMidi = scaleDegreeMidi(scale, distractorDegree)
    const tonicFirst = random() < 0.5
    return {
      id: `tonic-${++serial}`,
      type,
      scale,
      tonicMidi,
      distractorDegree,
      candidateMidi: tonicFirst ? [tonicMidi, distractorMidi] : [distractorMidi, tonicMidi],
      correctCandidateIndex: tonicFirst ? 0 : 1,
    }
  }
}

export const relativePitchLearningKeyboardFrom = midiNote(60)
export const relativePitchLearningKeyboardTo = midiNote(83)
export const tonicKeyboardFrom = midiNote(60)
export const tonicKeyboardTo = midiNote(71)
