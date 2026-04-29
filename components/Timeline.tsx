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

  const playheadPct = duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0

  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Tidslinje</div>
          <div className="mt-2 text-sm text-slate-300">Klikk på markører for å hoppe i videoen.</div>
        </div>
        <div className="text-sm tabular-nums text-slate-300">
          {currentTime.toFixed(2)}s / {duration ? duration.toFixed(2) : '--'}s
        </div>
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

        {/* Shot marker track */}
        <div className="relative mt-4 h-8 overflow-visible rounded-xl bg-slate-900">
          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-px bg-white/40 transition-none"
            style={{ left: `${playheadPct}%` }}
          />

          {markers.map((marker, index) => {
            const left = duration > 0 ? `${(marker.time / duration) * 100}%` : '0%'
            return (
              <button
                key={`${marker.type}-${marker.time}-${index}`}
                type="button"
                onClick={() => onSeek(marker.time)}
                className={`absolute top-1 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-black/40 transition-transform hover:scale-125
                  ${marker.type === 'beep' ? 'bg-emerald-400' : 'bg-amber-300'}`}
                style={{ left }}
                title={`${marker.type === 'beep' ? 'Start-beep' : 'Skudd'} @ ${marker.time.toFixed(2)}s`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" /> Start-beep
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-300" /> Skudd
          </span>
        </div>
      </div>
    </div>
  )
}

