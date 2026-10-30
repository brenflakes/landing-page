// The planets: Bren's interests orbiting bren.id.au.
// orbit: fraction of the system radius. phase: starting angle (radians).
// period: seconds per revolution (outer planets slower, roughly Keplerian).
export const PLANETS = [
  { id: 'ai',       label: 'AI',          orbit: 0.30, phase: 0.6, period: 70,  size: 5.5, color: '#a78bfa' },
  { id: 'payments', label: 'Payments',    orbit: 0.45, phase: 2.4, period: 110, size: 7,   color: '#58a6ff' },
  { id: 'homelab',  label: 'Homelab',     orbit: 0.60, phase: 4.1, period: 160, size: 9,   color: '#34d399' },
  { id: 'printing', label: '3D Printing', orbit: 0.60, phase: 0.9, period: 160, size: 6,   color: '#22d3ee' },
  { id: 'f1',       label: 'F1',          orbit: 0.76, phase: 5.3, period: 220, size: 8.5, color: '#1e41ff', ring: '#e10600' },
  { id: 'homebrew', label: 'Homebrew',    orbit: 0.93, phase: 1.8, period: 300, size: 6.5, color: '#d9a441' },
  { id: 'storm',    label: 'Storm',       orbit: 0.93, phase: 4.9, period: 300, size: 5.5, color: '#632390', ring: '#ffc72c' },
];

// Orbit radii actually used (for drawing faint orbit ellipses once each).
export const ORBITS = [...new Set(PLANETS.map(p => p.orbit))];
