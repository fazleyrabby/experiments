# Inside the V8

A minimal, cinematic, interactive 90° V8 engine study built with Three.js, Vite, and vanilla JavaScript. All geometry, surface textures, and studio reflections are generated procedurally. No models, images, fonts, or HDR files are downloaded at runtime.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To create and inspect a production build:

```sh
npm run build
npm run preview
```

## Explore

- Drag or swipe to orbit. Scroll or pinch to zoom.
- **BREAK DOWN** expands the engine; **REASSEMBLE** returns it precisely to its original transforms. Either control can reverse an ongoing transition.
- Manual disassembly or assembly pauses the automatic sequence. Reload the page to restart the automatic loop.
- Select a component detail label in the exploded view, or click a 3D surface, to highlight its system and read a short explanation. Select it again or use the close button to clear it.
- Automatic playback holds the assembled engine for 5 seconds, disassembles over 4.5 seconds, holds the exploded view for 7 seconds, and reassembles over 4.5 seconds.
- Reduced-motion preferences disable automatic rotation and the automatic cycle; manual transitions remain available at a shorter duration.

## Structure

```text
src/
  engine/createEngine.js   Independently addressable component groups
  engine/resources.js     Shared geometry, materials, procedural brush texture
  engine/mechanics.js     Cross-plane crank and slider-crank calculations
  scene.js                Studio, environment, camera, orbit controls, resizing
  animation.js            Interruptible staggered timeline and automatic cycle
  ui.js                   Controls, state, progress, component inspection
  movie.js                Local 18-second recording mode
  main.js                 Single delta-time animation loop and resource cleanup
  style.css               Responsive exhibit overlay
tests/mechanics.test.js    Mechanical invariants and timeline regression checks
```

The crankshaft has four throws phased at 0°, 90°, 270°, and 180°, with two side-by-side rods per throw. Piston displacement is solved from the intersection of a cylinder axis and a fixed-length connecting rod. The exposed rotating assembly remains connected during disassembly, while the cylinder banks move outward. This is a simplified educational engine, not CAD or a combustion simulation.

Geometry and materials are cached and shared. Repeated static detail is merged by material within each moving component, reducing the engine to roughly 150 draw calls while keeping each piston, rod, and crank independently animated. Resources, controls, observers, listeners, recording tracks, and the animation loop are disposed on teardown and Vite hot replacement. Hidden tabs pause visual updates, and resumed frame deltas are capped.

## Verify

```sh
npm test
npm run build
```

The tests cover all eight piston/rod mechanisms through two revolutions, full automatic cycles, interruption without transform jumps, precise reassembly, and reduced-motion behavior.

## Overview video

The project includes `inside-the-v8-overview.mp4`: an 18-second breakdown, exploded 360° overview, and reassembly.

To regenerate it in Chrome, open the running site with `?record=1`. The same render loop produces a 1280×720, 30 fps canvas recording with a full turn. After 18 seconds, use the capture page’s **SAVE OVERVIEW VIDEO** link to download `inside-the-v8-overview.webm`. Convert the downloaded recording with FFmpeg:

```sh
ffmpeg -i inside-the-v8-overview.webm -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p -movflags +faststart -an inside-the-v8-overview.mp4
```

For a guaranteed frame-complete export, open `?frames=1` in the Vite dev server. The app writes 540 JPEG frames into `artifacts/frames/`, advancing only after each frame is saved. Then run:

```sh
node scripts/render-video.mjs
```

This creates the 18-second, 1280×720, 30 fps MP4 in the project root. It requires FFmpeg. The export helpers run only in Vite development; the built app has no backend. The movie is silent. Recording and frame exports stay on your computer.
