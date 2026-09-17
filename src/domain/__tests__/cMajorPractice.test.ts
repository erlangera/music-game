import assert from 'node:assert/strict'
import { test } from 'node:test'
import { answerMapping, cMajorNotes, createMappingGenerator } from '../cMajorPractice.ts'
import { midiNote } from '../pitch.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('C major maps 1–7 to the seven white keys, accepting equivalent octaves but rejecting black keys', () => {
  assert.deepEqual(cMajorNotes.map(note => note.midi), [60, 62, 64, 65, 67, 69, 71])
  assert.deepEqual(cMajorNotes.map(note => note.name), ['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  for (const direction of ['degree-to-key', 'key-to-degree'] as const) {
    for (const note of cMajorNotes) {
      const question = { direction, sequence: [note] }
      for (let pitch = 0; pitch < 12; pitch++) {
        const result = answerMapping(question, { index: 0, status: 'answering' }, midiNote(72 + pitch))
        assert.equal(result.status, pitch === note.pitch ? 'correct' : 'wrong')
      }
    }
  }
})

test('both directions and every length use balanced seven-note bags without adjacent repeats', () => {
  for (const direction of ['degree-to-key', 'key-to-degree'] as const) {
    for (let sequenceLength = 1; sequenceLength <= 12; sequenceLength++) {
      for (let seed = 0; seed < 10; seed++) {
        const next = createMappingGenerator({ directions: [direction], sequenceLength, mode: 'fixed' }, seeded(seed))
        const questions = Array.from({ length: 70 }, next)
        assert.ok(questions.every(q => q.direction === direction && q.sequence.length === sequenceLength))
        const stream = questions.flatMap(q => q.sequence.map(note => note.degree))
        for (let i = 0; i < stream.length; i++) {
          if (i > 0) {
            assert.notEqual(stream[i], stream[i - 1])
          }
          if (i % 7 === 0) {
            assert.deepEqual(stream.slice(i, i + 7).sort(), [1, 2, 3, 4, 5, 6, 7])
          }
        }
      }
    }
  }
  for (const sequenceLength of [0, 13, 1.5, Number.NaN]) {
    assert.throws(() => createMappingGenerator({ directions: ['degree-to-key'], sequenceLength, mode: 'fixed' }), RangeError)
  }
  assert.throws(() => createMappingGenerator({ directions: [], sequenceLength: 1, mode: 'fixed' }), RangeError)
})

test('selected mapping question types stay balanced and avoid adjacent repeats', () => {
  for (let seed = 0; seed < 20; seed++) {
    const next = createMappingGenerator({ directions: ['degree-to-key', 'key-to-degree'], sequenceLength: 1, mode: 'infinite' }, seeded(seed))
    const questions = Array.from({ length: 20 }, next)

    assert.equal(questions.filter(question => question.direction === 'degree-to-key').length, 10)
    assert.equal(questions.filter(question => question.direction === 'key-to-degree').length, 10)
    assert.ok(questions.every((question, index) => index === 0 || question.direction !== questions[index - 1]!.direction))
  }
})

test('partial answers do not complete a question; first error locks the sequence at its failed position', () => {
  const question = { direction: 'degree-to-key' as const, sequence: cMajorNotes.slice(0, 3) }
  const first = answerMapping(question, { index: 0, status: 'answering' }, midiNote(60))
  assert.equal(first.status, 'answering')
  assert.equal(first.index, 1)
  const wrong = answerMapping(question, first, midiNote(63))
  assert.equal(wrong.status, 'wrong')
  assert.equal(wrong.index, 1)
  assert.equal(wrong.selected, 63)
  assert.equal(answerMapping(question, wrong, midiNote(62)), wrong)
  const second = answerMapping(question, first, midiNote(62))
  const complete = answerMapping(question, second, midiNote(64))
  assert.equal(complete.status, 'correct')
  assert.equal(complete.index, 3)
  assert.equal(answerMapping(question, complete, midiNote(64)), complete)
})
