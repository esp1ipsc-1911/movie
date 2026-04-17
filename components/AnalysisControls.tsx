'use client'

import { AnalysisSettings } from '@/lib/types'

type AnalysisControlsProps = {
  settings: AnalysisSettings
  onChange: (settings: AnalysisSettings) => void
  onAnalyze: () => void
  onAddShotAtCurrentTime: () => void
  onRemoveLastShot: () => void
  isAnalyzing: boolean
}

export function AnalysisControls({
  settings,
  onChange,
  onAnalyze,
  onAddShotAtCurrentTime,
  onRemoveLastShot,
  isAnalyzing,
}: AnalysisControlsProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur">
      <h2 className="text-lg font-bold text-white">Controls</h2>
      <p className="mt-2 text-sm text-slate-300">
        Tune the detector to better separate real shots from echoes and background noise.
      </p>

      <div className="mt-5 space-y-5">
        <RangeControl
          label="Sensitivity"
          value={settings.sensitivity}
          min={0.2}
          max={2}
          step={0.05}
          onChange={(value) => onChange({ ...settings, sensitivity: value })}
        />
        <RangeControl
          label="Echo filter window (ms)"
          value={settings.echoWindowMs}
          min={60}
          max={250}
          step={5}
          onChange={(value) => onChange({ ...settings, echoWindowMs: value })}
        />
        <RangeControl
          label="Minimum shot gap (ms)"
          value={settings.minShotGapMs}
          min={80}
          max={400}
          step={5}
          onChange={(value) => onChange({ ...settings, minShotGapMs: value })}
        />
        <RangeControl
          label="Noise floor"
          value={settings.noiseFloor}
          min={0.01}
          max={0.3}
          step={0.01}
          onChange={(value) => onChange({ ...settings, noiseFloor: value })}
        />
      </div>

      <div className="mt-6 grid gap-3">
        <button
          className="rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze video'}
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
          onClick={onAddShotAtCurrentTime}
        >
          Add shot at current time
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
          onClick={onRemoveLastShot}
        >
          Remove last shot
        </button>
      </div>
    </div>
  )
}

type RangeControlProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function RangeControl({ label, value, min, max, step, onChange }: RangeControlProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-amber-300">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  )
}
