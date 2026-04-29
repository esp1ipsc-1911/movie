import { AnalysisSettings, ShotEvent } from '@/lib/types'

/**
 * Two-stage shot detector optimised for pistol fire in outdoor ranges.
 *
 * Stage 1 – Peak picker
 *   Slide a short window (~5 ms) across the audio and record the peak
 *   amplitude of every window. This gives us a "peak envelope".
 *
 * Stage 2 – Adaptive threshold + onset gate
 *   A shot must satisfy ALL of:
 *   a) Peak > absolute floor (noiseFloor * 4) – rules out silence/hiss
 *   b) Peak > adaptive_median * onsetMultiplier – must be much louder
 *      than the recent background level
 *   c) Hard cooldown after each accepted shot – kills echo tails
 *
 * The adaptive median is the median peak of the last ~0.5 s of windows.
 * This automatically adjusts to the recording's overall loudness level,
 * so the same settings work for quiet indoor ranges and loud outdoor ones.
 *
 * sensitivity slider:  1.0 = onsetMultiplier of 6× (default, strict)
 *                      2.0 = onsetMultiplier of 3× (more sensitive)
 *                      0.5 = onsetMultiplier of 12× (very strict)
 */
export function detectShots(
  samples: Float32Array,
  sampleRate: number,
  startTime: number | null,
  settings: AnalysisSettings,
): ShotEvent[] {
  if (startTime === null) return []

  // ~5 ms window, 50 % overlap
  const winSize  = Math.round(sampleRate * 0.005)
  const hopSize  = Math.round(sampleRate * 0.0025)
  const startIdx = Math.floor((startTime + 0.08) * sampleRate)

  // --- Stage 1: build peak envelope ----------------------------------------
  const peaks: number[] = []
  for (let i = startIdx; i + winSize < samples.length; i += hopSize) {
    let peak = 0
    for (let j = 0; j < winSize; j++) {
      const a = Math.abs(samples[i + j])
      if (a > peak) peak = a
    }
    peaks.push(peak)
  }

  // Absolute minimum peak to even consider (3× noiseFloor, min 0.12)
  const absFloor = Math.max(settings.noiseFloor * 4, 0.12)

  // How many frames to look back for the adaptive background median (~0.5 s)
  const medianWindow = Math.round(0.5 / (hopSize / sampleRate))

  // onsetMultiplier: how many times louder than background a shot must be
  const onsetMultiplier = 6.0 / settings.sensitivity

  // Hard cooldown in frames
  const cooldownFrames = Math.round((settings.minShotGapMs / 1000) / (hopSize / sampleRate))

  // --- Stage 2: pick shots --------------------------------------------------
  const shots: ShotEvent[] = []
  let cooldown = 0

  for (let fi = 0; fi < peaks.length; fi++) {
    if (cooldown > 0) { cooldown--; continue }

    const peak = peaks[fi]
    if (peak < absFloor) continue

    // Adaptive background: median of previous medianWindow frames
    const lo  = Math.max(0, fi - medianWindow)
    const slice = peaks.slice(lo, fi).sort((a, b) => a - b)
    const background = slice.length > 0 ? slice[Math.floor(slice.length / 2)] : 0

    // Must be significantly louder than background
    if (peak < background * onsetMultiplier) continue

    const eventTime = startIdx / sampleRate + fi * (hopSize / sampleRate)
    const confidence = background > 0 ? peak / background : peak * 10

    shots.push({
      id: `shot-${shots.length + 1}-${eventTime.toFixed(3)}`,
      time: Number(eventTime.toFixed(3)),
      confidence: Number(Math.min(confidence, 99).toFixed(3)),
      source: 'auto',
    })

    cooldown = cooldownFrames
  }

  return shots
}

