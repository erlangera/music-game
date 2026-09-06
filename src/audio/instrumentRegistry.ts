import type { PlayableInstrument } from './instrumentAudio.ts'

export interface InstrumentRegistry {
  get: (id: string) => PlayableInstrument
  has: (id: string) => boolean
}

export function createInstrumentRegistry(instruments: readonly PlayableInstrument[]): InstrumentRegistry {
  const byId = new Map<string, PlayableInstrument>()
  for (const instrument of instruments) {
    if (byId.has(instrument.id)) {
      throw new Error(`Duplicate instrument id: ${instrument.id}`)
    }
    byId.set(instrument.id, instrument)
  }
  return {
    get(id) {
      const instrument = byId.get(id)
      if (!instrument) {
        throw new Error(`Instrument is not registered: ${id}`)
      }
      return instrument
    },
    has: id => byId.has(id),
  }
}
