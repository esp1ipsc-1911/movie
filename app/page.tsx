'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisControls } from '@/components/AnalysisControls'
import { MatchStageHeader } from '@/components/MatchStageHeader'
import { OverlayStats } from '@/components/OverlayStats'
import { Timeline } from '@/components/Timeline'
import { UploadPanel } from '@/components/UploadPanel'
import { VideoPlayer } from '@/components/VideoPlayer'
import { calculateStats } from '@/lib/audio/calculateStats'
import { detectShots } from '@/lib/audio/detectShots'
import { detectStartBeep } from '@/lib/audio/detectStartBeep'
import { extractAudioFromFile } from '@/lib/audio/extractAudio'
import { AnalysisResult, AnalysisSettings, MatchInfo, ShotEvent } from '@/lib/types'

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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    matchName: '',
    stageName: '',
    shooterName: '',
  })

  useEffect(() => {
    if (!file) {
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
    if (!video) {
      return
    }

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
      return
    }

    setIsAnalyzing(true)
    try {
      const { samples, sampleRate } = await extractAudioFromFile(file)
      const beep = detectStartBeep(samples, sampleRate)
      const shots = detectShots(samples, sampleRate, beep, settings)
      setResult(calculateStats(beep, shots))
    } catch (error) {
      console.error('Analysis failed', error)
      alert('The app could not analyze this video file. Try another recording or format.')
    } finally {
      setIsAnalyzing(false)
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
    if (orderedShots.length === 0) {
      return
    }
    updateShots(orderedShots.slice(0, -1))
  }

  function seekTo(time: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-6 xl:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Insight Dynamics Shooting - Movie</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Recorded run analysis for dynamic shooting</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Upload a recorded run, detect the timer beep, identify shots, and separate likely shots from echo and background noise.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-6">
          <MatchStageHeader value={matchInfo} onChange={setMatchInfo} />
          <VideoPlayer videoUrl={videoUrl} videoRef={videoRef} matchInfo={matchInfo} currentTime={currentTime} />
          <Timeline result={result} duration={duration} currentTime={currentTime} onSeek={seekTo} />
        </div>

        <div className="space-y-6">
          <UploadPanel onSelect={setFile} fileName={file?.name} />
          <AnalysisControls
            settings={settings}
            onChange={setSettings}
            onAnalyze={runAnalysis}
            onAddShotAtCurrentTime={addShotAtCurrentTime}
            onRemoveLastShot={removeLastShot}
            isAnalyzing={isAnalyzing}
          />
          <OverlayStats result={result} />
        </div>
      </div>
    </main>
  )
}
