import { AnalysisResult } from '@/lib/types'

type OverlayStatsProps = {
  result: AnalysisResult
}

function formatTime(value: number | null) {
  if (value == null) return '--'
  return `${value.toFixed(2)}s`
}

const cards = [
  { key: 'shots', label: 'Skudd totalt', value: (r: AnalysisResult) => String(r.totalShots) },
  { key: 'startBeep', label: 'Start-beep', value: (r: AnalysisResult) => formatTime(r.startBeepTime) },
  { key: 'firstShot', label: 'Første skudd', value: (r: AnalysisResult) => formatTime(r.firstShotTime) },
  { key: 'bestSplit', label: 'Beste split', value: (r: AnalysisResult) => formatTime(r.bestSplit) },
]

export function OverlayStats({ result }: OverlayStatsProps) {
  const bestSplit = result.bestSplit

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
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Splitter</div>
        {result.splits.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {result.splits.map((split, index) => {
              const isBest = bestSplit !== null && split === bestSplit
              return (
                <div
                  key={`${split}-${index}`}
                  className={`rounded-2xl border px-4 py-3 text-sm
                    ${isBest
                      ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
                      : 'border-white/10 bg-slate-950/40 text-slate-200'
                    }`}
                >
                  Split {index + 1}:{' '}
                  <span className="font-bold text-white">{split.toFixed(2)}s</span>
                  {isBest && <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-amber-300">Best</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
            Ingen splitter ennå.
          </div>
        )}
      </div>
    </div>
  )
}

