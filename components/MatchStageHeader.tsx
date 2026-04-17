'use client'

import { MatchInfo } from '@/lib/types'

type MatchStageHeaderProps = {
  value: MatchInfo
  onChange: (value: MatchInfo) => void
}

export function MatchStageHeader({ value, onChange }: MatchStageHeaderProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold uppercase tracking-[0.15em] text-amber-300">Match</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none ring-0 placeholder:text-slate-500"
            value={value.matchName}
            onChange={(event) => onChange({ ...value, matchName: event.target.value })}
            placeholder="Example: Nordic Handgun Cup"
          />
        </label>
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold uppercase tracking-[0.15em] text-amber-300">Stage</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none ring-0 placeholder:text-slate-500"
            value={value.stageName}
            onChange={(event) => onChange({ ...value, stageName: event.target.value })}
            placeholder="Example: Stage 7"
          />
        </label>
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold uppercase tracking-[0.15em] text-amber-300">Shooter / Run</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none ring-0 placeholder:text-slate-500"
            value={value.shooterName}
            onChange={(event) => onChange({ ...value, shooterName: event.target.value })}
            placeholder="Optional"
          />
        </label>
      </div>
    </div>
  )
}
