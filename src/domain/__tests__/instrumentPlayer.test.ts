import type { InstrumentAudioEngine } from '../../audio/instrumentAudio.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultInstrumentVolume } from '../../audio/instrumentAudio.ts'
import { createInstrumentPlayer } from '../../audio/instrumentPlayer.ts'
import { midiNote } from '../pitch.ts'

function fixture(unlock: () => Promise<boolean> = async () => true) {
  const notes: number[] = []
  const volumes: number[] = []
  let unsubscribed = false
  const audio: InstrumentAudioEngine = {
    state: { status: 'fallback' },
    prepare: async () => {},
    unlock,
    playNote: note => notes.push(note),
    startNote: () => {},
    stopNote: () => {},
    stop: () => {},
    setVolume: volume => volumes.push(volume),
    subscribe: () => () => { unsubscribed = true },
    dispose: () => {},
  }
  const player = createInstrumentPlayer({ id: 'piano', label: 'Piano', audio })
  return { player, audio, notes, volumes, unsubscribed: () => unsubscribed }
}
const steps = [{ notes: [midiNote(60)], durationMilliseconds: 100, gapMilliseconds: 20 }]

test('unavailable or rejected audio cannot complete a listening question; retry can', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  for (const fail of [async () => false, async () => {
    throw new Error('audio blocked')
  }]) {
    const { player, audio, notes } = fixture(fail)
    let completed = 0
    let unavailable = 0
    const options = { onComplete: () => completed++, onUnavailable: () => unavailable++ }
    await player.playTimeline(steps, options)
    t.mock.timers.tick(1000)
    assert.equal(completed, 0)
    assert.equal(unavailable, 1)
    assert.equal(player.isPlaying.value, false)
    assert.deepEqual(player.activeNotes.value, [])
    assert.deepEqual(notes, [])
    audio.unlock = async () => true
    await player.playTimeline(steps, options)
    t.mock.timers.tick(1)
    assert.deepEqual(notes, [60])
    assert.equal(completed, 0)
    t.mock.timers.tick(119)
    assert.equal(completed, 1)
    assert.equal(player.error.value, '')
    player.dispose()
  }
})

test('replay and cancellation cannot complete the previous listening question', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { player } = fixture()
  let oldCompleted = 0
  let newCompleted = 0
  await player.playTimeline(steps, { onComplete: () => oldCompleted++ })
  t.mock.timers.tick(50)
  await player.playTimeline(steps, { onComplete: () => newCompleted++ })
  t.mock.timers.tick(70)
  assert.equal(oldCompleted, 0)
  assert.equal(newCompleted, 0)
  t.mock.timers.tick(50)
  assert.equal(newCompleted, 1)
  await player.playTimeline(steps, { onComplete: () => oldCompleted++ })
  player.stop()
  t.mock.timers.tick(1000)
  assert.equal(oldCompleted, 0)
  player.dispose()
})

test('leaving while unlock is pending never plays or invokes question callbacks', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let resolveUnlock: (value: boolean) => void = () => {}
  const pending = new Promise<boolean>((resolve) => {
    resolveUnlock = resolve
  })
  const { player, notes, unsubscribed } = fixture(() => pending)
  let callback = false
  const playing = player.playTimeline(steps, { onComplete: () => callback = true, onUnavailable: () => callback = true })
  player.dispose()
  resolveUnlock(true)
  await playing
  t.mock.timers.tick(1000)
  assert.equal(callback, false)
  assert.deepEqual(notes, [])
  assert.equal(unsubscribed(), true)
})

test('page-local mute is restored on disposal before a new player uses the shared engine', () => {
  const { player, audio, volumes } = fixture()
  player.setVolume(0)
  assert.deepEqual(volumes, [0])
  player.dispose()
  assert.deepEqual(volumes, [0, defaultInstrumentVolume])
  const nextPage = createInstrumentPlayer({ id: 'piano', label: 'Piano', audio })
  nextPage.dispose()
  assert.deepEqual(volumes, [0, defaultInstrumentVolume])
})
