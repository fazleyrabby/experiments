// The five-colour palette and mixing helpers. Colours are [r, g, b] arrays.

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export const P = {
  night: hex('#061C27'),
  teal: hex('#0D4548'),
  orange: hex('#D85C25'),
  amber: hex('#FFAD49'),
  parch: hex('#E8D5B2'),
};

// Derived tints, all mixes of the five.
P.ink = mix(P.night, [0, 0, 0], 0.45);
P.deep = mix(P.night, P.teal, 0.45);
P.seaLight = mix(P.teal, P.parch, 0.18);
P.rust = mix(P.orange, P.night, 0.45);
P.ember = mix(P.orange, P.amber, 0.5);
P.paleGold = mix(P.amber, P.parch, 0.55);
P.cold = mix(P.teal, P.parch, 0.32);
P.coldDeep = mix(P.night, P.teal, 0.7);

export function mix(a, b, k) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function rgba(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export function scale(c, k) {
  return [c[0] * k, c[1] * k, c[2] * k];
}
