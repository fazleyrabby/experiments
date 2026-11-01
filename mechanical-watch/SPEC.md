# Inside the mechanical watch

## Intent
A small, cinematic mechanical-watch breakdown in Three.js and Vite. Follow the V8 reference's procedural studio model and reversible explosion, with the Falcon reference's restrained exhibit typography. The watch is the interface's main subject. No framework, backend, downloaded model, image, font, or HDR dependency.

## Visual direction
A charcoal studio, polished silver case, graphite dial, machined movement plates, brass wheels, ruby bearings, and a restrained pale-green interface accent. System sans-serif with monospaced technical labels. One full-screen scene, a quiet title, a component index, and a bottom transport. Design variance 6/10, motion intensity 6/10, visual density 3/10. Native CSS, with no external UI system.

## Model
An original, unbranded manual-wind watch head. Nine independently selectable assemblies:
1. Sapphire crystal and bezel: transparent cover and polished outer ring.
2. Hands: central hour, minute, and seconds hands.
3. Dial: graphite face, minute track, applied indices, and printed numerals.
4. Movement bridges: machined plates, screws, and jewel bearings.
5. Going train: visibly toothed, spoked brass wheels with steel pivots.
6. Balance and escapement: oscillating balance, spiral hairspring, stylized lever and escape wheel.
7. Mainspring barrel: toothed drum with an exposed spring ribbon.
8. Mainplate: circular supporting plate, cutouts, bearings, and fasteners.
9. Case and back: steel middle case, lugs, knurled crown, exhibition back.

The assembled view is a recognizable finished watch. During breakdown, components separate along the movement axis with small lateral offsets. The movement is a schematic educational illustration: wheel motion, escapement, spring behavior, and spacing are illustrative, not a physically solved watch or manufacturer-specific calibre. The display does not claim measured dimensions, reserve, beat rate, or jewel count.

## Interaction
- Automatic sequence: assembled hold, breakdown, exploded hold, reassembly; repeat. Manual exploration stops the cycle.
- Breakdown and reassemble actions are reversible even during a transition, with no transform jumps.
- Separation slider gives continuous manual control.
- Drag / touch to orbit, wheel / pinch to zoom.
- Select a component in the index or on the model to highlight it and explain its role. Clear selection to return to the overview.
- Pause / resume the illustrative mechanism independently of assembly.
- Toggle automatic cycling and reset the view.
- Keyboard-accessible controls, visible focus, semantic status, touch-friendly targets.
- Reduced-motion preference disables autoplay and starts the mechanism paused; direct user controls remain available.

## Implementation
- `src/watch/createWatch.js`: procedural assemblies and operational movement.
- `src/watch/resources.js`: shared materials, procedural textures, reusable geometry helpers, merged static meshes.
- `src/animation.js`: deterministic interruptible assembly timeline.
- `src/scene.js`: studio reflections, lighting, camera, orbit controls, responsive framing.
- `src/ui.js`: component inspection, controls, status.
- `src/main.js`: one animation loop, selection, lifecycle and cleanup.
- Native WebGL2 renderer, capped pixel ratio, shared resources. No postprocessing dependency. Pause updates in hidden tabs. Dispose resources on Vite hot reload.

## Acceptance
- Installs, runs with `npm run dev`, builds with `npm run build`.
- Watch reads clearly at a laptop viewport and a narrow mobile viewport.
- All nine assemblies separate and return exactly to their original transforms.
- Mid-transition direction changes and slider interaction are continuous.
- Index selection and model selection agree; details remain usable on mobile.
- No browser runtime errors during a complete assembly cycle.
- Useful loading, WebGL error, and no-JavaScript states.
- Tests cover timeline endpoints, reversal, automatic cycle, and reduced-motion behavior.

## Milestones
1. Specification and project scaffold.
2. Procedural watch and studio.
3. Breakdown timeline and component inspection.
4. Responsive UI, browser review, build and regression checks.

## References
- Local: `../v8enginebreakdown` and `../millenium falcon`.
- Mechanical principles: https://www.fhs.swiss/eng/mechanical-quartz.html
- Jewels: https://www.fhs.swiss/eng/jewels.html
- Three.js renderer: https://threejs.org/docs/pages/WebGLRenderer.html
- Orbit controls: https://threejs.org/docs/pages/OrbitControls.html

## Luxury refinement and showcase deliverable
The case uses smooth turned profiles, polished chamfers, curved lugs and a decorated knurled crown. The green dial has sunburst brushing, guilloche detail, applied batons, a gilt chapter ring and faceted dauphine hands. The movement adds engine-turned perlage, engraved bridges, polished jewel settings, winding wheels and a flat ribbon mainspring.

Deliver an 18-second, 1920×1080, 60 fps silent MP4 with the watch as the sole subject. Hide all exhibit text and controls. Use fixed-frame capture: assembled opening, eased breakdown, orbit while exploded, eased reassembly, assembled closing. Save as `mechanical-watch-showcase.mp4`. Retain reusable local export and encoding tools.
