# The Last Storm

A sixty-second animated short drawn live with Canvas 2D. An old fisherman collects storms in bottles and sells them to villages in drought. Every storm he lets go takes a memory of his daughter with it. Then he opens the last one.

Everything is procedural: the painted cloud masses, the ocean, the boat and figures, the light, the paper grain, and the whole soundtrack. There are no image or audio files. Every frame is a pure function of film time, so the film looks the same whether you play it, scrub through it or export it.

## Run the preview

The film is plain ES modules with no build step and no dependencies. Serve this folder over HTTP:

```bash
python3 tools/capture_server.py 4190 . renders/frames
```

Then open http://127.0.0.1:4190/. Any static server works for watching (`python3 -m http.server 4190`), but the capture server is needed to export.

**Player:** Space plays or pauses, ←/→ seek 2 s, M mutes, C toggles subtitles, F goes fullscreen. **Sound** opens ambience/effects levels and an optional spoken-narration preview that uses the browser's own voice. **16:9 / 9:16** switches to a real vertical composition, not a crop. **High / Preview** sets render resolution.

**URL options:** `?t=42.5` opens at a time, `?aspect=tall` opens vertical, `?q=preview` opens at preview quality, and `?debug` shows FPS, frame time, scene and shot, plus toggles for each layer.

## Export to MP4 (1920×1080, 24 fps, 2,160 frames)

Requirements: `python3`, a current Chrome or Edge, and `ffmpeg` built with `libx264` and `aac` (Homebrew's build includes both).

1. Start the capture server (it also serves the page):
   ```bash
   python3 tools/capture_server.py 4190 . renders/frames
   ```
2. Open this URL and leave the tab in front until it reports **Done**:
   ```
   http://127.0.0.1:4190/?export&w=1920&h=1080
   ```
   It renders frame *n* at exactly *t = n / 24* and uploads `frame_00000.png` … `frame_01439.png`. It then renders the soundtrack offline at 48 kHz and uploads `audio.wav` and `export.json`. Real-time speed never affects a frame.
3. Assemble the video:
   ```bash
   tools/export.sh renders/frames renders/the-last-storm-1080p.mp4
   ```
   This runs `ffmpeg -framerate 24 -i frame_%05d.png -i audio.wav -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart`.

Full-resolution PNG frames take several GB of disk. Other export options:

| Option | Effect |
|--------|--------|
| `&fmt=jpg` | JPEG frames (much smaller); `export.sh` detects them |
| `&w=960&h=540` | Quick low-resolution preview export |
| `&w=1080&h=1920` | Vertical 9:16 export |
| `&from=600&to=900` | Render a frame range, for example to resume a stopped run |
| `&subs=0` | No burned-in subtitles (they are on by default because there is no recorded voice) |
| `&audio=0` | Skip the soundtrack |

`renders/` is listed in the repo's `.vercelignore`.

## Structure

```
index.html, css/player.css   player shell
js/main.js                   playback clock, scrubbing, controls, debug overlay
js/timeline.js               scenes, shots, narration cues, story beats, lightning: the single source of timing
js/film.js                   renderFrame(t): picks the shot, composites transitions, post pass, subtitles
js/core/                     seeded math and noise, palette, generated textures, post (grade, bloom, grain)
js/art/                      sky and cloud sprites, ocean, boat and figures, bottle, hands, village, cabin, atmosphere
js/scenes/                   one module per scene, plus the shared seascape and reflection sets
js/audio.js                  synthesized soundtrack: offline-rendered stems, playback, WAV export
js/export.js                 deterministic frame and audio export
tools/capture_server.py      static server that accepts frame uploads
tools/export.sh              ffmpeg assembly
```

Clouds are painted once per sprite, pixel by pixel: soft-unioned sphere lobes form a heightfield whose normals drive a posterised light ramp, with brush-streak noise and rim and ink edges. Each mass has a base and a lightning-lit variant. Reflections render the boat set a second time, so the water can show someone the boat does not.

## Narration and sound

See [SOUND_CREDITS.md](SOUND_CREDITS.md). All sound is original and synthesized. To use a recorded narration, set `src` in `audio/narration.json`.
