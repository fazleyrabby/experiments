# Typewriter

A full-screen 3D mechanical typewriter built with **Three.js, Vite, HTML, CSS, and vanilla JavaScript**. The typewriter is modeled procedurally; no external 3D assets or API keys are required.

## Run

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Controls

- **Play demo** types: `Hi, fellow followers of X how are you doing?`
- The small control bar disappears during playback. **Space** pauses or resumes; **Escape** stops.
- The **T** button edits the sentence and typing pace.
- Click the scene and use your keyboard, or click the 3D keys. Enter returns the carriage; Backspace removes a character.
- The circular arrow starts a fresh page. A page holds 18 lines of 38 characters.
- Camera buttons switch between studio, paper, and keyboard views. Drag to orbit; scroll to zoom.
- Speaker and sun/moon buttons control sound and appearance.
- The record button types the sentence and downloads a video. It captures **only the typewriter canvas and mechanical audio**. No controls, captions, labels, or interface text appear in the video. The current camera angle is preserved. Escape ends a recording early.
- **Ctrl/Cmd + Enter** starts or pauses the demo.

Recording requires browser support for `canvas.captureStream` and `MediaRecorder`. Chrome is recommended. WebM is preferred, with MP4 used if the browser supports it. Convert to MP4 in a video editor when needed for posting.

## Source

- `src/scene.js`: typewriter geometry, materials, lighting, animation, camera, and paper texture.
- `src/document.js`: text layout, carriage returns, and page limits.
- `src/sound.js`: synthesized mechanical audio.
- `src/main.js`: keyboard, playback, controls, and video export.
- `src/style.css`: full-screen scene and minimal controls.

The model is an original interpretation of a vintage portable typewriter. A detailed authored GLB can replace the procedural body in a later photorealism pass.
