'use client'

import { AnalysisSettings } from '@/lib/types'

type AnalysisControlsProps = {
  settings: AnalysisSettings
  onChange: (nextValue: AnalysisSettings) => void
  onAnalyze: () => void
  onAddShotAtCurrentTime: () => void
  onRemoveLastShot: () => void
  disabled?: boolean
  isAnalyzing?: boolean
}

type SliderField = {
  key: keyof AnalysisSettings
  label: string
  min: number
  max: number
  step: number
}

const sliderFields: SliderField[] = [
  { key: 'sensitivity', label: 'Sensitivity', min: 0.3, max: 2, step: 0.05 },
  { key: 'echoWindowMs', label: 'Echo filter window (ms)', min: 40, max: 240, step: 5 },
  { key: 'minShotGapMs', label: 'Minimum shot gap (ms)', min: 60, max: 280, step: 5 },
  { key: 'noiseFloor', label: 'Noise floor', min: 0.005, max: 0.2, step: 0.005 },
]

export function AnalysisControls({
  settings,
  onChange,
  onAnalyze,
  onAddShotAtCurrentTime,
  onRemoveLastShot,
  disabled,
  isAnalyzing,
}: AnalysisControlsProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel2/80 p-5 shadow-soft backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Controls</div>
      <p className="mt-2 text-sm text-slate-300">Tune the backend detector settings that will be sent together with the upload job.</p>

      <div className="mt-5 space-y-5">
        {sliderFields.map((field) => (
          <label key={field.key} className="block">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-200">
              <span>{field.label}</span>
              <span className="font-semibold text-amber-300">{settings[field.key]}</span>
            </div>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={settings[field.key]}
              onChange={(event) =>
                onChange({
                  ...settings,
                  [field.key]: Number(event.target.value),
                })
              }
              className="w-full"
              disabled={disabled}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled || isAnalyzing}
          className="w-full rounded-2xl bg-accent px-4 py-4 text-base font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? 'Starting analysis…' : 'Upload + analyze video'}
        </button>
        <button
          type="button"
          onClick={onAddShotAtCurrentTime}
          disabled={disabled}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-base font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add shot at current time
        </button>
        <button
          type="button"
          onClick={onRemoveLastShot}
          disabled={disabled}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-base font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove last shot
        </button>
      </div>
    </div>
  )
}
