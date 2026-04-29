import { AnalysisSettings, ShotEvent } from '@/lib/types'

/**
 * Cluster-peak shot detector, tuned for 9mm pistol fire outdoors on iPhone.
 *
 * Analysis of real recordings shows:
 * - Genuine shots produce short bursts of high amplitude (peak > 0.45-0.65)
 * - Echo/reverb decays within ~200ms but stays audible
 * - Background movement noise stays below ~0.35 peak
 * - Shots cluster in tight groups of identical-peak frames (~5-15ms wide)
 *
 * Strategy:
 * 1. Build a 5ms peak envelope
 * 2. Apply a hard amplitude threshold (scales with sensitivity setting)
 * 3. Group consecutive threshold-crossings into clusters
 * 4. Take the peak frame of each cluster as the shot time
 * 5. Enforce minimum gap between shots (kills echoes completely)
 *
 * This is deliberately simple and robust - no spectral analysis,
 * no adaptive background, just threshold + clustering.
 * The sensitivity slider moves the threshold between 0.35 (sensitive) and 0.65 (strict).
 */
export function detectShots(
  samples: Float32Array,
  sampleRate: number,
  startTime: number | null,
  settings: AnalysisSettings,
): ShotEvent[] {
  if (startTime === null) return []

  // 5ms window, 2.5ms hop - short enough to catch sharp transients
  const winSize = Math.round(sampleRate * 0.005)
  const hopSize = Math.round(sampleRate * 0.0025)
  const startIdx = Math.floor((startTime + 0.05) * sampleRate)

  // Threshold: sensitivity=1.0 → 0.50, sensitivity=2.0 → 0.35, sensitivity=0.5 → 0.65
  // Clamped to [0.30, 0.75]
  const threshold = Math.max(0.30, Math.min(0.75, 0.50 / settings.sensitivity))

  // Min gap between shots in frames - based on minShotGapMs setting
  const minGapFrames = Math.round((settings.minShotGapMs / 1000) / (hopSize / sampleRate))

  // --- Build peak envelope ---
  const peakEnv: number[] = []
  const envTimes: number[] = []
  for (let i = startIdx; i + winSize < samples.length; i += hopSize) {
    let peak = 0
    for (let j = 0; j < winSize; j++) {
      const a = Math.abs(samples[i + j])
      if (a > peak) peak = a
    }
    peakEnv.push(peak)
    envTimes.push(i / sampleRate)
  }

  // --- Cluster detection ---
  // Group consecutive frames above threshold into clusters,
  // then take the highest-peak frame as the shot.
  const shots: ShotEvent[] = []
  let lastShotFrame = -minGapFrames * 2
  let inCluster = false
  let clusterPeak = 0
  let clusterPeakFrame = 0

  for (let fi = 0; fi < peakEnv.length; fi++) {
    const p = peakEnv[fi]

    if (p >= threshold) {
      if (!inCluster) {
        // Start new cluster - but only if past the minimum gap
        if (fi - lastShotFrame >= minGapFrames) {
          inCluster = true
          clusterPeak = p
          clusterPeakFrame = fi
        }
      } else {
        // Extend cluster, track peak frame
        if (p > clusterPeak) {
          clusterPeak = p
          clusterPeakFrame = fi
        }
      }
    } else {
      if (inCluster) {
        // Cluster ended - emit shot at peak frame
        const eventTime = envTimes[clusterPeakFrame]
        shots.push({
          id: `shot-${shots.length + 1}-${eventTime.toFixed(3)}`,
          time: Number(eventTime.toFixed(3)),
          confidence: Number(clusterPeak.toFixed(3)),
          source: 'auto',
        })
        lastShotFrame = clusterPeakFrame
        inCluster = false
        clusterPeak = 0
      }
    }
  }

  // Handle cluster that extends to end of audio
  if (inCluster) {
    const eventTime = envTimes[clusterPeakFrame]
    shots.push({
      id: `shot-${shots.length + 1}-${eventTime.toFixed(3)}`,
      time: Number(eventTime.toFixed(3)),
      confidence: Number(clusterPeak.toFixed(3)),
      source: 'auto',
    })
  }

  return shots
}


