# Roadster Flight Study

An interactive Three.js recreation of the Roadster ramp demonstration. The scene includes a procedural model of the current white Roadster, a ramp curving beyond vertical, an airborne turnaround and thruster-assisted landing.

## Run

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. `pnpm build` produces `dist/`; `pnpm preview` serves that production build. `pnpm test` verifies trajectory continuity, ramp clearance, ground contact, and the final upright orientation. npm also works in a fresh checkout (`npm install`, `npm run dev`). Use one package manager per checkout.

## Controls

- Space or the play button: play/pause. R: reset. Arrow keys: seek by 0.2 seconds.
- H: hide every control for recording. H or Escape restores the controls. Double-click the scene (or tap on touch devices) also restores them.
- The compact playback bar also fades away after a short idle period during playback.
- Scrub the timeline to inspect any frame.
- Playback speed: 0.25×, 0.5×, 1×, 1.5×; optional loop.
- Cinematic, side, chase, and free-orbit views. Keys 1–4 switch views.
- Drag the scene to enter free orbit; scroll/pinch to zoom.
- Motor whine, rolling noise, thruster hiss, and a landing impact play with the replay. The speaker button mutes/unmutes all sound.
- Toggle daylight/night lighting. The scene starts in night lighting to match the film.
- Starts paused; respects reduced-motion preferences and pauses progress in background tabs.

## Implementation

- `src/car.js`: original procedural geometry, PBR materials, wheels, canopy, aero, and nozzle details. No external model or runtime asset downloads.
- `src/world.js`: curved ramp and trusses, track, lighting, shadows, deterministic exhaust particles, and optional path.
- `src/audio.js`: local Web Audio synthesis synchronized to playback, with mute and pause handling.
- `src/flight.js`: seekable choreography in scene metres/seconds.
- `src/main.js`: camera, rendering, controls, playback, and clean recording mode.

The vehicle is an approximation created from [Tesla's Roadster reference](https://www.tesla.com/roadster), not an official Tesla model. The choreography interprets [the supplied film](https://x.com/CollinRugg/status/2110901393238474863). Speeds, scale, timing, and thrust are illustrative, not measured performance data or an engineering simulation.
