# Insight Dynamics Shooting - Movie v2

This version restructures the app for **iPhone-first uploads**.

## What changed

The original MVP tried to analyze video audio in the browser. That is too fragile for iPhone-originated MOV/HEVC uploads. In v2:

- the browser uploads the original video directly to **Vercel Blob**
- the app creates an **analysis job**
- a backend analyzer service is expected to download the video and process it server-side
- the web UI polls for job status and displays the result

## Important honesty

This package is a **production-minded scaffold**, not the final analyzer.

What is ready:
- Vercel-ready Next.js frontend
- direct Blob client upload route
- analysis job creation route
- analysis status polling route
- updated iPhone-focused UI and status flow
- analyzer service starter folder

What is still TODO:
- real ffmpeg audio extraction
- real beep detection
- real shot detection and echo filtering
- persistent job storage instead of in-memory placeholders

## Vercel setup

### 1. Blob storage
In your Vercel project:
- open **Storage**
- create a **Blob** store
- attach it to this project

Vercel will add:
- `BLOB_READ_WRITE_TOKEN`

### 2. Environment variables
Add these in Vercel Project Settings → Environment Variables:

- `BLOB_READ_WRITE_TOKEN` (from Blob setup)
- `ANALYZER_BASE_URL` (URL of the deployed analyzer service)
- `ANALYZER_API_KEY` (optional, if you secure the analyzer)

### 3. Deploy frontend
Push these files to GitHub and let Vercel deploy.

## Analyzer backend
The `analyzer/` folder is a separate backend service starter.

Deploy it to one of:
- Railway
- Render
- Google Cloud Run

Then set `ANALYZER_BASE_URL` in Vercel to that deployed service URL.

## File map

```text
app/
  api/upload/route.ts
  api/analysis/create/route.ts
  api/analysis-status/[jobId]/route.ts
  page.tsx
components/
  UploadPanel.tsx
  AnalysisStatus.tsx
  AnalysisControls.tsx
  MatchStageHeader.tsx
  VideoPlayer.tsx
  Timeline.tsx
  OverlayStats.tsx
analyzer/
  main.py
  requirements.txt
  README.md
```

## Next recommended step
Implement the real analyzer in `analyzer/main.py` with ffmpeg and audio detection.
