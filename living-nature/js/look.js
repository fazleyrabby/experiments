// Time-of-day + weather -> one "look" object describing the whole scene's light.
import { clamp, lerp, smooth, wrap, hex, mixc, lum } from './util.js';

const K = (h, top, mid, hor, tint, haze, hazeA, night) => ({
  h, top: hex(top), mid: hex(mid), hor: hex(hor), tint: hex(tint), haze: hex(haze), hazeA, night,
});

const KEYS = [
  K(0,    '#03061a', '#08123a', '#16295c', '#5a70b4', '#1b2c5a', 0.12, 1),
  K(4.5,  '#060d2a', '#14214f', '#2c3d72', '#5e72b2', '#26386a', 0.15, 0.95),
  K(5.4,  '#1c2560', '#50508e', '#e08a7e', '#c0a0a8', '#cc8ea4', 0.34, 0.5),
  K(6.2,  '#3d62a4', '#c9a2a2', '#ffb878', '#ffd2a2', '#f3c6a4', 0.36, 0.1),
  K(7.5,  '#4b84c6', '#9ec6e2', '#ffe2b0', '#ffeccc', '#dbe3d0', 0.26, 0),
  K(10,   '#3c86d6', '#78b8ec', '#cde8f2', '#fffaf0', '#cfe2ee', 0.14, 0),
  K(13,   '#2f7ad4', '#6ab0ee', '#bfe0f4', '#ffffff', '#c4def0', 0.1, 0),
  K(16.5, '#3f82d0', '#82b8e6', '#d9e8e6', '#fff4dc', '#d4e0e0', 0.16, 0),
  K(17.8, '#3f6fb8', '#d9a888', '#ffbe6a', '#ffcf90', '#f2c79c', 0.28, 0),
  K(18.7, '#2f4088', '#c46a8a', '#ff8650', '#f2aa7c', '#e89a82', 0.34, 0.08),
  K(19.5, '#1a2058', '#6c4a88', '#d4605e', '#a58cb8', '#8a6a98', 0.3, 0.4),
  K(20.5, '#0a1034', '#212a66', '#4a4682', '#6c7ab6', '#353c78', 0.2, 0.82),
  K(22,   '#050924', '#0c1a46', '#1c3262', '#5a6eae', '#1d2e5e', 0.14, 1),
  K(24,   '#03061a', '#08123a', '#16295c', '#5a70b4', '#1b2c5a', 0.12, 1),
];

const WEATHER = {
  clear: { cover: 0.14, rain: 0, fog: 0 },
  clouds: { cover: 0.78, rain: 0, fog: 0 },
  rain: { cover: 1, rain: 1, fog: 0.15 },
  fog: { cover: 0.55, rain: 0, fog: 1 },
};
export const weatherTarget = (name) => WEATHER[name] || WEATHER.clear;

const grey = (c, k = 1) => {
  const l = lum(c) * k;
  return [l, l, l];
};

export function fmtHour(h) {
  const m = Math.floor(wrap(h, 24) * 60);
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

export function computeLook(hour, wx) {
  hour = wrap(hour, 24);
  let i = 0;
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = clamp((hour - a.h) / (b.h - a.h));
  const s = t * t * (3 - 2 * t);
  const m = (k) => mixc(a[k], b[k], s);

  const fog = wx.fog || 0;
  const g = clamp(wx.cover * 0.52 + wx.rain * 0.3 + fog * 0.18);
  const dark = wx.rain * 0.3 + wx.cover * 0.05;
  const skyMix = (c, k) => mixc(c, grey(c, k), g).map((v) => v * (1 - dark));
  const night = lerp(a.night, b.night, s);
  const top = skyMix(m('top'), 1.0);
  const mid = skyMix(m('mid'), 1.0);
  const hor = skyMix(m('hor'), 0.96);
  let tint = mixc(m('tint'), grey(m('tint'), 1.0), clamp(g * 0.95)).map((v) => v * (1 - dark * 0.85));
  const haze = mixc(m('haze'), grey(m('haze'), 1), g * 0.5);
  const hazeA = lerp(a.hazeA, b.hazeA, s) + wx.rain * 0.16 + wx.cover * 0.04 + fog * 0.2;

  const sp = (hour - 6) / 12.8; // sun progress, 0 sunrise .. 1 sunset
  const mp = wrap(hour - 19.2, 24) / 10.6; // moon progress
  const sunX = lerp(74, 404, sp);
  const sunY = 116 - 98 * Math.sin(Math.PI * sp);
  const moonX = lerp(100, 380, mp);
  const moonY = 120 - 92 * Math.sin(Math.PI * clamp(mp, -0.1, 1.1));
  const sunVis = sp > -0.1 && sp < 1.1 ? 1 : 0;
  const moonVis = mp >= 0 && mp <= 1.04 ? 1 : 0;
  const clearSky = 1 - wx.cover * 0.82;

  const lightsBase = hour >= 12 ? smooth(17.4, 19.2, hour) : 1 - smooth(5.6, 6.9, hour);
  const lights = clamp(Math.max(lightsBase, wx.cover * 0.25 + wx.rain * 0.45));
  const mornMist = smooth(4, 5.6, hour) * (1 - smooth(7.6, 10, hour));
  const mist = clamp(mornMist * 0.95 + wx.rain * 0.35 + wx.cover * 0.06 + fog * 0.95);

  return {
    hour, top, mid, hor, tint, haze, hazeA, night: night, day: 1 - night,
    sunX, sunY, moonX, moonY, sunVis, moonVis, sp, mp, clearSky,
    sunLight: smooth(-0.02, 0.1, sp) * (1 - smooth(0.9, 1.02, sp)) * clearSky,
    lights, mist, cover: wx.cover, rain: wx.rain, fog,
    // warm "golden" amount for rim colouring (sunrise/sunset)
    gold: clamp(1 - Math.abs(night - 0.1) * 2) * (Math.abs(hour - 12) > 3 ? 1 : 0),
  };
}

export function phaseName(h) {
  h = wrap(h, 24);
  if (h < 4.5) return 'Night';
  if (h < 5.8) return 'Dawn';
  if (h < 8) return 'Sunrise';
  if (h < 11) return 'Morning';
  if (h < 14) return 'Midday';
  if (h < 17) return 'Afternoon';
  if (h < 19.3) return 'Sunset';
  if (h < 20.8) return 'Dusk';
  return 'Night';
}
