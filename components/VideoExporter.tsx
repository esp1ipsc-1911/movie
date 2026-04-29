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
const AMBER  = '#fbbf24'
const GREEN  = '#34d399'
const WHITE  = '#ffffff'
const BG     = 'rgba(2, 6, 23, 0.78)'

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  currentTime: number,
  result: AnalysisResult,
  matchInfo: MatchInfo,
) {
  const { startBeepTime, shots, firstShotTime, bestSplit, splits } = result
  const pad = Math.round(w * 0.022)
  const r = Math.round(w * 0.018)

  // ── Top-left info panel ─────────────────────────────────────────────────────
  const lines: { text: string; color: string; size: number }[] = [
    { text: 'INSIGHT DYNAMICS SHOOTING — MOVIE', color: AMBER, size: Math.round(w * 0.018) },
    { text: matchInfo.matchName || 'Match ikke satt',  color: WHITE, size: Math.round(w * 0.026) },
    { text: matchInfo.stageName || 'Stage ikke satt',  color: '#94a3b8', size: Math.round(w * 0.022) },
  ]
  if (matchInfo.shooterName) {
    lines.push({ text: matchInfo.shooterName, color: '#64748b', size: Math.round(w * 0.020) })
  }

  const lineHeight = Math.round(w * 0.032)
  const panelH = pad * 2 + lines.length * lineHeight
  const panelW = Math.round(w * 0.44)

  ctx.fillStyle = BG
  roundRect(ctx, pad, pad, panelW, panelH, r)
  ctx.fill()

  let ty = pad * 2
  for (const line of lines) {
    ctx.fillStyle = line.color
    ctx.font = `600 ${line.size}px "SF Pro Display", -apple-system, system-ui, sans-serif`
    ctx.fillText(line.text, pad * 2, ty)
    ty += lineHeight
  }

  // ── Bottom-right time panel ─────────────────────────────────────────────────
  const timeStr = currentTime.toFixed(2) + 's'
  const timeFontSize = Math.round(w * 0.048)
  ctx.font = `800 ${timeFontSize}px "SF Pro Display", -apple-system, system-ui, sans-serif`
  const timeW = ctx.measureText(timeStr).width
  const timePanelW = timeW + pad * 3
  const timePanelH = timeFontSize + pad * 2.5

  ctx.fillStyle = BG
  roundRect(ctx, w - timePanelW - pad, h - timePanelH - pad, timePanelW, timePanelH, r)
  ctx.fill()

  ctx.fillStyle = WHITE
  ctx.fillText(timeStr, w - timeW - pad * 1.5, h - pad * 1.8)

  // ── Bottom timeline bar ─────────────────────────────────────────────────────
  const barH    = Math.round(h * 0.045)
  const barY    = h - barH - pad * 0.4
  const barX    = pad
  const barW    = w - pad * 2
  const barR    = Math.round(barH / 2)
  const duration = shots.length > 0 ? Math.max(...shots.map(s => s.time)) + 2 : currentTime + 2

  // Bar background
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
  roundRect(ctx, barX, barY, barW, barH, barR)
  ctx.fill()

  // Progress fill
  const progress = duration > 0 ? currentTime / duration : 0
  ctx.fillStyle = 'rgba(251,191,36,0.25)'
  roundRect(ctx, barX, barY, barW * progress, barH, barR)
  ctx.fill()

  // Shot markers on bar
  for (const shot of shots) {
    const mx = barX + (shot.time / duration) * barW
    const isActive = currentTime >= shot.time && currentTime < shot.time + 0.5
    ctx.fillStyle = isActive ? AMBER : 'rgba(251,191,36,0.7)'
    ctx.beginPath()
    ctx.arc(mx, barY + barH / 2, isActive ? barH * 0.55 : barH * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  // Beep marker
  if (startBeepTime != null) {
    const bx = barX + (startBeepTime / duration) * barW
    ctx.fillStyle = GREEN
    ctx.beginPath()
    ctx.arc(bx, barY + barH / 2, barH * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  // Playhead
  const px = barX + progress * barW
  ctx.strokeStyle = WHITE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, barY)
  ctx.lineTo(px, barY + barH)
  ctx.stroke()

  // ── Stats panel – top right ─────────────────────────────────────────────────
  const stats: { label: string; value: string }[] = [
    { label: 'SKUDD', value: String(shots.length) },
    { label: 'FØRSTE', value: firstShotTime != null ? firstShotTime.toFixed(2) + 's' : '--' },
    { label: 'BESTE SPLIT', value: bestSplit != null ? bestSplit.toFixed(2) + 's' : '--' },
  ]

  const statFontSize = Math.round(w * 0.022)
  const statValSize  = Math.round(w * 0.032)
  const statW = Math.round(w * 0.18)
  const statH = pad * 2 + stats.length * (statFontSize + statValSize + pad * 0.6)
  const statX = w - statW - pad

  ctx.fillStyle = BG
  roundRect(ctx, statX, pad, statW, statH, r)
  ctx.fill()

  let sy = pad * 2
  for (const stat of stats) {
    ctx.fillStyle = '#64748b'
    ctx.font = `600 ${statFontSize}px "SF Pro Display", -apple-system, system-ui, sans-serif`
    ctx.fillText(stat.label, statX + pad, sy)
    sy += statFontSize + 4
    ctx.fillStyle = WHITE
    ctx.font = `800 ${statValSize}px "SF Pro Display", -apple-system, system-ui, sans-serif`
    ctx.fillText(stat.value, statX + pad, sy)
    sy += statValSize + pad * 0.6
  }

  // ── Active shot flash ───────────────────────────────────────────────────────
  for (const shot of shots) {
    const age = currentTime - shot.time
    if (age >= 0 && age < 0.4) {
      const alpha = 1 - age / 0.4
      ctx.fillStyle = `rgba(251,191,36,${alpha * 0.18})`
      ctx.fillRect(0, 0, w, h)

      // Split label
      const shotIdx = shots.indexOf(shot)
      const splitLabel = shotIdx === 0
        ? (startBeepTime != null ? `Drew: ${firstShotTime?.toFixed(2)}s` : `Skudd 1`)
        : `Split ${shotIdx}: ${splits[shotIdx - 1]?.toFixed(2)}s`

      const flashSize = Math.round(w * 0.055)
      ctx.font = `900 ${flashSize}px "SF Pro Display", -apple-system, system-ui, sans-serif`
      ctx.fillStyle = `rgba(251,191,36,${alpha})`
      ctx.textAlign = 'center'
      ctx.fillText(splitLabel, w / 2, h / 2)
      ctx.textAlign = 'left'
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
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

    // Create hidden video element for frame source
    const video = document.createElement('video')
    video.src = videoUrl
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    await new Promise<void>((res) => {
      video.onloadedmetadata = () => res()
      video.load()
    })

    const duration = video.duration
    const W = video.videoWidth  || 1280
    const H = video.videoHeight || 720

    // Canvas for compositing
    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Choose best supported MIME
    const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    const chunks: BlobPart[] = []
    const stream   = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    const recordingDone = new Promise<void>((res) => {
      recorder.onstop = () => res()
    })

    recorder.start(100) // collect chunks every 100ms

    // Render frame by frame at ~30 fps using requestAnimationFrame isn't
    // available headlessly, so we seek + draw in a loop
    const fps      = 30
    const frameMs  = 1000 / fps
    let   t        = 0

    const seekAndDraw = (): Promise<void> =>
      new Promise((res) => {
        video.currentTime = t
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, W, H)
          drawOverlay(ctx, W, H, t, result, matchInfo)
          res()
        }
      })

    while (t <= duration && !cancelRef.current) {
      await seekAndDraw()
      setProgress(Math.round((t / duration) * 100))
      t += frameMs / 1000
      // Yield to browser
      await new Promise(r => setTimeout(r, 0))
    }

    recorder.stop()
    await recordingDone

    if (cancelRef.current) {
      setState('idle')
      return
    }

    const blob = new Blob(chunks, { type: mimeType })
    const url  = URL.createObjectURL(blob)
    setDownloadUrl(url)
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
