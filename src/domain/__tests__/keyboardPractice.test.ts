import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHighlightPlayer, createKeyboardGenerator, isCorrectKey, namedPitch, pianoKeys, pitches } from '../keyboardPractice.ts'

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

test('all sequence lengths preserve twelve-tone coverage, direction quotas and fixed unique options', () => {
  for (let length = 1; length <= 12; length++) {
    for (let seed = 0; seed < 10; seed++) {
      const next = createKeyboardGenerator({ direction: 'mixed', mode: 'infinite', sequenceLength: length }, seeded(seed))
      const questions = Array.from({ length: 120 }, next)
      const stream = questions.flatMap(question => question.sequence.map(note => note.pitch))
      for (let i = 0; i < stream.length; i++) {
        if (i > 0) {
          assert.notEqual(stream[i], stream[i - 1])
        }
        if (i % 12 === 0) {
          assert.equal(new Set(stream.slice(i, i + 12)).size, 12)
        }
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]!
        assert.equal(q.sequence.length, length)
        assert.deepEqual(q.options.map(n => n.pitch).sort((a, b) => a - b), [...pitches])
        const order = q.options.map(n => n.pitch).join(',')
        assert.notEqual(order, pitches.join(','))
        assert.notEqual(order, [...pitches].reverse().join(','))
        if (i > 0) {
          assert.notEqual(order, questions[i - 1]!.options.map(n => n.pitch).join(','))
        }
        if (i > 1) {
          assert.ok(q.direction !== questions[i - 1]!.direction || q.direction !== questions[i - 2]!.direction)
        }
        if (i % 10 === 0) {
          assert.equal(questions.slice(i, i + 10).filter(q => q.direction === 'name-to-key').length, 5)
        }
      }
    }
  }
})

test('enharmonic spellings differ but all twelve physical pitches score by pitch identity', () => {
  for (const pitch of pitches) {
    const sharp = namedPitch(pitch, () => 0)
    const flat = namedPitch(pitch, () => 0.99)
    assert.ok(isCorrectKey(sharp, flat))
    if (pianoKeys[pitch]!.black) {
      assert.notEqual(sharp.label, flat.label)
    }
    for (const other of pitches) {
      assert.equal(isCorrectKey(sharp, namedPitch(other)), pitch === other)
    }
  }
  assert.deepEqual(pianoKeys.map(k => k.midi), Array.from({ length: 12 }, (_, i) => 60 + i))
  assert.equal(new Set(pianoKeys.map(k => k.shortcut)).size, 12)
})

test('single directions, constant random sources and invalid lengths', () => {
  for (const direction of ['name-to-key', 'key-to-name'] as const) {
    const next = createKeyboardGenerator({ direction, mode: 'fixed', sequenceLength: 12 }, () => 0)
    assert.ok(Array.from({ length: 10 }, next).every(q => q.direction === direction && q.sequence.length === 12))
  }
  for (const sequenceLength of [0, 13, 1.5, Number.NaN]) {
    assert.throws(() => createKeyboardGenerator({ direction: 'mixed', mode: 'fixed', sequenceLength }), RangeError)
  }
})

function fakePlayer() {
  let time = 0
  let serial = 0
  const jobs = new Map<number, { at: number, callback: () => void }>()
  const frames: (number | null)[] = []
  const player = createHighlightPlayer(index => frames.push(index), {
    schedule(callback) {
      const id = ++serial
      jobs.set(id, { at: time + 1000, callback })
      return id as unknown as ReturnType<typeof setTimeout>
    },
    cancel(id) {
      jobs.delete(id as unknown as number)
    },
  })
  function tick(ms: number) {
    const end = time + ms
    while (true) {
      const next = [...jobs].sort((a, b) => a[1].at - b[1].at)[0]
      if (!next || next[1].at > end) {
        break
      }
      time = next[1].at
      jobs.delete(next[0])
      next[1].callback()
    }
    time = end
  }
  return { player, frames, tick, jobs }
}

test('highlight moves each second without answers, clears after final item; single note persists', () => {
  const { player, frames, tick } = fakePlayer()
  player.start(3)
  tick(999)
  assert.deepEqual(frames, [0])
  tick(1)
  tick(2000)
  assert.deepEqual(frames, [0, 1, 2, null])
  player.start(1)
  tick(10000)
  assert.equal(frames.at(-1), 0)
})

test('early answer resets the interval; late answers never skip the displayed item', () => {
  const { player, frames, tick } = fakePlayer()
  player.start(5)
  tick(300)
  player.answered(1)
  assert.deepEqual(frames, [0, 1])
  tick(700)
  assert.equal(frames.at(-1), 1)
  tick(300)
  assert.equal(frames.at(-1), 2)
  player.answered(2)
  assert.equal(frames.at(-1), 2)
  player.answered(3)
  assert.equal(frames.at(-1), 3)
})

test('replay starts at first unanswered item; stopping prevents callbacks in next question', () => {
  const { player, frames, tick, jobs } = fakePlayer()
  player.start(5)
  tick(2100)
  player.start(5, 1)
  assert.equal(frames.at(-1), 1)
  tick(900)
  assert.equal(frames.at(-1), 1)
  tick(100)
  assert.equal(frames.at(-1), 2)
  player.stop()
  tick(10000)
  assert.equal(frames.at(-1), null)
  assert.equal(jobs.size, 0)
  player.start(2)
  tick(1000)
  assert.equal(frames.at(-1), 1)
})
