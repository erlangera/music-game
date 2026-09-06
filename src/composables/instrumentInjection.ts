import type { App, InjectionKey } from 'vue'
import type { PlayableInstrument } from '@/audio/instrumentAudio'
import type { InstrumentRegistry } from '@/audio/instrumentRegistry'
import { inject } from 'vue'
import { createInstrumentRegistry } from '@/audio/instrumentRegistry'

const instrumentRegistryKey: InjectionKey<InstrumentRegistry> = Symbol('instrument-registry')

export function installInstruments(app: App, instruments: readonly PlayableInstrument[]) {
  app.provide(instrumentRegistryKey, createInstrumentRegistry(instruments))
}

export function useInstrument(id: string): PlayableInstrument {
  const registry = inject(instrumentRegistryKey)
  if (!registry) {
    throw new Error('Instrument registry has not been installed')
  }
  return registry.get(id)
}
