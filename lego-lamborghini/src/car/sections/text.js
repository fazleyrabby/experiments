// Tiny 3x5 pixel font, used for the lettering on the tail and the dash.
// Rows run top to bottom, '1' = a lit pixel.

const GLYPHS = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  ' ': ['000', '000', '000', '000', '000'],
};

/** Pixel width of a string, in pixels. */
export function textWidth(text) {
  return text.length * 4 - 1;
}

/**
 * Raised lettering on a vertical face that looks toward -z (the tail). Each
 * horizontal run of lit pixels becomes one thin tile.
 *
 * @param {object} b          layout builder
 * @param {string} text
 * @param {number} cx         centre x of the text
 * @param {number} y          bottom of the text, in plates
 * @param {number} z          z of the face the text stands on
 * @param {number} pixel      pixel size in studs
 * @param {string} color
 */
export function tailText(b, text, cx, y, z, pixel, color) {
  const width = textWidth(text) * pixel;
  const rowPlates = pixel / 0.4;
  const depth = 0.22;
  for (let row = 0; row < 5; row++) {
    let col = 0;
    const lit = [];
    for (const [index, char] of [...text].entries()) {
      const glyph = GLYPHS[char] ?? GLYPHS[' '];
      for (let k = 0; k < 3; k++) lit[index * 4 + k] = glyph[row][k] === '1';
    }
    while (col < lit.length) {
      if (!lit[col]) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < lit.length && lit[col + run]) run++;
      // Seen from behind the car, +x is on the reader's left.
      const x = cx + width / 2 - (col + run) * pixel;
      b.panel(x, y + (4 - row) * rowPlates, z - depth, run * pixel, rowPlates, depth, color);
      col += run;
    }
  }
}
