export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type SolfegeName = 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'si'
export type QuestionDirection = 'name-to-degree' | 'degree-to-name'
export type SolfegeQuestionType = 'dictation' | QuestionDirection
export type AnswerValue = Degree | SolfegeName
export type PracticeMode = 'fixed' | 'infinite'

export interface SolfegePair {
  name: SolfegeName
  degree: Degree
}

export interface PracticeQuestion {
  type: SolfegeQuestionType
  direction: QuestionDirection
  sequence: SolfegePair[]
}

export interface PracticeSettings {
  mode: PracticeMode
  questionTypes: SolfegeQuestionType[]
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
export const allSolfegeQuestionTypes: readonly SolfegeQuestionType[] = ['dictation', 'name-to-degree', 'degree-to-name']

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }

  return result
}

/** Shuffle once per question, with a bounded fallback for deterministic random sources. */
export function createSolfegeOptionOrder(previous: readonly SolfegeName[] = [], random = Math.random): SolfegeName[] {
  const forbidden = [allSolfegeNames.join(), [...allSolfegeNames].reverse().join(), previous.join()]
  const candidate = shuffle(allSolfegeNames, random)
  for (let index = 0; index < candidate.length; index++) {
    if (!forbidden.includes(candidate.join())) {
      return candidate
    }
    candidate.push(candidate.shift()!)
  }
  return candidate
}

export function createDirectionOrder(count: number, random = Math.random): QuestionDirection[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Direction count must be a non-negative integer')
  }

  const firstDirectionCount = Math.ceil(count / 2)
  const directions: QuestionDirection[] = [
    ...Array.from<QuestionDirection>({ length: firstDirectionCount }).fill('name-to-degree'),
    ...Array.from<QuestionDirection>({ length: count - firstDirectionCount }).fill('degree-to-name'),
  ]

  for (let attempt = 0; attempt < 32; attempt++) {
    const candidate = shuffle(directions, random)
    if (!hasThreeConsecutiveDirections(candidate)) {
      return candidate
    }
  }

  return Array.from({ length: count }, (_, index) => (
    index % 2 === 0 ? 'name-to-degree' : 'degree-to-name'
  ))
}

export function createQuestionTypeOrder(
  count: number,
  enabledTypes: readonly SolfegeQuestionType[],
  random = Math.random,
  previousType?: SolfegeQuestionType,
): SolfegeQuestionType[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Question count must be a non-negative integer')
  }

  const uniqueTypes = [...new Set(enabledTypes)]
  if (uniqueTypes.length === 0) {
    throw new RangeError('At least one question type must be enabled')
  }

  const order: SolfegeQuestionType[] = []
  while (order.length < count) {
    let cycle = shuffle(uniqueTypes, random)
    const previous = order.at(-1) ?? previousType
    if (cycle.length > 1 && cycle[0] === previous) {
      cycle = [...cycle.slice(1), cycle[0]!]
    }
    order.push(...cycle)
  }

  return order.slice(0, count)
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
  questionTypes: readonly SolfegeQuestionType[],
  random = Math.random,
): PracticeQuestion[] {
  const types = createQuestionTypeOrder(totalQuestions, questionTypes, random)
  const pairDeck = createBalancedPairDeck(totalQuestions * sequenceLength, random)

  return types.map((type, questionIndex) => ({
    type,
    direction: type === 'degree-to-name' ? 'degree-to-name' : 'name-to-degree',
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
