import { AnalysisResult } from '@/lib/types'

type OverlayStatsProps = {
  result: AnalysisResult
}

function formatTime(value: number | null) {
  if (value == null) {
    return '--'
  }
  return `${value.toFixed(2)}s`
}

const cards = [
  { key: 'shots', label: 'Shots', value: (result: AnalysisResult) => String(result.totalShots) },
  { key: 'startBeep', label: 'Start beep', value: (result: AnalysisResult) => formatTime(result.startBeepTime) },
  { key: 'firstShot', label: 'First shot', value: (result: AnalysisResult) => formatTime(result.firstShotTime) },
  { key: 'bestSplit', label: 'Best split', value: (result: AnalysisResult) => formatTime(result.bestSplit) },
]

export function OverlayStats({ result }: OverlayStatsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.key} className="rounded-[1.75rem] border border-white/10 bg-panel/80 p-5 shadow-soft backdrop-blur">
            <div className="text-sm text-slate-400">{card.label}</div>
            <div className="mt-4 text-4xl font-black tracking-tight text-white">{card.value(result)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-panel/80 p-5 shadow-soft backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Splits</div>
        {result.splits.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {result.splits.map((split, index) => (
              <div key={`${split}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                Split {index + 1}: <span className="font-bold text-white">{split.toFixed(2)}s</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">No splits available yet.</div>
        )}
      </div>
    </div>
  )
}
