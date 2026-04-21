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
    ...(result.startBeepTime != null ? [{ type: 'beep' as const, time: result.startBeepTime }] : []),
    ...result.shots.map((shot) => ({ type: 'shot' as const, time: shot.time })),
  ]

  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Timeline</div>
          <div className="mt-2 text-sm text-slate-300">Tap markers to jump through the run.</div>
        </div>
        <div className="text-sm text-slate-300">{currentTime.toFixed(2)}s / {duration ? duration.toFixed(2) : '--'}s</div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="w-full"
        />
        <div className="relative mt-4 h-6 overflow-hidden rounded-xl bg-slate-900">
          {markers.map((marker, index) => {
            const left = duration > 0 ? `${(marker.time / duration) * 100}%` : '0%'
            return (
              <button
                key={`${marker.type}-${marker.time}-${index}`}
                type="button"
                onClick={() => onSeek(marker.time)}
                className={`absolute top-1 h-4 w-4 -translate-x-1/2 rounded-full border border-black/30 ${marker.type === 'beep' ? 'bg-emerald-400' : 'bg-amber-300'}`}
                style={{ left }}
                title={`${marker.type} at ${marker.time.toFixed(2)}s`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
