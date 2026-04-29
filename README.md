# Insight Dynamics Shooting — Movie

Skuddanalyseverktøy basert på video. Last opp en iPhone-video, og lyden analyseres direkte i nettleseren — ingen server-backend nødvendig.

## Arkitektur (Alternativ A — browser-analyse)

All analyse skjer lokalt i nettleseren via Web Audio API:

1. **Opplasting** — brukeren velger en MP4 eller MOV-fil lokalt
2. **Lydekstraksjon** — `extractAudio.ts` bruker `AudioContext.decodeAudioData()` + `OfflineAudioContext` for å normalisere til mono 44100 Hz Float32
3. **Start-beep** — `detectStartBeep.ts` finner startsignal via energi + zero-crossing rate
4. **Skudddeteksjon** — `detectShots.ts` scorer hvert frame på peak, energi og transient; `filterEchoes.ts` fjerner ekko
5. **Statistikk** — `calculateStats.ts` beregner splits, reaksjonstid og beste split
6. **Resultat** — Timeline og OverlayStats viser resultatet

## iPhone-kompatibilitet

| Modell | Status |
|---|---|
| iPhone 5s (iOS 12) | ⚠️ Kantcase – treg på store filer |
| iPhone 6 / 6 Plus | ⚠️ Kantcase – begrenset RAM |
| **iPhone 6s og nyere** | **✅ Fungerer** |

> **Merk:** HEVC-video fra iPhone er ikke et problem. Lydsporet er alltid AAC, som Safari på iOS støtter fullt ut i Web Audio API.

## Kom i gang

```bash
npm install
npm run dev
```

Ingen miljøvariabler trengs for browser-analyse.

## Filstruktur

```text
app/
  page.tsx                       ← Hovedside med browser-analyseflyt
  api/                           ← API-ruter (ikke i bruk for Alternativ A)
components/
  UploadPanel.tsx
  AnalysisStatus.tsx
  AnalysisControls.tsx
  MatchStageHeader.tsx
  VideoPlayer.tsx
  Timeline.tsx
  OverlayStats.tsx
lib/
  audio/
    extractAudio.ts              ← Web Audio API + OfflineAudioContext
    detectStartBeep.ts           ← Energi + ZCR-basert beep-detektor
    detectShots.ts               ← Peak/energi/transient scoring
    filterEchoes.ts              ← Ekkofiltring
    calculateStats.ts            ← Splits, reaksjonstid, beste split
  types.ts
analyzer/                        ← Python/FastAPI backend (ikke i bruk for Alternativ A)
```

## Justerbare parametere

| Parameter | Standard | Beskrivelse |
|---|---|---|
| Sensitivity | 1.0 | Terskel for skudd-score |
| Echo filter window | 120 ms | Vindu for å filtrere ekko |
| Min shot gap | 140 ms | Minimumstid mellom skudd |
| Noise floor | 0.04 | Bakgrunnsstøy-terskel |
