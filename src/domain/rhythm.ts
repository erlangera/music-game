export const rhythmPatterns = [
  { id: 'quarter', label: '四分音符', notation: '♩', cells: [true, false], detail: '一拍发一次音，持续整拍；& 处延续，不重新发音。' },
  { id: 'eighths', label: '二八节奏', notation: '♫', cells: [true, true], detail: '两个八分音符均分一拍，在数字和 & 处各发一次音。' },
  { id: 'rest-first', label: '前半拍休止', notation: '休 + ♪', cells: [false, true], detail: '数字处休止，& 处发音；心里的拍点不能停。' },
  { id: 'rest-last', label: '后半拍休止', notation: '♪ + 休', cells: [true, false], detail: '数字处发音，& 处休止。起音位置与四分相同，持续时间不同。' },
] as const

export type RhythmPattern = typeof rhythmPatterns[number]
export type RhythmLevel = 'basic' | 'rests'
export const rhythmCounts = ['1', '&', '2', '&', '3', '&', '4', '&'] as const

export function rhythmCells(patterns: readonly RhythmPattern[]): boolean[] {
  return patterns.flatMap(pattern => [...pattern.cells])
}

export function createRhythmQueue(count: number, level: RhythmLevel, random = Math.random): RhythmPattern[][] {
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new RangeError('题量必须为 1–100')
  }
  const pool = level === 'basic' ? rhythmPatterns.slice(0, 2) : [...rhythmPatterns]
  const units = Array.from({ length: count * 4 }, (_, i) => pool[i % pool.length]!)
  for (let i = units.length - 1; i > 0; i--) {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('随机数必须在 [0, 1)')
    }
    const j = Math.floor(value * (i + 1))
    ;[units[i], units[j]] = [units[j]!, units[i]!]
  }
  return Array.from({ length: count }, (_, i) => units.slice(i * 4, i * 4 + 4))
}

export function gradeRhythm(expected: readonly boolean[], answer: readonly boolean[]) {
  if (expected.length !== 8 || answer.length !== 8) {
    throw new RangeError('一小节需要八个位置')
  }
  const cells = expected.map((hit, i) => hit === answer[i] ? 'correct' : hit ? 'missing' : 'extra')
  return { correct: cells.every(cell => cell === 'correct'), cells }
}

export interface RhythmSound {
  beat: number
  duration: number
  kind: 'click' | 'note'
  accent: boolean
}

/** Beat positions include a four-beat count-in; all timing uses quarter-note beats. */
export function rhythmTimeline(patterns: readonly RhythmPattern[]): RhythmSound[] {
  const sounds: RhythmSound[] = Array.from({ length: 4 + patterns.length }, (_, beat) => ({ beat, duration: 0.06, kind: 'click', accent: beat % 4 === 0 }))
  patterns.forEach((pattern, beat) => {
    pattern.cells.forEach((hit, half) => {
      if (hit) {
        sounds.push({ beat: 4 + beat + half / 2, duration: pattern.id === 'quarter' ? 0.9 : 0.4, kind: 'note', accent: false,
        })
      }
    })
  })
  return sounds
}
