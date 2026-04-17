export type ShotEvent = {
  id: string
  time: number
  confidence: number
  source: 'auto' | 'manual'
}

export type AnalysisResult = {
  startBeepTime: number | null
  shots: ShotEvent[]
  firstShotTime: number | null
  bestSplit: number | null
  splits: number[]
  totalShots: number
}

export type AnalysisSettings = {
  sensitivity: number
  echoWindowMs: number
  minShotGapMs: number
  noiseFloor: number
}

export type MatchInfo = {
  matchName: string
  stageName: string
  shooterName: string
}
