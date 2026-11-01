# Optimus Prime transformation

A local, full-screen Three.js experience built with Vite, plain JavaScript and GSAP. The procedural character follows the supplied red cab-over truck reference, with split windshield chest panels, blue lower legs, exposed machinery, a silver faceplate and an extending ion rifle.

## Run

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. The first 7.6 seconds transform the truck into the robot. The cinematic finishes at 14 seconds after a complete 360-degree camera orbit.

- **Replay / R** restarts the cinematic from truck mode.
- **Truck mode / Robot mode / Space** reverses or resumes the mechanical transformation, including while it is running.
- Drag to orbit and scroll or pinch to zoom. Dragging cancels the automatic camera.
- Reduced-motion preferences skip the opening cinematic and make mode changes immediate.

For recording, use Replay and record the viewport for 14 seconds. No external models, textures, fonts or media downloads are needed at runtime.

## Structure

- `src/model/Builder.js`: cached procedural geometry, materials and static detail batching within each articulated pivot.
- `src/model/createOptimus.js`: cab, doors, chassis, six wheels, hierarchical limbs, pistons and head. Dynamic rods follow their actual attachment points.
- `src/model/createIonBlaster.js`: long metal rifle, receiver, magazine and telescoping barrel shroud.
- `src/animation/Transformation.js`: reversible GSAP component timeline and separate interruptible camera timeline.
- `src/scene/`: studio lighting, environment reflections, ambient occlusion, restrained bloom, particles and impact effect.

Metal roughness and environment intensity are deliberately restrained to keep armor details readable. Rendering caps pixel density, uses lower shadow resolution on touch devices, skips ambient occlusion there, and batches stationary details inside each moving assembly. Camera framing adapts to the viewport.

```sh
npm test
npm run build
npm run preview
```

Tests check both reversible endpoints, intermediate matrices, geometry batching and reduced-motion behavior. This is a procedural interpretation of the supplied references, not a licensed film mesh.
