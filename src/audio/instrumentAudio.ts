import type { MidiNote } from '@/domain/pitch'

export type InstrumentAudioStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'unavailable'

export interface InstrumentAudioState {
  status: InstrumentAudioStatus
}

export interface PlayNoteOptions {
  durationSeconds?: number
  /** Normalized note velocity. MIDI input should convert 0–127 to 0–1. */
  velocity?: number
}

export interface InstrumentAudioEngine {
  readonly state: InstrumentAudioState
  prepare: () => Promise<void>
  unlock: () => Promise<boolean>
  playNote: (note: MidiNote, options?: PlayNoteOptions) => void
  startNote: (note: MidiNote, options?: Omit<PlayNoteOptions, 'durationSeconds'>) => void
  stopNote: (note: MidiNote) => void
  stop: () => void
  setVolume: (volume: number) => void
  subscribe: (listener: (state: InstrumentAudioState) => void) => () => void
  dispose: () => void
}
