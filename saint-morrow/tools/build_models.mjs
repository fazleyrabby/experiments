// Downloads CC0 scanned models from Poly Haven and writes compressed GLBs.
// Street props:   node saint-morrow/tools/build_models.mjs <download-cache-dir>
// Shop interiors: node saint-morrow/tools/build_models.mjs <download-cache-dir> interiors
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HEADERS = { 'User-Agent': 'saint-morrow-asset-tool/1.0' };
const STREET_MODELS = {
  street_lamp_01: 0.42,
  fire_hydrant: 0.2,
  metal_trash_can: 0.6,
  trashbag: 1,
  wooden_crate_01: 1,
  barrel_03: 1,
  cardboard_box_01: 0.4,
  modular_street_seating: 0.6,
  utility_box_01: 1,
  utility_box_02: 1,
  large_castle_door: 1,
  rollershutter_door: 1,
  rollershutter_window_01: 1,
  gothic_statue: 0.7,
  covered_car: 1,
  old_tyre: 1,
  can_rusted: 1,
  industrial_wall_lamp: 1,
  street_rat: 0.25,
};
const INTERIOR_IDS = [
  'wooden_display_shelves_01', 'wooden_bookshelf_worn', 'painted_wooden_shelves', 'drawer_cabinet',
  'vintage_wooden_drawer_01', 'GothicCabinet_01', 'CashRegister_01', 'lantern_chandelier_01', 'hanging_industrial_lamp',
  'WoodenTable_02', 'wooden_stool_01', 'bar_chair_round_01',
  'wine_bottles_01', 'wine_barrel_01', 'brass_goblets',
  'vintage_grandfather_clock_01', 'mantel_clock_01', 'wall_clock', 'alarm_clock_01',
  'fishermans_hat', 'rubber_boots', 'vintage_suitcase',
  'croissant', 'hamburger_buns', 'carrot_cake', 'strawberry_chocolate_cake', 'wicker_basket_01',
  'metal_toolbox', 'pipe_wrench', 'cross_pein_hammer', 'handsaw_wood', 'wooden_bucket_01', 'small_oil_can_01',
  'watering_can_metal_01', 'wooden_ladder', 'bench_vice_01',
  'Camera_01', 'hanging_picture_frame_01', 'hanging_picture_frame_02', 'hanging_picture_frame_03',
  'standing_picture_frame_01', 'ornate_mirror_01',
  'book_encyclopedia_set_01',
];
const INTERIOR_TRIANGLE_TARGET = 6000;
// Goods repeated dozens of times per shop get far tighter budgets (whole file, all variants).
const REPEATED_GOODS_TARGETS = {
  wine_bottles_01: 1600,
  book_encyclopedia_set_01: 2400,
  hamburger_buns: 1200,
  croissant: 500,
  wall_clock: 1200,
  alarm_clock_01: 1400,
  mantel_clock_01: 2000,
  fishermans_hat: 1200,
  small_oil_can_01: 1500,
  bar_chair_round_01: 3000,
  brass_goblets: 1500,
  hanging_picture_frame_03: 1200,
  hanging_picture_frame_02: 1000,
  hanging_picture_frame_01: 800,
};

const [cache, mode] = process.argv.slice(2);
if (!cache) throw new Error('Pass a download cache directory.');
const interiors = mode === 'interiors';
const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const cli = path.join(toolsDir, 'node_modules', '.bin', 'gltf-transform');
const outDir = path.join(toolsDir, '..', 'assets', interiors ? 'interiors' : 'models');
await mkdir(outDir, { recursive: true });

async function getJson(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json();
}

async function download(entry, target) {
  const url = new URL(entry.url);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('polyhaven.org')) throw new Error(`Unexpected host: ${url.hostname}`);
  if (existsSync(target)) {
    const cached = await readFile(target);
    if (createHash('md5').update(cached).digest('hex') === entry.md5) return;
  }
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('md5').update(bytes).digest('hex') !== entry.md5) throw new Error(`Checksum mismatch: ${url}`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

async function simplifyRatio(id) {
  if (!interiors) return STREET_MODELS[id];
  const info = await getJson(`https://api.polyhaven.com/info/${encodeURIComponent(id)}`);
  const target = REPEATED_GOODS_TARGETS[id] ?? INTERIOR_TRIANGLE_TARGET;
  return Math.min(1, target / Math.max(info.polycount || 1, 1));
}

let total = 0;
const credits = [];
for (const id of interiors ? INTERIOR_IDS : Object.keys(STREET_MODELS)) {
  const ratio = await simplifyRatio(id);
  const files = await getJson(`https://api.polyhaven.com/files/${encodeURIComponent(id)}`);
  const gltf = files.gltf?.['1k']?.gltf;
  if (!gltf) throw new Error(`${id} has no 1k glTF`);

  const modelDir = path.resolve(cache, id);
  await mkdir(modelDir, { recursive: true });
  const main = path.join(modelDir, `${id}.gltf`);
  await download(gltf, main);
  for (const [relative, entry] of Object.entries(gltf.include ?? {})) {
    const target = path.resolve(modelDir, relative);
    if (!target.startsWith(`${modelDir}${path.sep}`)) throw new Error(`Unsafe path in ${id}: ${relative}`);
    await download(entry, target);
  }

  const output = path.join(outDir, `${id}.glb`);
  const args = [
    'optimize', main, output,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', interiors ? '512' : '1024',
    '--instance', 'false',
    '--palette', 'false',
    '--join', 'false',
    '--flatten', 'false',
  ];
  if (ratio < 1) args.push('--simplify', 'true', '--simplify-ratio', ratio.toFixed(3), '--simplify-error', interiors ? (REPEATED_GOODS_TARGETS[id] ? '0.04' : '0.01') : '0.002');
  else args.push('--simplify', 'false');
  await run(cli, args, { cwd: modelDir, maxBuffer: 16 * 1024 * 1024 });

  const { size } = await stat(output);
  total += size;
  credits.push(`- ${id}: https://polyhaven.com/a/${id} (CC0)`);
  console.log(`${id}: ${(size / 1048576).toFixed(2)} MB`);
}

await writeFile(path.join(outDir, 'CREDITS.md'), `# Model credits\n\nAll models from Poly Haven, CC0.\n\n${credits.join('\n')}\n`);
console.log(`total ${(total / 1048576).toFixed(1)} MB`);
