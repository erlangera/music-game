import type { PlayableInstrument } from './instrumentAudio.ts'
import { getPianoAudioEngine } from './tonePianoAudio.ts'

export const pianoInstrument = {
  id: 'piano',
  label: '钢琴',
  audio: getPianoAudioEngine(),
} satisfies PlayableInstrument
