// Hero ship presets for the ship selector.

const MSC_PALETTE = [
  ['#d9a520', 10], ['#c8901c', 6], ['#9a2a22', 6], ['#6e1f1a', 4], ['#7d8285', 5], ['#b9bcbb', 3],
  ['#3c7f6c', 2], ['#2f6fa3', 3], ['#c96a1e', 2], ['#d8d8d2', 2], ['#5a2c1f', 2],
];

export const HERO_SHIPS = {
  meridian: {
    label: 'Meridian',
    tag: 'MV Meridian Star',
    opts: { L: 230, seed: 3, name: 'MERIDIAN STAR', brand: 'NORDVIK', hull: '#15222c', funnelBand: '#b3271d', stackMax: 7 },
  },
  msc: {
    label: 'MSC',
    tag: 'MSC Tempesta',
    note: 'Livery inspired by MSC. Fan render, not affiliated.',
    opts: {
      L: 300, B: 45, seed: 7, layout: 'ulcv', floors: 9, stackMax: 9,
      name: 'MSC TEMPESTA', port: 'PANAMA',
      brand: 'M S C', brandX: -40, brandH: 7.8, brandSpacing: 1.4, brandColor: '#eef0ee',
      bowStripes: true, bowMark: 'msc', sheerLine: '#5e1a17',
      hull: '#0f1011', red: '#6b1d1c', boot: '#3a1414',
      lashColor: '#8a2a22', bulwark: '#c8452a', bridgeAccent: '#e2581e', funnelBase: '#e2d49a',
      palette: MSC_PALETTE,
    },
  },
  cruise: {
    label: 'Cruise',
    tag: 'MS Aurelia',
    kind: 'cruise',
    opts: { L: 320, B: 40, D: 16, T: 8.6, seed: 9, name: 'AURELIA', brand: 'SEAVANTE' },
  },
  trireme: {
    label: 'Trireme',
    tag: 'Trireme Nikē',
    kind: 'trireme',
    opts: {},
  },
  firstrate: {
    label: 'First-rate',
    tag: 'First-rate Valiant',
    kind: 'firstrate',
    opts: {},
  },
  ghost: {
    label: 'Ghost',
    tag: 'The Hollow Tide',
    kind: 'ghost',
    note: 'Seen only on stormy nights, they say.',
    opts: { ghost: true },
  },
};
