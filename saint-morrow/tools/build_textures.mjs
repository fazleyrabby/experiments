// Downloads CC0 PBR sets from Poly Haven and writes web-ready WebP maps.
// Usage: node saint-morrow/tools/build_textures.mjs <download-cache-dir>
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SETS = {
  cobble: 'cobblestone_floor_04',
  pavement: 'concrete_floor_worn_001',
  brick: 'castle_brick_07',
  stone: 'stone_brick_wall_001',
  plaster: 'plastered_stone_wall',
  slate: 'castle_wall_slates',
  iron: 'rusty_metal_02',
};
const INTERIOR_SETS = {
  floorWood: 'weathered_brown_planks',
  floorTile: 'floor_tiles_06',
  wallPlaster: 'white_plaster_02',
};
const MAPS = [
  { api: 'Diffuse', suffix: 'color', size: 2048, quality: 84 },
  { api: 'nor_gl', suffix: 'normal', size: 2048, quality: 90 },
  { api: 'arm', suffix: 'orm', size: 1024, quality: 82 },
];
const HEADERS = { 'User-Agent': 'saint-morrow-asset-tool/1.0' };

// Pass "interiors" as a second argument to build the smaller shop-room sets.
const [cache, mode] = process.argv.slice(2);
if (!cache) throw new Error('Pass a download cache directory.');
const interiors = mode === 'interiors';
const activeSets = interiors ? INTERIOR_SETS : SETS;
const maxSize = interiors ? 1024 : 2048;
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', ...(interiors ? ['interiors', 'tex'] : ['tex']));
await mkdir(outDir, { recursive: true });

async function fetchChecked(entry, target) {
  const url = new URL(entry.url);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('polyhaven.org')) throw new Error(`Unexpected host: ${url.hostname}`);
  if (existsSync(target)) {
    const cached = await readFile(target);
    if (createHash('md5').update(cached).digest('hex') === entry.md5) return cached;
  }
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('md5').update(bytes).digest('hex') !== entry.md5) throw new Error(`Checksum mismatch: ${url}`);
  await writeFile(target, bytes);
  return bytes;
}

const credits = [];
let totalBytes = 0;
for (const [name, id] of Object.entries(activeSets)) {
  const response = await fetch(`https://api.polyhaven.com/files/${encodeURIComponent(id)}`, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} for ${id}`);
  const files = await response.json();
  const setDir = path.join(cache, id);
  await mkdir(setDir, { recursive: true });

  for (const map of MAPS) {
    const entry = files[map.api]?.['2k']?.jpg;
    if (!entry) throw new Error(`${id} has no 2k ${map.api} JPG`);
    const source = await fetchChecked(entry, path.join(setDir, `${map.suffix}.jpg`));
    const output = path.join(outDir, `${name}_${map.suffix}.webp`);
    const size = Math.min(map.size, maxSize);
    const info = await sharp(source).resize(size, size).webp({ quality: map.quality, effort: 5 }).toFile(output);
    totalBytes += info.size;
  }
  credits.push(`- ${name}: https://polyhaven.com/a/${id} (CC0)`);
  console.log(`built ${name} from ${id}`);
}

await writeFile(path.join(outDir, 'CREDITS.md'), `# Texture credits\n\nAll textures from Poly Haven, CC0.\n\n${credits.join('\n')}\n`);
console.log(`total ${(totalBytes / 1048576).toFixed(1)} MB`);
