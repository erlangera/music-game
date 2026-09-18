import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  answerSpellings,
  createToneStepQuestion,
  createToneStepQuestionQueue,
  formatSpelledPitch,
  isCorrectToneStepAnswer,
  pitchClassOfSpelling,
  preferredAnswer,
} from '../toneStepPractice.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('spelled notes and degrees map to the same twelve pitch classes', () => {
  assert.equal(pitchClassOfSpelling({ symbol: 'C', accidental: 'natural' }, 'note'), 0)
  assert.equal(pitchClassOfSpelling({ symbol: 'B', accidental: 'sharp' }, 'note'), 0)
  assert.equal(pitchClassOfSpelling({ symbol: 3, accidental: 'sharp' }, 'degree'), 5)
  assert.equal(pitchClassOfSpelling({ symbol: 4, accidental: 'natural' }, 'degree'), 5)
})

test('questions wrap around the octave and accept enharmonic answers', () => {
  const bUpSemitone = createToneStepQuestion('note', 'semitone', 'up', 6)
  assert.equal(formatSpelledPitch(preferredAnswer(bUpSemitone), 'note'), 'C')
  assert.equal(isCorrectToneStepAnswer(bUpSemitone, { symbol: 'C', accidental: 'natural' }), true)
  assert.equal(isCorrectToneStepAnswer(bUpSemitone, { symbol: 'B', accidental: 'sharp' }), true)

  const cDownWholeTone = createToneStepQuestion('note', 'whole-tone', 'down', 0)
  assert.deepEqual(
    answerSpellings(cDownWholeTone).map(answer => formatSpelledPitch(answer, 'note')).sort(),
    ['A♯', 'B♭'],
  )
})

test('degree questions use C-major pitch positions and accept 3 up a semitone as 4', () => {
  const question = createToneStepQuestion('degree', 'semitone', 'up', 2)
  assert.equal(question.prompt, 3)
  assert.equal(formatSpelledPitch(preferredAnswer(question), 'degree'), '4')
  assert.equal(isCorrectToneStepAnswer(question, { symbol: 4, accidental: 'natural' }), true)
  assert.equal(isCorrectToneStepAnswer(question, { symbol: 3, accidental: 'sharp' }), true)
})

test('fixed queues balance every enabled question dimension', () => {
  const queue = createToneStepQuestionQueue(56, {
    notations: ['note', 'degree'],
    distances: ['semitone', 'whole-tone'],
    directions: ['up', 'down'],
  }, seeded(42))

  assert.equal(queue.length, 56)
  assert.deepEqual(new Set(queue.map(question => question.notation)), new Set(['note', 'degree']))
  assert.deepEqual(new Set(queue.map(question => question.distance)), new Set(['semitone', 'whole-tone']))
  assert.deepEqual(new Set(queue.map(question => question.direction)), new Set(['up', 'down']))
  assert.ok(queue.every((question, index) => index === 0 || question.prompt !== queue[index - 1]!.prompt))
  assert.throws(() => createToneStepQuestionQueue(10, {
    notations: [],
    distances: ['semitone'],
    directions: ['up'],
  }), RangeError)
})
