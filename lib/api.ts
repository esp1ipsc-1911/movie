import { upload } from '@vercel/blob/client'
import { AnalysisJob, AnalysisSettings, CreateJobResponse, MatchInfo } from '@/lib/types'

export async function uploadVideoToBlob(file: File) {
  return upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    clientPayload: JSON.stringify({
      originalName: file.name,
      size: file.size,
      contentType: file.type,
    }),
  })
}

export async function createAnalysisJob(payload: {
  videoUrl: string
  settings: AnalysisSettings
  matchInfo: MatchInfo
}) {
  const response = await fetch('/api/analysis/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Could not create analysis job')
  }

  return (await response.json()) as CreateJobResponse
}

export async function getAnalysisJob(jobId: string) {
  const response = await fetch(`/api/analysis-status/${jobId}`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Could not fetch analysis status')
  }

  return (await response.json()) as AnalysisJob
}
