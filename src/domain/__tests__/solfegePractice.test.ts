import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDirectionOrder } from '../solfegePractice.ts'

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
