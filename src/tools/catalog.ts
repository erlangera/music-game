export type MusicToolKind = 'instrument' | 'utility'

export interface MusicToolDefinition {
  id: string
  kind: MusicToolKind
  title: string
  description: string
  routeName: string
}

export const musicTools = [
  {
    id: 'piano',
    kind: 'instrument',
    title: '自由钢琴',
    description: '不计分、不出题，随时弹奏一个八度钢琴。',
    routeName: 'tool-piano',
  },
] as const satisfies readonly MusicToolDefinition[]

export const pianoTool = musicTools[0]
