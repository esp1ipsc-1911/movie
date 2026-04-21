import { NextResponse } from 'next/server'
import { jobs } from '@/app/api/analysis/create/route'

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const analyzerBaseUrl = process.env.ANALYZER_BASE_URL
  const analyzerApiKey = process.env.ANALYZER_API_KEY
  const localJob = jobs.get(jobId)

  if (!localJob) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (!analyzerBaseUrl || localJob.status === 'failed') {
    return NextResponse.json(localJob, { status: 200 })
  }

  try {
    const response = await fetch(`${analyzerBaseUrl.replace(/\/$/, '')}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        ...(analyzerApiKey ? { Authorization: `Bearer ${analyzerApiKey}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || 'Analyzer service status check failed')
    }

    const remoteJob = await response.json()
    return NextResponse.json(remoteJob, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch analyzer status'
    return NextResponse.json({ ...localJob, status: 'failed', error: message }, { status: 200 })
  }
}
