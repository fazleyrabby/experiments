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
 * (see brickMaterials.js). `body` and `trim` change with the selected finish.
 */
export const PALETTE_NAMES = [
  'body',
  'trim',
  'chrome',
  'dark',
  'gold',
  'rubber',
  'glass',
  'leather',
  'plastic',
  'caliper',
  'glowRed',
  'glowAmber',
  'glowWhite',
];

/** Selectable paint finishes. Resolved to materials in brickMaterials.js. */
export const FINISHES = {
  red: { label: 'Bright red', swatch: '#c91a09' },
  yellow: { label: 'Bright yellow', swatch: '#f2cd37' },
  white: { label: 'White', swatch: '#f4f4f0' },
  blue: { label: 'Bright blue', swatch: '#0055bf' },
  orange: { label: 'Bright orange', swatch: '#fe8a18' },
};
export const DEFAULT_FINISH = 'red';

/** Optional features. */
export const OPTIONS = {
  rearWing: false,
};

/** Build order used to stagger the assembly, section by section. */
export const SECTION_ORDER = [
  'chassis',
  'wheels',
  'drivetrain',
  'interior',
  'lowerBody',
  'frontBumper',
  'rearBumper',
  'haunches',
  'engineCover',
  'hood',
  'door',
  'glasshouse',
  'roof',
  'wing',
  'lights',
  'details',
];

export const SECTION_LABELS = {
  chassis: 'Chassis and suspension',
  wheels: 'Wheels and brakes',
  drivetrain: 'V12 drivetrain',
  interior: 'Cockpit interior',
  lowerBody: 'Sills and lower body',
  frontBumper: 'Front fascia',
  rearBumper: 'Rear fascia and exhaust',
  haunches: 'Rear haunches',
  engineCover: 'Louvered engine cover',
  hood: 'Hood and front fenders',
  doorLeft: 'Scissor door',
  doorRight: 'Scissor door',
  glasshouse: 'Glasshouse and pillars',
  roof: 'Roof and periscope',
  wing: 'Rear wing',
  lights: 'Lamps and lenses',
  details: 'Badges and details',
};

/** Animation timings, in seconds. */
export const TIMING = {
  assemble: { spread: 8.5, duration: 1.5, durationJitter: 0.45, lift: 2.2 },
  reassemble: { spread: 5.5, duration: 1.45, durationJitter: 0.4, lift: 2.2 },
  explode: { spread: 1.8, duration: 1.7, durationJitter: 0.5, lift: 1.2 },
  showcaseSpeed: 0.22, // rad/s once assembled
  buildDriftSpeed: 0.04, // rad/s while pieces are flying in
  resumeDelay: 1.6, // idle time after user interaction before rotation resumes
};

export const LAYOUT_SEED = 0xc0a7ac;
