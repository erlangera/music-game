import { shuffle } from './solfegePractice.ts'

export const pitches = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type Pitch = typeof pitches[number]
export type KeyboardDirection = 'name-to-key' | 'key-to-name'
export type KeyboardDirectionSetting = KeyboardDirection | 'mixed'
export interface KeyboardSettings {
  direction: KeyboardDirectionSetting
  mode: 'fixed' | 'infinite'
  sequenceLength: number
}
export interface NamedPitch {
  pitch: Pitch
  label: string
}
export interface KeyboardQuestion {
  sequence: NamedPitch[]
  direction: KeyboardDirection
  options: NamedPitch[]
}
export const pitchNames: readonly (readonly string[])[] = [
  ['C'],
  ['C♯', 'D♭'],
  ['D'],
  ['D♯', 'E♭'],
  ['E'],
  ['F'],
  ['F♯', 'G♭'],
  ['G'],
  ['G♯', 'A♭'],
  ['A'],
  ['A♯', 'B♭'],
  ['B'],
]
export const pianoKeys = pitches.map(pitch => ({
  pitch,
  midi: 60 + pitch,
  shortcut: ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'][pitch]!,
  black: [1, 3, 6, 8, 10].includes(pitch),
  left: [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6][pitch]! / 7 * 100,
}))
export function namedPitch(pitch: Pitch, random = Math.random): NamedPitch {
  const names = pitchNames[pitch]!
  return { pitch, label: names[Math.floor(random() * names.length)]! }
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
