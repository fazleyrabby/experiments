# Inside the mechanical watch

A procedural, interactive watch breakdown built with Three.js, vanilla JavaScript, HTML, CSS, and Vite. All geometry, dial printing, machining textures, and studio reflections are generated locally. No external models, fonts, images, or HDR files are requested at runtime.

The product brief and acceptance criteria are in [SPEC.md](./SPEC.md).

## Run

Use Node.js 22.12+ and pnpm or npm:

```sh
pnpm install
pnpm dev
```

Or use `npm install` and `npm run dev`. Open the local URL Vite prints.

```sh
npm test
npm run build
npm run preview
```

## Explore

- Drag or swipe to orbit; scroll or pinch to zoom.
- **Break down** separates nine assemblies. **Reassemble** returns every assembly to its original position. Both actions can reverse a transition.
- Drag **Separation** for direct control.
- Select any component in the index or on the model for a highlighted view and a short explanation. Selecting an index entry reveals the movement automatically. Close the details, select the same component again, or press Escape to clear selection.
- **Auto cycle** holds the assembled watch for 5 seconds, separates it over 3.8 seconds, holds the exploded view for 8 seconds, and reassembles it. Manual interaction stops the cycle.
- **Pause movement** pauses the gears, balance and hands independently of the assembly timeline.
- **Reset view** restores the original orbit and zoom.
- Reduced-motion settings disable automatic cycling and start the mechanism paused, while preserving manual controls.

This is an original, unbranded teaching model. It illustrates the mainspring, wheel train, balance, and escapement, with intentionally exposed parts and slowed illustrative motion. It is not a CAD model, a manufacturer-specific calibre, or a physically solved mechanical simulation. The dial starts near 10:10 and advances with the demonstration; it is not a local-time clock.

## Source

- `src/watch/createWatch.js`: assemblies, dial and component content, movement animation, highlighting.
- `src/watch/resources.js`: geometry helpers, textures, shared materials and static-detail batching.
- `src/animation.js`: deterministic assembly, interruption, scrubbing and cycling.
- `src/scene.js`: lights, generated studio environment, camera, orbit and responsive framing.
- `src/ui.js`: accessible controls, component index, inspector and status.
- `src/main.js`: render loop, raycasting, initialization and cleanup.
- `tests/animation.test.js`: endpoint precision, reversal continuity, scrubbing, cycle and reduced-motion checks.

Resources are shared and static meshes are merged by material inside each moving assembly. Pixel ratio is capped at 1.75. Hidden tabs skip updates, frame deltas are capped, and Vite hot replacement disposes geometry, materials, textures, controls, listeners, renderer and generated environment.

Mechanical descriptions are informed by the [Federation of the Swiss Watch Industry](https://www.fhs.swiss/eng/mechanical-quartz.html) and its [explanation of jewel bearings](https://www.fhs.swiss/eng/jewels.html).

## Clean showcase film

`mechanical-watch-showcase.mp4` is an 18-second, 1920×1080, 60 fps H.264 film. It shows the assembled watch, a smooth breakdown, an orbit around the movement, and reassembly. There are no interface labels or buttons in the film, and no audio track.

To regenerate it:

1. Run `npm run dev` with this project's Vite configuration.
2. Open the printed local URL with `?frames=1`. Keep the tab active while it saves all 1,080 JPEG frames to `artifacts/frames/`.
3. Run `node scripts/render-video.mjs` (requires FFmpeg).

`?film=1` plays the same clean camera sequence without writing frames. Capture uses fixed animation times and saves each frame before advancing, so the exported motion is independent of rendering speed. The frame-writing endpoint is available only in the development server; the production build has no export backend.
