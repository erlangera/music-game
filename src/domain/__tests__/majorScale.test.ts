import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createMajorScaleGenerator,
  isAccidentalsAnswer,
  isMappingAnswer,
  isRepairAnswer,
  majorScaleIds,
  majorScales,
  notePitchClass,
  scaleMidiNotes,
} from '../majorScale.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('twelve major tonics preserve letter spelling, pitch classes and ascending low-octave MIDI', () => {
  const expected = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'],
    'F': ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'],
    'D': ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'],
    'A': ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'],
    'B♭': ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'],
    'E': ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'],
    'E♭': ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'],
    'B': ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'],
    'A♭': ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'],
    'D♭': ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'],
    'F♯': ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'],
  }
  for (const id of majorScaleIds) {
    const scale = majorScales[id]
    assert.deepEqual([...scale.notes], expected[id])
    assert.deepEqual(scale.notes.map(notePitchClass), [...scale.pitchClasses])
    assert.equal(new Set(scale.notes.map(note => note[0])).size, 7)
    const midi = scaleMidiNotes(scale)
    assert.equal(midi.length, 8)
    assert.equal(midi[0], scale.lowTonicMidi)
    assert.equal(midi[7], scale.lowTonicMidi + 12)
    assert.ok(midi.every((note, index) => index === 0 || note > midi[index - 1]!))
  }
})

test('selected question types cover every scale and exercise without changing answer rules', () => {
  const next = createMajorScaleGenerator({ exercises: ['accidentals', 'repair', 'mapping', 'piano'], key: 'all', mode: 'fixed' }, seeded(7))
  const questions = Array.from({ length: 16 }, next)
  assert.deepEqual([...new Set(questions.slice(0, 12).map(question => question.scale.id))].sort(), [...majorScaleIds].sort())
  assert.deepEqual([...new Set(questions.slice(0, 4).map(question => question.type))].sort(), ['accidentals', 'mapping', 'piano', 'repair'])
})

test('accidental, repair and bidirectional mapping questions score exact answers', () => {
  const accidentals = createMajorScaleGenerator({ exercises: ['accidentals'], key: 'D', mode: 'fixed' }, () => 0)()
  assert.equal(accidentals.type, 'accidentals')
  assert.ok(isAccidentalsAnswer(accidentals, [2, 6]))
  assert.ok(!isAccidentalsAnswer(accidentals, [2]))

  const repair = createMajorScaleGenerator({ exercises: ['repair'], key: 'F', mode: 'fixed' }, () => 0)()
  assert.equal(repair.type, 'repair')
  assert.equal(repair.displayedNotes[3], 'B')
  assert.ok(isRepairAnswer(repair, 3, '♭'))
  assert.ok(!isRepairAnswer(repair, 3, '♯'))

  const nextMapping = createMajorScaleGenerator({ exercises: ['mapping'], key: 'G', mode: 'fixed' }, () => 0)
  const forward = nextMapping()
  const reverse = nextMapping()
  assert.equal(forward.type, 'mapping')
  assert.equal(reverse.type, 'mapping')
  assert.notEqual(forward.direction, reverse.direction)
  assert.ok(isMappingAnswer(forward, forward.direction === 'degree-to-note' ? 'G' : '1'))
  assert.ok(isMappingAnswer(reverse, reverse.direction === 'degree-to-note' ? 'G' : '1'))
})

test('selected major-scale question types stay balanced and reject an empty selection', () => {
  const next = createMajorScaleGenerator({ exercises: ['repair', 'piano'], key: 'all', mode: 'infinite' }, seeded(9))
  const questions = Array.from({ length: 20 }, next)

  assert.equal(questions.filter(question => question.type === 'repair').length, 10)
  assert.equal(questions.filter(question => question.type === 'piano').length, 10)
  assert.ok(questions.every((question, index) => index === 0 || question.type !== questions[index - 1]!.type))
  assert.throws(() => createMajorScaleGenerator({ exercises: [], key: 'all', mode: 'fixed' }), RangeError)
})
