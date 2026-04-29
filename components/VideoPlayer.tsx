'use client'

import { MatchInfo } from '@/lib/types'
import { RefObject } from 'react'

type VideoPlayerProps = {
  videoUrl: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  matchInfo: MatchInfo
  currentTime: number
}

export function VideoPlayer({ videoUrl, videoRef, matchInfo, currentTime }: VideoPlayerProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-4 shadow-soft backdrop-blur">
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-black">
        {videoUrl ? (
          <>
            <video ref={videoRef} src={videoUrl} controls playsInline className="h-full w-full object-contain" />
            <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-slate-950/75 px-4 py-3 backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300">Insight Dynamics Shooting — Movie</div>
              <div className="mt-2 text-sm text-white">{matchInfo.matchName || 'Match ikke satt'}</div>
              <div className="text-sm text-slate-300">{matchInfo.stageName || 'Stage ikke satt'}</div>
              {matchInfo.shooterName ? <div className="text-sm text-slate-400">{matchInfo.shooterName}</div> : null}
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 rounded-2xl bg-slate-950/75 px-4 py-3 text-right backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Avspilling</div>
              <div className="mt-1 text-2xl font-bold text-white">{currentTime.toFixed(2)}s</div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
            Last opp en video for å starte analysen.
          </div>
        )}
      </div>
    </div>
  )
}
