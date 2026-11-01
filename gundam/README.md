# RX-78-2

A detailed, centered procedural Gundam viewer with two controls: **Break down** and **Assemble**. The model contains 926 independent components, rendered in 326 instanced batches. The armor separates around a mechanical frame and assembles again in a staged, interruptible sequence.

All geometry is generated in code: sculpted armor, stepped seams, recessed service latches, hydraulic pistons, detailed joints, articulated fingers, cooling louvers, a compact helmet with amber eyes and white V-fins, backpack thrusters and beam sabers, a shield, and a downward-held beam rifle. The rifle is attached by its pistol grip to the right palm; the shield connects to the left forearm rail and a handle inside the left fist. No imported meshes, textures, or fonts. Styling and proportions were informed by the supplied reference image.

## Run

```sh
npm install
npm run dev
```

Drag to orbit, scroll or pinch to zoom, and right-drag to pan. Space alternates breakdown and assembly; R resets the camera. Reduced-motion preferences skip the introduction and make transitions immediate.

## Check and build

```sh
npm run validate
npm run build
npm run preview
```

The model uses shared geometry and instancing. Desktop rendering adds ambient occlusion, subtle paint variation, soft bloom on the optical sensors, studio reflections and directional lighting. Touch devices use lower rendering resolution and skip ambient occlusion.

`src/model/createGundam.js` defines the body, `src/model/Builder.js` contains the geometry builders and instancing, `src/animation/AssemblyController.js` owns the animation timeline, and `src/scene/createStudio.js` configures the camera and lighting.

This is a procedural fan interpretation, not an official asset or an exact replica of a manufactured kit. Rendering uses [Three.js](https://threejs.org/docs/), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), and [GTAOPass](https://threejs.org/docs/pages/GTAOPass.html).
