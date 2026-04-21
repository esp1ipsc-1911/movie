import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { AnalysisJob, AnalysisSettings, MatchInfo } from '@/lib/types'

const jobs = new Map<string, AnalysisJob>()

type CreateBody = {
  videoUrl: string
  settings: AnalysisSettings
  matchInfo: MatchInfo
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateBody
  const analyzerBaseUrl = process.env.ANALYZER_BASE_URL
  const analyzerApiKey = process.env.ANALYZER_API_KEY
  const jobId = randomUUID()
  const now = new Date().toISOString()

  jobs.set(jobId, {
    jobId,
    status: 'queued',
    videoUrl: body.videoUrl,
    createdAt: now,
    updatedAt: now,
  })

  if (!analyzerBaseUrl) {
    jobs.set(jobId, {
      jobId,
      status: 'failed',
      videoUrl: body.videoUrl,
      createdAt: now,
      updatedAt: new Date().toISOString(),
      error: 'Analyzer backend is not configured yet. Add ANALYZER_BASE_URL to Vercel env vars and deploy the analyzer service.',
    })

    return NextResponse.json({ jobId, status: 'failed' }, { status: 202 })
  }

  try {
    const response = await fetch(`${analyzerBaseUrl.replace(/\/$/, '')}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(analyzerApiKey ? { Authorization: `Bearer ${analyzerApiKey}` } : {}),
      },
      body: JSON.stringify({
        jobId,
        videoUrl: body.videoUrl,
        settings: body.settings,
        matchInfo: body.matchInfo,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || 'Analyzer service rejected the job')
    }

    return NextResponse.json({ jobId, status: 'queued' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create analysis job'
    jobs.set(jobId, {
      jobId,
      status: 'failed',
      videoUrl: body.videoUrl,
      createdAt: now,
      updatedAt: new Date().toISOString(),
      error: message,
    })
    return NextResponse.json({ jobId, status: 'failed', error: message }, { status: 202 })
  }
}

export { jobs }
