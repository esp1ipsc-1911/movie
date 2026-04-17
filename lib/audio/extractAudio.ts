export async function extractAudioFromFile(file: File): Promise<{ samples: Float32Array; sampleRate: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const channelData = audioBuffer.getChannelData(0)
    return {
      samples: new Float32Array(channelData),
      sampleRate: audioBuffer.sampleRate,
    }
  } finally {
    await audioContext.close()
  }
}
