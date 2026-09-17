import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  allSolfegeNames,
  allSolfegeQuestionTypes,
  createDirectionOrder,
  createFixedQuestionQueue,
  createQuestionTypeOrder,
  createSolfegeOptionOrder,
} from '../solfegePractice.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('direction orders stay balanced and never repeat a direction three times', () => {
  for (let count = 0; count <= 25; count++) {
    for (let seed = 0; seed < 20; seed++) {
      const order = createDirectionOrder(count, seeded(seed))
      const nameToDegreeCount = order.filter(direction => direction === 'name-to-degree').length

      assert.equal(order.length, count)
      assert.equal(nameToDegreeCount, Math.ceil(count / 2))
      assert.ok(order.every((direction, index) => (
        index < 2 || direction !== order[index - 1] || direction !== order[index - 2]
      )))
    }
  }
})

test('direction order terminates with constant random sources and rejects invalid counts', () => {
  for (const random of [() => 0, () => 0.999999]) {
    const order = createDirectionOrder(10, random)
    assert.equal(order.filter(direction => direction === 'name-to-degree').length, 5)
    assert.ok(order.every((direction, index) => (
      index < 2 || direction !== order[index - 1] || direction !== order[index - 2]
    )))
  }

  for (const count of [-1, 1.5, Number.NaN]) {
    assert.throws(() => createDirectionOrder(count), RangeError)
  }
})

test('selected question types are deduplicated, balanced, and cycled without adjacent repeats', () => {
  for (let seed = 0; seed < 20; seed++) {
    const order = createQuestionTypeOrder(10, allSolfegeQuestionTypes, seeded(seed))
    const counts = allSolfegeQuestionTypes.map(type => order.filter(item => item === type).length)

    assert.equal(order.length, 10)
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1)
    assert.ok(order.every((type, index) => index === 0 || type !== order[index - 1]))
  }

  assert.deepEqual(
    createQuestionTypeOrder(4, ['dictation', 'dictation'], seeded(1)),
    ['dictation', 'dictation', 'dictation', 'dictation'],
  )
  assert.notEqual(
    createQuestionTypeOrder(3, allSolfegeQuestionTypes, () => 0, 'dictation')[0],
    'dictation',
  )
  assert.throws(() => createQuestionTypeOrder(10, []), RangeError)
})

test('fixed queues preserve each selected question type and its answer direction', () => {
  const queue = createFixedQuestionQueue(9, 2, allSolfegeQuestionTypes, seeded(42))

  assert.deepEqual(new Set(queue.map(question => question.type)), new Set(allSolfegeQuestionTypes))
  assert.ok(queue.every(question => question.sequence.length === 2))
  assert.ok(queue.every(question => (
    question.direction === (question.type === 'degree-to-name' ? 'degree-to-name' : 'name-to-degree')
  )))
})

test('solfege choices stay complete and avoid scale order and the previous question even with constant randomness', () => {
  for (const random of [seeded(42), () => 0, () => 0.999999]) {
    let previous = [...allSolfegeNames]
    for (let question = 0; question < 100; question++) {
      const order = createSolfegeOptionOrder(previous, random)
      assert.deepEqual([...order].sort(), [...allSolfegeNames].sort())
      assert.notDeepEqual(order, allSolfegeNames)
      assert.notDeepEqual(order, [...allSolfegeNames].reverse())
      assert.notDeepEqual(order, previous)
      previous = order
    }
  }
})
