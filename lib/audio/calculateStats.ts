import { AnalysisResult, ShotEvent } from '@/lib/types'

export function calculateStats(startBeepTime: number | null, shots: ShotEvent[]): AnalysisResult {
  const orderedShots = [...shots].sort((a, b) => a.time - b.time)
  const splits = orderedShots.slice(1).map((shot, index) => Number((shot.time - orderedShots[index].time).toFixed(3)))
  const firstShotTime = startBeepTime != null && orderedShots.length > 0
    ? Number((orderedShots[0].time - startBeepTime).toFixed(3))
    : null

  return {
    startBeepTime,
    shots: orderedShots,
    firstShotTime,
    bestSplit: splits.length > 0 ? Math.min(...splits) : null,
    splits,
    totalShots: orderedShots.length,
  }
}
