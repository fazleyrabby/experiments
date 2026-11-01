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

/**
 * Colour names the layout can use. Each maps to one shared material
 * (see brickMaterials.js). LEGO colour names in the comments.
 */
export const PALETTE_NAMES = [
  'hull', // light bluish grey: the bulk of the plating
  'hullLight', // white / very light grey: weathered panels
  'hullDark', // a slightly darker grey for panel variation
  'dark', // dark bluish grey: frame, trenches, greebles
  'black',
  'red', // dark red markings
  'tan', // a few warm accents
  'metal', // pearl dark grey: cannons, dish feed, pipes
  'glass', // trans-black smoke canopy
  'engine', // glowing blue sublight grille
  'glowRed',
  'glowWhite',
];

/** Build order used to stagger the assembly, section by section. */
export const SECTION_ORDER = [
  'frame',
  'lowerHull',
  'lowerPlating',
  'rim',
  'engines',
  'mandibles',
  'upperHull',
  'cockpit',
  'upperPlating',
  'turrets',
  'dish',
  'details',
];

export const SECTION_LABELS = {
  frame: 'Main deck and keel',
  lowerHull: 'Lower hull frame',
  lowerPlating: 'Ventral hull plating',
  rim: 'Outer rim and docking rings',
  engines: 'Sublight engine array',
  mandibles: 'Forward mandibles',
  upperHull: 'Upper hull frame',
  cockpit: 'Cockpit and access tube',
  upperPlating: 'Dorsal hull plating',
  turrets: 'Quad laser turrets',
  dish: 'Sensor rectenna',
  details: 'Greebles and vents',
};

/** Animation timings, in seconds. */
export const TIMING = {
  /** How long the loose bricks drift in space before the first one starts to move. */
  hold: 1.6,
  assemble: { spread: 9.5, duration: 1.6, durationJitter: 0.5, lift: 2.4 },
  reassemble: { spread: 6, duration: 1.5, durationJitter: 0.45, lift: 2.2 },
  explode: { spread: 2.2, duration: 1.8, durationJitter: 0.5, lift: 1.4 },
  showcaseSpeed: 0.16, // rad/s once assembled (a slow 360° every ~40 s)
  buildDriftSpeed: 0.035, // rad/s while pieces are flying in
  resumeDelay: 1.6, // idle time after user interaction before rotation resumes
};

export const LAYOUT_SEED = 0x7e1300;
