# Analyzer starter

This folder is the backend service that should eventually do the real work:

1. download the uploaded video from Blob
2. extract audio with ffmpeg
3. convert to a stable mono WAV analysis format
4. detect start beep
5. detect shots
6. filter likely echoes
7. return the finished stats

The current starter is intentionally honest:
- it proves the app/backend contract
- it does **not** yet perform real shot detection
- it returns a clear failure message until you replace the placeholder logic in `main.py`

## Suggested deploy targets
- Railway
- Render
- Google Cloud Run

## Environment variables
- `ANALYZER_API_KEY` (optional)
