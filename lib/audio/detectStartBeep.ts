export function detectStartBeep(
  samples: Float32Array,
  sampleRate: number,
  minSeconds = 0,
): number | null {
  const frameSize = 1024
  const hopSize = 256
  const startIndex = Math.floor(minSeconds * sampleRate)
  let bestScore = 0
  let bestTime: number | null = null

  for (let i = startIndex; i + frameSize < samples.length; i += hopSize) {
    let energy = 0
    let zeroCrossings = 0

    for (let j = 0; j < frameSize; j += 1) {
      const current = samples[i + j]
      const next = samples[i + j + 1] ?? 0
      energy += current * current
      if ((current >= 0 && next < 0) || (current < 0 && next >= 0)) {
        zeroCrossings += 1
      }
    }

    const normalizedEnergy = energy / frameSize
    const zcr = zeroCrossings / frameSize
    const score = normalizedEnergy * (1 + zcr * 6)

    if (score > bestScore && normalizedEnergy > 0.005 && zcr > 0.08) {
      bestScore = score
      bestTime = i / sampleRate
    }
  }

  return bestTime !== null ? Number(bestTime.toFixed(3)) : null
}
