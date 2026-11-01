# Prompt: Chrome LEGO Lamborghini Countach

Build a Vite + Three.js web app (`three@^0.186`, `vite@^8`, vanilla JS ES modules, no framework) that shows a **procedurally generated, highly detailed, chrome-plated LEGO Lamborghini Countach (LP400 / LP5000 QV wedge silhouette)**. The bricks assemble themselves one by one on page load; a button breaks the car down into an exploded view; another button rebuilds it.

**Use `/Users/rabbi/Desktop/Projects/lego-spaceship` as the architectural and behavioural reference.** Read it first and mirror its structure, conventions and breakdown/assembly mechanism. Do NOT copy spaceship-specific content (wings, engines, starfield). Reuse the pattern, replace the model.

## 1. Project structure (mirror the spaceship repo)

```
index.html
vite.config.js, package.json, .prettierrc, .gitignore
src/main.js
src/config.js                 // STUD, PLATE_HEIGHT, PALETTE, SECTION_ORDER, SECTION_LABELS, TIMING, LAYOUT_SEED
src/style.css
src/animation/AnimationManager.js, easing.js
src/audio/createBrickAudio.js // procedural Web Audio click, no audio files
src/scene/createScene.js, createLighting.js, createCamera.js, createPlatform.js
src/ui/controls.js, status.js
src/utils/random.js           // seeded RNG
src/car/createBrick.js, brickGeometry.js, brickMaterials.js, createCar.js, carLayout.js
src/car/layout/LayoutBuilder.js, wedgeMath.js
src/car/sections/*.js         // one file per section, see section 4
```

Keep the same rules as the reference: pure-data layout code with no Three.js imports (so it can be validated outside the browser), a seeded layout, shared cached geometries and materials (many bricks, few BufferGeometries), `createBrick({width,height,depth,position,rotation,color,type,shape})` as the single brick factory, and the same grid convention (1 stud = 1 unit, 1 plate = 0.4 units, 3 plates = 1 brick, specs use min-corner `(x,y,z)` + size `(w,h,d)`, `LayoutBuilder.mirror()` for the symmetric left/right halves). Car convention: `+z` = nose, `-z` = tail, `x` = left/right, `y` = up.

## 2. Assembly on page load

- On load every brick starts scattered (`scatterPosition` / `scatterQuaternion`) and the build begins automatically. No button press needed.
- Bricks fly in section by section in `SECTION_ORDER`, staggered, each with lift, ease-out, small rotation settle and a tiny overshoot "snap" when it seats. Per-brick random jitter on duration (as in `TIMING.assemble`).
- Build order, bottom up: chassis plate and floor, wheels and axles, drivetrain / V12 engine, lower body and sills, interior tub and seats, wedge body panels, scissor doors, glasshouse and windscreen, rear engine cover with louvers, wing, headlights, bumpers, mirrors, details (badges, exhausts, light units).
- Camera intro orbit during the build (`rig.playIntro`), then slow showcase rotation once assembled. Rotation pauses on user drag and resumes after `resumeDelay`.
- Procedural brick click sound per placed brick, throttled, pitch by brick mass. When complete, play a short V12 start-up chord and give a small engine-bay glow pulse. Sound toggle button, preference stored in localStorage inside try/catch.

## 3. Breakdown and reassemble (same mechanism as the spaceship)

Initial assembly, breakdown and reassembly are one mechanism: a timed "run" of per-brick tracks. Reuse `AnimationManager` semantics exactly:

- States: `ASSEMBLING`, `ASSEMBLED`, `BREAKING_DOWN`, `DISASSEMBLED`, `REASSEMBLING`.
- Every brick has `finalPosition/Quaternion` and `explodedPosition/Quaternion`.
- **Break Down** button: enabled only when `ASSEMBLED`. Studs "pop" first, then bricks drift outward to the exploded pose, peeling off in **reverse build order** (details first, chassis last). Camera eases to a wide framing.
- **Exploded layout, not random scatter**: bricks move along an exploded-view vector per section (wheels out sideways along their axles, doors swing out and up, engine cover lifts up and back, wing lifts up and rearward, bumpers pull forward/back, interior drops down, engine drops down and back, glass floats up). Add slight per-brick jitter so it reads as a tidy technical exploded diagram, not chaos.
- Pieces resting in the exploded view get a gentle weightless bob.
- **Reassemble** button: enabled when `DISASSEMBLED` or `BREAKING_DOWN`, interrupts cleanly mid-explosion (tracks continue from current pose), camera returns to the normal framing.
- Both buttons never allow invalid transitions. Buttons sync via `controls.sync(manager)`.
- Status HUD: state label, placed-brick counter, progress bar, current section label (e.g. "Scissor doors"), with `aria-live` on the label.
- Extra buttons: Reset View, Sound toggle. Hint text "Drag to orbit, scroll to zoom" that hides on first interaction.

## 4. The car (this is the important part: be highly detailed)

Target 2,500 to 5,000 bricks. Accurate Countach proportions: very low, long wedge, nose dipping to the ground, cab-forward glasshouse, sharply raked windscreen, flat tail, wide rear haunches, car roughly 2:1 length-to-width and very low.

Sections (one file each, each tagged for build order, labels, and exploded vectors):

1. **Chassis and floor**: studded base plates, Technic-like frame rails (visible when exploded), cross members, skid plate.
2. **Wheels (x4)**: 6 stud-wide rear tyres, narrower front. Built from rings of angled wedge/curved bricks. Tyre = black rubber-look, 5-spoke or the classic Countach **Campagnolo-style 5-hole alloy wheel** in chrome, centre cap, brake disc and red caliper behind the spokes, wheel arches with proper gap. Rear wheels visibly wider than front.
3. **Drivetrain / V12**: visible engine block, two cylinder banks, intake trumpets, exhaust pipes running back to **four tailpipes**, gearbox, rear subframe. Visible through the louvered engine cover and when exploded.
4. **Lower body and sills**: side skirts, front splitter, rear diffuser, **NACA-style side air intakes** behind the doors (recessed dark bricks).
5. **Interior**: tub, two bucket seats, steering wheel, dash, gear shifter with gate, centre tunnel, pedals. A minifig-scale driver is optional.
6. **Main wedge body**: sloped panels from wedge/slope/curved-slope bricks (`wedgeMath.js` for the angled polygons as in the spaceship), flat hood with the two small hood vents, flat shoulder line, **rear haunches** that flare over the wide rear tyres, sharp crease along the side.
7. **Scissor doors (x2)**: separate hinged sections that sit closed in the assembled state. In the exploded view they rotate open upward about the front hinge (rotate, don't only translate) as part of the breakdown for a signature moment.
8. **Glasshouse**: raked windscreen, side windows, rear window, **periscope roof slot** (centre roof recess), translucent glass bricks. Windows see-through so the interior shows.
9. **Engine cover**: louvered rear deck made of stacked slats (alternating plates and tiles), rear window, flat tail panel with lower vent grille.
10. **Rear wing** (LP500S style, optional toggle in config): wing blade, two endplates, two pylons.
11. **Lights**: pop-up style rectangular **headlights** (lens bricks, retracted look plus chrome bezel, emissive amber/white lenses), front indicators, **rear light bars** across the tail (emissive red slats), reverse lights, number plate tile.
12. **Bumpers**: front bumper with air intake and slim grille, rear bumper with exhaust cut-outs.
13. **Details**: side mirrors on stalks, door handles, fuel cap, wipers, "LAMBORGHINI" lettering as 1x1 tiles in a stylised pixel font across the tail, raging-bull badge, antenna, side repeaters, wheel nuts, hood latch. Add tiny greebling (1x1 round plates and tiles) along panel seams for realism.

Studs on all upward-facing surfaces where a real LEGO model would have them, smooth tiles on top where it would look right (roof, hood, doors), with proper brick seams (`BRICK_GAP`) and softened edges so every brick reads as an individual part.

## 5. Chrome look (key requirement)

Chrome only looks like chrome when it has something bright and contrasty to reflect. The reference `RoomEnvironment` at `environmentIntensity 0.42` is far too dull. Do this instead:

- Build a **custom procedural studio environment**: a dark room scene containing several large emissive softbox panels and long thin strip lights (overhead, left and right, one low rim strip behind, a horizon gradient), run through `PMREMGenerator.fromScene`. Strong light/dark contrast is what sells chrome. Set `scene.environment` and raise `environmentIntensity` to about 1.2 to 1.8.
- **Chrome materials**: `MeshPhysicalMaterial` / `MeshStandardMaterial`, `metalness: 1`, `roughness: 0.04` to `0.12`, `envMapIntensity` high, slight `clearcoat` on painted-chrome variants. Keep `flatShading` off on body bricks so reflections are smooth, but keep rounded-edge bevels so edges catch highlights and bricks stay readable.
- **Palette of chrome finishes** (mirror colour names in `PALETTE`, one cached material each):
  - `chrome` (silver mirror): body panels, bumpers, wing, mirrors
  - `chromeRed` (candy red chrome, Countach hero colour): main body highlight panels
  - `chromeGold`: wheels or badge and trim accents
  - `chromeBlack` (dark gunmetal mirror): sills, diffuser, interior trim, window frames, louvers
  - `rubber`: tyres (non-metal, matte black, roughness 0.8)
  - `glass`: tinted, translucent, high clearcoat, depthWrite off, rendered after opaque bricks
  - `glowRed`, `glowAmber`, `glowWhite`: emissive lights, driven at runtime
  - `leather`: dark interior (low-metal, so the cabin reads against all the chrome)
  Provide one config switch `CAR_FINISH = 'silver' | 'candyRed' | 'gold'`, default `candyRed` body over `chrome` trim.
- Reflective **showroom floor**: dark polished platform with `MeshReflectorMaterial`-style reflection (use a mirrored render target plane or a simple flipped-scene reflection with fade-out) so the chrome car reflects on the ground. Soft contact shadows under the tyres.
- Postprocessing: `UnrealBloomPass` (subtle, thresholded so only lights and the brightest speculars bloom), ACES tone mapping, optional subtle vignette. Drop bloom and shrink shadow maps on coarse pointers (`lowPower`).
- Moving specular highlights: because the car slowly rotates in the showcase, reflections must sweep across the bodywork. That motion is the "wow", so confirm it by eye.
- Lighting rig like `createLighting.js`: warm key (only shadow caster, PCF soft), broad top softbox, cool rim from behind, warm low accent, plus the env map doing the heavy reflective lifting.

## 6. UI and page design

- Dark, premium, minimal: near-black radial-gradient backdrop, canvas transparent over it. Title "COUNTACH", subtitle line (LP400 · V12 · 1974 style), a small model-data list (bricks, sections, build status) like the spaceship's `meta`.
- Bottom control bar: **Break down**, **Reassemble**, **Reset view**, **Sound**. Clear disabled states, keyboard accessible, visible focus rings, `prefers-reduced-motion` respected (shorten animations, no auto-spin).
- Fully responsive down to phone width, no horizontal scroll, and a WebGL-failure fallback message like the reference.
- Optional extras if time allows: hovering a brick in the exploded view highlights it and shows its section name, and a "Section isolate" list that lights one section and dims the rest.

## 7. Performance and quality bar

- `InstancedMesh` per unique (geometry, material) pair is welcome, but each brick must remain independently animatable, so either instance with per-instance matrices updated by `AnimationManager`, or use shared geometry meshes like the reference. Choose whichever hits **60fps on a modern laptop and 30fps on a phone** with 3 to 5k bricks.
- Cap pixel ratio (desktop 2, coarse pointer 1.5). Dispose resources properly.
- Seeded randomness only (`LAYOUT_SEED`) so the car and animation are deterministic.
- Add a Node validation script (`npm run validate`) that loads the pure layout and checks: no two bricks overlap, every brick is supported or attached, symmetric halves match, all section keys are in `SECTION_ORDER`, and prints brick counts per section.

## 8. Deliverable and process

1. Read the spaceship repo first. Summarise what you will reuse versus replace in 10 lines.
2. Scaffold, then build the **chrome environment and materials first** with a single test brick to prove the chrome reads well before generating the car.
3. Build the layout section by section, running the validator and checking visually (screenshot via the browser pane) after each section: chassis, wheels, body, doors, glass, wing, details.
4. Verify the three flows in a real browser: assemble on load, Break Down (check doors swing, wheels slide out, no bricks flying through the floor), Reassemble mid-explosion and after completion.
5. `npm run build` must pass. Report brick count, fps, and anything you could not finish.
