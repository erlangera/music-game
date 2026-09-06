import type { InstrumentAudioEngine, PlayableInstrument } from '../../audio/instrumentAudio.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInstrumentRegistry } from '../../audio/instrumentRegistry.ts'

function fakeInstrument(id: string): PlayableInstrument {
  const audio: InstrumentAudioEngine = {
    state: { status: 'idle' },
    dispose() {},
    playNote() {},
    prepare: async () => {},
    setVolume() {},
    startNote() {},
    stop() {},
    stopNote() {},
    subscribe: () => () => {},
    unlock: async () => true,
  }
  return { id, label: id, audio }
}

test('instrument registry injects by stable id and rejects ambiguous registration', () => {
  const piano = fakeInstrument('piano')
  const registry = createInstrumentRegistry([piano])
  assert.equal(registry.get('piano'), piano)
  assert.equal(registry.has('piano'), true)
  assert.equal(registry.has('guitar'), false)
  assert.throws(() => registry.get('guitar'), /not registered/)
  assert.throws(() => createInstrumentRegistry([piano, fakeInstrument('piano')]), /Duplicate/)
})
