import { generateCarLayout, generateSpecs, isGridPiece, occupiedCells } from '../src/car/carLayout.js';
import { SECTION_ORDER } from '../src/config.js';

const specs = generateSpecs();
const layout = generateCarLayout();
const sectionName = (s) => (s.startsWith('door') ? 'door' : s);

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`FAIL  ${message}`);
};

// 1. Every section is known.
for (const section of Object.keys(layout.sections)) {
  if (!SECTION_ORDER.includes(sectionName(section))) fail(`section "${section}" is missing from SECTION_ORDER`);
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

// 3. Left/right symmetry of the grid pieces.
const left = new Map();
const right = new Map();
for (const spec of specs) {
  if (!isGridPiece(spec)) continue;
  for (const [X, Y, Z] of occupiedCells(spec)) {
    const colour = spec.color;
    if (X >= 0) left.set(`${X},${Y},${Z}`, colour);
    else right.set(`${-X - 1},${Y},${Z}`, colour);
  }
}
let asymmetric = 0;
for (const [key, colour] of left) {
  if (right.get(key) === undefined) asymmetric++;
  else if (right.get(key) !== colour) asymmetric++;
}
for (const key of right.keys()) if (!left.has(key)) asymmetric++;
if (asymmetric > 0) console.warn(`WARN  ${asymmetric} grid cells differ between the left and right halves`);

// 4. Report.
const counts = {};
for (const brick of layout.bricks) counts[brick.section] = (counts[brick.section] ?? 0) + 1;
console.log(`\n${layout.bricks.length} bricks in ${Object.keys(counts).length} sections`);
for (const [section, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${section.padEnd(14)} ${String(count).padStart(5)}`);
}
console.log(`size (studs x plates x studs): ${layout.size.map((v) => v.toFixed(1)).join(' x ')}`);

if (failed) {
  console.error('\nValidation failed.');
  process.exit(1);
}
console.log('\nValidation passed.');
