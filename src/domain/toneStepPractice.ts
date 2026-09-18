import type { PitchClass } from './pitch.ts'

export const toneStepNotations = ['note', 'degree'] as const
export const toneStepDistances = ['semitone', 'whole-tone'] as const
export const toneStepDirections = ['up', 'down'] as const
export const accidentals = ['flat', 'natural', 'sharp'] as const

export type ToneStepNotation = typeof toneStepNotations[number]
export type ToneStepDistance = typeof toneStepDistances[number]
export type ToneStepDirection = typeof toneStepDirections[number]
export type Accidental = typeof accidentals[number]
export type NaturalNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ToneStepSymbol = NaturalNote | Degree
export type PracticeMode = 'fixed' | 'infinite'

export interface SpelledPitch {
  accidental: Accidental
  symbol: ToneStepSymbol
}

export interface ToneStepQuestion {
  id: string
  notation: ToneStepNotation
  distance: ToneStepDistance
  direction: ToneStepDirection
  prompt: ToneStepSymbol
  expectedPitchClass: PitchClass
}

export interface ToneStepSettings {
  notations: ToneStepNotation[]
  distances: ToneStepDistance[]
  directions: ToneStepDirection[]
  mode: PracticeMode
}

export const naturalNotes: readonly NaturalNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
export const degrees: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7]

const naturalPitchClasses: readonly PitchClass[] = [0, 2, 4, 5, 7, 9, 11]
const accidentalOffsets: Record<Accidental, number> = { flat: -1, natural: 0, sharp: 1 }
const distanceOffsets: Record<ToneStepDistance, number> = { 'semitone': 1, 'whole-tone': 2 }

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }
  return result
}

export function pitchClassOfSpelling(spelling: SpelledPitch, notation: ToneStepNotation): PitchClass {
  const symbols = notation === 'note' ? naturalNotes : degrees
  const symbolIndex = symbols.indexOf(spelling.symbol as never)
  if (symbolIndex < 0) {
    throw new RangeError(`Invalid ${notation} symbol`)
  }
  return modulo(naturalPitchClasses[symbolIndex]! + accidentalOffsets[spelling.accidental]) as PitchClass
}

export function isCorrectToneStepAnswer(question: ToneStepQuestion, answer: SpelledPitch): boolean {
  return pitchClassOfSpelling(answer, question.notation) === question.expectedPitchClass
}

export function formatSpelledPitch(spelling: SpelledPitch, notation: ToneStepNotation): string {
  const accidental = spelling.accidental === 'flat' ? '♭' : spelling.accidental === 'sharp' ? '♯' : ''
  return notation === 'note' ? `${spelling.symbol}${accidental}` : `${accidental}${spelling.symbol}`
}

export function answerSpellings(question: ToneStepQuestion): SpelledPitch[] {
  const symbols = question.notation === 'note' ? naturalNotes : degrees
  return symbols.flatMap(symbol => accidentals.map(accidental => ({ symbol, accidental })))
    .filter(answer => isCorrectToneStepAnswer(question, answer))
}

export function preferredAnswer(question: ToneStepQuestion): SpelledPitch {
  const symbols = question.notation === 'note' ? naturalNotes : degrees
  const promptIndex = symbols.indexOf(question.prompt as never)
  const naturalCandidate = symbols.find((symbol) => {
    return pitchClassOfSpelling({ symbol, accidental: 'natural' }, question.notation) === question.expectedPitchClass
  })
  if (naturalCandidate !== undefined) {
    return { symbol: naturalCandidate, accidental: 'natural' }
  }

  const direction = question.direction === 'up' ? 1 : -1
  const preferredSymbol = symbols[modulo(promptIndex + direction, symbols.length)]!
  const accidental = accidentals.find(candidate => (
    pitchClassOfSpelling({ symbol: preferredSymbol, accidental: candidate }, question.notation) === question.expectedPitchClass
  ))
  if (accidental) {
    return { symbol: preferredSymbol, accidental }
  }

  return answerSpellings(question)[0]!
}

export function createToneStepQuestion(
  notation: ToneStepNotation,
  distance: ToneStepDistance,
  direction: ToneStepDirection,
  promptIndex: number,
): ToneStepQuestion {
  const symbols = notation === 'note' ? naturalNotes : degrees
  const prompt = symbols[modulo(promptIndex, symbols.length)]!
  const promptPitchClass = naturalPitchClasses[modulo(promptIndex, naturalPitchClasses.length)]!
  const signedDistance = distanceOffsets[distance] * (direction === 'up' ? 1 : -1)
  return {
    id: `${notation}-${distance}-${direction}-${promptIndex}-${Math.random().toString(36).slice(2)}`,
    notation,
    distance,
    direction,
    prompt,
    expectedPitchClass: modulo(promptPitchClass + signedDistance) as PitchClass,
  }
}

export function createToneStepQuestionQueue(
  count: number,
  settings: Pick<ToneStepSettings, 'notations' | 'distances' | 'directions'>,
  random = Math.random,
): ToneStepQuestion[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Question count must be a non-negative integer')
  }
  if (settings.notations.length === 0 || settings.distances.length === 0 || settings.directions.length === 0) {
    throw new RangeError('Each question dimension needs at least one enabled option')
  }

  const combinations = settings.notations.flatMap(notation => (
    settings.distances.flatMap(distance => (
      settings.directions.map(direction => ({ notation, distance, direction }))
    ))
  ))
  const orderedCombinations = cycleShuffled(combinations, count, random)
  const orderedPromptIndices = cycleShuffled([0, 1, 2, 3, 4, 5, 6], count, random)

  return orderedCombinations.map((combination, index) => createToneStepQuestion(
    combination.notation,
    combination.distance,
    combination.direction,
    orderedPromptIndices[index]!,
  ))
}

function cycleShuffled<T>(values: readonly T[], count: number, random: () => number): T[] {
  const result: T[] = []
  while (result.length < count) {
    let cycle = shuffle(values, random)
    if (cycle.length > 1 && result.at(-1) === cycle[0]) {
      cycle = [...cycle.slice(1), cycle[0]!]
    }
    result.push(...cycle)
  }
  return result.slice(0, count)
}

function modulo(value: number, divisor = 12): number {
  return ((value % divisor) + divisor) % divisor
}
