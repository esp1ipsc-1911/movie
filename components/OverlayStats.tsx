'use client'

import { AnalysisResult } from '@/lib/types'

type OverlayStatsProps = {
  result: AnalysisResult
}

function statValue(value: number | null, suffix = 's') {
  if (value === null || Number.isNaN(value)) {
    return '--'
  }
  return `${value.toFixed(3)}${suffix}`
}

export function OverlayStats({ result }: OverlayStatsProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Analysis</h2>
        <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Auto
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-slate-400">Shots</div>
          <div className="mt-1 text-2xl font-bold text-white">{result.totalShots}</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-slate-400">Start beep</div>
          <div className="mt-1 text-2xl font-bold text-white">{statValue(result.startBeepTime)}</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-slate-400">First shot</div>
          <div className="mt-1 text-2xl font-bold text-white">{statValue(result.firstShotTime)}</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-slate-400">Best split</div>
          <div className="mt-1 text-2xl font-bold text-white">{statValue(result.bestSplit)}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Splits</div>
        <div className="max-h-48 space-y-2 overflow-auto pr-1 text-sm text-slate-200">
          {result.splits.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-3 text-slate-400">No splits available yet.</div>
          ) : (
            result.splits.map((split, index) => (
              <div key={`${split}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                <span>Split {index + 1}</span>
                <span className="font-semibold text-white">{split.toFixed(3)}s</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
