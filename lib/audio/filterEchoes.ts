import { ShotEvent } from '@/lib/types'

export function filterEchoes(candidates: ShotEvent[], echoWindowMs: number): ShotEvent[] {
  if (candidates.length === 0) {
    return []
  }

  const sorted = [...candidates].sort((a, b) => a.time - b.time)
  const filtered: ShotEvent[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]
    const previous = filtered[filtered.length - 1]
    const deltaMs = (current.time - previous.time) * 1000

    if (deltaMs < echoWindowMs) {
      if (current.confidence > previous.confidence) {
        filtered[filtered.length - 1] = current
      }
      continue
    }

    filtered.push(current)
  }

  return filtered
}
