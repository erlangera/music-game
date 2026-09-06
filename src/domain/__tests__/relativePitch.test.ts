import assert from 'node:assert/strict'
import { test } from 'node:test'
import { majorScaleIds, majorScales, scaleMidiNotes } from '../majorScale.ts'
import {
  createTonicQuestionGenerator,
  curatedRelativePitchMotifs,
  isTonicChoiceAnswer,
  isTonicPianoAnswer,
  relativePitchLearningKeyboardFrom,
  relativePitchLearningKeyboardTo,
  tonalContextSteps,
  tonicQuestionSteps,
  tonicResolutionSteps,
} from '../relativePitch.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('tonic generator covers all twelve keys before reusing a key', () => {
  const next = createTonicQuestionGenerator(seeded(17))
  const questions = Array.from({ length: 12 }, next)
  assert.deepEqual([...new Set(questions.map(question => question.scale.id))].sort(), [...majorScaleIds].sort())
  assert.ok(questions.every(question => question.tonicMidi >= 60 && question.tonicMidi <= 71))
})

test('tonic exercises and distractors use balanced shuffle bags', () => {
  const next = createTonicQuestionGenerator(seeded(8))
  const questions = Array.from({ length: 6 }, next)
  assert.deepEqual(new Set(questions.slice(0, 2).map(question => question.type)), new Set(['choice', 'piano']))
  assert.deepEqual(new Set(questions.map(question => question.distractorDegree)), new Set([2, 3, 4, 5, 6, 7]))
  for (const question of questions) {
    assert.equal(question.candidateMidi.filter(note => note === question.tonicMidi).length, 1)
    assert.notEqual(question.candidateMidi[0], question.candidateMidi[1])
  }
})

test('choice and piano answers only accept the generated tonic target', () => {
  const next = createTonicQuestionGenerator(seeded(3))
  const questions = Array.from({ length: 2 }, next)
  const choice = questions.find(question => question.type === 'choice')!
  const piano = questions.find(question => question.type === 'piano')!

  assert.ok(isTonicChoiceAnswer(choice, choice.correctCandidateIndex))
  assert.ok(!isTonicChoiceAnswer(choice, choice.correctCandidateIndex === 0 ? 1 : 0))
  assert.ok(isTonicPianoAnswer(piano, piano.tonicMidi))
  assert.ok(!isTonicPianoAnswer(piano, piano.candidateMidi[piano.correctCandidateIndex === 0 ? 1 : 0]))
})

test('four hints build distinct, deterministic tonal contexts', () => {
  const question = createTonicQuestionGenerator(seeded(4))()
  const scale = tonalContextSteps(question.scale, 'scale')
  const triad = tonalContextSteps(question.scale, 'triad')
  const cadence = tonalContextSteps(question.scale, 'cadence')
  const tonic = tonalContextSteps(question.scale, 'tonic')

  assert.equal(scale.length, 8)
  assert.equal(triad.length, 4)
  assert.deepEqual(cadence.map(step => step.notes.length), [3, 3, 3])
  assert.equal(tonic.length, 1)
  assert.equal(scale.at(-1)!.gapMilliseconds, 600)
  assert.equal(tonic[0]!.notes[0], question.tonicMidi)
})

test('learning keyboard contains every complete ascending major scale', () => {
  for (const id of majorScaleIds) {
    const notes = scaleMidiNotes(majorScales[id])
    assert.ok(notes.every(note => note >= relativePitchLearningKeyboardFrom && note <= relativePitchLearningKeyboardTo))
  }
  assert.equal(relativePitchLearningKeyboardFrom, 60)
  assert.equal(relativePitchLearningKeyboardTo, 83)
})

test('question and correction audio preserve the generated key', () => {
  const next = createTonicQuestionGenerator(seeded(11))
  const questions = Array.from({ length: 2 }, next)
  for (const question of questions) {
    const steps = tonicQuestionSteps(question, 'tonic')
    assert.equal(steps[0]!.notes[0], question.tonicMidi)
    assert.equal(steps.length, question.type === 'choice' ? 3 : 6)
    assert.equal(tonicResolutionSteps(question).at(-1)!.notes[0], question.tonicMidi)
  }
})

test('later motif practice uses the accepted curated pattern set', () => {
  assert.deepEqual(curatedRelativePitchMotifs, [
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
  ])
})
