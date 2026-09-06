import type { MidiNote, PitchClass } from './pitch.ts'
import { midiNote } from './pitch.ts'

export const majorScaleIds = ['C', 'G', 'F', 'D', 'A', 'B♭', 'E', 'E♭', 'B', 'A♭', 'D♭', 'F♯'] as const
export type MajorScaleId = typeof majorScaleIds[number]
export type Accidental = '' | '♯' | '♭'
export type MajorScaleExercise = 'accidentals' | 'repair' | 'mapping' | 'piano'
export type MajorScaleFocus = MajorScaleExercise | 'mixed'
export type PracticeMode = 'fixed' | 'infinite'

export interface MajorScaleDefinition {
  id: MajorScaleId
  name: string
  lesson: number
  summary: string
  insight: string
  notes: readonly [string, string, string, string, string, string, string]
  pitchClasses: readonly [PitchClass, PitchClass, PitchClass, PitchClass, PitchClass, PitchClass, PitchClass]
  lowTonicMidi: MidiNote
}

export interface MajorScaleSettings {
  focus: MajorScaleFocus
  key: MajorScaleId | 'all'
  mode: PracticeMode
}

interface QuestionBase {
  id: string
  type: MajorScaleExercise
  scale: MajorScaleDefinition
}

export interface AccidentalsQuestion extends QuestionBase {
  type: 'accidentals'
  expectedIndices: number[]
}

export interface RepairQuestion extends QuestionBase {
  type: 'repair'
  displayedNotes: string[]
  wrongIndex: number
  expectedAccidental: Accidental
}

export interface MappingQuestion extends QuestionBase {
  type: 'mapping'
  direction: 'degree-to-note' | 'note-to-degree'
  degree: number
  options: string[]
}

export interface PianoQuestion extends QuestionBase {
  type: 'piano'
  expectedMidi: MidiNote[]
}

export type MajorScaleQuestion = AccidentalsQuestion | RepairQuestion | MappingQuestion | PianoQuestion

const pitchClassByLetter: Record<string, PitchClass> = {
  A: 9,
  B: 11,
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
}

export const majorScales: Record<MajorScaleId, MajorScaleDefinition> = {
  'C': {
    id: 'C',
    name: 'C 大调',
    lesson: 2,
    summary: '第一次完整走出大调结构',
    insight: 'C 大调不需要升降号，但 E–F 与 B–C 本身就是半音。',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    pitchClasses: [0, 2, 4, 5, 7, 9, 11],
    lowTonicMidi: midiNote(60),
  },
  'G': {
    id: 'G',
    name: 'G 大调',
    lesson: 3,
    summary: '第一次遇到升号 F♯',
    insight: '第 7 级需要与高音主音保持半音，因此 F 要升高为 F♯。',
    notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'],
    pitchClasses: [7, 9, 11, 0, 2, 4, 6],
    lowTonicMidi: midiNote(67),
  },
  'F': {
    id: 'F',
    name: 'F 大调',
    lesson: 4,
    summary: '第一次遇到降号 B♭',
    insight: '第 3 级到第 4 级需要半音，因此 B 要降低为 B♭，不能写成 A♯。',
    notes: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'],
    pitchClasses: [5, 7, 9, 10, 0, 2, 4],
    lowTonicMidi: midiNote(65),
  },
  'D': {
    id: 'D',
    name: 'D 大调',
    lesson: 5,
    summary: '同时记住 F♯ 与 C♯',
    insight: '第 3 级是 F♯，第 7 级是 C♯，共同保持大调的固定距离。',
    notes: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'],
    pitchClasses: [2, 4, 6, 7, 9, 11, 1],
    lowTonicMidi: midiNote(62),
  },
  'A': {
    id: 'A',
    name: 'A 大调',
    lesson: 6,
    summary: '三个升号组成新的键位轮廓',
    insight: 'F♯、C♯、G♯依次出现；第 7 级 G♯与高音 A 保持半音。',
    notes: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'],
    pitchClasses: [9, 11, 1, 2, 4, 6, 8],
    lowTonicMidi: midiNote(69),
  },
  'B♭': {
    id: 'B♭',
    name: 'B♭ 大调',
    lesson: 7,
    summary: '从黑键 B♭开始',
    insight: '主音本身就是 B♭，第 4 级还需要 E♭；七个音级仍各用一个不同字母。',
    notes: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'],
    pitchClasses: [10, 0, 2, 3, 5, 7, 9],
    lowTonicMidi: midiNote(70),
  },
  'E': {
    id: 'E',
    name: 'E 大调',
    lesson: 8,
    summary: '四个升号连接成完整结构',
    insight: 'F♯、C♯、G♯、D♯共同维持 E 大调的全半音顺序。',
    notes: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'],
    pitchClasses: [4, 6, 8, 9, 11, 1, 3],
    lowTonicMidi: midiNote(64),
  },
  'E♭': {
    id: 'E♭',
    name: 'E♭ 大调',
    lesson: 9,
    summary: '三个降号组成黑键起点音阶',
    insight: 'B♭、E♭、A♭是这个调的三个降音，主音 E♭本身位于黑键。',
    notes: ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'],
    pitchClasses: [3, 5, 7, 8, 10, 0, 2],
    lowTonicMidi: midiNote(63),
  },
  'B': {
    id: 'B',
    name: 'B 大调',
    lesson: 10,
    summary: '五个升号覆盖大部分黑键',
    insight: 'C♯、D♯、F♯、G♯、A♯都要升高，E 与 B 保持自然音。',
    notes: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'],
    pitchClasses: [11, 1, 3, 4, 6, 8, 10],
    lowTonicMidi: midiNote(71),
  },
  'A♭': {
    id: 'A♭',
    name: 'A♭ 大调',
    lesson: 11,
    summary: '四个降号构成柔和的键位轮廓',
    insight: 'B♭、E♭、A♭、D♭是四个降音；A♭既是主音，也是黑键起点。',
    notes: ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'],
    pitchClasses: [8, 10, 0, 1, 3, 5, 7],
    lowTonicMidi: midiNote(68),
  },
  'D♭': {
    id: 'D♭',
    name: 'D♭ 大调',
    lesson: 12,
    summary: '五个降号覆盖大部分黑键',
    insight: 'D♭、E♭、G♭、A♭、B♭都是降音，F 与 C 保持自然音。',
    notes: ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'],
    pitchClasses: [1, 3, 5, 6, 8, 10, 0],
    lowTonicMidi: midiNote(61),
  },
  'F♯': {
    id: 'F♯',
    name: 'F♯ 大调',
    lesson: 13,
    summary: '六个升号完成十二主音学习',
    insight: '除了 B 以外，其余字母都带升号；第 7 级必须写 E♯，不能写 F。',
    notes: ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'],
    pitchClasses: [6, 8, 10, 11, 1, 3, 5],
    lowTonicMidi: midiNote(66),
  },
}

export const majorScaleExercises: MajorScaleExercise[] = ['accidentals', 'repair', 'mapping', 'piano']
export const majorScaleSteps = ['全', '全', '半', '全', '全', '全', '半'] as const

export function accidentalOf(note: string): Accidental {
  if (note.includes('♯')) {
    return '♯'
  }
  if (note.includes('♭')) {
    return '♭'
  }
  return ''
}

export function naturalLetter(note: string) {
  return note[0]!
}

export function scaleMidiNotes(scale: MajorScaleDefinition): MidiNote[] {
  const result = [scale.lowTonicMidi]
  for (let index = 1; index < scale.pitchClasses.length; index++) {
    let candidate = Math.floor(scale.lowTonicMidi / 12) * 12 + scale.pitchClasses[index]!
    while (candidate <= result[index - 1]!) {
      candidate += 12
    }
    result.push(midiNote(candidate))
  }
  result.push(midiNote(scale.lowTonicMidi + 12))
  return result
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

export function isAccidentalsAnswer(question: AccidentalsQuestion, selectedIndices: readonly number[]) {
  return [...selectedIndices].sort((a, b) => a - b).join(',') === question.expectedIndices.join(',')
}

export function isRepairAnswer(question: RepairQuestion, index: number | undefined, accidental: Accidental | undefined) {
  return index === question.wrongIndex && accidental === question.expectedAccidental
}

export function isMappingAnswer(question: MappingQuestion, answer: string | undefined) {
  return answer === (question.direction === 'degree-to-note' ? question.scale.notes[question.degree - 1] : String(question.degree))
}

export function createMajorScaleGenerator(settings: MajorScaleSettings, random = Math.random): () => MajorScaleQuestion {
  let serial = 0
  let scaleQueue: MajorScaleId[] = []
  let exerciseQueue: MajorScaleExercise[] = []
  let mappingDirection: MappingQuestion['direction'] = random() < 0.5 ? 'degree-to-note' : 'note-to-degree'

  function nextScale() {
    if (settings.key !== 'all') {
      return majorScales[settings.key]
    }
    if (!scaleQueue.length) {
      scaleQueue = shuffle(majorScaleIds, random)
    }
    return majorScales[scaleQueue.shift()!]
  }

  function nextExercise() {
    if (settings.focus !== 'mixed') {
      return settings.focus
    }
    if (!exerciseQueue.length) {
      exerciseQueue = shuffle(majorScaleExercises, random)
    }
    return exerciseQueue.shift()!
  }

  return () => {
    const scale = nextScale()
    const type = nextExercise()
    const base = { id: `scale-${++serial}`, scale }
    if (type === 'accidentals') {
      return {
        ...base,
        type,
        expectedIndices: scale.notes.flatMap((note, index) => accidentalOf(note) ? [index] : []),
      }
    }
    if (type === 'repair') {
      const accidentalIndices = scale.notes.flatMap((note, index) => accidentalOf(note) ? [index] : [])
      const candidates = accidentalIndices.length ? accidentalIndices : [1, 2, 3, 4, 5, 6]
      const wrongIndex = candidates[Math.floor(random() * candidates.length)]!
      const expectedAccidental = accidentalOf(scale.notes[wrongIndex]!)
      const displayedNotes = [...scale.notes]
      displayedNotes[wrongIndex] = expectedAccidental ? naturalLetter(scale.notes[wrongIndex]!) : `${naturalLetter(scale.notes[wrongIndex]!)}♯`
      return { ...base, type, displayedNotes, wrongIndex, expectedAccidental }
    }
    if (type === 'mapping') {
      const degree = Math.floor(random() * 7) + 1
      const direction = mappingDirection
      mappingDirection = direction === 'degree-to-note' ? 'note-to-degree' : 'degree-to-note'
      return {
        ...base,
        type,
        direction,
        degree,
        options: shuffle(direction === 'degree-to-note' ? scale.notes : ['1', '2', '3', '4', '5', '6', '7'], random),
      }
    }
    return { ...base, type, expectedMidi: scaleMidiNotes(scale) }
  }
}

export function notePitchClass(note: string): PitchClass {
  const letter = naturalLetter(note)
  const base = pitchClassByLetter[letter]
  if (base === undefined) {
    throw new RangeError(`Unknown note name: ${note}`)
  }
  const offset = accidentalOf(note) === '♯' ? 1 : accidentalOf(note) === '♭' ? -1 : 0
  return ((base + offset + 12) % 12) as PitchClass
}
