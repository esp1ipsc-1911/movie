'use client'

import { MatchInfo } from '@/lib/types'

type MatchStageHeaderProps = {
  value: MatchInfo
  onChange: (nextValue: MatchInfo) => void
}

const fields: Array<{ key: keyof MatchInfo; label: string; placeholder: string }> = [
  { key: 'matchName', label: 'Match', placeholder: 'Example: Nordic Handgun Cup' },
  { key: 'stageName', label: 'Stage', placeholder: 'Example: Stage 7' },
  { key: 'shooterName', label: 'Shooter / run', placeholder: 'Optional' },
]

export function MatchStageHeader({ value, onChange }: MatchStageHeaderProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fields.map((field) => (
        <label key={field.key} className="rounded-[1.75rem] border border-white/10 bg-panel/80 p-4 shadow-soft backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">{field.label}</div>
          <input
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            placeholder={field.placeholder}
            value={value[field.key]}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
