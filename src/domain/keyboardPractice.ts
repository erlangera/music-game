import type { NamedPitch, Pitch } from './piano.ts'
import { namedPitch, pitches } from './piano.ts'
import { shuffle } from './solfegePractice.ts'

export type { NamedPitch, Pitch } from './piano.ts'
export { namedPitch, pianoKeys, pianoKeyShortcuts, pitches, pitchNames } from './piano.ts'
export type KeyboardDirection = 'name-to-key' | 'key-to-name'
export type KeyboardDirectionSetting = KeyboardDirection | 'mixed'
export interface KeyboardSettings {
  direction: KeyboardDirectionSetting
  mode: 'fixed' | 'infinite'
  sequenceLength: number
}
export interface KeyboardQuestion {
  sequence: NamedPitch[]
  direction: KeyboardDirection
  options: NamedPitch[]
}
export function isCorrectKey(expected: NamedPitch, selected: NamedPitch): boolean {
  return expected.pitch === selected.pitch
}
export function createKeyboardGenerator(settings: KeyboardSettings, random = Math.random) {
  if (!Number.isInteger(settings.sequenceLength) || settings.sequenceLength < 1 || settings.sequenceLength > 12) {
    throw new RangeError('Sequence length must be an integer from 1 to 12')
  }
  let notes: Pitch[] = []
  let lastNote: Pitch | undefined
  let directions: KeyboardDirection[] = []
  let previousOptions = ''
  function nextNote() {
    if (!notes.length) {
      notes = shuffle(pitches, random)
      if (notes[0] === lastNote) {
        [notes[0], notes[1]] = [notes[1]!, notes[0]!]
      }
    }
    lastNote = notes.shift()!
    return namedPitch(lastNote, random)
  }
  return (): KeyboardQuestion => {
    if (settings.direction === 'mixed' && !directions.length) {
      directions = random() < 0.5 ? ['name-to-key', 'key-to-name'] : ['key-to-name', 'name-to-key']
    }
    const direction = settings.direction === 'mixed' ? directions.shift()! : settings.direction
    const sequence = Array.from({ length: settings.sequenceLength }, nextNote)
    let order = shuffle(pitches, random)
    const forbidden = new Set([pitches.join(','), [...pitches].reverse().join(','), previousOptions])
    while (forbidden.has(order.join(','))) {
      order = [...order.slice(1), order[0]!]
    }
    previousOptions = order.join(',')
    return { sequence, direction, options: order.map(pitch => namedPitch(pitch, random)) }
  }
}

// Display and answer cursors are independent. Inject a clock for deterministic tests.
export function createHighlightPlayer(
  show: (index: number | null) => void,
  clock = { schedule: (callback: () => void) => setTimeout(callback, 1000), cancel: (id: ReturnType<typeof setTimeout>) => clearTimeout(id) },
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let cursor = -1
  let length = 0
  let version = 0
  function clear() {
    version++
    if (timer !== undefined) {
      clock.cancel(timer)
      timer = undefined
    }
  }
  function stop() {
    clear()
    cursor = -1
    show(null)
  }
  function display(index: number) {
    clear()
    cursor = index
    if (index >= length) {
      cursor = -1
      show(null)
      return
    }
    show(index)
    if (length > 1) {
      const current = version
      timer = clock.schedule(() => {
        if (version === current) {
          display(index + 1)
        }
      })
    }
  }
  return {
    start(count: number, from = 0) {
      length = count
      display(from)
    },
    answered(nextIndex: number) {
      if (cursor >= 0 && nextIndex > cursor && nextIndex < length) {
        display(nextIndex)
      }
    },
    stop,
  }
}
