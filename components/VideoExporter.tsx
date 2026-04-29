'use client'

import { useRef, useState } from 'react'
import { AnalysisResult, MatchInfo } from '@/lib/types'

type VideoExporterProps = {
  videoUrl: string | null
  result: AnalysisResult
  matchInfo: MatchInfo
}

type ExportState = 'idle' | 'rendering' | 'done' | 'error' | 'unsupported'

// Colors
const AMBER = '#fbbf24'
const GREEN = '#34d399'

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  result: AnalysisResult,
  matchInfo: MatchInfo,
) {
  const { shots, startBeepTime, firstShotTime, splits } = result
  const duration = shots.length > 0
    ? Math.max(...shots.map(s => s.time)) + 1.5
    : Math.max(t + 1, 5)

  // ── Top-left: minimal match info ──────────────────────────────────────────
  const infoLines = [matchInfo.matchName, matchInfo.stageName, matchInfo.shooterName].filter(Boolean) as string[]
  if (infoLines.length > 0) {
    const pad = Math.round(w * 0.018)
    const labelSize = Math.round(h * 0.030)
    const lineH = labelSize * 1.4

    const grad = ctx.createLinearGradient(0, 0, 0, pad * 2 + infoLines.length * lineH + pad)
    grad.addColorStop(0, 'rgba(0,0,0,0.50)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, Math.round(w * 0.5), pad * 2 + infoLines.length * lineH + pad)

    let ly = pad + labelSize
    for (let i = 0; i < infoLines.length; i++) {
      ctx.font = `${i === 0 ? 700 : 500} ${labelSize}px -apple-system,"SF Pro Display",system-ui,sans-serif`
      ctx.fillStyle = i === 0 ? 'rgba(251,191,36,0.95)' : 'rgba(255,255,255,0.80)'
      ctx.textAlign = 'left'
      ctx.fillText(infoLines[i], pad, ly)
      ly += lineH
    }
  }

  // ── Bottom gradient fade ───────────────────────────────────────────────────
  const fadeH = Math.round(h * 0.22)
  const fadeGrad = ctx.createLinearGradient(0, h - fadeH, 0, h)
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)')
  fadeGrad.addColorStop(1, 'rgba(0,0,0,0.68)')
  ctx.fillStyle = fadeGrad
  ctx.fillRect(0, h - fadeH, w, fadeH)

  // ── Timeline bar ──────────────────────────────────────────────────────────
  const barH = Math.round(h * 0.007)
  const barY = h - Math.round(h * 0.048)
  const barX = Math.round(w * 0.025)
  const barW = w - barX * 2
  const prog = Math.min(1, t / duration)

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.roundRect(barX, barY, barW, barH, barH / 2)
  ctx.fill()

  if (prog > 0) {
    ctx.fillStyle = 'rgba(251,191,36,0.55)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW * prog, barH, barH / 2)
    ctx.fill()
  }

  const dotR = Math.round(h * 0.009)
  for (const shot of shots) {
    const mx = barX + (shot.time / duration) * barW
    const isActive = t >= shot.time && t < shot.time + 0.5
    ctx.beginPath()
    ctx.arc(mx, barY + barH / 2, isActive ? dotR * 1.6 : dotR, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? AMBER : 'rgba(251,191,36,0.85)'
    ctx.fill()
  }

  if (startBeepTime != null) {
    const bx = barX + (startBeepTime / duration) * barW
    ctx.beginPath()
    ctx.arc(bx, barY + barH / 2, dotR, 0, Math.PI * 2)
    ctx.fillStyle = GREEN
    ctx.fill()
  }

  const px = barX + prog * barW
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(1, Math.round(w * 0.0015))
  ctx.beginPath()
  ctx.moveTo(px, barY - dotR * 1.5)
  ctx.lineTo(px, barY + barH + dotR * 1.5)
  ctx.stroke()

  // ── Timer bottom-right ─────────────────────────────────────────────────────
  const timerSize = Math.round(h * 0.072)
  ctx.font = `800 ${timerSize}px -apple-system,"SF Pro Display",system-ui,monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.textAlign = 'right'
  ctx.fillText(t.toFixed(2), w - Math.round(w * 0.025), h - Math.round(h * 0.055))
  ctx.textAlign = 'left'

  // ── Active shot flash + split label ───────────────────────────────────────
  for (let i = 0; i < shots.length; i++) {
    const age = t - shots[i].time
    if (age >= 0 && age < 0.5) {
      const alpha = 1 - age / 0.5
      ctx.fillStyle = `rgba(251,191,36,${alpha * 0.10})`
      ctx.fillRect(0, 0, w, h)

      const splitStr = i === 0
        ? (startBeepTime != null ? `DRAW  ${firstShotTime?.toFixed(2)}s` : `SKUDD 1`)
        : `SPLIT ${i}  ${splits[i - 1]?.toFixed(2)}s`

      const splitSize = Math.round(h * 0.050)
      ctx.font = `900 ${splitSize}px -apple-system,"SF Pro Display",system-ui,sans-serif`
      ctx.fillStyle = `rgba(251,191,36,${alpha})`
      ctx.textAlign = 'left'
      ctx.fillText(splitStr, Math.round(w * 0.025), h - Math.round(h * 0.095))
    }
  }
}

export function VideoExporter({ videoUrl, result, matchInfo }: VideoExporterProps) {
  const [state, setState]       = useState<ExportState>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const cancelRef = useRef(false)

  if (!videoUrl || result.shots.length === 0) return null

  function checkSupport(): boolean {
    if (typeof window === 'undefined') return false
    if (!window.MediaRecorder) return false
    // Prefer WebM (Chrome/Firefox); Safari 17+ also supports it
    const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
    return types.some(t => MediaRecorder.isTypeSupported(t))
  }

  async function startExport() {
    if (!videoUrl) return
    if (!checkSupport()) {
      setState('unsupported')
      return
    }

    cancelRef.current = false
    setState('rendering')
    setProgress(0)
    setDownloadUrl(null)

    const video = document.createElement('video')
    video.src = videoUrl
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    // Play at 2× speed to render faster, we capture every frame anyway
    video.playbackRate = 1.0

    await new Promise<void>((res) => {
      video.onloadedmetadata = () => res()
      video.load()
    })

    const duration = video.duration

    // Scale down for faster rendering – cap at 1280px wide
    const origW = video.videoWidth  || 1280
    const origH = video.videoHeight || 720
    const scale = Math.min(1, 1280 / origW)
    const W = Math.round(origW * scale)
    const H = Math.round(origH * scale)

    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { alpha: false })!

    const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    const chunks: BlobPart[] = []
    // Capture at 30fps
    const stream   = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    const recordingDone = new Promise<void>((res) => { recorder.onstop = () => res() })
    recorder.start(200)

    // Draw loop driven by requestAnimationFrame during playback
    let rafId = 0
    let lastProgress = 0

    const drawFrame = () => {
      if (cancelRef.current) return
      const t = video.currentTime
      ctx.drawImage(video, 0, 0, W, H)
      drawOverlay(ctx, W, H, t, result, matchInfo)
      const pct = Math.round((t / duration) * 100)
      if (pct !== lastProgress) {
        lastProgress = pct
        setProgress(pct)
      }
      if (!video.ended && !video.paused) {
        rafId = requestAnimationFrame(drawFrame)
      }
    }

    await new Promise<void>((res) => {
      video.onended = () => res()
      video.onerror = () => res()
      video.currentTime = 0
      video.onseeked = () => {
        rafId = requestAnimationFrame(drawFrame)
        video.play()
      }
    })

    cancelAnimationFrame(rafId)

    // Draw final frame
    ctx.drawImage(video, 0, 0, W, H)
    drawOverlay(ctx, W, H, duration, result, matchInfo)

    recorder.stop()
    await recordingDone

    if (cancelRef.current) {
      setState('idle')
      return
    }

    const blob = new Blob(chunks, { type: mimeType })
    setDownloadUrl(URL.createObjectURL(blob))
    setState('done')
  }

  function cancel() {
    cancelRef.current = true
    setState('idle')
    setProgress(0)
  }

  const ext = downloadUrl?.includes('mp4') ? 'mp4' : 'webm'

  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel2/80 p-5 shadow-soft backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Eksporter video</div>
      <p className="mt-2 text-sm text-slate-300">
        Genererer en ny videofil med statistikk-overlay bakt inn. Kan lagres til kamerarullen fra nettleseren.
      </p>

      {state === 'unsupported' && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Nettleseren din støtter ikke MediaRecorder. Bruk Safari 17+, Chrome eller Firefox.
        </div>
      )}

      {state === 'idle' && (
        <button
          type="button"
          onClick={startExport}
          className="mt-4 w-full rounded-2xl bg-accent px-4 py-4 text-base font-black text-slate-950 transition hover:brightness-105"
        >
          Generer video med overlay
        </button>
      )}

      {state === 'rendering' && (
        <div className="mt-4 space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Rendrer… {progress}%</span>
            <button type="button" onClick={cancel} className="text-slate-500 underline hover:text-slate-300">
              Avbryt
            </button>
          </div>
          <p className="text-xs text-slate-500">Dette kan ta noen minutter avhengig av videolengde.</p>
        </div>
      )}

      {state === 'done' && downloadUrl && (
        <div className="mt-4 space-y-3">
          <a
            href={downloadUrl}
            download={`shooting-overlay.${ext}`}
            className="block w-full rounded-2xl bg-emerald-500 px-4 py-4 text-center text-base font-black text-slate-950 transition hover:brightness-105"
          >
            Last ned video (.{ext})
          </a>
          <p className="text-xs text-slate-400">
            På iPhone: trykk og hold på nedlastingsknappen → «Lagre til Bilder» for å legge den i kamerarullen.
          </p>
          <button
            type="button"
            onClick={() => { setState('idle'); setDownloadUrl(null) }}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"
          >
            Generer på nytt
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Noe gikk galt under eksport. Prøv igjen.
        </div>
      )}
    </div>
  )
}
