# 叮叮 — Hong Kong Tram in Seven Styles

A double-decker "ding ding" tram rolling through a neon rainstorm. Everything is procedural (no models, no image
files) and the whole frame can be re-drawn live in seven art styles.

## Run

Static site, no build step (the dev server disables caching so edits show up on reload):

```bash
python3 hk-tram/tools/serve.py 4311
```

Open http://localhost:4311. Needs WebGL 2.

## Styles

1. **Realistic** — wet-road planar reflections, bloom, grain
2. **1-Bit Dither** — Bayer ordered dither with ink outlines
3. **Ukiyo-e** — woodblock palette, key-block outlines, paper grain, misregistered colour plate
4. **Comic Halftone** — CMYK dot screens at four angles, thick inks
5. **Blueprint** — drafting grid and white line-work
6. **Thermal Cam** — iron-bow palette on scene luminance
7. **Game Boy** — 4-shade LCD green, 160×144-style pixels

Switching wipes diagonally from the old style to the new. **Compare** turns the wipe into a draggable divider
(click a style to set the left side, Shift-click for the right).

## Controls

`1`–`7` style · `S` compare · `A` auto-cycle · `C` cinematic/orbit · `N` next shot · `Space` pause · `B` bell ·
`P` save frame · drag to orbit, scroll/pinch to zoom. **Record tour** captures a 20 s style tour as `.webm`.

## How it works

- `world.js` — a 240 m periodic street (three chunks, re-centred on the tram by whole periods so it never ends):
  shader-drawn tenement facades, merged neon sign atlases (`signs.js`), wires, lamps, wet road with a planar
  reflection and rain ripples.
- `tram.js` / `traffic.js` — ad-wrapped trams (canvas colour + emissive maps), taxis, minibuses, umbrella crowd.
- `post.js` — HDR scene target with depth → bloom chain → one style pass. Each style is a GLSL function of the same
  frame; edges come from depth + luminance.
- `camera.js` — six looping cinematic shots plus an orbit camera. `audio.js` — synthesised rain, motor, rail clacks, bell.

Debug params: `?style=N`, `?shot=N&u=seconds`, `?freeze=1`, `?split=1&a=0&b=2`, `?cam=orbit`.

## Blender facade kit

`assets/hk_kit.glb` is built by `tools/blender_kit.py`: recessed aluminium windows, window cages with plants,
open and enclosed balconies, bay windows, shopfronts (open and shuttered), AC units and drainpipes, with
grime and ambient occlusion baked in Cycles. It runs in its own `HKTram_Kit` scene and never saves the .blend.
With the BlenderMCP add-on listening on port 9876, send the script as `execute_code`; `js/facade.js` instances
the kit bay by bay and storey by storey on the street faces near the tram.

## Blender vehicles and tram detail

- `tools/blender_vehicles.py` → `assets/taxi.glb`, `assets/minibus.glb`: Crown Comfort-style taxi and Coaster-style
  green minibus, lofted from superellipse sections, subdivided, wheel arches cut with booleans, trim placed on the
  body surface by raycast, drivers and passengers inside. `js/traffic.js` swaps in neon-reflective paint and glass.
- `tools/blender_tram.py` → `assets/tram_detail.glb`: window gaskets and opening sashes, folding doors, bumper,
  headlamp hoods, wipers, roof resistors and trolley springs, trucks with leaf springs, interior strip lights —
  fitted to the hull `js/tram.js` lofts.

Each script builds in its own scene, exports, switches back to the scene that was open and never saves the .blend.
