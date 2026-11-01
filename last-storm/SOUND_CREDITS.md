# Sound credits — The Last Storm

Every sound in the film is **original and synthesized** in the browser with the Web Audio API (`js/audio.js`).
No recordings were downloaded or used, so there are no third-party licences to honour.
The soundtrack renders deterministically from the film timeline: the same code produces the same audio in the player and in the export.

| Sound | Where | Source | Creator | Licence |
|-------|-------|--------|---------|---------|
| Ocean swell and breaking crests | throughout | Synthesized: filtered brown/pink noise with swell envelopes | This project | Original work, same licence as the project |
| Wind | 1, 2A, cabin, storm | Synthesized: band-passed pink noise with a wandering centre frequency | This project | Original |
| Rain wash and drops | 2B–2D, 4, 5 | Synthesized: high-passed noise plus thousands of tiny band-passed bursts | This project | Original |
| Cabin room tone | 3 | Synthesized: low-passed brown noise | This project | Original |
| Wooden boat creaks, rope tension | 1, 2A, 4, 5 | Synthesized: stick-slip sawtooth pulses through a resonant band-pass | This project | Original |
| Distant gulls | 1A, 5C | Synthesized: gliding triangle tones with vibrato | This project | Original |
| Glass taps, rings and bowed glass tones | 1B, 2C, 3C, 4A, 4C, 5B | Synthesized: inharmonic sine partials; sustained vibrato sines | This project | Original |
| Coins | 2D | Synthesized: inharmonic metallic partials | This project | Original |
| Cork pop and release rush | 4A | Synthesized: noise burst, pitch-dropping thump, swept band-pass noise | This project | Original |
| Thunder | 1A (distant), 4 | Synthesized: crack of low-passed noise, rolling brown-noise rumble | This project | Original |
| Low pads | 3, 5, title | Synthesized: detuned triangle oscillators, low-passed | This project | Original |
| Reverb | effects stem | Synthesized impulse response (seeded decaying noise) | This project | Original |

## Narration

There is **no recorded voice**. The narration exists as timed subtitles (burned into the export by default).
The player has an optional *spoken narration preview* using the browser's own text-to-speech voice; it is a preview only and is never exported.

To add a real narration recording, place it in `audio/` and set `src` in `audio/narration.json`:

```json
{ "src": "narration.mp3", "label": "Narration recorded by …", "offset": 0 }
```

The file should be one continuous take aligned to t = 0 (use `offset` in seconds to shift it). The player and the exporter both pick it up. Record its creator and licence in this file.

## Adding real recordings later

If you replace a synthesized layer with a recording from Freesound, Pixabay or Mixkit, check the licence on the asset's own page before using it, and add a row here with the asset name, creator, source URL and licence. Do not list an asset as CC0 or public domain unless its page says so.
