// Guided voyage: a ~3 minute scripted arc from a rough dusk through a hurricane night
// and a rogue wave, to a calm dawn with dolphins. Everything else in the scene keeps
// running live; the script only nudges weather, time, camera and events.

export const VOYAGE = [
  { t: 0, time: 'dusk', weather: 'rough', shot: 0,
    log: '18:40 · Departed Halifax, bound for Rotterdam. Barometer 1002 hPa and falling.' },
  { t: 14, shot: 5 },
  { t: 26, time: 'night', weather: 'storm', shot: 2,
    log: '21:15 · Wind backing south-west, Force 10. Speed reduced, heading into the sea.' },
  { t: 40, shot: 1, strike: 700 },
  { t: 52, weather: 'hurricane', shot: 4,
    log: '23:50 · Force 12. Seas fourteen metres and building. All hands off the deck.' },
  { t: 58, strike: 500 },
  { t: 66, shot: 3, strike: 900, rogue: 30 },
  { t: 72, log: '00:31 · Lookout reports a wall of water fine on the bow.' },
  { t: 84, shot: 2, strike: 600 },
  { t: 100, log: '00:34 · Took green water over the forecastle. Lashings held. No injuries.' },
  { t: 112, weather: 'storm', shot: 5 },
  { t: 126, time: 'dawn', weather: 'rough', shot: 0,
    log: '05:40 · Wind easing to Force 7. First grey light in the east.' },
  { t: 146, weather: 'calm', shot: 1, dolphins: true,
    log: '06:25 · Swell down to three metres. Dolphins riding the bow wave.' },
  { t: 162, whale: true, shot: 2 },
  { t: 176, log: '07:10 · Course 078°. Rotterdam in four days. Ship and crew well.' },
  { t: 186, end: true },
];

export class Voyage {
  constructor(api) {
    this.api = api;
    this.active = false;
    this.t = 0;
    this.i = 0;
    this.duration = VOYAGE[VOYAGE.length - 1].t;
  }

  start() {
    this.active = true; this.t = 0; this.i = 0;
    this.api.onStart();
  }

  stop(finished = false) {
    if (!this.active) return;
    this.active = false;
    this.api.onEnd(finished);
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    while (this.i < VOYAGE.length && VOYAGE[this.i].t <= this.t) {
      const k = VOYAGE[this.i++];
      const a = this.api;
      if (k.time || k.weather) a.setAtmosphere(k.time ?? null, k.weather ?? null);
      if (k.shot !== undefined) a.setShot(k.shot);
      if (k.log) a.log(k.log);
      if (k.strike) a.strike(k.strike);
      if (k.rogue) a.rogue(k.rogue);
      if (k.dolphins) a.dolphins();
      if (k.whale) a.whale();
      if (k.end) this.stop(true);
    }
    this.api.progress(Math.min(1, this.t / this.duration));
  }
}
