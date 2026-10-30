// Canvas engine for the bren.id.au solar system. One loop, all state in plain objects —
// React never re-renders per frame (v1 did ~6 state updates a frame, which cooked phones).
//
// The engine draws the base layer (stars, orbits, sun, planets, packets) and runs a director
// that fires a random event every few seconds. Events live in events.js; they get a `world`
// handle to read positions and nudge shared knobs (sun brightness, star streaking, captions).
import { PLANETS, ORBITS } from './planets';
import { getRandomPacketColor, getRandomStarColor, getRandomTrailType } from '../constants';
import { EVENTS, PLANET_EVENTS } from './events';
import { TAU, rand, pick, rgba } from './util';

export function createCosmos(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let cx = 0, cy = 0, R = 0, tilt = 0.55;  // system centre, radius, ellipse flattening
  let stars = [], shooting = [], packets = [], effects = [], active = [], queued = [];
  let raf = 0, last = 0, t = 0, running = false;
  let nextPacket = 0.6, nextShooting = rand(4, 10), nextEvent = 0;
  const recent = [];  // last few director picks, to avoid repeats

  // Debug: ?force=<event> fires that event every 6 s. Not linked anywhere.
  const force = new URLSearchParams(location.search).get('force');
  nextEvent = force ? 1 : rand(2.5, 4);

  // ---- world: what events can see and touch ---------------------------------
  const STAR = { id: 'star' };
  const world = {
    get t() { return t; }, get W() { return W; }, get H() { return H; },
    get cx() { return cx; }, get cy() { return cy; }, get R() { return R; }, get tilt() { return tilt; },
    STAR, PLANETS,
    get active() { return active; },
    planet: (id) => PLANETS.find(p => p.id === id),
    pos: (node) => posOf(node),
    spawnPacket: (...a) => spawnPacket(...a),
    fire: (def, opts) => fire(def, opts),
    count: (kind) => active.concat(queued).filter(e => e.kind === kind).length,
    // Knobs events may set each frame; reset to neutral at the start of every frame.
    sunGain: 1,      // corona/core brightness multiplier
    sunDim: 0,       // 0..1 darkening (Astrophage)
    streak: 0,       // 0..1 hyperspace star streaking
    orbitGlow: 0,    // 0..1 extra orbit brightness (Pendulum)
    flash: null,     // { color, a } full-screen tint
    planetGlow: {},  // id -> 0..1 extra halo
    planetHide: {},  // id -> 0..1 fade a planet out (DNS outage)
    sunTint: null,   // hex: recolour the star (HAL, beer o'clock)
  };

  if (force) window.__cosmos = world;  // test hook, only with ?force

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
        drift: [1.2, 2.5, 4.5][layer], z: layer + 1,
        tw: rand(0.4, 1.6), tp: rand(0, TAU),
        color: getRandomStarColor(),
      };
    });
  }

  // ---- positions ----------------------------------------------------------
  function planetPos(p, time = t) {
    const ang = p.phase + (time / p.period) * TAU;
    const r = p.orbit * R;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * tilt, depth: Math.sin(ang), ang };
  }
  const posOf = (node) => node === STAR ? { x: cx, y: cy, depth: 0 } : planetPos(node);
  const planetSize = (p, depth) => p.size * Math.max(0.75, R / 260) * (0.88 + 0.12 * (depth + 1) / 2);

  // ---- spawning -----------------------------------------------------------
  function spawnPacket(from, to, chain = 0, opts = {}) {
    const a = posOf(from), b = posOf(to);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const color = opts.color || getRandomPacketColor();
    packets.push({
      from, to, chain, color, trail: opts.trail || getRandomTrailType(),
      sx: a.x, sy: a.y, age: 0, dur: (opts.speed || 1) * Math.max(0.9, dist / (R * 0.9)),
      size: opts.size || rand(1.8, 2.8), hist: [],
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

  // New events are queued and merged after this frame's updates, so an event can fire others
  // from inside its own update without being lost.
  function fire(def, opts) {
    queued.push(def.create(world, opts));
  }

  // The director: weighted pick, never one of the last three, never a "big" event while
  // another big one is still running.
  function direct() {
    if (force) { const d = EVENTS.find(e => e.id === force); if (d) fire(d); nextEvent = 9; return; }
    const bigRunning = active.some(e => e.big);
    const pool = EVENTS.filter(e => e.weight > 0 && !recent.includes(e.id) && !(bigRunning && e.big));
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total, def = pool[0];
    for (const e of pool) { r -= e.weight; if (r <= 0) { def = e; break; } }
    fire(def);
    recent.push(def.id); if (recent.length > 3) recent.shift();
    nextEvent = rand(6, 14);
  }

  // ---- update -------------------------------------------------------------
  function update(dt) {
    t += dt;
    Object.assign(world, { sunGain: 1, sunDim: 0, streak: 0, orbitGlow: 0, flash: null, planetGlow: {}, planetHide: {}, sunTint: null });

    nextPacket -= dt;
    if (nextPacket <= 0) { randomPacket(); nextPacket = rand(1.4, 2.8); }
    nextShooting -= dt;
    if (nextShooting <= 0) { spawnShootingStar(); nextShooting = rand(6, 15); }
    nextEvent -= dt;
    if (nextEvent <= 0) direct();

    active = active.filter(e => e.update(dt, world) !== false).concat(queued.splice(0));

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
    active.forEach(e => e.draw?.(ctx, world, 'sky'));
    drawOrbits();

    const placed = PLANETS.map(p => ({ p, ...planetPos(p) }));
    placed.filter(q => q.depth < 0).sort((a, b) => a.depth - b.depth).forEach(drawPlanet);
    drawSun();
    placed.filter(q => q.depth >= 0).sort((a, b) => a.depth - b.depth).forEach(drawPlanet);

    drawEffects();
    drawPackets();
    active.forEach(e => e.draw?.(ctx, world, 'front'));
    if (world.flash) { ctx.fillStyle = rgba(world.flash.color, world.flash.a); ctx.fillRect(0, 0, W, H); }
    active.forEach(e => e.draw?.(ctx, world, 'hud'));
  }

  function drawStars() {
    const k = world.streak;
    for (const s of stars) {
      const x = (s.x + t * s.drift) % W;
      const a = s.a * (0.65 + 0.35 * Math.sin(t * s.tw + s.tp));
      if (k > 0.02) {
        // Hyperspace: stretch each star away from the centre of the screen.
        const dx = x - W / 2, dy = s.y - H / 2;
        const len = k * k * 0.9 * s.z;
        ctx.strokeStyle = rgba(s.color, Math.min(1, a + k * 0.5)); ctx.lineWidth = s.r;
        ctx.beginPath(); ctx.moveTo(x, s.y); ctx.lineTo(x + dx * len, s.y + dy * len); ctx.stroke();
      } else {
        ctx.fillStyle = rgba(s.color, a);
        ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, TAU); ctx.fill();
      }
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
      ctx.strokeStyle = `rgba(88,166,255,${0.08 + world.orbitGlow * 0.45})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, o * R, o * R * tilt, 0, 0, TAU); ctx.stroke();
    }
  }

  function drawSun() {
    // A star, not a ball: small hot core, wide soft corona that breathes and flickers slightly.
    const breathe = (1 + 0.05 * Math.sin(t * 0.7) + 0.015 * Math.sin(t * 3.1)) * world.sunGain;
    const lit = 1 - world.sunDim * 0.85;
    const r = Math.max(7, R * 0.042);
    const tc = world.sunTint || '#58a6ff', hc = world.sunTint || '#78b4ff';
    let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 9 * breathe);
    g.addColorStop(0, rgba(hc, 0.30 * lit * (world.sunTint ? 1.6 : 1))); g.addColorStop(0.15, rgba(tc, 0.12 * lit * (world.sunTint ? 1.6 : 1)));
    g.addColorStop(0.45, rgba(tc, 0.035 * lit)); g.addColorStop(1, rgba(tc, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 9 * breathe, 0, TAU); ctx.fill();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    g.addColorStop(0, `rgba(255,255,255,${0.15 + 0.85 * lit})`); g.addColorStop(0.45, `rgba(230,241,255,${0.1 + 0.9 * lit})`);
    g.addColorStop(0.75, world.sunTint ? rgba(world.sunTint, 0.9 * lit) : `rgba(160,205,255,${0.7 * lit})`); g.addColorStop(1, rgba(tc, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, TAU); ctx.fill();
  }

  function drawPlanet({ p, x, y, depth }) {
    const s = planetSize(p, depth);
    const lit = Math.atan2(cy - y, cx - x);  // lit from the star
    const lx = x + Math.cos(lit) * s * 0.45, ly = y + Math.sin(lit) * s * 0.45;
    const glow = world.planetGlow[p.id] || 0;
    const hov = hover === p ? 0.6 : 0;
    ctx.save(); ctx.globalAlpha = 1 - (world.planetHide[p.id] || 0) * 0.9;

    const hr = s * (3 + glow * 3 + hov);
    const halo = ctx.createRadialGradient(x, y, 0, x, y, hr);
    halo.addColorStop(0, rgba(p.color, 0.18 + glow * 0.4 + hov * 0.2)); halo.addColorStop(1, rgba(p.color, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, hr, 0, TAU); ctx.fill();

    if (p.ring) drawRing(x, y, s, p.ring, 'back');
    const g = ctx.createRadialGradient(lx, ly, 0, x, y, s);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, p.color); g.addColorStop(1, rgba(p.color, 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    if (p.ring) drawRing(x, y, s, p.ring, 'front');

    ctx.font = `${Math.round(Math.max(9, Math.min(12, R / 30)))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba('#cfe6ff', 0.35 + 0.15 * (depth + 1) / 2 + hov * 0.4);
    ctx.fillText(p.label, x, y + s + 13);
    ctx.restore();
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

  // ---- pointer: tap a planet and it does its thing --------------------------
  let hover = null;
  const cooldown = {};
  // What's under the pointer: a tappable event (ISS, car, Enterprise...) wins over planets.
  function targetAt(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    for (let i = active.length - 1; i >= 0; i--) if (active[i].hit?.(x, y, world)) return { event: active[i], x, y };
    if (Math.hypot(x - cx, y - cy) < Math.max(24, R * 0.07)) return { node: STAR };
    let best = null, bestD = Infinity;
    for (const p of PLANETS) {
      const q = planetPos(p);
      const d = Math.hypot(q.x - x, q.y - y);
      const hit = Math.max(22, planetSize(p, q.depth) * 3);  // generous for thumbs
      if (d < hit && d < bestD) { best = p; bestD = d; }
    }
    return best ? { node: best } : null;
  }
  const onMove = (ev) => {
    const tgt = targetAt(ev);
    hover = tgt?.node || null;
    canvas.style.cursor = tgt ? 'pointer' : 'default';
  };
  const onClick = (ev) => {
    const tgt = targetAt(ev);
    if (!tgt) return;
    if (tgt.event) { tgt.event.tap(world, tgt.x, tgt.y); return; }
    const p = tgt.node;
    if ((cooldown[p.id] || 0) > t) return;
    const def = PLANET_EVENTS[p.id];
    if (def) { fire(def); cooldown[p.id] = t + (def.cooldown ?? 1.5); }
  };

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
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('click', onClick);
  };
}
