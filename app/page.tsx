'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisControls } from '@/components/AnalysisControls'
import { AnalysisStatus } from '@/components/AnalysisStatus'
import { MatchStageHeader } from '@/components/MatchStageHeader'
import { OverlayStats } from '@/components/OverlayStats'
import { Timeline } from '@/components/Timeline'
import { UploadPanel } from '@/components/UploadPanel'
import { VideoPlayer } from '@/components/VideoPlayer'
import { VideoExporter } from '@/components/VideoExporter'
import { calculateStats } from '@/lib/audio/calculateStats'
import { detectShots } from '@/lib/audio/detectShots'
import { detectStartBeep } from '@/lib/audio/detectStartBeep'
import { extractAudioFromFile } from '@/lib/audio/extractAudio'
import { AnalysisJobStatus, AnalysisResult, AnalysisSettings, MatchInfo, ShotEvent } from '@/lib/types'

const defaultSettings: AnalysisSettings = {
  sensitivity: 1,
  echoWindowMs: 120,
  minShotGapMs: 140,
  noiseFloor: 0.04,
}

const emptyResult: AnalysisResult = {
  startBeepTime: null,
  shots: [],
  firstShotTime: null,
  bestSplit: null,
  splits: [],
  totalShots: 0,
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [settings, setSettings] = useState<AnalysisSettings>(defaultSettings)
  const [result, setResult] = useState<AnalysisResult>(emptyResult)
  const [status, setStatus] = useState<AnalysisJobStatus>('idle')
  const [analysisPhase, setAnalysisPhase] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    matchName: '',
    stageName: '',
    shooterName: '',
  })

  useEffect(() => {
    if (!file) {
      setVideoUrl(null)
      setStatus('idle')
      setError(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setVideoUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => setDuration(video.duration || 0)
    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0)

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [videoUrl])

  const orderedShots = useMemo(() => [...result.shots].sort((a, b) => a.time - b.time), [result.shots])

  async function runAnalysis() {
    if (!file) {
      setError('Velg en video først.')
      return
    }

    setError(null)
    setResult(emptyResult)
    setStatus('analyzing')

    try {
      const { samples, sampleRate } = await extractAudioFromFile(file, (phase) => {
        setAnalysisPhase(phase)
      })

      setAnalysisPhase('Finner start-beep…')
      const beepTime = detectStartBeep(samples, sampleRate)

      setAnalysisPhase('Detekterer skudd…')
      const shots = detectShots(samples, sampleRate, beepTime, settings)

      setAnalysisPhase('Beregner statistikk…')
      const stats = calculateStats(beepTime, shots)

      setResult(stats)
      setStatus('completed')
      setAnalysisPhase('')
    } catch (err) {
      setStatus('failed')
      setAnalysisPhase('')
      setError(
        err instanceof Error
          ? `Analysefeil: ${err.message}`
          : 'Kunne ikke analysere lyden i videofilen. Prøv et annet format.',
      )
    }
  }

  function updateShots(newShots: ShotEvent[]) {
    setResult(calculateStats(result.startBeepTime, newShots))
  }

  function addShotAtCurrentTime() {
    const newShot: ShotEvent = {
      id: `manual-${Date.now()}`,
      time: Number(currentTime.toFixed(3)),
      confidence: 1,
      source: 'manual',
    }
    updateShots([...orderedShots, newShot])
  }

  function removeLastShot() {
    if (orderedShots.length === 0) return
    updateShots(orderedShots.slice(0, -1))
  }

  function seekTo(time: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const isAnalyzing = status === 'analyzing'

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-6 xl:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Insight Dynamics Shooting — Movie</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Skuddanalyse direkte i nettleseren</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Last opp en opptak fra iPhone eller kamera. Lyden analyseres lokalt i nettleseren — ingen opplasting til server.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <MatchStageHeader value={matchInfo} onChange={setMatchInfo} />
          <VideoPlayer videoUrl={videoUrl} videoRef={videoRef} matchInfo={matchInfo} currentTime={currentTime} />
          <Timeline result={result} duration={duration} currentTime={currentTime} onSeek={seekTo} />
        </div>

        <div className="space-y-6">
          <UploadPanel onSelect={setFile} fileName={file?.name} disabled={isAnalyzing} />
          <AnalysisStatus status={status} phase={analysisPhase} error={error} fileName={file?.name ?? null} fileSize={file?.size ?? null} />
          <AnalysisControls
            settings={settings}
            onChange={setSettings}
            onAnalyze={runAnalysis}
            onAddShotAtCurrentTime={addShotAtCurrentTime}
            onRemoveLastShot={removeLastShot}
            disabled={isAnalyzing}
            isAnalyzing={isAnalyzing}
          />
          <OverlayStats result={result} />
          <VideoExporter videoUrl={videoUrl} result={result} matchInfo={matchInfo} />
        </div>
      </div>
    </main>
  )
}
