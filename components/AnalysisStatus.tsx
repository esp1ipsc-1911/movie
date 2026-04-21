import { AnalysisJobStatus, UploadState } from '@/lib/types'

const labels: Record<AnalysisJobStatus, string> = {
  idle: 'Waiting for a file',
  uploading: 'Uploading video to storage',
  uploaded: 'Upload finished',
  queued: 'Analysis job created',
  analyzing: 'Server is analyzing the video',
  completed: 'Analysis completed',
  failed: 'Analysis failed',
}

type AnalysisStatusProps = {
  status: AnalysisJobStatus
  upload: UploadState
  error: string | null
  jobId: string | null
}

export function AnalysisStatus({ status, upload, error, jobId }: AnalysisStatusProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel2/80 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Status</div>
          <div className="mt-3 text-2xl font-black text-white">{labels[status]}</div>
          {jobId ? <div className="mt-2 text-xs text-slate-400">Job ID: {jobId}</div> : null}
        </div>
        <span className={`inline-flex h-3 w-3 rounded-full ${status === 'failed' ? 'bg-red-500' : status === 'completed' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300 md:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Selected file</div>
          <div className="mt-2 break-all text-white">{upload.fileName || 'No file selected'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Storage URL</div>
          <div className="mt-2 break-all text-white">{upload.url || 'Not uploaded yet'}</div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}
    </div>
  )
}
