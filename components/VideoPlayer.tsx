'use client'

import { AnalysisResult, MatchInfo } from '@/lib/types'
import React, { useEffect, useRef } from 'react'

type VideoPlayerProps = {
  videoUrl: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  matchInfo: MatchInfo
  currentTime: number
  result: AnalysisResult
}

export function VideoPlayer({ videoUrl, videoRef, matchInfo, currentTime, result }: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const playOriginRef = useRef<{ wallMs: number; videoT: number } | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')!

    function syncOrigin() {
      if (!video) return
      if (!video.paused && !video.ended) {
        playOriginRef.current = { wallMs: performance.now(), videoT: video.currentTime }
      } else {
        playOriginRef.current = null
      }
    }

    function getDisplayTime(): number {
      if (!video) return 0
      if (playOriginRef.current && !video.paused && !video.ended) {
        const elapsed = (performance.now() - playOriginRef.current.wallMs) / 1000
        return playOriginRef.current.videoT + elapsed * video.playbackRate
      }
      return video.currentTime
    }

    function drawFrame() {
      if (!video || !canvas) return
      const w = canvas.width
      const h = canvas.height
      ctx.drawImage(video, 0, 0, w, h)
      drawHUD(ctx, w, h, getDisplayTime(), result, matchInfo)
      rafRef.current = requestAnimationFrame(drawFrame)
    }

    function onResize() {
      if (!video || !canvas) return
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const ratio = video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 16 / 9
      canvas.width  = Math.round(rect.width)
      canvas.height = Math.round(rect.width / ratio)
    }

    video.addEventListener('play',       syncOrigin)
    video.addEventListener('pause',      syncOrigin)
    video.addEventListener('seeked',     syncOrigin)
    video.addEventListener('ratechange', syncOrigin)
    video.addEventListener('loadedmetadata', onResize)

    const ro = new ResizeObserver(onResize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    onResize()
    rafRef.current = requestAnimationFrame(drawFrame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener('play',       syncOrigin)
      video.removeEventListener('pause',      syncOrigin)
      video.removeEventListener('seeked',     syncOrigin)
      video.removeEventListener('ratechange', syncOrigin)
      video.removeEventListener('loadedmetadata', onResize)
      ro.disconnect()
    }
  }, [videoUrl, result, matchInfo])

  const videoEl = (videoRef as React.RefObject<HTMLVideoElement>).current

  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-3 shadow-soft backdrop-blur">
      <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-black">
        {videoUrl ? (
          <>
            <video
              ref={videoRef as React.RefObject<HTMLVideoElement>}
              src={videoUrl}
              playsInline
              className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
            />
            <canvas
              ref={canvasRef}
              className="block w-full cursor-pointer"
              onClick={() => {
                const v = (videoRef as React.RefObject<HTMLVideoElement>).current
                if (!v) return
                v.paused ? v.play() : v.pause()
              }}
            />
            <div className="flex items-center gap-2 px-3 pb-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const v = (videoRef as React.RefObject<HTMLVideoElement>).current
                  if (!v) return
                  v.paused ? v.play() : v.pause()
                }}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white"
              >
                ▶ / ⏸
              </button>
              <input
                type="range"
                min={0}
                max={videoEl?.duration || 0}
                step={0.01}
                value={currentTime}
                onChange={(e) => {
                  const v = (videoRef as React.RefObject<HTMLVideoElement>).current
                  if (v) v.currentTime = Number(e.target.value)
                }}
                className="flex-1"
              />
              <span className="min-w-[3rem] text-right text-xs tabular-nums text-slate-400">
                {currentTime.toFixed(2)}s
              </span>
            </div>
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center p-8 text-center text-slate-400">
            Last opp en video for å starte analysen.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HUD drawing ──────────────────────────────────────────────────────────────

function drawHUD(
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

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.roundRect(barX, barY, barW, barH, barH / 2)
  ctx.fill()

  // Progress
  if (prog > 0) {
    ctx.fillStyle = 'rgba(251,191,36,0.55)'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW * prog, barH, barH / 2)
    ctx.fill()
  }

  // Shot markers
  const dotR = Math.round(h * 0.009)
  for (const shot of shots) {
    const mx = barX + (shot.time / duration) * barW
    const isActive = t >= shot.time && t < shot.time + 0.5
    ctx.beginPath()
    ctx.arc(mx, barY + barH / 2, isActive ? dotR * 1.6 : dotR, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#fbbf24' : 'rgba(251,191,36,0.85)'
    ctx.fill()
  }

  // Beep marker
  if (startBeepTime != null) {
    const bx = barX + (startBeepTime / duration) * barW
    ctx.beginPath()
    ctx.arc(bx, barY + barH / 2, dotR, 0, Math.PI * 2)
    ctx.fillStyle = '#34d399'
    ctx.fill()
  }

  // Playhead
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
