# Insight Dynamics Shooting - Movie

A Next.js webapp for analyzing recorded dynamic shooting videos. The app uploads a finished video, detects the timer beep, detects likely shots, tries to reduce echo and background noise, and shows the result in a custom analysis layout.

## Included in this first version

- Upload recorded video files
- Enter match name
- Enter stage name
- Optional shooter/run field
- Detect probable start beep
- Detect probable shots after the beep
- Filter close duplicate events as likely echo
- Show shot markers on a clickable timeline
- Show total shots, first shot, best split, and all split times
- Manual correction: add shot at current time or remove last shot

## Tech stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Web Audio API

## Project structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  AnalysisControls.tsx
  MatchStageHeader.tsx
  OverlayStats.tsx
  Timeline.tsx
  UploadPanel.tsx
  VideoPlayer.tsx
lib/
  types.ts
  audio/
    calculateStats.ts
    detectShots.ts
    detectStartBeep.ts
    extractAudio.ts
    filterEchoes.ts
```

## How to run locally

### 1. Create the project folder
Unzip the project or clone it from GitHub.

### 2. Open terminal in the project folder

### 3. Install dependencies
```bash
npm install
```

### 4. Start development server
```bash
npm run dev
```

### 5. Open in browser
Open the local address shown in the terminal, normally:
```bash
http://localhost:3000
```

## Notes about detection quality

This version uses browser-based signal analysis. It is a good MVP, but it is not a forensic-grade shot timer.

That means:
- some echoes may still be counted as shots
- steel hits or loud voice/noise may trigger false positives
- beep detection depends on recording quality
- different microphones and distances will affect results

## Recommended next steps

### v2 improvements
- better waveform analysis
- frequency band filtering for timer beep
- confidence coloring for shots
- manual delete by clicking a specific marker
- save and load sessions locally
- export a report

### v3 improvements
- backend analysis for better accuracy
- model-based classification for shot vs echo vs noise
- export rendered overlay video
- user login and run history

## GitHub quick start

### 1. Create a new repository on GitHub
Suggested name:
```text
insight-dynamics-shooting-movie
```

### 2. Initialize git locally
```bash
git init
git add .
git commit -m "Initial MVP for Insight Dynamics Shooting - Movie"
```

### 3. Link your GitHub repository
```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
```

### 4. Push
```bash
git branch -M main
git push -u origin main
```

## Important limitation

The current detector is intentionally simple and readable so it is easy to develop further. If you want more reliable classification of shots versus echo and background noise, the best next step is usually to add a backend analysis service.
