// Shared constants. This module is intentionally free of Three.js imports so the
// pure-data layout code can be loaded (and validated) outside the browser.

/** One stud pitch = 1 world unit. Every brick footprint is a multiple of this. */
export const STUD = 1;
/** A plate is one third of a standard brick: 0.4 units (real LEGO ratio 3.2mm : 8mm). */
export const PLATE_HEIGHT = 0.4;
export const PLATES_PER_BRICK = 3;

export const STUD_RADIUS = 0.3;
export const STUD_HEIGHT = 0.19;
/** Horizontal clearance between neighbouring bricks so every seam stays readable. */
export const BRICK_GAP = 0.035;
export const EDGE_RADIUS = 0.045;

export const PALETTE = {
  red: 0xa80f1c,
  lightGray: 0x9aa1ab,
  metal: 0x7b828c,
  charcoal: 0x2a2d33,
  black: 0x111215,
  orange: 0xf26a1b,
  yellow: 0xf2bd1d,
  glass: 0x37d6ee,
  glow: 0x2ea8ff,
};

/** Build order used to stagger the assembly, section by section. */
export const SECTION_ORDER = [
  'lowerFuselage',
  'structure',
  'fuselage',
  'cockpitSupport',
  'wingLeft',
  'wingRight',
  'engineMounts',
  'engines',
  'canopy',
  'stabilizers',
  'details',
];

export const SECTION_LABELS = {
  structure: 'Internal structural base',
  lowerFuselage: 'Lower fuselage',
  fuselage: 'Main fuselage body',
  cockpitSupport: 'Cockpit support',
  canopy: 'Cockpit canopy',
  wingLeft: 'Left wing',
  wingRight: 'Right wing',
  engineMounts: 'Rear engine mounts',
  engines: 'Engine assemblies',
  stabilizers: 'Vertical stabilizers',
  details: 'Surface plates and details',
};

/** Animation timings, in seconds. */
export const TIMING = {
  assemble: { spread: 4.7, duration: 1.55, durationJitter: 0.45, lift: 1.5 },
  reassemble: { spread: 3.4, duration: 1.45, durationJitter: 0.4, lift: 1.5 },
  explode: { spread: 1.5, duration: 1.5, durationJitter: 0.5, lift: 0.9 },
  showcaseSpeed: 0.2, // rad/s once assembled
  buildDriftSpeed: 0.035, // rad/s while pieces are flying in
  resumeDelay: 1.6, // idle time after user interaction before rotation resumes
};

export const LAYOUT_SEED = 0x1e60;
