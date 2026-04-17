'use client'

type UploadPanelProps = {
  onSelect: (file: File) => void
  fileName?: string
}

export function UploadPanel({ onSelect, fileName }: UploadPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur">
      <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
        Upload video
      </label>
      <p className="mt-2 text-sm text-slate-300">
        Select a recorded stage video in MP4 or MOV format.
      </p>
      <input
        className="mt-4 block w-full rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-3 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
        type="file"
        accept="video/*"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0]
          if (selectedFile) {
            onSelect(selectedFile)
          }
        }}
      />
      <div className="mt-3 min-h-6 text-sm text-slate-400">{fileName ? `Selected: ${fileName}` : 'No file selected yet.'}</div>
    </div>
  )
}
