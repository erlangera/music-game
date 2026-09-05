export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type SolfegeName = 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'si'
export type QuestionDirection = 'name-to-degree' | 'degree-to-name'
export type AnswerValue = Degree | SolfegeName
export type PracticeMode = 'fixed' | 'infinite'

export interface SolfegePair {
  name: SolfegeName
  degree: Degree
}

export interface PracticeQuestion {
  direction: QuestionDirection
  sequence: SolfegePair[]
}

export interface PracticeSettings {
  dictation: boolean
  mode: PracticeMode
  sequenceLength: number
}

export const solfegePairs: readonly SolfegePair[] = [
  { name: 'do', degree: 1 },
  { name: 're', degree: 2 },
  { name: 'mi', degree: 3 },
  { name: 'fa', degree: 4 },
  { name: 'sol', degree: 5 },
  { name: 'la', degree: 6 },
  { name: 'si', degree: 7 },
]

export const allDegrees: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7]
export const allSolfegeNames: readonly SolfegeName[] = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }

  return result
}

export function createDirectionOrder(count: number, random = Math.random): QuestionDirection[] {
  const firstDirectionCount = Math.ceil(count / 2)
  const directions: QuestionDirection[] = [
    ...Array.from<QuestionDirection>({ length: firstDirectionCount }).fill('name-to-degree'),
    ...Array.from<QuestionDirection>({ length: count - firstDirectionCount }).fill('degree-to-name'),
  ]
  let nextOrder = shuffle(directions, random)

  while (hasThreeConsecutiveDirections(nextOrder)) {
    nextOrder = shuffle(directions, random)
  }

  return nextOrder
}

export function createBalancedPairDeck(totalItems: number, random = Math.random): SolfegePair[] {
  const deck: SolfegePair[] = []

  while (deck.length < totalItems) {
    let cycle = shuffle(solfegePairs, random)

    while (deck.at(-1)?.name === cycle[0]?.name) {
      cycle = shuffle(solfegePairs, random)
    }

    deck.push(...cycle)
  }

  return deck.slice(0, totalItems)
}

export function createFixedQuestionQueue(
  totalQuestions: number,
  sequenceLength: number,
  random = Math.random,
): PracticeQuestion[] {
  const directions = createDirectionOrder(totalQuestions, random)
  const pairDeck = createBalancedPairDeck(totalQuestions * sequenceLength, random)

  return directions.map((direction, questionIndex) => ({
    direction,
    sequence: pairDeck.slice(
      questionIndex * sequenceLength,
      (questionIndex + 1) * sequenceLength,
    ),
  }))
}

export function expectedAnswerAt(question: PracticeQuestion, index: number): AnswerValue | undefined {
  const pair = question.sequence[index]

  if (!pair) {
    return undefined
  }

  return question.direction === 'name-to-degree' ? pair.degree : pair.name
}

export function promptValueAt(question: PracticeQuestion, index: number): AnswerValue | undefined {
  const pair = question.sequence[index]

  if (!pair) {
    return undefined
  }

  return question.direction === 'name-to-degree' ? pair.name : pair.degree
}

function hasThreeConsecutiveDirections(directions: readonly QuestionDirection[]) {
  return directions.some(
    (direction, index) =>
      index >= 2 && direction === directions[index - 1] && direction === directions[index - 2],
  )
}
