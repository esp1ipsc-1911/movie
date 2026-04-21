# FFmpeg notes for the real analyzer

Recommended future pipeline:

```bash
ffmpeg -i input.mov -vn -ac 1 -ar 48000 -sample_fmt s16 output.wav
```

Then analyze the mono WAV signal on the server.

High-level approach:
- detect short narrow-band timer beep candidate
- set `t = 0` from the beep
- detect high-energy transient peaks after beep
- suppress likely echoes that fall inside a short decay window
- calculate first shot, splits, and best split
```
