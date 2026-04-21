import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

const allowedContentTypes = [
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/3gpp',
  'video/3gpp2',
  'video/webm',
  'video/*',
]

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes,
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 1024,
          tokenPayload: JSON.stringify({ pathname, clientPayload }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed', { blob, tokenPayload })
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Blob upload route failed', error)
    return NextResponse.json({ error: 'Upload token generation failed' }, { status: 400 })
  }
}
