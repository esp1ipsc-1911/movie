'use client'

type UploadPanelProps = {
  fileName?: string | null
  onSelect: (file: File | null) => void
  disabled?: boolean
}

export function UploadPanel({ fileName, onSelect, disabled }: UploadPanelProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-5 shadow-soft backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Upload video</div>
      <p className="mt-2 text-sm text-slate-300">
        Select an iPhone or camera recording in MP4 or MOV format. The file will upload first, then analysis will run on the server.
      </p>
      <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-slate-300">
        <span className="rounded-xl bg-accent px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-950">Choose file</span>
        <span className="min-w-0 flex-1 truncate text-right">{fileName || 'No file selected'}</span>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/*"
          className="hidden"
          disabled={disabled}
          onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
