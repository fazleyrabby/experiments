# Claude Code One-Shot Prompt — THE LAST STORM

Act as a senior animation director, creative developer, procedural graphics engineer, and sound designer. Build a complete, polished, approximately 60-second **cinematic 2D animated short film** called **THE LAST STORM** using **HTML5 Canvas 2D and JavaScript**.

Work directly in the current repository. Inspect the existing project first and preserve useful structure. If it is empty, set up a minimal runnable project. **Do not stop at a plan, spec, or static mockup: implement the film, run it, inspect the result, and fix obvious problems.** Make sensible creative and technical decisions without asking me questions.

## Repository context

- The film lives in `last-storm/` inside the `Experiments` gallery repo (static experiments served from the repo root, deployed to Vercel). Sibling `storm-at-sea/` is the closest precedent: plain `index.html` + `js/` ES modules + `tools/capture_server.py` for frame capture. Follow that shape.
- **No build step, no npm dependencies.** Plain ES modules served by any static server. The runtime must not load anything from a CDN.
- Keep renders (`last-storm/renders/`) out of the deployment: add them to the root `.vercelignore`. Do **not** add the film to the gallery, `vercel.json` or `gallery/projects.json` in this pass; that is a separate step once the film is approved.
- Add a `last-storm` entry to `.claude/launch.json` so the preview can be started by name.
- Local tools available: `ffmpeg` 8 (with `libx264` and `aac`), `python3`, `node`. Nothing else is assumed.

## Creative goal

The result should feel like a premium, hand-painted 2D animated short: richly illustrated, atmospheric, emotionally restrained, and cinematic—not a generic Canvas demo. Use the visual language of textured graphic-novel art and painterly storybook illustration, with layered parallax, intricate silhouettes, dramatic lighting, fine grain, organic contours, and carefully composed shots.

Use a cohesive palette:
- Midnight blue-black `#061C27`
- Deep ocean teal `#0D4548`
- Burnt orange `#D85C25`
- Amber gold `#FFAD49`
- Warm parchment `#E8D5B2`

Derived tints (darker/lighter mixes of these five) are fine; foreign hues are not. The colour story is the emotional arc: **warm (1–2) → drained cold blue-green (3) → violent amber (4) → pale gold (5)**.

Avoid flat vector-looking scenes, emoji, placeholder rectangles, generic stock gradients, noisy flicker, and gratuitous effects. Procedural Canvas should be the rendering and animation engine, not an excuse for simplistic artwork.

## Story

An elderly fisherman collects storms in glass bottles and sells them to drought-stricken villages. Each storm he releases erases another memory of his daughter, who disappeared at sea years ago. He has one bottle left. When he opens it, the storm illuminates the ocean and, for a brief moment, he sees his daughter's reflection beside his boat. She disappears with the rain.

Final line: **“Some storms are worth keeping. Some are worth letting go.”**

Tell the story visually, with restrained narration, purposeful silence, and a clear emotional arc. Do not over-explain the supernatural mystery.

**The two reveals must read differently.** In scene 4 the daughter is a *storm-lit glimpse*: she appears only in the reflection, lit by lightning, standing beside him, in total silence. In scene 5 the reflection is *calm*: for a moment the reflection shows two seated figures where there is one, and then rain ripples erase her. The first reveal is a shock; the second is a goodbye.

## Shot list — five scenes, 60.0 seconds, 24 fps

Times are film seconds. "Dissolve" = cross-fade; "cut" = hard cut; "match" = graphic match cut.

> **Final cut: 90 s (2,160 frames).** The 60 s timings below are the draft cut. The 60 s draft felt rushed, so each shot was lengthened to 1A 9 · 1B 5 · 2A 7 · 2B 4.5 · 2C 2.5 · 2D 3.5 · 3A 7 · 3B 7 · 3C 5.5 · 4A 6 · 4B 7 · 4C 5 · 4D 3.5 · 5A 5 · 5B 4.5 · 5C 4.5 · 5D 3.5 s. `at()` in `js/timeline.js` maps every draft time below onto the final clock, at the same relative point within its shot. Ambient motion (waves, rain, flicker) keeps real-time speed.

| # | Shot | Time | Camera / content | In |
|---|------|------|------------------|----|
| **1 · The Collector** |||||
| 1A | Extreme wide seascape | 0.0–6.6 | Fade up from black (0–1.2s). Immense teal ocean, towering burnt-orange cloud masses, a tiny boat lower third. Slow push (≈1.0→1.18) and slight pan toward the boat. Gulls far off. | fade |
| 1B | Medium: the collector | 6.6–10.0 | Fisherman standing in boat, bottle raised against cloud light; tiny storm swirling inside. Push in toward the bottle (≈1.0→1.3). | dissolve 0.8s |
| **2 · The Trade** |||||
| 2A | Release over the coast | 10.0–15.4 | Distant coastal village on cliffs with a lighthouse. Amber vapour rises from the uncorked bottle in the foreground boat, travels inland and blooms into layered clouds over the rooftops. | dissolve 0.8s |
| 2B | Rain on the village | 15.4–18.6 | Closer on rooftops: rain falls, windows glow, rain catches the warm light. The lighthouse stands in a fixed frame position. | cut |
| 2C | Match cut | 18.6–20.0 | Graphic match: the lighthouse silhouette becomes the *empty* bottle held up in the same frame position. | match |
| 2D | The gold | 20.0–22.0 | Close-up: a pale hand from the top of frame lets three coins fall into the fisherman's open palm. Glints. | cut |
| **3 · The Price** |||||
| 3A | Cabin | 22.0–27.0 | Weathered plank cabin, lantern flicker, shelves of empty bottles catching light. Slow lateral pan. | dissolve 1.0s |
| 3B | Portrait and chair | 27.0–31.2 | Faded portrait of a young girl beside an empty chair. The portrait's features fade a step on each word: “A face. A voice. A memory.” | dissolve 0.8s |
| 3C | The window | 31.2–35.0 | Fisherman at the window. Outside the sea goes unnaturally still (mirror flat); the frame grade drains from warm to cold blue-green. One last bottle on the sill glows faintly. | dissolve 0.8s |
| **4 · The Last Storm** |||||
| 4A | The bottle | 35.0–39.4 | Macro close-up of hands, glass and cork. The inner storm spins faster. Cork releases at **38.7s**: sharp highlight sweeps the glass, amber particles escape. | dissolve 0.6s |
| 4B | The storm (signature shot) | 39.4–45.0 | Wide: an immense orange storm unfolds from the boat across the sky. Lightning lights the internal cloud layers and the water; ropes whip; deep overlapping waves rise; amber reflections ripple. **Promotional still ≈ 42.5s.** | cut |
| 4C | The reflection | 45.0–47.6 | Low angle at the waterline: the reflected boat, lit by lightning. In the reflection only, a girl stands beside him. Soundtrack falls to near silence (one held glass tone). | cut |
| 4D | After | 47.6–50.0 | Medium on the fisherman in heavy rain, the storm beginning to soften. | cut |
| **5 · Letting Go** |||||
| 5A | Calm | 50.0–53.4 | Storm dissolving into gentle rain; sea calming; pale gold reaches the horizon. | dissolve 1.2s |
| 5B | Second reflection | 53.4–55.6 | Calm reflection: he sits alone, but the reflection shows two seated figures. Rain ripples erase her. Silence apart from rain. | dissolve 0.8s |
| 5C | Horizon | 55.6–58.0 | Extreme wide, tiny boat, pale gold horizon, he looks toward it. Fade to black 57.4–58.4s. | dissolve 0.8s |
| 5D | Title | 58.4–60.0 | **THE LAST STORM** on black, warm parchment, fades in and holds. | fade |

## Narration cue sheet

| Line | In | Out | Over |
|------|----|-----|------|
| “The old man collected storms.” | 1.6 | 4.8 | 1A |
| “He sold them to villages that had forgotten the rain.” | 5.4 | 9.4 | 1A→1B |
| “In return, he asked for gold.” | 19.8 | 22.0 | 2C→2D |
| “But every storm he released took something from him.” | 23.0 | 26.6 | 3A |
| “A face. A voice. A memory.” | 27.4 | 30.8 | 3B |
| “Until only one bottle remained.” | 31.6 | 34.6 | 3C |
| “He had saved it for the day he could no longer bear the silence.” | 35.2 | 38.4 | 4A |
| “When he opened it, the sea remembered.” | 41.0 | 43.6 | 4B |
| *(silence — reflection reveal)* | 45.0 | 47.6 | 4C |
| “For one moment, she was there.” | 47.8 | 49.9 | 4D |
| “Then the rain washed everything away.” | 50.6 | 53.2 | 5A |
| *(silence — second reflection)* | 53.4 | 55.6 | 5B |
| “Some storms are worth keeping. Some are worth letting go.” | 55.7 | 58.2 | 5C |

## Rendering and animation requirements

Use JavaScript ES modules and a reusable architecture with separate scene modules, drawing primitives, a central timeline, and deterministic time-based animation. Use seeded randomness so textures and particles remain stable when seeking or exporting frames. Keep the film reproducible at any timestamp: `renderFrame(t)` must depend on `t` and the output size only.

Create a layered compositing pipeline with foreground, midground, background, atmosphere, and lighting passes. Implement smooth camera pans, pushes, pullbacks, easing, and parallax. Alternate wide shots and intimate close-ups with intentional negative space and consistent perspective.

Build the following elements with custom Canvas paths and layered shapes:
- **Ocean:** multiple independently moving Bézier wave layers; perspective-aware scale; teal gradients; hand-drawn gold contours; foam, subtle specular highlights, and reflections. A `stillness` parameter must flatten it into a mirror for 3C.
- **Clouds/storm:** organic irregular cloud masses with internal shading, fine outlines, textured pigment, wind-driven movement, and progressive expansion. Lightning should illuminate nearby clouds and water. Pre-render cloud masses to offscreen sprites (a base and a lightning-lit variant) and animate the sprites.
- **Bottle:** recognizable glass silhouette, translucent body, rim highlights, internal reflections, and a small coherent storm system inside.
- **Characters/props:** distinctive fisherman (sou'wester hat, beard, long coat, hunched posture), boat, village, ropes, portrait, chair, and daughter silhouettes. Avoid stick figures and generic symbols. Add restrained movement to body posture, hands, rope, and boat.
- **Reflections:** render the boat and figures to an offscreen buffer, flip it, and redraw in thin horizontal slices with a time-based sine offset for ripple distortion.
- **Lighting:** layered radial gradients, restrained glow, warm rim lighting, atmospheric haze, light scattering approximations, and reflections that respond to storm intensity.
- **Texture:** stable paper grain, painterly noise, subtle scratches, distressed pigment, and irregular ink contours. Generate textures once and reuse them; do not regenerate random pixel noise every frame. Film grain may change per *frame number* (from a small pre-generated set), never per real-time tick.
- **Atmosphere:** rain, mist, spray, drifting particles, and wind, all purposeful and depth-aware. Particle position is a closed-form function of `t` and a seeded index—no simulation state.
- **Compositing:** restrained bloom and grain, controlled contrast, coherent color grading, and transitions that feel authored rather than abrupt. Do not depend on `ctx.filter` (Safari); approximate blur by down/upsampling.

### 16:9 and 9:16

Do not crop the 16:9 frame for vertical. Each shot lays out its subjects from the viewport size (`unit = min(w, h) / 1000`) and per-orientation focal positions, so 9:16 gets its own composition with more sky and sea stacked vertically.

### Flash safety

Lightning must not produce more than three flashes in any one-second window, and full-frame luminance jumps stay moderate. Respect `prefers-reduced-motion` in the player by softening flashes (export always uses the authored values).

### Performance

- Preview quality: render at half resolution with reduced particle counts; target ≥ 30 fps at 1280-wide on an Apple Silicon laptop.
- High quality: full device-pixel resolution for playback; 1920×1080 for export.
- Use offscreen canvases and cache static artwork. Avoid per-frame allocations in hot loops.

## Sound and narration

The default soundtrack is **original and synthesized** with the Web Audio API, which is reproducible and needs no licensing. Real recordings are optional: only add one if it was actually downloaded and its licence was verified on the source page (Freesound CC0 preferred, Pixabay, Mixkit). Never claim an asset is CC0 or public domain without checking. Record every asset—synthesized ones included, labelled "synthesized"—in `SOUND_CREDITS.md`.

Sounds: ocean waves, wind, wooden boat creaks, rope tension, distant gulls, glass resonance, cork release, coins, thunder, and rain. Use silence deliberately during both reveals (4C and 5B).

**Sync model:** render the soundtrack once with an `OfflineAudioContext` into two stems (ambience, effects) driven by the same timeline the picture uses. Playback starts `AudioBufferSourceNode`s at the current film offset; seeking stops and restarts them. The export writes the same mix to WAV. This keeps audio sample-accurate with picture while scrubbing and exporting.

Provide master volume, mute, and independent ambience/effects controls. Respect browser autoplay restrictions and start audio only after a user gesture.

Narration: subtitles follow the cue sheet. Narration is replaceable with a local audio file declared in `audio/narration.json` (one file aligned to t = 0). An optional browser text-to-speech preview may speak cues in the player; it is never part of the export. Because there is no recorded voice, the export burns subtitles into the frames by default (flag to turn off). Do not pretend to have generated a professional voice recording.

## Player and export

Create a minimal, elegant film player with:
- Play/pause, restart, timeline scrubbing, scene markers, mute/volume, subtitles, fullscreen, quality toggle, 16:9 / 9:16 toggle, and render progress.
- Keyboard: Space play/pause, ←/→ seek 2s, M mute, C subtitles, F fullscreen.
- A development-only debug overlay (`?debug`) for FPS, current scene and shot, frame time, and layer visibility toggles.
- A beautiful opening frame (a held still from 1A with the title and a play control) instead of a blank canvas or loading screen.
- Error handling (render errors shown in-frame, audio failures degrade to silent playback) and clear instructions for running locally.

### Export pipeline

1. `python3 tools/capture_server.py 4190 . renders/frames` serves the film and accepts `POST /upload/<name>`.
2. Open `http://127.0.0.1:4190/?export&w=1920&h=1080` in Chrome. The page renders frames 0–1439 from explicit time `t = n / 24`, uploads `frame_00000.png` … `frame_01439.png`, then renders the soundtrack offline and uploads `audio.wav`. Progress is shown on the page. `&from=` / `&to=` resume a partial run; `&fmt=jpg` and `&w=960&h=540` give a fast preview export.
3. `tools/export.sh` assembles `renders/the-last-storm-1080p.mp4` (H.264 `yuv420p`, CRF 16, 24 fps, AAC 192k, `+faststart`). Document the exact command.

Full-resolution PNGs take several GB; the docs must say so. Never rely on real-time playback speed to determine frame state.

## Verification

Render and inspect these frames at 1920×1080 (and the starred ones at 1080×1920):
`2.0*, 5.5, 8.5, 12.5, 17.0, 19.2 (match cut), 21.0, 24.5, 29.0, 33.5*, 37.5, 38.9 (cork), 42.5* (promo still), 46.3* (reveal), 49.0, 52.0, 54.5, 57.0, 59.5`.
Also scrub across every shot boundary to check for jumps, and check the console for errors.

## Acceptance criteria

- All five scenes are implemented and genuinely animated.
- The film has a coherent story, clear visual progression, and emotionally effective final reveal.
- The opening shot is immediately striking, with rich artwork, texture, lighting, and depth.
- The bottle-opening/storm-release shot is the visual centerpiece and suitable as a promotional still.
- Audio, subtitles, transitions, and scene timing remain synchronized while scrubbing and exporting.
- No placeholder graphics, unstable flickering, or unexplained jumps.
- The project runs using documented commands, and export is reproducible.
- The implementation is organized, maintainable, and performant.

## Build order

1. Engine: RNG/noise, timeline + shot table, camera, texture cache, post pass, film `renderFrame(t)`.
2. Seascape (sky, cloud sprites, ocean, boat, fisherman) → shots 1A/1B. Inspect before going further: everything else reuses it.
3. Remaining shots in film order; then transitions.
4. Player UI, subtitles, debug overlay.
5. Offline audio stems, playback sync, narration hooks.
6. Export pipeline; then the verification pass and refinement.

## Execution

Implement the complete project now. Run it, inspect representative frames from every scene (especially the opening and storm release), and refine weak compositions, flat textures, awkward silhouettes, lighting, transitions, and timing. Fix runtime errors before finishing. If an ambitious effect is too expensive, approximate it with layered Canvas techniques rather than dropping the visual ambition.

At the end, report only the essentials: what was built, how to run the preview, how to render/export, which sound assets and licenses were used, and any genuine remaining limitations.

**The standard is not merely “it works.” The opening should feel like a beautifully illustrated film, and the storm release should make someone stop scrolling and wonder how it was made.**
