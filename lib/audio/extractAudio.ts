const TARGET_SAMPLE_RATE = 44100

export async function extractAudioFromFile(
  file: File,
  onProgress?: (phase: string) => void,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  onProgress?.('Leser fil…')
  const arrayBuffer = await file.arrayBuffer()

  onProgress?.('Dekoder lyd…')
  const decodeContext = new AudioContext()

  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await decodeContext.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    await decodeContext.close()
  }

  // If already mono at target rate, return directly
  if (audioBuffer.numberOfChannels === 1 && audioBuffer.sampleRate === TARGET_SAMPLE_RATE) {
    return { samples: new Float32Array(audioBuffer.getChannelData(0)), sampleRate: TARGET_SAMPLE_RATE }
  }

  // Resample + downmix to mono via OfflineAudioContext
  onProgress?.('Normaliserer lyd…')
  const duration = audioBuffer.duration
  const frameCount = Math.ceil(duration * TARGET_SAMPLE_RATE)
  const offlineCtx = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE)

  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start(0)

  const rendered = await offlineCtx.startRendering()
  const samples = new Float32Array(rendered.getChannelData(0))

  return { samples, sampleRate: TARGET_SAMPLE_RATE }
}
