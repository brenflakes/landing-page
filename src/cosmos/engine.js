// Canvas engine for the bren.id.au solar system. One loop, all state in plain objects —
// React never re-renders per frame (v1 did ~6 state updates a frame, which cooked phones).
import { PLANETS, ORBITS } from './planets';
import { getRandomPacketColor, getRandomStarColor, getRandomTrailType } from '../constants';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const hexToRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

export function createCosmos(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let cx = 0, cy = 0, R = 0, tilt = 0.55;  // system centre, radius, ellipse flattening
  let stars = [], shooting = [], packets = [], effects = [];
  let raf = 0, last = 0, t = 0, running = false;
  let nextPacket = 0.6, nextShooting = rand(4, 10);

  // ---- layout -------------------------------------------------------------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const portrait = H > W;
    tilt = portrait ? 0.78 : 0.5;
    // System sits in the upper part of the screen, leaving room for title + card below.
    cy = H * (portrait ? 0.34 : 0.35);
    cx = W / 2;
    R = Math.min(W * (portrait ? 0.47 : 0.38), (H * (portrait ? 0.25 : 0.27)) / tilt);
    makeStars();
  }

  function makeStars() {
    const n = Math.round(Math.min(420, (W * H) / 3500));
    stars = Array.from({ length: n }, () => {
      const layer = Math.random() < 0.7 ? 0 : Math.random() < 0.8 ? 1 : 2;
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: [0.5, 0.9, 1.4][layer] * rand(0.7, 1.2),
        a: [0.35, 0.55, 0.85][layer] * rand(0.6, 1),
        drift: [1.2, 2.5, 4.5][layer],
        tw: rand(0.4, 1.6), tp: rand(0, TAU),
        color: getRandomStarColor(),
      };
    });
  }

  // ---- positions ----------------------------------------------------------
  function planetPos(p, time = t) {
    const ang = p.phase + (time / p.period) * TAU;
    const r = p.orbit * R;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * tilt, depth: Math.sin(ang) };
  }
  const STAR = { id: 'star' };
  const posOf = (node) => node === STAR ? { x: cx, y: cy, depth: 0 } : planetPos(node);

  // ---- spawning -----------------------------------------------------------
  function spawnPacket(from, to, chain = 0) {
    const a = posOf(from), b = posOf(to);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const color = getRandomPacketColor();
    packets.push({
      from, to, chain, color, trail: getRandomTrailType(),
      sx: a.x, sy: a.y, age: 0, dur: Math.max(0.9, dist / (R * 0.9)),
      size: rand(1.8, 2.8), hist: [],
      bend: rand(0.15, 0.35) * (Math.random() < 0.5 ? -1 : 1),
    });
    effects.push({ kind: 'pulse', node: from, color, age: 0, life: 0.9 });
  }

  function randomPacket() {
    const nodes = [STAR, ...PLANETS];
    const from = Math.random() < 0.2 ? STAR : pick(PLANETS);
    let to = pick(nodes);
    while (to === from) to = pick(nodes);
    spawnPacket(from, to);
  }

  function spawnShootingStar() {
    const ang = rand(0.15, 0.6) + (Math.random() < 0.5 ? 0 : Math.PI - 0.75);
    const speed = rand(500, 850);
    shooting.push({
      x: rand(W * 0.1, W * 0.9), y: rand(0, H * 0.4),
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      age: 0, life: rand(0.6, 1.1), color: getRandomStarColor(),
    });
  }

  // ---- update -------------------------------------------------------------
  function update(dt) {
    t += dt;
    nextPacket -= dt;
    if (nextPacket <= 0) { randomPacket(); nextPacket = rand(1.6, 3.2); }
    nextShooting -= dt;
    if (nextShooting <= 0) { spawnShootingStar(); nextShooting = rand(7, 18); }

    for (const p of packets) {
      p.age += dt;
      const k = Math.min(1, p.age / p.dur);
      const pos = packetPoint(p, k);
      p.hist.push(pos); if (p.hist.length > 14) p.hist.shift();
      p.x = pos.x; p.y = pos.y;
      if (k >= 1 && !p.done) {
        p.done = true;
        effects.push({ kind: 'burst', node: p.to, color: p.color, age: 0, life: 0.7 });
        if (p.chain < 2 && Math.random() < 0.5) {
          const next = pick([STAR, ...PLANETS].filter(n => n !== p.to && n !== p.from));
          setTimeout(() => running && spawnPacket(p.to, next, p.chain + 1), rand(120, 320));
        }
      }
    }
    packets = packets.filter(p => !p.done);
    for (const e of effects) e.age += dt;
    effects = effects.filter(e => e.age < e.life);
    for (const s of shooting) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    shooting = shooting.filter(s => s.age < s.life);
  }

  // Quadratic curve from the launch point to the target's *current* position, bowed sideways
  // so packets arc like they're riding the system's gravity rather than drawing straight lines.
  function packetPoint(p, k) {
    const b = posOf(p.to);
    const mx = (p.sx + b.x) / 2, my = (p.sy + b.y) / 2;
    const dx = b.x - p.sx, dy = b.y - p.sy;
    const qx = mx - dy * p.bend, qy = my + dx * p.bend;
    const e = 1 - Math.pow(1 - k, 2.2);  // ease-out
    const u = 1 - e;
    return { x: u * u * p.sx + 2 * u * e * qx + e * e * b.x, y: u * u * p.sy + 2 * u * e * qy + e * e * b.y };
  }

  // ---- draw ---------------------------------------------------------------
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawStars();
    drawShooting();
    drawOrbits();

    const placed = PLANETS.map(p => ({ p, ...planetPos(p) }));
    placed.filter(q => q.depth < 0).sort((a, b) => a.depth - b.depth).forEach(drawPlanet);
    drawSun();
    placed.filter(q => q.depth >= 0).sort((a, b) => a.depth - b.depth).forEach(drawPlanet);

    drawEffects();
    drawPackets();
  }

  function drawStars() {
    for (const s of stars) {
      const x = (s.x + t * s.drift) % W;
      const a = s.a * (0.65 + 0.35 * Math.sin(t * s.tw + s.tp));
      ctx.fillStyle = rgba(s.color, a);
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, TAU); ctx.fill();
    }
  }

  function drawShooting() {
    for (const s of shooting) {
      const k = s.age / s.life, a = Math.sin(k * Math.PI);
      const len = 0.09;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
      g.addColorStop(0, rgba(s.color, 0.9 * a)); g.addColorStop(1, rgba(s.color, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len); ctx.stroke();
    }
  }

  function drawOrbits() {
    ctx.lineWidth = 1;
    for (const o of ORBITS) {
      ctx.strokeStyle = 'rgba(88,166,255,0.08)';
      ctx.beginPath(); ctx.ellipse(cx, cy, o * R, o * R * tilt, 0, 0, TAU); ctx.stroke();
    }
  }

  function drawSun() {
    // A star, not a ball: small hot core, wide soft corona that breathes and flickers slightly.
    const breathe = 1 + 0.05 * Math.sin(t * 0.7) + 0.015 * Math.sin(t * 3.1);
    const r = Math.max(7, R * 0.042);
    let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 9 * breathe);
    g.addColorStop(0, 'rgba(120,180,255,0.30)'); g.addColorStop(0.15, 'rgba(88,166,255,0.12)');
    g.addColorStop(0.45, 'rgba(88,166,255,0.035)'); g.addColorStop(1, 'rgba(88,166,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 9 * breathe, 0, TAU); ctx.fill();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#e6f1ff'); g.addColorStop(0.75, 'rgba(160,205,255,0.7)');
    g.addColorStop(1, 'rgba(88,166,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, TAU); ctx.fill();
  }

  function drawPlanet({ p, x, y, depth }) {
    // Size scales a touch with screen and with depth, for a hint of perspective.
    const s = p.size * Math.max(0.75, R / 260) * (0.88 + 0.12 * (depth + 1) / 2);
    const lit = Math.atan2(cy - y, cx - x);  // lit from the star
    const lx = x + Math.cos(lit) * s * 0.45, ly = y + Math.sin(lit) * s * 0.45;

    const halo = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
    halo.addColorStop(0, rgba(p.color, 0.18)); halo.addColorStop(1, rgba(p.color, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, s * 3, 0, TAU); ctx.fill();

    if (p.ring) drawRing(x, y, s, p.ring, 'back');
    const g = ctx.createRadialGradient(lx, ly, 0, x, y, s);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, p.color); g.addColorStop(1, rgba(p.color, 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    if (p.ring) drawRing(x, y, s, p.ring, 'front');

    ctx.font = `${Math.round(Math.max(9, Math.min(12, R / 30)))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba('#cfe6ff', 0.35 + 0.15 * (depth + 1) / 2);
    ctx.fillText(p.label, x, y + s + 13);
  }

  function drawRing(x, y, s, color, half) {
    ctx.strokeStyle = rgba(color, 0.7); ctx.lineWidth = Math.max(1, s * 0.18);
    ctx.beginPath();
    if (half === 'back') ctx.ellipse(x, y, s * 1.9, s * 0.55, -0.3, Math.PI, TAU);
    else ctx.ellipse(x, y, s * 1.9, s * 0.55, -0.3, 0, Math.PI);
    ctx.stroke();
  }

  function drawEffects() {
    for (const e of effects) {
      const { x, y } = posOf(e.node);
      const k = e.age / e.life;
      const r = (e.kind === 'burst' ? 22 : 14) * (0.3 + k);
      ctx.strokeStyle = rgba(e.color, (1 - k) * 0.6); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
  }

  function drawPackets() {
    for (const p of packets) {
      const h = p.hist, n = h.length;
      if (p.trail === 'comet' && n > 1) {
        for (let i = 1; i < n; i++) {
          ctx.strokeStyle = rgba(p.color, (i / n) * 0.6); ctx.lineWidth = p.size * (i / n);
          ctx.beginPath(); ctx.moveTo(h[i - 1].x, h[i - 1].y); ctx.lineTo(h[i].x, h[i].y); ctx.stroke();
        }
      } else if (p.trail === 'dots') {
        for (let i = 0; i < n; i += 3) {
          ctx.fillStyle = rgba(p.color, (i / n) * 0.5);
          ctx.beginPath(); ctx.arc(h[i].x, h[i].y, p.size * 0.45, 0, TAU); ctx.fill();
        }
      } else if (n > 4) {
        const g = ctx.createLinearGradient(h[n - 5].x, h[n - 5].y, p.x, p.y);
        g.addColorStop(0, rgba(p.color, 0)); g.addColorStop(1, rgba(p.color, 0.55));
        ctx.strokeStyle = g; ctx.lineWidth = p.size * 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(h[n - 5].x, h[n - 5].y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      g.addColorStop(0, rgba(p.color, 0.9)); g.addColorStop(1, rgba(p.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6, 0, TAU); ctx.fill();
    }
  }

  // ---- loop ---------------------------------------------------------------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);  // clamp: no jump after a stall
    last = now;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reducedMotion) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? stop() : start());
  const onResize = () => { resize(); if (!running) draw(); };

  resize();
  if (reducedMotion) { t = 40; draw(); }  // one calm, static frame
  else start();
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onResize);

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onResize);
  };
}
