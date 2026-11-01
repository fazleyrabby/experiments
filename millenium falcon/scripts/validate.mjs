import { generateFalconLayout, generateSpecs, isGridPiece, occupiedCells } from '../src/falcon/falconLayout.js';
import { PALETTE_NAMES, SECTION_ORDER } from '../src/config.js';

const specs = generateSpecs();
const layout = generateFalconLayout();

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`FAIL  ${message}`);
};

// 1. Every section and colour is known.
for (const section of Object.keys(layout.sections)) {
  if (!SECTION_ORDER.includes(section)) fail(`section "${section}" is missing from SECTION_ORDER`);
}
for (const brick of layout.bricks) {
  if (!PALETTE_NAMES.includes(brick.color)) fail(`brick ${brick.id} uses unknown colour "${brick.color}"`);
  if (![...brick.position, ...brick.rotation].every(Number.isFinite)) fail(`brick ${brick.id} has a non-finite transform`);
}

// 2. No two grid-aligned pieces occupy the same cell.
const owner = new Map();
let overlaps = 0;
for (const [index, spec] of specs.entries()) {
  if (!isGridPiece(spec)) continue;
  for (const [X, Y, Z] of occupiedCells(spec)) {
    const key = `${X},${Y},${Z}`;
    const other = owner.get(key);
    if (other !== undefined) {
      if (overlaps < 12) fail(`overlap at (${X}, ${Y}, ${Z}): ${specs[other].section}/${specs[other].type} vs ${spec.section}/${spec.type}`);
      overlaps++;
    } else {
      owner.set(key, index);
    }
  }
}
if (overlaps) fail(`${overlaps} overlapping cells in total`);

// 3. Report.
const counts = {};
for (const brick of layout.bricks) counts[brick.section] = (counts[brick.section] ?? 0) + 1;
const geometries = new Set(layout.bricks.map((b) => JSON.stringify(b.geo)));
const groups = new Set(layout.bricks.map((b) => `${JSON.stringify(b.geo)}|${b.color}`));
console.log(`\n${layout.bricks.length} bricks in ${Object.keys(counts).length} sections`);
for (const section of SECTION_ORDER) {
  console.log(`  ${section.padEnd(14)} ${String(counts[section] ?? 0).padStart(5)}`);
}
console.log(`size (x, y, z world units): ${layout.size.map((v) => v.toFixed(1)).join(' x ')}`);
console.log(`radius ${layout.radius.toFixed(1)}, ${geometries.size} geometries, ${groups.size} draw groups`);

if (failed) {
  console.error('\nValidation failed.');
  process.exit(1);
}
console.log('\nValidation passed.');
