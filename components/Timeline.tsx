'use client'

import { AnalysisResult } from '@/lib/types'

type TimelineProps = {
  result: AnalysisResult
  duration: number
  currentTime: number
  onSeek: (time: number) => void
}

export function Timeline({ result, duration, currentTime, onSeek }: TimelineProps) {
  const markers = [
    ...(result.startBeepTime !== null
      ? [{ type: 'beep' as const, time: result.startBeepTime, label: 'Start' }]
      : []),
    ...result.shots.map((shot, index) => ({ type: 'shot' as const, time: shot.time, label: `S${index + 1}` })),
  ]

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Timeline</h3>
        <div className="text-sm text-slate-300">Current: {currentTime.toFixed(2)}s</div>
      </div>

      <div
        className="relative h-16 cursor-pointer rounded-2xl bg-slate-950/70"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          onSeek(Math.max(0, Math.min(duration, ratio * duration)))
        }}
      >
        <div className="absolute inset-y-0 left-0 rounded-2xl bg-amber-400/10" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />

        {markers.map((marker) => {
          const left = duration > 0 ? (marker.time / duration) * 100 : 0
          return (
            <button
              key={`${marker.type}-${marker.time}-${marker.label}`}
              className={`absolute top-2 -translate-x-1/2 rounded-full px-2 py-1 text-[10px] font-bold ${
                marker.type === 'beep' ? 'bg-cyan-400 text-slate-950' : 'bg-amber-400 text-slate-950'
              }`}
              style={{ left: `${left}%` }}
              onClick={(event) => {
                event.stopPropagation()
                onSeek(marker.time)
              }}
            >
              {marker.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>0.00s</span>
        <span>{duration.toFixed(2)}s</span>
      </div>
    </div>
  )
}
