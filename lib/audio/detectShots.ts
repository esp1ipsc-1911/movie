import { AnalysisSettings, ShotEvent } from '@/lib/types'

/**
 * Transient-onset shot detector.
 *
 * Strategy: a gunshot is a sudden, large amplitude jump followed by a decay.
 * We measure the peak of the CURRENT frame vs the peak of the PREVIOUS frame.
 * If the ratio exceeds a threshold, it's a candidate. After accepting a shot
 * we enter a hard cooldown that ignores all frames for `minShotGapMs` ms —
 * this kills echo tails and reverb bleed without needing a separate echo filter.
 *
 * Settings:
 *   sensitivity   – multiplier on the onset ratio threshold (lower = more sensitive)
 *   noiseFloor    – absolute minimum peak for a frame to be considered at all
 *   minShotGapMs  – hard cooldown after each accepted shot
 *   echoWindowMs  – (unused in this detector; kept for UI compatibility)
 */
export function detectShots(
  samples: Float32Array,
  sampleRate: number,
  startTime: number | null,
  settings: AnalysisSettings,
): ShotEvent[] {
  if (startTime === null) {
    return []
  }

  // Frame size ~5 ms at 44100 Hz – short enough to catch sharp transients
  const frameSize = Math.round(sampleRate * 0.005)   // ~220 samples
  const hopSize   = Math.round(sampleRate * 0.0025)  // ~110 samples (50% overlap)

  // How many times louder than the previous frame counts as an onset
  // sensitivity=1 → ratio must be ≥5×; sensitivity=2 → ≥3×; sensitivity=0.5 → ≥9×
  const onsetRatioThreshold = 5.0 / settings.sensitivity

  // Minimum absolute peak in a frame to bother with (filters silence/hiss)
  const minPeak = Math.max(settings.noiseFloor * 3, 0.10)

  const cooldownSamples = Math.round((settings.minShotGapMs / 1000) * sampleRate)
  const startIndex = Math.floor((startTime + 0.05) * sampleRate)

  const shots: ShotEvent[] = []
  let cooldownUntil = startIndex
  let prevFramePeak = 0

  for (let i = startIndex; i + frameSize < samples.length; i += hopSize) {
    // Find peak amplitude in this frame
    let framePeak = 0
    for (let j = 0; j < frameSize; j++) {
      const abs = Math.abs(samples[i + j])
      if (abs > framePeak) framePeak = abs
    }

    // Skip if we're in cooldown
    if (i < cooldownUntil) {
      prevFramePeak = framePeak
      continue
    }

    // Skip weak frames
    if (framePeak < minPeak) {
      prevFramePeak = framePeak
      continue
    }

    // Compute onset ratio vs previous frame
    const ratio = prevFramePeak > 0.001 ? framePeak / prevFramePeak : framePeak * 10

    if (ratio >= onsetRatioThreshold) {
      const eventTime = i / sampleRate
      shots.push({
        id: `shot-${shots.length + 1}-${eventTime.toFixed(3)}`,
        time: Number(eventTime.toFixed(3)),
        confidence: Number(Math.min(ratio / onsetRatioThreshold, 9.99).toFixed(3)),
        source: 'auto',
      })
      cooldownUntil = i + cooldownSamples
    }

    prevFramePeak = framePeak
  }

  return shots
}
