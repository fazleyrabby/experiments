// Greedy brick packer: turns a set of occupied unit cells into real LEGO
// pieces. Cells are (X, Y, Z) with X, Z in studs and Y in plates. Cells that
// share a section and colour are merged into bricks (3 plates tall) wherever
// three consecutive layers line up, and into plates everywhere else. Course
// direction alternates every brick course and lengths are varied, so the walls
// get believable running-bond seams instead of a regular grid.

const COURSE_ORIGIN = 4; // body bottom: courses start at plate 4, 7, 10 ...
const LENGTHS = [2, 3, 3, 4, 4, 4, 6, 6];

const key2 = (X, Z) => X * 1024 + Z;
const unkey2 = (k) => [Math.round(k / 1024), k - Math.round(k / 1024) * 1024];

/**
 * Cover `cells` (a Set of 2D keys) with rectangles.
 * @returns {Array<{X:number,Z:number,w:number,d:number}>}
 */
function packRects(cells, alongZ, random, { maxWidth, maxLength }) {
  const list = [...cells].map(unkey2);
  list.sort(alongZ ? (a, b) => a[0] - b[0] || a[1] - b[1] : (a, b) => a[1] - b[1] || a[0] - b[0]);
  const rects = [];
  for (const [X, Z] of list) {
    if (!cells.has(key2(X, Z))) continue;
    const lengthCap = Math.min(maxLength, LENGTHS[Math.floor(random() * LENGTHS.length)]);
    const widthCap = random() < 0.5 ? Math.min(maxWidth, 2) : maxWidth;
    let length = 1;
    if (alongZ) {
      while (length < lengthCap && cells.has(key2(X, Z + length))) length++;
    } else {
      while (length < lengthCap && cells.has(key2(X + length, Z))) length++;
    }
    let width = 1;
    outer: while (width < widthCap) {
      for (let k = 0; k < length; k++) {
        const c = alongZ ? key2(X + width, Z + k) : key2(X + k, Z + width);
        if (!cells.has(c)) break outer;
      }
      width++;
    }
    for (let i = 0; i < (alongZ ? width : length); i++) {
      for (let j = 0; j < (alongZ ? length : width); j++) cells.delete(key2(X + i, Z + j));
    }
    rects.push(alongZ ? { X, Z, w: width, d: length } : { X, Z, w: length, d: width });
  }
  return rects;
}

/**
 * @param {Map<string, {X:number,Y:number,Z:number}>} cells grouped by "section|color"
 * @param {(spec: object) => void} emit
 * @param {() => number} random seeded RNG
 * @param {{maxWidth?: number, maxLength?: number}} [limits]
 */
export function packGroups(groups, emit, random, limits = {}) {
  const maxWidth = limits.maxWidth ?? 2;
  const maxLength = limits.maxLength ?? 6;

  for (const [groupKey, cells] of groups) {
    const [section, color] = groupKey.split('|');
    // Bucket by brick course.
    const courses = new Map();
    for (const { X, Y, Z } of cells) {
      const course = Math.floor((Y - COURSE_ORIGIN) / 3);
      let layers = courses.get(course);
      if (!layers) courses.set(course, (layers = [new Set(), new Set(), new Set()]));
      layers[Y - COURSE_ORIGIN - course * 3].add(key2(X, Z));
    }

    for (const [course, layers] of courses) {
      const y0 = COURSE_ORIGIN + course * 3;
      const alongZ = (course & 1) === 0;
      const triple = new Set();
      for (const k of layers[0]) if (layers[1].has(k) && layers[2].has(k)) triple.add(k);
      for (const k of triple) for (const layer of layers) layer.delete(k);

      for (const r of packRects(triple, alongZ, random, { maxWidth, maxLength })) {
        emit({ type: 'brick', x: r.X, y: y0, z: r.Z, w: r.w, d: r.d, h: 3, color, section });
      }
      for (let l = 0; l < 3; l++) {
        for (const r of packRects(layers[l], alongZ, random, { maxWidth, maxLength })) {
          emit({ type: 'plate', x: r.X, y: y0 + l, z: r.Z, w: r.w, d: r.d, h: 1, color, section });
        }
      }
    }
  }
}
