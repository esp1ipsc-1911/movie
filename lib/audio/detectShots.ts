import { AnalysisSettings, ShotEvent } from '@/lib/types'
import { filterEchoes } from '@/lib/audio/filterEchoes'

export function detectShots(
  samples: Float32Array,
  sampleRate: number,
  startTime: number | null,
  settings: AnalysisSettings,
): ShotEvent[] {
  if (startTime === null) {
    return []
  }

  const frameSize = 512
  const hopSize = 128
  const startIndex = Math.floor((startTime + 0.02) * sampleRate)
  const candidates: ShotEvent[] = []
  let previousAcceptedTime = -Infinity

  for (let i = startIndex; i + frameSize < samples.length; i += hopSize) {
    let peak = 0
    let energy = 0
    let transient = 0

    for (let j = 1; j < frameSize; j += 1) {
      const current = Math.abs(samples[i + j])
      const prev = Math.abs(samples[i + j - 1])
      peak = Math.max(peak, current)
      energy += current * current
      transient += Math.max(0, current - prev)
    }

    const normalizedEnergy = energy / frameSize
    const normalizedTransient = transient / frameSize
    const confidence = peak * 0.55 + normalizedEnergy * 18 + normalizedTransient * 8
    const threshold = settings.noiseFloor + settings.sensitivity * 0.22
    const eventTime = i / sampleRate
    const gapMs = (eventTime - previousAcceptedTime) * 1000

    if (
      confidence > threshold &&
      peak > 0.18 &&
      gapMs > settings.minShotGapMs
    ) {
      candidates.push({
        id: `shot-${candidates.length + 1}-${eventTime.toFixed(3)}`,
        time: Number(eventTime.toFixed(3)),
        confidence: Number(confidence.toFixed(3)),
        source: 'auto',
      })
      previousAcceptedTime = eventTime
    }
  }

  return filterEchoes(candidates, settings.echoWindowMs)
}
