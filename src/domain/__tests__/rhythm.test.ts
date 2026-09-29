import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRhythmQueue, gradeRhythm, rhythmCells, rhythmPatterns, rhythmTimeline } from '../rhythm.ts'

test('四拍小节、所选集合与配额在极端随机源下仍成立', () => {
  for (const level of ['basic', 'rests'] as const) {
    for (const value of [0, 0.5, 0.99999]) {
      const questions = createRhythmQueue(10, level, () => value)
      assert.equal(questions.length, 10)
      assert.ok(questions.every(q => q.length === 4 && rhythmCells(q).length === 8))
      const pool = level === 'basic' ? rhythmPatterns.slice(0, 2) : rhythmPatterns
      for (const pattern of pool) {
        assert.equal(questions.flat().filter(p => p.id === pattern.id).length, 40 / pool.length)
      }
    }
  }
  assert.throws(() => createRhythmQueue(0, 'basic'), RangeError)
  assert.throws(() => createRhythmQueue(1, 'basic', () => 1), RangeError)
})

test('起音判分区分漏选与多选，不把时值差别判成位置错误', () => {
  const expected = rhythmCells(rhythmPatterns)
  assert.equal(gradeRhythm(expected, [...expected]).correct, true)
  const answer = [...expected]
  answer[0] = false
  answer[1] = true
  const result = gradeRhythm(expected, answer)
  assert.equal(result.correct, false)
  assert.deepEqual(result.cells.slice(0, 2), ['missing', 'extra'])
  assert.deepEqual(rhythmCells([rhythmPatterns[0]]), rhythmCells([rhythmPatterns[3]]))
  assert.throws(() => gradeRhythm(expected, []), RangeError)
})

test('音频先四拍预备，半拍间距与休止、长音时值准确', () => {
  const timeline = rhythmTimeline(rhythmPatterns)
  assert.deepEqual(timeline.filter(s => s.kind === 'click').map(s => s.beat), [0, 1, 2, 3, 4, 5, 6, 7])
  const notes = timeline.filter(s => s.kind === 'note')
  assert.deepEqual(notes.map(s => s.beat), [4, 5, 5.5, 6.5, 7])
  assert.equal(notes[0]!.duration, 0.9)
  assert.equal(notes[4]!.duration, 0.4)
})
