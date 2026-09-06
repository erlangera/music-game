import assert from 'node:assert/strict'
import test from 'node:test'
import { pianoSamples } from '../../audio/pianoSamples.ts'
import { midiNote, midiNoteFromPitchClass, scientificPitch } from '../pitch.ts'

test('MIDI notes remain distinct from pitch classes and convert to scientific pitch', () => {
  assert.equal(midiNoteFromPitchClass(0, 4), 60)
  assert.equal(midiNoteFromPitchClass(11, 4), 71)
  assert.equal(scientificPitch(midiNote(60)), 'C4')
  assert.equal(scientificPitch(midiNote(61)), 'C#4')
  assert.equal(scientificPitch(midiNote(127)), 'G9')
})

test('MIDI notes reject fractional and out-of-range values', () => {
  for (const invalid of [-1, 1.5, 128]) {
    assert.throws(() => midiNote(invalid), RangeError)
  }
  assert.throws(() => midiNoteFromPitchClass(11, 9), RangeError)
})

test('keyboard memory samples cover C4–B4 within one semitone', () => {
  const sampledMidi = pianoSamples.map(sample => sample.note)
  for (let note = 60; note <= 71; note += 1) {
    const distance = Math.min(...sampledMidi.map(sample => Math.abs(sample - note)))
    assert.ok(distance <= 1, `MIDI ${note} is ${distance} semitones from its nearest sample`)
  }
})
