import { AnalysisJobStatus } from '@/lib/types'

const labels: Record<AnalysisJobStatus, string> = {
  idle: 'Venter på video',
  uploading: 'Laster opp…',
  uploaded: 'Opplasting ferdig',
  queued: 'Analyse i kø',
  analyzing: 'Analyserer lyd…',
  completed: 'Analyse fullført',
  failed: 'Analyse feilet',
}

const dotColor: Record<AnalysisJobStatus, string> = {
  idle: 'bg-slate-600',
  uploading: 'bg-amber-300 animate-pulse',
  uploaded: 'bg-amber-300',
  queued: 'bg-amber-300 animate-pulse',
  analyzing: 'bg-amber-300 animate-pulse',
  completed: 'bg-emerald-400',
  failed: 'bg-red-500',
}

type AnalysisStatusProps = {
  status: AnalysisJobStatus
  phase: string
  error: string | null
  fileName: string | null
  fileSize: number | null
}

function formatSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnalysisStatus({ status, phase, error, fileName, fileSize }: AnalysisStatusProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel2/80 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Status</div>
          <div className="mt-3 text-2xl font-black text-white">{labels[status]}</div>
          {phase ? <div className="mt-1 text-sm text-amber-300/80">{phase}</div> : null}
        </div>
        <span className={`mt-1 inline-flex h-3 w-3 flex-shrink-0 rounded-full ${dotColor[status]}`} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300 md:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Valgt fil</div>
          <div className="mt-2 break-all text-white">{fileName || 'Ingen fil valgt'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Størrelse</div>
          <div className="mt-2 text-white">{formatSize(fileSize) || '—'}</div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}
    </div>
  )
}

