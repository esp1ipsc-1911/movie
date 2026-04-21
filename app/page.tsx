'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisControls } from '@/components/AnalysisControls'
import { AnalysisStatus } from '@/components/AnalysisStatus'
import { MatchStageHeader } from '@/components/MatchStageHeader'
import { OverlayStats } from '@/components/OverlayStats'
import { Timeline } from '@/components/Timeline'
import { UploadPanel } from '@/components/UploadPanel'
import { VideoPlayer } from '@/components/VideoPlayer'
import { createAnalysisJob, getAnalysisJob, uploadVideoToBlob } from '@/lib/api'
import { calculateStats } from '@/lib/audio/calculateStats'
import { AnalysisJobStatus, AnalysisResult, AnalysisSettings, MatchInfo, ShotEvent, UploadState } from '@/lib/types'

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

const emptyUploadState: UploadState = {
  url: null,
  pathname: null,
  fileName: null,
  size: null,
  contentType: null,
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pollingRef = useRef<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [settings, setSettings] = useState<AnalysisSettings>(defaultSettings)
  const [result, setResult] = useState<AnalysisResult>(emptyResult)
  const [status, setStatus] = useState<AnalysisJobStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>(emptyUploadState)
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    matchName: '',
    stageName: '',
    shooterName: '',
  })

  useEffect(() => {
    if (!file) {
      setVideoUrl(null)
      setUploadState(emptyUploadState)
      setStatus('idle')
      setError(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setVideoUrl(objectUrl)
    setUploadState({
      url: null,
      pathname: null,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    })

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

  useEffect(() => {
    if (!jobId || !['queued', 'analyzing'].includes(status)) {
      return
    }

    async function poll() {
      try {
        const job = await getAnalysisJob(jobId)
        setStatus(job.status)
        setError(job.error || null)
        if (job.result) {
          setResult(job.result)
        }
      } catch (pollError) {
        setStatus('failed')
        setError(pollError instanceof Error ? pollError.message : 'Could not read analysis status')
      }
    }

    poll()
    pollingRef.current = window.setInterval(poll, 2500)

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [jobId, status])

  const orderedShots = useMemo(() => [...result.shots].sort((a, b) => a.time - b.time), [result.shots])

  async function runAnalysis() {
    if (!file) {
      setError('Select a video first.')
      return
    }

    setError(null)
    setResult(emptyResult)
    setStatus('uploading')

    try {
      const blob = await uploadVideoToBlob(file)
      setUploadState({
        url: blob.url,
        pathname: blob.pathname,
        fileName: file.name,
        size: file.size,
        contentType: file.type,
      })
      setStatus('uploaded')

      const job = await createAnalysisJob({
        videoUrl: blob.url,
        settings,
        matchInfo,
      })
      setJobId(job.jobId)
      setStatus(job.status)
    } catch (runError) {
      setStatus('failed')
      setError(runError instanceof Error ? runError.message : 'Could not upload or create analysis job')
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
          <div className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Insight Dynamics Shooting - Movie v2</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Recorded run analysis with iPhone-first upload flow</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Upload a recorded run, store the original file safely, then send the job to a backend analyzer that can process iPhone video reliably.
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
          <UploadPanel onSelect={setFile} fileName={file?.name} disabled={status === 'uploading'} />
          <AnalysisStatus status={status} upload={uploadState} error={error} jobId={jobId} />
          <AnalysisControls
            settings={settings}
            onChange={setSettings}
            onAnalyze={runAnalysis}
            onAddShotAtCurrentTime={addShotAtCurrentTime}
            onRemoveLastShot={removeLastShot}
            disabled={status === 'uploading'}
            isAnalyzing={status === 'uploading' || status === 'queued' || status === 'analyzing'}
          />
          <OverlayStats result={result} />
        </div>
      </div>
    </main>
  )
}
