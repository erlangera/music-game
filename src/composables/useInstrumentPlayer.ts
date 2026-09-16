import { onBeforeUnmount } from 'vue'
import { createInstrumentPlayer } from '@/audio/instrumentPlayer'
import { useInstrument } from '@/composables/instrumentInjection'

export type { InstrumentTimelineStep } from '@/audio/instrumentPlayer'

export function useInstrumentPlayer(instrumentId: string) {
  const player = createInstrumentPlayer(useInstrument(instrumentId))
  onBeforeUnmount(player.dispose)
  return player
}
