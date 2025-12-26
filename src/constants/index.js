// Fonts for title animation
export const FONTS = [
  "'JetBrains Mono', monospace",
  "'Space Mono', monospace", 
  "'Source Code Pro', monospace",
];

export const TITLE_TEXT = 'bren.id.au';
export const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Star colors - realistic distribution
export const STAR_COLORS = [
  { color: '#ffffff', weight: 50 },  // White
  { color: '#cad8ff', weight: 25 },  // Blue-white
  { color: '#aabfff', weight: 10 },  // Light blue
  { color: '#ffe4c4', weight: 10 },  // Warm yellow
  { color: '#ffccaa', weight: 4 },   // Orange
  { color: '#ffaaaa', weight: 1 },   // Red giant
];

export const COLORS = {
  bg: '#0a0a0f',
  accent: '#58a6ff',
  outline: '#58a6ff',
};

export const PACKET_COLORS = [
  { color: '#58a6ff', weight: 40 },  // Electric Blue
  { color: '#22d3ee', weight: 25 },  // Cyan
  { color: '#a78bfa', weight: 20 },  // Purple
  { color: '#34d399', weight: 10 },  // Mint
  { color: '#fbbf24', weight: 5 },   // Amber
];

export const TRAIL_TYPES = [
  { type: 'comet', weight: 40 },     // Fading opacity tail
  { type: 'dots', weight: 35 },      // Trailing smaller circles
  { type: 'blur', weight: 25 },      // Motion blur stretch
];

export const CITIES = {
  perth:     { x: 62,  y: 412, label: 'Perth' },
  darwin:    { x: 295, y: 29,  label: 'Darwin' },
  adelaide:  { x: 420, y: 451, label: 'Adelaide' },
  brisbane:  { x: 666, y: 280, label: 'Brisbane' },
  sydney:    { x: 626, y: 441, label: 'Sydney' },
  melbourne: { x: 515, y: 520, label: 'Melbourne', isHub: true },
  hobart:    { x: 544, y: 616, label: 'Hobart' },
};

// Network connections - Melbourne is hub
export const CONNECTIONS = [
  // Melbourne hub spokes
  ['melbourne', 'sydney'],
  ['melbourne', 'brisbane'],
  ['melbourne', 'adelaide'],
  ['melbourne', 'perth'],
  ['melbourne', 'darwin'],
  ['melbourne', 'hobart'],
  // Cross-connections
  ['sydney', 'brisbane'],
  ['sydney', 'adelaide'],
  ['adelaide', 'perth'],
  ['perth', 'darwin'],
  ['darwin', 'brisbane'],
];

// Utility functions
export const getRandomStarColor = () => {
  const totalWeight = STAR_COLORS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const star of STAR_COLORS) {
    random -= star.weight;
    if (random <= 0) return star.color;
  }
  return STAR_COLORS[0].color;
};

export const getRandomPacketColor = () => {
  const totalWeight = PACKET_COLORS.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const packet of PACKET_COLORS) {
    random -= packet.weight;
    if (random <= 0) return packet.color;
  }
  return PACKET_COLORS[0].color;
};

export const getRandomTrailType = () => {
  const totalWeight = TRAIL_TYPES.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  for (const trail of TRAIL_TYPES) {
    random -= trail.weight;
    if (random <= 0) return trail.type;
  }
  return TRAIL_TYPES[0].type;
};

// Interpolate between two hex colors
export const lerpColor = (colorA, colorB, t) => {
  const parseHex = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
};

// Easing function
export const cubicEaseOut = (t) => 1 - Math.pow(1 - t, 3);
