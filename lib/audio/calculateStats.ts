import { AnalysisResult, ShotEvent } from '@/lib/types'

export function calculateStats(startBeepTime: number | null, shots: ShotEvent[]): AnalysisResult {
  const orderedShots = [...shots].sort((a, b) => a.time - b.time)
  const splits: number[] = []

  for (let i = 1; i < orderedShots.length; i += 1) {
    splits.push(Number((orderedShots[i].time - orderedShots[i - 1].time).toFixed(3)))
  }

  const firstShotTime =
    startBeepTime !== null && orderedShots[0]
      ? Number((orderedShots[0].time - startBeepTime).toFixed(3))
      : null

  const bestSplit = splits.length > 0 ? Math.min(...splits) : null

  return {
    startBeepTime,
    shots: orderedShots,
    firstShotTime,
    bestSplit,
    splits,
    totalShots: orderedShots.length,
  }
}
