# Desk Grand Prix

1:64 die-cast cars race three laps across a sunlit 3 m oak desk on 6.2 m of orange toy track. The track banks around a coffee mug, threads a pencil-cup chicane, climbs onto a stack of books and jumps a real gap. You drive a Countach LP400 against three fictional rivals: the Brawler 440 fastback, the Rally 12 hatch and the Hauler van.

Every model and texture is generated in code. Nothing is downloaded except three.js r160 and the fonts. The only recorded asset is the engine loop.

## Run

```bash
python3 desk-grand-prix/tools/serve.py 4391
```

Then open http://localhost:4391. Any static server works; `serve.py` just turns caching off while you edit.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Throttle |
| S / ↓ | Brake, then reverse |
| A / D, ← / → | Steer |
| Space | Handbrake |
| R | Put the car back on the track |
| C | Camera: chase, front, low, trackside, hood, heli, director |
| P | Photo mode: orbit, click to focus, blur slider, save PNG |
| V | Record a clip (MP4 where the browser supports it, otherwise WebM) with sound |
| H | Clean feed: hide the interface |
| M | Sound on or off |
| Esc | Back to the showroom |

**Watch the AI** runs all four cars on autopilot under the director camera, which is the easiest way to film a clip.

## How it is built

- **Die-cast bodies** (`js/cars.js`, `js/sdf.js`):
  - Each car is a signed-distance field in real-car metres: a side-profile polygon extruded to a plan-view half-width, with every edge rounded. A separate greenhouse is smooth-unioned on top.
  - Details are carved into the field: wheel arches cut only through the outer skin, the Countach's periscope roof trough and NACA ducts, the Brawler's hood scoop, the Rally 12's boxed flares and roof spoiler, the Hauler's blower opening.
  - A surface-nets mesher turns each field into about 110–140k triangles (0.34 mm cells on the toy). Each car meshes in its own Web Worker.
  - Normals come from the field gradient, so edges shade like soft cast metal. The field's Laplacian is stored per vertex as "wear".
- **Paint and tampo** (`js/diecast.js`):
  - Glass, black trim, chrome, lamps, shut lines, stripes, roundels and plates are painted onto four canvases (side, top, front, back). The shader projects them back onto the body.
  - Candy paint is metallic with clearcoat and a per-cell flake normal.
  - Convex edges chip through to bare zamak where the wear value and a noise threshold agree.
  - Wheels are lathed plastic tyres with chrome or gold extruded faces: telephone-dial, deep-dish, six- and five-spoke. Each sits on a steel axle pin.
  - The unpainted base has embossed lettering and rivets.
- **Track** (`js/track.js`):
  - A closed Catmull-Rom centreline sampled every 2.5 mm into frames (tangent, right, up).
  - Hairpins bank automatically from smoothed curvature, and the centreline lifts so the low edge stays on the desk.
  - The moulded U-profile is extruded along the frames. Grey support pylons go wherever a wall's underside is clear of the desk or the books.
  - The gap is a stretch with no surface and capped track ends.
  - A racing line and a reference-speed profile (forward and backward grip passes) feed the AI.
- **Physics** (`js/physics.js`):
  - Grounded cars live in track coordinates: arc length, lateral offset and heading, with a slip-angle tyre model.
  - The drive is power-limited with air drag, so cars top out near 72 cm/s (about 165 km/h at 1:64) and laps take about 9.5 s.
  - Gravity is split along the track frame, so the ramp slows you and the banking holds you in.
  - When the normal load goes negative or the track runs out, a car becomes a rigid body. It lands back on the track or crashes onto the desk; a crashed car is returned to the track behind where it left it.
  - Cars collide as pairs of circles with restitution and a yaw kick. Units are centimetres with real gravity, so the toys fall like toys.
- **Race** (`js/race.js`): countdown lights, lap and best-lap tracking, finishing order. The AI swings to the inside of corners, brakes to the reference speed, picks a side to pass, and rubber-bands lightly to the player.
- **Desk and room** (`js/world.js`, `js/textures.js`):
  - Oak planks: a 4096 × 512 grain texture with a normal and roughness map, each plank offset differently.
  - Desk props: a glazed mug with steam, two cloth-bound books, keyboard keycaps with a legend atlas, the desk lamp's spotlight, and a monitor showing live timing.
  - Paper props: a notebook with a hand-drawn sketch of the actual track, sticky notes, and the empty blister card the Countach came out of.
  - Small props: pencils, coins, a paper clip and a succulent.
  - Sun comes through a window behind the desk, so the mullions throw bar shadows across it. The sun's 4096 shadow map follows the camera's focus, snapped to texels.
  - Reflections come from a code-built copy of the room.
- **Camera and look** (`js/camera.js`, `js/post.js`):
  - Shots: chase, front tracking, low side tracking, telephoto trackside stations, hood, heli, and a showroom orbit.
  - The director cuts between shots and drops into slow motion with a side-on camera when a car takes the book jump.
  - Post chain: GTAO, then a thin-lens depth of field (circle of confusion ∝ |1 − focus/depth|, 44-tap golden-spiral gather that keeps sharp foregrounds clean and blooms bright highlights into bokeh), then bloom, ACES, and a grade with vignette, grain and a trace of chromatic aberration.
- **Sound** (`js/audio.js`):
  - The engine is a real recording re-pitched through a pretend four-speed box, with rivals mixed by distance.
  - Die-cast knocks are modal synthesis of a small zinc casting.
  - There are plastic-wheel rumble, wall scrapes, and a click at every track joint.

## Sources

- `assets/engine.wav`: "Racing car engine sound loops" (loop_0) by domasx2, CC0, https://opengameart.org/content/racing-car-engine-sound-loops. It is the same file the Desert Huracán uses.
- The Countach's proportions follow published LP400 dimensions (length 4.14 m, width 1.89 m, height 1.07 m, wheelbase 2.45 m), exaggerated the way toy castings are. The three rivals are fictional designs.
