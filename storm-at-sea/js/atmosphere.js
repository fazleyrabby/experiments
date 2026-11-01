import * as THREE from 'three';

// Time of day x weather. Each time of day has a clear-sky and a storm palette;
// the weather's `overcast` blends between them. Everything eases toward the target.

const P = (o) => o;

export const TIMES = {
  dawn: {
    label: 'Dawn', clock: '05:52',
    clear: P({ top: '#365579', hor: '#e7a57c', fog: '#a99288', amb: '#5f6874', key: '#ffbf86', keyInt: 2.4, sunEl: 5, deep: '#0c3140', scatter: '#3a8d88', exposure: 1.05, windows: 0.7, nav: 0.7, stars: 0.15, disc: 1, moon: 0 }),
    storm: P({ top: '#1b2129', hor: '#5d5755', fog: '#4b4a4c', amb: '#363d44', key: '#a08470', keyInt: 0.8, sunEl: 6, deep: '#0b2a30', scatter: '#2f8a83', exposure: 1.3, windows: 1.0, nav: 0.9, stars: 0, disc: 1, moon: 0 }),
  },
  day: {
    label: 'Day', clock: '13:20',
    clear: P({ top: '#2a66a8', hor: '#b7cfdf', fog: '#a3b9c6', amb: '#7a8b97', key: '#fff2de', keyInt: 3.0, sunEl: 48, deep: '#063f4f', scatter: '#1ea397', exposure: 0.9, windows: 0.12, nav: 0.3, stars: 0, disc: 1, moon: 0 }),
    storm: P({ top: '#1a2027', hor: '#525c63', fog: '#424c53', amb: '#3b464d', key: '#8a8f8c', keyInt: 0.9, sunEl: 22, deep: '#0b2a30', scatter: '#2f8a83', exposure: 1.3, windows: 0.8, nav: 0.8, stars: 0, disc: 1, moon: 0 }),
  },
  dusk: {
    label: 'Dusk', clock: '18:41',
    clear: P({ top: '#24345e', hor: '#ef8748', fog: '#8f7270', amb: '#545566', key: '#ff9450', keyInt: 2.2, sunEl: 3, deep: '#0b2a38', scatter: '#2f7d80', exposure: 1.1, windows: 1.3, nav: 1, stars: 0.2, disc: 1, moon: 0 }),
    storm: P({ top: '#161920', hor: '#4b4244', fog: '#3a383c', amb: '#2b3037', key: '#9a6a52', keyInt: 0.75, sunEl: 4, deep: '#0a242b', scatter: '#2a7a74', exposure: 1.45, windows: 1.4, nav: 1, stars: 0, disc: 1, moon: 0 }),
  },
  night: {
    label: 'Night', clock: '03:47',
    clear: P({ top: '#03060c', hor: '#16223a', fog: '#111a27', amb: '#121b29', key: '#a9bfe0', keyInt: 0.55, sunEl: 32, deep: '#03161e', scatter: '#0f4a50', exposure: 1.75, windows: 2.2, nav: 1.3, stars: 1, disc: 0, moon: 0 }),
    storm: P({ top: '#06080c', hor: '#1b2128', fog: '#171d23', amb: '#18202a', key: '#66727e', keyInt: 0.35, sunEl: 30, deep: '#051a1f', scatter: '#16484a', exposure: 2.1, windows: 2.4, nav: 1.4, stars: 0, disc: 0, moon: 0 }),
  },
  moonlit: {
    label: 'Moonlit', clock: '01:15',
    clear: P({ top: '#0a1426', hor: '#2a3a58', fog: '#1f2b3e', amb: '#22324a', key: '#c9d8f5', keyInt: 1.0, sunEl: 24, deep: '#04202a', scatter: '#195a62', exposure: 1.55, windows: 1.8, nav: 1.2, stars: 0.7, disc: 1, moon: 1 }),
    storm: P({ top: '#080b10', hor: '#20262e', fog: '#1a2026', amb: '#1d2530', key: '#7d8a99', keyInt: 0.45, sunEl: 24, deep: '#051a1f', scatter: '#16484a', exposure: 2.0, windows: 2.2, nav: 1.3, stars: 0, disc: 1, moon: 1 }),
  },
};

export const WEATHERS = {
  calm: { label: 'Calm', overcast: 0.0, cover: 0.22, waves: 0.15, wind: 0.25, rain: 0, lightning: 0, fogD: 0.00011 },
  rough: { label: 'Rough', overcast: 0.5, cover: 0.62, waves: 0.62, wind: 0.6, rain: 0.25, lightning: 0.12, fogD: 0.0002 },
  storm: { label: 'Storm', overcast: 0.92, cover: 0.95, waves: 1.0, wind: 1.0, rain: 1.0, lightning: 1.0, fogD: 0.00031 },
  hurricane: { label: 'Hurricane', overcast: 1.0, cover: 1.0, waves: 1.3, wind: 1.3, rain: 1.5, lightning: 2.2, fogD: 0.0004 },
};

const COLORS = ['top', 'hor', 'fog', 'amb', 'key', 'deep', 'scatter'];
const NUMS = ['keyInt', 'sunEl', 'exposure', 'windows', 'nav', 'stars', 'disc', 'moon', 'overcast', 'cover', 'waves', 'wind', 'rain', 'lightning', 'fogD'];

function blank() {
  const s = {};
  for (const k of COLORS) s[k] = new THREE.Color();
  for (const k of NUMS) s[k] = 0;
  return s;
}

export class Atmosphere {
  constructor(time = 'day', weather = 'storm') {
    this.cur = blank();
    this.tgt = blank();
    this.overrides = {}; // slider overrides of waves / wind / rain / lightning
    this.set(time, weather, true);
  }

  set(time, weather, snap = false) {
    this.time = TIMES[time] ? time : this.time;
    this.weather = WEATHERS[weather] ? weather : this.weather;
    this.overrides = {};
    const T = TIMES[this.time], W = WEATHERS[this.weather];
    const a = T.clear, b = T.storm, k = W.overcast;
    for (const c of COLORS) {
      const ca = new THREE.Color(a[c]), cb = new THREE.Color(b[c]);
      this.tgt[c].copy(ca).lerp(cb, k);
    }
    for (const n of ['keyInt', 'sunEl', 'exposure', 'windows', 'nav', 'stars', 'disc', 'moon']) this.tgt[n] = a[n] + (b[n] - a[n]) * k;
    for (const n of ['overcast', 'cover', 'waves', 'wind', 'rain', 'lightning', 'fogD']) this.tgt[n] = W[n];
    if (snap) this.snap();
  }

  override(key, v) { this.overrides[key] = v; }

  snap() {
    for (const c of COLORS) this.cur[c].copy(this.tgt[c]);
    for (const n of NUMS) this.cur[n] = this.tgt[n];
  }

  get settled() {
    return Math.abs(this.cur.exposure - this.tgt.exposure) < 0.01 && this.cur.top.equals(this.tgt.top);
  }

  update(dt) {
    const k = 1 - Math.exp(-dt / (this.tau || 1.6));
    for (const c of COLORS) this.cur[c].lerp(this.tgt[c], k);
    for (const n of NUMS) {
      const t = n in this.overrides ? this.overrides[n] : this.tgt[n];
      this.cur[n] += (t - this.cur[n]) * k;
    }
    return this.cur;
  }
}
