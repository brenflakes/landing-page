export const TAU = Math.PI * 2;
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
// 0 -> 1 -> 0 envelope with fade-in over `a` and fade-out over `b` (fractions of the whole).
export const env = (k, a = 0.15, b = 0.25) => clamp(Math.min(k / a, (1 - k) / b));

const hexToRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
export const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${clamp(a)})`; };
