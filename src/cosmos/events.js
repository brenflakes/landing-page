// Events: the things that make people go "hang on a sec...".
// The director in engine.js fires one every 6-14 s (weighted, no repeats in the last three),
// and tapping a planet fires that planet's own event. Each event has small random variations.
//
// An event definition is { id, weight, big?, create(world) }. create() returns an instance with
// update(dt, world) -> false when finished, and draw(ctx, world, layer) where layer is
// 'sky' (behind the system), 'front' (over planets) or 'hud' (captions, on top of everything).
import { TAU, rand, pick, clamp, ease, env, rgba } from './util';

const PALETTE = ['#58a6ff', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];
const RB = { navy: '#1e41ff', dark: '#121f45', red: '#e10600', yellow: '#ffcc00' };
const STORM = { purple: '#632390', gold: '#ffc72c' };

// ---- shared helpers ---------------------------------------------------------

// Radio-style caption, typed out. Default spot is just above the solar system.
// There is one caption slot: the newest event to speak takes it, and anything it pre-empted
// goes quiet for good. Otherwise rapid taps stacked five unreadable captions on top of each other.
let slot = null;
function caption(ctx, w, { owner, label, text, color = '#58a6ff', k, x, y, size = 13 }) {
  if (owner) {
    if (!owner._spoke) { owner._spoke = true; slot = owner; }
    if (slot !== owner) return;
  }
  const a = env(k, 0.08, 0.2);
  if (a <= 0) return;
  x ??= w.cx;
  y ??= Math.max(34, w.cy - w.R * w.tilt - 36);
  const shown = text.slice(0, Math.ceil(text.length * clamp(k * 3)));
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `500 ${size}px 'JetBrains Mono', monospace`;
  const tw = ctx.measureText(text).width;
  const lw = label ? (ctx.font = `600 ${size - 3}px 'JetBrains Mono', monospace`, ctx.measureText(label).width + 14) : 0;
  const bw = tw + lw + 24, bh = size + 14;
  if (bw > w.W - 16 && size > 8) {  // narrow phones: shrink to fit rather than clip
    ctx.restore();
    return caption(ctx, w, { owner: this, label, text, color, k, x, y, size: Math.max(8, Math.floor(size * (w.W - 16) / bw)) });
  }
  ctx.fillStyle = `rgba(5,7,12,${0.75 * a})`;
  ctx.strokeStyle = rgba(color, 0.5 * a); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
  let cx = x - bw / 2 + 12;
  if (label) {
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(color, a); ctx.fillText(label, cx, y + 0.5);
    cx += lw;
  }
  ctx.textAlign = 'left';
  ctx.font = `500 ${size}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = `rgba(230,241,255,${a})`; ctx.fillText(shown, cx, y + 0.5);
  ctx.restore();
}

// Big floating word near a point (PIVOT!, APPROVED).
function shout(ctx, text, x, y, color, a, size = 18) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.fillStyle = rgba(color, a); ctx.fillText(text, x, y);
  ctx.restore();
}

// Simple timed instance: update counts age, finishes at `dur`.
function timed(dur, parts) {
  const inst = { age: 0, dur, ...parts };
  const u = parts.update;
  inst.update = (dt, w) => { inst.age += dt; u?.call(inst, dt, w, inst.age / inst.dur); return inst.age < inst.dur; };
  return inst;
}

// ---- F1: Red Bull car laps the system --------------------------------------

const RADIO = [
  ['KIMI', 'Leave me alone, I know what I\'m doing.'],
  ['KIMI', 'Bwoah.'],
  ['MAX', 'Simply lovely.'],
  ['BRUNDLE', 'Is that Glock?!'],
  ['ALONSO', 'GP2 engine. GP2! Argh!'],
  ['SAINZ', 'Smooooth operator.'],
  ['TEAM RADIO', 'It\'s an inchident.'],
  ['TEAM RADIO', 'Box box. Box box.'],
];

// Liveries. Red Bull is always first; spam the F1 planet and rivals join in.
const LIVERIES = [
  { name: 'VERSTAPPEN', body: RB.navy,   floor: RB.dark,   wing: RB.red,   tip: RB.yellow, trail: [RB.red, RB.yellow] },
  { name: 'NORRIS',     body: '#ff8000', floor: '#1a1a1a', wing: '#47c7fc', tip: '#000000', trail: ['#ff8000', '#47c7fc'] },
  { name: 'LECLERC',    body: '#dc0000', floor: '#2a0000', wing: '#fff200', tip: '#ffffff', trail: ['#dc0000', '#fff200'] },
  { name: 'RUSSELL',    body: '#c8ccd2', floor: '#111111', wing: '#00d2be', tip: '#111111', trail: ['#c8ccd2', '#00d2be'] },
  { name: 'ALONSO',     body: '#00594f', floor: '#002420', wing: '#cedc00', tip: '#cedc00', trail: ['#00594f', '#cedc00'] },
];

function drawCar(ctx, x, y, heading, L, lv = LIVERIES[0]) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(heading);
  const W = L * 0.32;
  ctx.fillStyle = '#0b0b0b';  // tyres
  for (const [tx, ty] of [[0.28, 1], [0.28, -1], [-0.32, 1], [-0.32, -1]]) ctx.fillRect(tx * L - L * 0.08, ty * W * 0.62 - W * 0.17, L * 0.16, W * 0.34);
  ctx.fillStyle = lv.floor;  // floor and sidepods
  ctx.beginPath(); ctx.roundRect(-L * 0.38, -W * 0.42, L * 0.62, W * 0.84, W * 0.3); ctx.fill();
  ctx.fillStyle = lv.body;  // nose + body
  ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.lineTo(L * 0.1, -W * 0.18); ctx.lineTo(-L * 0.4, -W * 0.22);
  ctx.lineTo(-L * 0.4, W * 0.22); ctx.lineTo(L * 0.1, W * 0.18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lv.wing;  // front wing + engine cover badge
  ctx.fillRect(L * 0.42, -W * 0.55, L * 0.07, W * 1.1);
  ctx.beginPath(); ctx.arc(-L * 0.05, 0, W * 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = lv.tip;  // nose tip + rear wing
  ctx.beginPath(); ctx.arc(L * 0.47, 0, W * 0.08, 0, TAU); ctx.fill();
  ctx.fillRect(-L * 0.5, -W * 0.5, L * 0.08, W);
  ctx.restore();
}

// One car lapping the star. opts (used by the race): livery, laps, dur, grid offsets, no radio.
const redbull = {
  id: 'redbull', weight: 3,
  create(w, opts = {}) {
    const f1 = w.planet('f1');
    const start = w.pos(f1);
    const lv = opts.livery || LIVERIES[w.count('car') % LIVERIES.length];
    const a0 = start.ang + (opts.da || 0), laps = opts.laps || rand(1.1, 1.6), dr = opts.dr || 0;
    const radio = opts.quiet || w.count('car') > 0 ? null : Math.random() < 0.6 ? pick(RADIO) : null;
    const trail = [], smoke = [];
    let prev = null;
    return timed(opts.dur || rand(5, 6.5), {
      kind: 'car', spin: 0, spinLeft: 0,
      hit(x, y) { return this.spinLeft <= 0 && near(this.p, x, y, 44); },  // big target: it's quick
      tap(w) {
        this.spinLeft = 0.9; this.tapAt = this.age; this.tapOwner = {};
        this.spinLine = pick([['🎙 CROFTY', 'And he\'s spun it! Lovely recovery though.'], ['📻 TEAM RADIO', 'I\'ve lost the car! I\'ve lost the car!'], ['🎙 BRUNDLE', 'Oh, that\'s a big moment.']]);
      },
      update(dt, w, k) {
        if (this.spinLeft > 0) {
          this.spinLeft -= dt; this.spin += dt * 16;
          if (this.p) smoke.push({ x: this.p.x, y: this.p.y, age: 0, r: rand(3, 6) });
        }
        for (const sm of smoke) sm.age += dt;
        // Ease-in sweep round the star on a slightly wider orbit, then spear off-screen.
        const sweep = Math.pow(k, 1.5) * laps * TAU;
        let r = w.R * (f1.orbit + dr + (1.08 - f1.orbit) * ease(k * 4));
        if (k > 0.82) r *= 1 + Math.pow((k - 0.82) / 0.18, 2) * 2.5;
        const th = a0 + sweep;
        const p = { x: w.cx + Math.cos(th) * r, y: w.cy + Math.sin(th) * r * w.tilt };
        this.heading = prev ? Math.atan2(p.y - prev.y, p.x - prev.x) : this.heading || 0;
        prev = this.p = p;
        trail.push(p); if (trail.length > 26) trail.shift();
        w.planetGlow.f1 = Math.max(w.planetGlow.f1 || 0, 1 - k * 5);
      },
      draw(ctx, w, layer) {
        if (layer === 'hud' && this.tapOwner) caption(ctx, w, { owner: this.tapOwner, label: this.spinLine[0], text: this.spinLine[1], color: RB.yellow, k: clamp((this.age - this.tapAt) / 3) });
        else if (layer === 'hud' && radio) caption(ctx, w, { owner: this, label: '📻 ' + radio[0], text: radio[1], color: RB.yellow, k: clamp(this.age / 4) });
        if (layer !== 'front' || !this.p) return;
        for (const [col, off, lw] of [[lv.trail[0], -1, 2], [lv.trail[1], 1, 1.2]]) {
          for (let i = 1; i < trail.length; i++) {
            ctx.strokeStyle = rgba(col, (i / trail.length) * 0.55); ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y + off); ctx.lineTo(trail[i].x, trail[i].y + off); ctx.stroke();
          }
        }
        for (const sm of smoke) {
          const sk = sm.age / 1.2; if (sk >= 1) continue;
          ctx.fillStyle = `rgba(200,200,210,${0.35 * (1 - sk)})`;
          ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r * (1 + sk * 3), 0, TAU); ctx.fill();
        }
        drawCar(ctx, this.p.x, this.p.y, this.heading + this.spin, Math.max(24, w.R * 0.1), lv);
      },
    });
  },
};

// Five cars at once -> a proper start. Lights come on one by one, hold, go out, and the whole
// grid launches together. Max wins. Obviously.
const lightsout = {
  id: 'lightsout', weight: 0.5, big: true,
  create(w) {
    const step = 0.55, hold = rand(0.5, 1.4), go = step * 5 + hold, raceDur = 6.2;
    let launched = false;
    return timed(go + raceDur + 0.5, {
      kind: 'lightsout', big: true,
      update(dt, w) {
        w.planetGlow.f1 = 0.6;
        if (!launched && this.age >= go) {
          launched = true;
          LIVERIES.forEach((lv, i) => w.fire(redbull, {
            livery: lv, quiet: true, dur: raceDur,
            laps: 1.5 * (i === 0 ? 1.04 : 1 - i * 0.025),  // Max pulls away
            da: -0.05 * i, dr: (i % 2 ? 0.035 : -0.035),     // staggered two-wide grid
          }));
        }
      },
      draw(ctx, w, layer) {
        if (layer !== 'hud') return;
        const t = this.age;
        if (t < go + 0.35) {  // the gantry
          const lit = t < go ? Math.min(5, Math.floor(t / step) + 1) : 0;
          const y = Math.max(34, w.cy - w.R * w.tilt - 36), r = 7, gap = 22, x0 = w.cx - gap * 2;
          ctx.fillStyle = 'rgba(10,10,12,0.9)';
          ctx.beginPath(); ctx.roundRect(x0 - 16, y - 14, gap * 4 + 32, 28, 6); ctx.fill();
          for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.fillStyle = i < lit ? '#ff1e1e' : '#2a0b0b';
            if (i < lit) { ctx.shadowColor = '#ff1e1e'; ctx.shadowBlur = 14; }
            ctx.beginPath(); ctx.arc(x0 + i * gap, y, r, 0, TAU); ctx.fill();
            ctx.restore();
          }
        }
        if (t >= go && t < go + 3) caption(ctx, w, { owner: this, label: '🎙 CROFTY', text: 'IT\'S LIGHTS OUT AND AWAY WE GO!', color: '#ff1e1e', k: (t - go) / 3 });
        if (t >= go + raceDur * 0.75) caption(ctx, w, { owner: this, label: '🏁 P1', text: 'MAX VERSTAPPEN. Simply lovely.', color: RB.yellow, k: clamp((t - go - raceDur * 0.75) / (this.dur - go - raceDur * 0.75)) });
      },
    });
  },
};

// Mash a planet: each tap fires its normal event, and five taps inside 8 seconds fires its
// combo instead (F1 -> the race, Storm -> a supercell, and so on).
function combo(base, big, n = 5, cooldown = 0.4) {
  let taps = [];
  return {
    id: base.id + '-tap', weight: 0, cooldown,
    create(w) {
      taps = taps.filter(t => w.t - t < 8).concat(w.t);
      if (taps.length >= n && !w.count(big.id)) {
        taps = [];
        w.fire(big);
        return { update: () => false };
      }
      return base.create(w);
    },
  };
}

const title = (text, color, hold) => window.dispatchEvent(new CustomEvent('cosmos:title', { detail: { text, color, hold } }));

const radio = {
  id: 'radio', weight: 1.5,
  create(w) {
    const [who, line] = pick(RADIO);
    return timed(4.5, {
      update(dt, w, k) { w.planetGlow.f1 = env(k) * 0.8; },
      draw(ctx, w, layer) { if (layer === 'hud') caption(ctx, w, { owner: this, label: '📻 ' + who, text: line, color: RB.yellow, k: this.age / this.dur }); },
    });
  },
};

// ---- Pendulum drop: the whole system pulses at 174 BPM ----------------------

const TRACKS = ['Watercolour', 'Propane Nightmares', 'The Island', 'Tarantula', 'Witchcraft', 'Hold Your Colour', 'Slam', 'Blood Sugar', 'Granite'];

const pendulum = {
  id: 'pendulum', weight: 2, big: true,
  create(w) {
    const beat = 60 / 174, build = 1.6, beats = 8;
    const track = pick(TRACKS);
    let fired = -1;
    return timed(build + beat * beats + 1, {
      big: true,
      update(dt, w) {
        const a = this.age;
        if (a < build) { const k = a / build; w.sunGain = 1 + k * k * 0.6; w.orbitGlow = k * 0.25; return; }
        const n = Math.floor((a - build) / beat), ph = ((a - build) % beat) / beat;
        if (n < beats) {
          const hit = Math.exp(-ph * 5);
          w.sunGain = 1.3 + hit * 0.9; w.orbitGlow = 0.2 + hit * 0.8;
          for (const p of w.PLANETS) w.planetGlow[p.id] = hit * 0.9;
          if (n !== fired) {
            fired = n;
            if (n % 2 === 0) for (const p of w.PLANETS) w.spawnPacket(w.STAR, p, 3, { color: PALETTE[(n / 2) % PALETTE.length], speed: 0.55, trail: 'comet' });
          }
        } else {
          const k = (a - build - beat * beats);
          w.sunGain = 1 + 0.3 * (1 - k); w.orbitGlow = 0.2 * (1 - k);
        }
      },
      draw(ctx, w, layer) { if (layer === 'hud') caption(ctx, w, { owner: this, label: '♪ NOW PLAYING', text: `Pendulum · ${track}`, color: '#22d3ee', k: this.age / this.dur }); },
    });
  },
};

// ---- PIVOT! ------------------------------------------------------------------

const pivot = {
  id: 'pivot', weight: 2,
  create(w) {
    const [a, b, c] = [...w.PLANETS].sort(() => Math.random() - 0.5);
    const color = pick(PALETTE);
    const start = w.pos(a);
    let mid = null, phase = 0, pos = start;
    const trail = [];
    return timed(3.4, {
      update(dt, w) {
        const t = this.age;
        if (t < 1.1) {  // head for B
          const tb = w.pos(b), k = ease(t / 1.1) * 0.55;
          pos = { x: start.x + (tb.x - start.x) * k, y: start.y + (tb.y - start.y) * k };
        } else if (t < 2.1) {  // stop, shake, PIVOT
          mid ??= pos; phase = 1;
          const j = 3 * (1 - (t - 1.1));
          pos = { x: mid.x + rand(-j, j), y: mid.y + rand(-j, j) };
        } else {  // swing off to C
          phase = 2;
          const tc = w.pos(c), k = ease((t - 2.1) / 1.0);
          pos = { x: mid.x + (tc.x - mid.x) * k, y: mid.y + (tc.y - mid.y) * k };
          if (k >= 1) w.planetGlow[c.id] = 1;
        }
        trail.push(pos); if (trail.length > 18) trail.shift();
      },
      draw(ctx, w, layer) {
        if (layer === 'front') {
          for (let i = 1; i < trail.length; i++) {
            ctx.strokeStyle = rgba(color, (i / trail.length) * 0.6); ctx.lineWidth = 4 * (i / trail.length);
            ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
          }
          const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 12);
          g.addColorStop(0, rgba(color, 1)); g.addColorStop(1, rgba(color, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pos.x, pos.y, 12, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.5, 0, TAU); ctx.fill();
        }
        if (layer === 'hud' && mid && this.age < 2.9) {
          const k = (this.age - 1.1) / 1.8;
          shout(ctx, 'PIVOT!', mid.x, mid.y - 22 - k * 10, '#fbbf24', env(k, 0.1, 0.4), 20);
        }
      },
    });
  },
};

// ---- ISS crossing ------------------------------------------------------------

// Particle bursts for things that get tapped and blow up.
function burst(list, x, y, colors, n = 26, speed = 90) {
  for (let i = 0; i < n; i++) {
    const an = rand(0, TAU), v = rand(0.2, 1) * speed;
    list.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, r: rand(0.8, 2.4), c: pick(colors), age: 0, life: rand(0.6, 1.4), spin: rand(-8, 8) });
  }
}
function stepBurst(list, dt) {
  for (const d of list) { d.age += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.985; d.vy = d.vy * 0.985 + 12 * dt; }
}
function drawBurst(ctx, list) {
  for (const d of list) {
    const k = d.age / d.life; if (k >= 1) continue;
    ctx.fillStyle = rgba(d.c, 1 - k);
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.age * d.spin);
    ctx.fillRect(-d.r, -d.r * 0.5, d.r * 2, d.r); ctx.restore();
  }
}
const near = (o, x, y, r = 26) => o && Math.hypot(o.x - x, o.y - y) < r;

const iss = {
  id: 'iss', weight: 2,
  create(w) {
    const ltr = Math.random() < 0.5;
    const y0 = rand(0.06, 0.2) * w.H, y1 = y0 + rand(-0.06, 0.08) * w.H;
    const bits = [];
    const said = {};
    return timed(rand(7, 9), {
      fate: null, fateAt: 0, climb: 0,
      hit(x, y) { return !this.fate && near(this.p, x, y, 30); },
      tap(w) {
        this.fate = Math.random() < 0.55 ? 'boom' : 'reboost';
        this.fateAt = this.age;
        if (this.fate === 'boom') { burst(bits, this.p.x, this.p.y, ['#ffffff', '#c8d2e6', '#96afe6', '#ffb347', '#ff4040'], 40, 120); w.flash = { color: '#ffffff', a: 0.15 }; }
        this.dur = Math.max(this.dur, this.age + 3.5);
      },
      update(dt, w) {
        stepBurst(bits, dt);
        if (this.fate === 'reboost') this.climb += dt * 140 * (1 + (this.age - this.fateAt) * 2);
      },
      draw(ctx, w, layer) {
        const k = Math.min(1, this.age / (this.fate ? this.age + 1 : this.dur));
        if (layer === 'sky' && this.fate !== 'boom') {
          const kk = this.age / this.dur;
          const x = ltr ? -40 + (w.W + 80) * kk : w.W + 40 - (w.W + 80) * kk;
          const y = y0 + (y1 - y0) * kk - this.climb;
          this.p = { x, y };
          const s = Math.max(1, w.R / 220);
          ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
          if (this.fate === 'reboost') {  // engine burn
            ctx.fillStyle = 'rgba(255,170,60,0.9)'; ctx.beginPath(); ctx.ellipse(0, 6, 1.6, 4 + Math.random() * 3, 0, 0, TAU); ctx.fill();
          }
          ctx.fillStyle = 'rgba(200,210,230,0.9)'; ctx.fillRect(-11, -0.6, 22, 1.2);  // truss
          ctx.fillStyle = 'rgba(150,175,230,0.85)';
          for (const px of [-10, -6, 4, 8]) { ctx.fillRect(px, -5, 2.5, 4); ctx.fillRect(px, 1, 2.5, 4); }  // solar arrays
          ctx.fillStyle = 'rgba(235,235,240,1)'; ctx.fillRect(-2, -1.5, 4, 3);  // modules
          if (Math.floor(this.age * 1.5) % 2 === 0) { ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(11, 0, 1.3, 0, TAU); ctx.fill(); }
          ctx.restore();
          ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(200,215,240,${0.55 * env(kk, 0.1, 0.1)})`;
          ctx.fillText(this.fate ? 'ISS · reboost burn' : 'ISS · 27,600 km/h', x, y + 16 * s);
        }
        if (layer === 'front') drawBurst(ctx, bits);
        if (layer === 'hud' && this.fate) {
          said.o ??= {};
          const kc = (this.age - this.fateAt) / 3.5;
          if (this.fate === 'boom') caption(ctx, w, { owner: said.o, label: '🛰 APOLLO 13', text: 'Houston, we\'ve had a problem.', color: '#ffb347', k: kc });
          else caption(ctx, w, { owner: said.o, label: '🛰 ISS', text: 'Reboost burn. Have a nice day.', color: '#96afe6', k: kc });
        }
      },
    });
  },
};

// ---- Storm: lightning ---------------------------------------------------------

function bolt(a, b, rough) {
  const pts = [a], n = 9;
  for (let i = 1; i < n; i++) {
    const k = i / n, nx = -(b.y - a.y), ny = b.x - a.x, len = Math.hypot(nx, ny) || 1;
    const off = rand(-rough, rough);
    pts.push({ x: a.x + (b.x - a.x) * k + (nx / len) * off, y: a.y + (b.y - a.y) * k + (ny / len) * off });
  }
  pts.push(b);
  return pts;
}

const storm = {
  id: 'storm', weight: 2,
  create(w) {
    const st = w.planet('storm');
    const strikes = [0, rand(0.2, 0.35), rand(0.55, 0.8)];
    const targets = strikes.map(() => (Math.random() < 0.5 ? w.STAR : pick(w.PLANETS.filter(p => p !== st))));
    const say = Math.random() < 0.5;
    let path = null, lastSeg = -1;
    return timed(2.6, {
      update(dt, w) {
        w.planetGlow.storm = Math.max(0, 1 - this.age / 2);
        const i = strikes.findIndex(s => this.age >= s && this.age < s + 0.16);
        if (i >= 0) {
          if (i !== lastSeg || Math.random() < 0.3) { path = bolt(w.pos(st), w.pos(targets[i]), w.R * 0.05); lastSeg = i; }
          w.flash = { color: STORM.purple, a: 0.1 };
        } else path = null;
      },
      draw(ctx, w, layer) {
        if (layer === 'hud' && say) caption(ctx, w, { owner: this, label: '⚡ STORM', text: 'Purple pride.', color: STORM.gold, k: this.age / this.dur });
        if (layer !== 'front' || !path) return;
        for (const [col, lw, blur] of [[STORM.purple, 6, 18], [STORM.gold, 1.6, 6]]) {
          ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.shadowColor = col; ctx.shadowBlur = blur;
          ctx.beginPath(); path.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.restore();
        }
      },
    });
  },
};

// ---- Homebrew: bubbles --------------------------------------------------------

const bubbles = {
  id: 'bubbles', weight: 2,
  create(w) {
    const hb = w.planet('homebrew');
    const list = [];
    const say = Math.random() < 0.4;
    let spawn = 0;
    return timed(4, {
      update(dt, w) {
        w.planetGlow.homebrew = env(this.age / this.dur) * 0.7;
        spawn -= dt;
        if (this.age < 2.6 && spawn <= 0) {
          const o = w.pos(hb);
          list.push({ x: o.x + rand(-6, 6), y: o.y - 4, vy: -rand(22, 48), r: rand(1.5, 4), ph: rand(0, TAU), life: rand(1, 1.8), age: 0 });
          spawn = rand(0.04, 0.12);
        }
        for (const b of list) { b.age += dt; b.y += b.vy * dt; b.x += Math.sin(b.age * 6 + b.ph) * 0.4; }
      },
      draw(ctx, w, layer) {
        if (layer === 'hud' && say) caption(ctx, w, { owner: this, label: '🍺 BREWDAY', text: 'Fermentation: vigorous.', color: '#d9a441', k: this.age / this.dur });
        if (layer !== 'front') return;
        for (const b of list) {
          const k = b.age / b.life;
          if (k < 1) {
            ctx.strokeStyle = `rgba(255,230,170,${0.8 * (1 - k * 0.5)})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, TAU); ctx.fill();
          } else if (k < 1.25) {  // pop
            ctx.strokeStyle = `rgba(255,230,170,${(1.25 - k) * 2})`;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + (k - 1) * 8), 0, TAU); ctx.stroke();
          }
        }
      },
    });
  },
};

// ---- Hyperspace: Millennium Falcon --------------------------------------------

function drawFalcon(ctx, x, y, s, engine) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(-13, 0, 0, -13, 0, 10);  // engine glow (rear, facing left)
  g.addColorStop(0, `rgba(160,210,255,${0.9 * engine})`); g.addColorStop(1, 'rgba(88,166,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-13, 0, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9ccd2';
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();  // hull
  ctx.fillRect(6, -6, 9, 4.5); ctx.fillRect(6, 1.5, 9, 4.5);  // mandibles
  ctx.fillStyle = '#9ea3ab'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(3, 10, 5, 2.4, 0.4, 0, TAU); ctx.fill();  // cockpit arm
  ctx.restore();
}

const hyperspace = {
  id: 'hyperspace', weight: 1.5, big: true,
  create(w) {
    const y = rand(0.15, 0.55) * w.H;
    return timed(3.6, {
      big: true,
      hit(x, yy) { return !this.tapOwner && this.age < 1.6 && near(this.p, x, yy, 34); },
      tap() { this.tapOwner = {}; this.tapAt = this.age; },
      update(dt, w) {
        const t = this.age;
        w.streak = t < 1.5 ? ease(t / 1.5) : t < 1.8 ? 1 : Math.max(0, 1 - (t - 1.8) / 1.0);
        if (t > 1.5 && t < 1.9) w.flash = { color: '#cfe6ff', a: 0.35 * (1 - (t - 1.5) / 0.4) };
      },
      draw(ctx, w, layer) {
        const t = this.age;
        if (layer === 'front' && t < 1.6) {
          const x = -40 + (w.W * 0.55) * Math.pow(t / 1.6, 2.2);
          this.p = { x, y };
          drawFalcon(ctx, x, y, Math.max(1, w.R / 200), clamp(t));
        }
        if (layer === 'hud' && this.tapOwner) caption(ctx, w, { owner: this.tapOwner, label: '✦ HAN', text: 'I\'ve got a bad feeling about this.', color: '#cfe6ff', k: clamp((t - this.tapAt) / (this.dur - this.tapAt)) });
        else if (layer === 'hud') caption(ctx, w, { owner: this, label: '✦', text: 'Punch it, Chewie.', color: '#cfe6ff', k: t / this.dur });
      },
    });
  },
};

// ---- Astrophage: the star dims (Project Hail Mary) ----------------------------

const astrophage = {
  id: 'astrophage', weight: 1, big: true,
  create(w) {
    const specks = Array.from({ length: 28 }, () => ({ a: rand(0, TAU), r: rand(0.3, 1.4), s: rand(0.6, 1.6), sp: rand(0.3, 0.9) }));
    return timed(7.5, {
      big: true,
      update(dt, w) {
        const t = this.age;
        w.sunDim = t < 2 ? ease(t / 2) * 0.8 : t < 4 ? 0.8 : Math.max(0, 0.8 * (1 - (t - 4) / 2));
      },
      draw(ctx, w, layer) {
        const t = this.age;
        if (layer === 'front') {
          const r0 = Math.max(7, w.R * 0.042) * 2.4;
          for (const p of specks) {
            const a = p.a + t * p.sp;
            ctx.fillStyle = `rgba(40,10,10,${0.7 * w.sunDim})`;
            ctx.beginPath(); ctx.arc(w.cx + Math.cos(a) * r0 * p.r, w.cy + Math.sin(a) * r0 * p.r * 0.7, p.s, 0, TAU); ctx.fill();
          }
        }
        if (layer === 'hud') {
          if (t < 4.8) caption(ctx, w, { owner: this, label: '🚀 HAIL MARY', text: '...Astrophage?', color: '#ff8a65', k: clamp((t - 1.2) / 3.6) });
          else caption(ctx, w, { owner: this, label: '🕷 ROCKY', text: 'Fist my bump. ✊', color: '#ff8a65', k: clamp((t - 4.8) / 2.7) });
        }
      },
    });
  },
};

// ---- Voyager 1 ------------------------------------------------------------------

const voyager = {
  id: 'voyager', weight: 1,
  create(w) {
    const x0 = rand(0.55, 0.8) * w.W, y0 = rand(0.55, 0.75) * w.H;
    const vx = rand(14, 22) * (Math.random() < 0.5 ? 1 : -1), vy = -rand(4, 10);
    const notes = [];
    return timed(9, {
      hit(x, y) { return near(this.p, x, y, 30); },
      tap(w) {
        this.tapOwner = {}; this.tapAt = this.age; this.dur = Math.max(this.dur, this.age + 4);
        this.track = pick(['Johnny B. Goode · Chuck Berry', 'Greetings in 55 languages', 'Brandenburg Concerto No. 2 · Bach', 'The sounds of Earth']);
        for (let i = 0; i < 8; i++) notes.push({ x: this.p.x, y: this.p.y, vx: rand(-20, 20), vy: -rand(20, 45), age: -i * 0.15, ch: pick(['♪', '♫', '♩']) });
      },
      update(dt) { for (const n of notes) { n.age += dt; if (n.age > 0) { n.x += n.vx * dt; n.y += n.vy * dt; } } },
      draw(ctx, w, layer) {
        if (layer === 'front') for (const n of notes) {
          if (n.age < 0 || n.age > 2.2) continue;
          ctx.font = '14px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(255,215,120,${1 - n.age / 2.2})`; ctx.fillText(n.ch, n.x, n.y);
        }
        if (layer === 'hud' && this.tapOwner) caption(ctx, w, { owner: this.tapOwner, label: '💿 GOLDEN RECORD', text: this.track, color: '#d4af37', k: clamp((this.age - this.tapAt) / 4) });
        if (layer !== 'sky') return;
        const k = this.age / this.dur, a = env(k, 0.15, 0.2);
        const x = x0 + vx * this.age, y = y0 + vy * this.age;
        this.p = { x, y: y + 4 };
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = `rgba(220,225,235,${a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();  // dish
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, 9); ctx.moveTo(-9, 6); ctx.lineTo(9, 6); ctx.stroke();  // boom + mag arm
        const glint = Math.exp(-Math.pow((k - 0.5) * 12, 2));  // the golden record catches the light
        const g = ctx.createRadialGradient(0, 4, 0, 0, 4, 10 * glint + 1);
        g.addColorStop(0, `rgba(255,215,120,${a * (0.4 + glint)})`); g.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 4, 10 * glint + 1, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(200,215,240,${0.55 * a})`;
        ctx.fillText('VOYAGER 1 · still phoning home', x, y + 22);
      },
    });
  },
};

// ---- Planet signatures (also in the director pool) -----------------------------

const approved = {
  id: 'approved', weight: 1.5,
  create(w) {
    const pay = w.planet('payments');
    const code = Math.random() < 0.85 ? ['APPROVED · 00', '#34d399'] : ['DECLINED · 51', '#e10600'];
    w.PLANETS.filter(p => p !== pay).sort(() => Math.random() - 0.5).slice(0, 3)
      .forEach((p, i) => setTimeout(() => w.spawnPacket(pay, p, 3, { color: code[1], speed: 0.7 }), i * 180));
    return timed(2.4, {
      update(dt, w, k) { w.planetGlow.payments = env(k) * 0.9; },
      draw(ctx, w, layer) {
        if (layer !== 'hud') return;
        const o = w.pos(pay), k = this.age / this.dur;
        shout(ctx, code[0], o.x, o.y - 26 - k * 14, code[1], env(k, 0.1, 0.35), 14);
      },
    });
  },
};

const homelab = {
  id: 'homelab', weight: 1.5,
  create(w) {
    const hl = w.planet('homelab');
    for (const p of w.PLANETS) if (p !== hl) w.spawnPacket(hl, p, 3, { color: '#34d399', speed: 0.8 });
    const leds = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * TAU, f: rand(4, 10), c: Math.random() < 0.8 ? '#34d399' : '#fbbf24' }));
    const msg = pick(['backup complete ✓', 'uptime 99.99%', 'all tiers green', 'scrub: 0 errors']);
    return timed(3, {
      update(dt, w, k) { w.planetGlow.homelab = env(k) * 0.8; },
      draw(ctx, w, layer) {
        const o = w.pos(hl), k = this.age / this.dur, a = env(k);
        if (layer === 'front') for (const l of leds) {
          if (Math.sin(this.age * l.f + l.a * 3) < 0) continue;
          ctx.fillStyle = rgba(l.c, a);
          ctx.beginPath(); ctx.arc(o.x + Math.cos(l.a) * 20, o.y + Math.sin(l.a) * 20 * 0.6, 1.6, 0, TAU); ctx.fill();
        }
        if (layer === 'hud') shout(ctx, msg, o.x, o.y - 30, '#34d399', a * 0.9, 12);
      },
    });
  },
};

const thinking = {
  id: 'thinking', weight: 1.2,
  create(w) {
    const ai = w.planet('ai');
    const order = [w.STAR, ...w.PLANETS.filter(p => p !== ai)].sort(() => Math.random() - 0.5);
    return timed(2.8, {
      update(dt, w, k) { w.planetGlow.ai = env(k) * 0.9; },
      draw(ctx, w, layer) {
        const o = w.pos(ai), k = this.age / this.dur, a = env(k, 0.1, 0.3);
        if (layer === 'front') order.forEach((n, i) => {
          const on = clamp((k * 1.6 - i * 0.12) * 4);  // links light up one by one
          if (on <= 0) return;
          const q = w.pos(n), fl = 0.5 + 0.5 * Math.sin(this.age * 20 + i);
          ctx.strokeStyle = rgba('#a78bfa', a * on * (0.25 + 0.35 * fl)); ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]); ctx.lineDashOffset = -this.age * 30;
          ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          ctx.setLineDash([]);
        });
        if (layer === 'hud') {
          const dots = '.'.repeat(1 + Math.floor(this.age * 3) % 3);
          shout(ctx, 'thinking' + dots, o.x, o.y - 26, '#a78bfa', a, 12);
        }
      },
    });
  },
};

const printing = {
  id: 'printing', weight: 1.2,
  create(w) {
    const pr = w.planet('printing');
    const layers = 14;
    return timed(3.4, {
      update(dt, w, k) { w.planetGlow.printing = env(k) * 0.8; },
      draw(ctx, w, layer) {
        const o = w.pos(pr), k = this.age / this.dur, a = env(k, 0.05, 0.25);
        const built = Math.min(layers, Math.floor(clamp(k / 0.7) * layers));
        if (layer === 'front') for (let i = 0; i < built; i++) {
          // a little vase-mode print growing up off the planet
          const rr = 7 + 3 * Math.sin((i / layers) * Math.PI * 1.2);
          ctx.strokeStyle = rgba('#22d3ee', a * (i === built - 1 ? 1 : 0.6)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(o.x, o.y - 10 - i * 2.2, rr, rr * 0.3, 0, 0, TAU); ctx.stroke();
        }
        if (layer === 'hud') shout(ctx, `layer ${built}/${layers}${built === layers ? ' ✓' : ''}`, o.x, o.y - 50, '#22d3ee', a, 11);
      },
    });
  },
};

// ---- Combos: what you get for mashing a planet ---------------------------------

// AI x5: HAL takes over the star.
const hal = {
  id: 'hal', weight: 0, big: true,
  create(w) {
    title('HAL 9000', '#ff2a2a', 3200);
    return timed(6.5, {
      kind: 'hal', big: true,
      update(dt, w, k) {
        const a = env(k, 0.15, 0.25);
        if (a > 0.02) w.sunTint = '#ff1a1a';
        w.sunGain = 1 + a * 0.5 + 0.08 * Math.sin(this.age * 3);
        w.planetGlow.ai = a;
      },
      draw(ctx, w, layer) {
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🔴 HAL', text: 'I\'m sorry, Bren. I\'m afraid I can\'t do that.', color: '#ff2a2a', k: this.age / this.dur });
      },
    });
  },
};

// Homelab x5: everything drops offline one by one. It was DNS.
const dns = {
  id: 'dns', weight: 0, big: true,
  create(w) {
    const order = [...w.PLANETS].sort(() => Math.random() - 0.5);
    let back = false;
    return timed(6, {
      kind: 'dns', big: true,
      update(dt, w) {
        const t = this.age;
        order.forEach((p, i) => {
          const off = clamp((t - i * 0.25) * 3) * (1 - clamp((t - 3.6 - i * 0.08) * 3));
          w.planetHide[p.id] = off;
        });
        w.sunDim = clamp((t - 1.2) * 2) * (1 - clamp((t - 3.4) * 2)) * 0.6;
        if (t > 3.6 && !back) {
          back = true;
          const hl = w.planet('homelab');
          for (const p of w.PLANETS) if (p !== hl) w.spawnPacket(hl, p, 3, { color: '#34d399', speed: 0.6 });
        }
      },
      draw(ctx, w, layer) {
        if (layer !== 'hud') return;
        const t = this.age;
        if (t < 3.5) caption(ctx, w, { owner: this, label: '🔥 HOMELAB', text: 'Everything is down.', color: '#e10600', k: t / 3.5 });
        else caption(ctx, w, { owner: this, label: '🔥 HOMELAB', text: 'It was DNS. It\'s always DNS.', color: '#34d399', k: (t - 3.5) / 2.5 });
      },
    });
  },
};

// Payments x5: the fraud engine has seen enough.
const blocked = {
  id: 'blocked', weight: 0, big: true,
  create(w) {
    title('DECLINED 05', '#e10600', 2600);
    const pay = w.planet('payments');
    w.PLANETS.forEach((p, i) => p !== pay && setTimeout(() => w.spawnPacket(p, pay, 3, { color: '#e10600', speed: 0.5 }), i * 90));
    return timed(5.5, {
      kind: 'blocked', big: true,
      update(dt, w, k) {
        const siren = (Math.sin(this.age * 10) + 1) / 2 * env(k);
        for (const p of w.PLANETS) w.planetGlow[p.id] = siren * 0.7;
        w.flash = { color: '#e10600', a: siren * 0.06 };
      },
      draw(ctx, w, layer) {
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🚨 FRAUD TEAM', text: 'Card blocked: unusual activity detected.', color: '#e10600', k: this.age / this.dur });
      },
    });
  },
};

// 3D printing x5: spaghetti.
const spaghetti = {
  id: 'spaghetti', weight: 0, big: true,
  create(w) {
    const pr = w.planet('printing');
    const strands = Array.from({ length: 22 }, () => ({ a: rand(0, TAU), len: rand(30, 90), wob: rand(4, 12), f: rand(0.08, 0.2), ph: rand(0, TAU), w: rand(0.8, 1.6) }));
    return timed(5, {
      kind: 'spaghetti', big: true,
      update(dt, w, k) { w.planetGlow.printing = env(k) * 0.7; },
      draw(ctx, w, layer) {
        const t = this.age, k = t / this.dur;
        if (layer === 'front') {
          const o = w.pos(pr), grow = ease(clamp(t / 1.8)), a = env(k, 0.05, 0.25);
          for (const st of strands) {
            ctx.strokeStyle = rgba('#22d3ee', 0.7 * a); ctx.lineWidth = st.w;
            ctx.beginPath();
            const L = st.len * grow * Math.max(0.8, w.R / 300);
            for (let d = 0; d <= L; d += 3) {
              const px = o.x + Math.cos(st.a) * d + Math.sin(d * st.f + st.ph + t * 2) * st.wob;
              const py = o.y + Math.sin(st.a) * d * 0.7 + Math.cos(d * st.f * 1.3 + st.ph) * st.wob;
              d ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.stroke();
          }
        }
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🖨 OCTOPRINT', text: 'Spaghetti detected. Print paused.', color: '#22d3ee', k });
      },
    });
  },
};

// Homebrew x5: every planet starts bubbling and the star goes amber.
const beeroclock = {
  id: 'beeroclock', weight: 0, big: true,
  create(w) {
    title('BEER O\'CLOCK', '#d9a441', 2600);
    const list = [];
    let spawn = 0;
    return timed(5.5, {
      kind: 'beeroclock', big: true,
      update(dt, w, k) {
        if (env(k) > 0.05) w.sunTint = '#f0b429';
        spawn -= dt;
        if (this.age < 4 && spawn <= 0) {
          const o = w.pos(pick([w.STAR, ...w.PLANETS]));
          list.push({ x: o.x + rand(-8, 8), y: o.y - 4, vy: -rand(25, 55), r: rand(1.5, 4.5), ph: rand(0, TAU), life: rand(1.2, 2), age: 0 });
          spawn = 0.025;
        }
        for (const b of list) { b.age += dt; b.y += b.vy * dt; b.x += Math.sin(b.age * 6 + b.ph) * 0.4; }
      },
      draw(ctx, w, layer) {
        if (layer === 'front') for (const b of list) {
          const k = b.age / b.life;
          if (k >= 1) continue;
          ctx.strokeStyle = `rgba(255,220,140,${0.8 * (1 - k * 0.6)})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
        }
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🍺 BREWDAY', text: 'It\'s beer o\'clock somewhere.', color: '#d9a441', k: this.age / this.dur });
      },
    });
  },
};

// Storm x5: a supercell. Bolts everywhere.
const supercell = {
  id: 'supercell', weight: 0, big: true,
  create(w) {
    title('PURPLE PRIDE', STORM.purple === '#632390' ? '#a46be0' : STORM.purple, 2600);
    const bolts = [];
    let next = 0;
    return timed(5, {
      kind: 'supercell', big: true,
      update(dt, w, k) {
        next -= dt;
        if (this.age < 4 && next <= 0) {
          const a = pick([w.STAR, ...w.PLANETS]); let b = pick([w.STAR, ...w.PLANETS]);
          while (b === a) b = pick([w.STAR, ...w.PLANETS]);
          bolts.push({ path: bolt(w.pos(a), w.pos(b), w.R * 0.06), age: 0 });
          next = rand(0.06, 0.2);
        }
        for (const b of bolts) b.age += dt;
        const live = bolts.filter(b => b.age < 0.15).length;
        if (live) w.flash = { color: STORM.purple, a: 0.05 + live * 0.03 };
        for (const p of w.PLANETS) w.planetGlow[p.id] = live ? 0.6 : 0;
      },
      draw(ctx, w, layer) {
        if (layer === 'front') for (const b of bolts) {
          if (b.age >= 0.15) continue;
          for (const [col, lw, blur] of [[STORM.purple, 5, 16], [STORM.gold, 1.4, 6]]) {
            ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.shadowColor = col; ctx.shadowBlur = blur;
            ctx.beginPath(); b.path.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.restore();
          }
        }
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '⚡ MELBOURNE STORM', text: 'Purple Pride.', color: STORM.gold, k: this.age / this.dur });
      },
    });
  },
};

// Star x5: supernova. Flash, shockwave, everything blasted with packets, then it settles.
const supernova = {
  id: 'supernova', weight: 0, big: true,
  create(w) {
    let blown = false;
    return timed(5.5, {
      kind: 'supernova', big: true,
      update(dt, w) {
        const t = this.age;
        if (t < 1.2) { w.sunGain = 1 + ease(t / 1.2) * 1.4; w.sunTint = t > 0.6 ? '#ffffff' : null; return; }
        if (!blown) {
          blown = true;
          for (let i = 0; i < 3; i++) for (const p of w.PLANETS) w.spawnPacket(w.STAR, p, 3, { color: pick(PALETTE), speed: 0.35 + i * 0.15, size: 3.2 });
        }
        const k = (t - 1.2) / 4.3;
        w.flash = { color: '#ffffff', a: Math.max(0, 0.7 - k * 4) };
        w.streak = Math.max(0, 0.35 - k);
        w.sunGain = 2.4 - ease(k) * 1.4;
        w.orbitGlow = Math.max(0, 1 - k * 2);
      },
      draw(ctx, w, layer) {
        const t = this.age;
        if (layer === 'front' && t > 1.2) {
          const k = (t - 1.2) / 2.2;
          if (k < 1) for (const [m, col] of [[1, '#ffffff'], [0.85, '#58a6ff'], [0.7, '#a78bfa']]) {
            const r = ease(k) * Math.max(w.W, w.H) * m;
            ctx.strokeStyle = rgba(col, (1 - k) * 0.6); ctx.lineWidth = 3 * (1 - k) + 1;
            ctx.beginPath(); ctx.ellipse(w.cx, w.cy, r, r * w.tilt, 0, 0, TAU); ctx.stroke();
          }
        }
        if (layer === 'hud' && t > 1.4) caption(ctx, w, { owner: this, label: '💥', text: 'Okay, maybe that was too many clicks.', color: '#ffffff', k: (t - 1.4) / 4.1 });
      },
    });
  },
};

// ---- More director events ----------------------------------------------------------

const ninenine = {
  id: 'ninenine', weight: 1.2,
  create(w) {
    const [t1, line] = pick([['NINE-NINE!', 'NINE-NINE!'], ['NOICE.', 'Noice. Toit.'], ['COOL COOL COOL', 'Cool cool cool cool cool. No doubt no doubt.']]);
    title(t1, '#fbbf24', 2200);
    return timed(4.5, {
      draw(ctx, w, layer) { if (layer === 'hud') caption(ctx, w, { owner: this, label: '🚓 99', text: line, color: '#fbbf24', k: this.age / this.dur }); },
    });
  },
};

const eagle = {
  id: 'eagle', weight: 1,
  create(w) {
    title('EAGLE!', '#22d3ee', 1800);
    const y0 = rand(0.15, 0.4) * w.H;
    const feathers = [];
    return timed(3.2, {
      fall: 0,
      hit(x, y) { return !this.downAt && near(this.p, x, y, 30); },
      tap(w) {
        this.downAt = this.age; this.tapOwner = {}; this.dur = Math.max(this.dur, this.age + 3);
        burst(feathers, this.p.x, this.p.y, ['#e6f1ff', '#cfe6ff'], 12, 40);
      },
      update(dt) { stepBurst(feathers, dt); if (this.downAt) this.fall += dt * 260 * (this.age - this.downAt + 0.3); },
      draw(ctx, w, layer) {
        if (layer === 'front') drawBurst(ctx, feathers);
        if (layer === 'hud' && this.tapOwner) { caption(ctx, w, { owner: this.tapOwner, label: '🩺 TURK', text: 'The eagle has... not landed.', color: '#22d3ee', k: clamp((this.age - this.downAt) / 3) }); return; }
        if (layer === 'front') {  // a little bird with very committed flapping
          const k = this.downAt ? this.downAt / 3.2 : this.age / 3.2, x = -30 + (w.W + 60) * k, flap = this.downAt ? 7 : Math.sin(this.age * 22) * 7;
          const y = y0 + this.fall;
          this.p = { x, y };
          ctx.strokeStyle = 'rgba(230,241,255,0.85)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - 12, y - flap); ctx.quadraticCurveTo(x - 5, y - 2, x, y); ctx.quadraticCurveTo(x + 5, y - 2, x + 12, y - flap); ctx.stroke();
        }
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🩺 J.D.', text: 'EAAAGLE!', color: '#22d3ee', k: this.age / this.dur });
      },
    });
  },
};

function drawEnterprise(ctx, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.fillStyle = '#c9cfd8';
  ctx.beginPath(); ctx.ellipse(10, 0, 14, 5, 0, 0, TAU); ctx.fill();                 // saucer
  ctx.fillRect(-2, 1, 8, 2.5);                                                       // neck
  ctx.beginPath(); ctx.ellipse(-8, 4, 10, 3, 0, 0, TAU); ctx.fill();                 // engineering hull
  ctx.fillRect(-22, -4, 16, 2.2); ctx.fillRect(-22, 8, 16, 2.2);                     // nacelles
  ctx.fillStyle = '#ff5a3c'; ctx.fillRect(-7, -4, 1.6, 2.2); ctx.fillRect(-7, 8, 1.6, 2.2);  // bussard collectors
  ctx.fillStyle = '#7fd4ff'; ctx.fillRect(-22, -4.6, 15, 0.9); ctx.fillRect(-22, 7.4, 15, 0.9);  // warp glow
  ctx.restore();
}

const enterprise = {
  id: 'enterprise', weight: 1, big: true,
  create(w) {
    const y = rand(0.12, 0.3) * w.H;
    const line = pick(['Engage.', 'Make it so.', 'Tea. Earl Grey. Hot.']);
    return timed(5.5, {
      big: true, shield: 0,
      hit(x, y) { return !this.alert && this.age < 3.4 && near(this.p, x, y, 40); },
      tap(w) { this.alert = true; this.shield = 1.2; this.tapOwner = {}; this.tapAt = this.age; },
      update(dt, w) {
        if (this.alert) {
          this.shield -= dt;
          w.flash = { color: '#ff1e1e', a: 0.06 * (Math.sin(this.age * 12) > 0 ? 1 : 0) };
          if (this.shield <= 0 && this.age < 3.6) this.age = 3.6;  // punch it
        }
        const t = this.age; if (t > 3.6 && t < 3.9) w.flash = { color: '#bfe6ff', a: 0.25 * (1 - (t - 3.6) / 0.3) }; },
      draw(ctx, w, layer) {
        const t = this.age, s = Math.max(1, w.R / 220);
        if (layer === 'front') {
          if (t < 3.6) {  // glide in, slow to a stop
            const x = -60 + (w.W * 0.35 + 60) * ease(t / 3);
            this.p = { x: x + 4 * s, y: y + 2 * s };
            drawEnterprise(ctx, x, y, s, clamp(t * 2));
            if (this.shield > 0) {
              ctx.strokeStyle = `rgba(120,200,255,${0.5 * clamp(this.shield)})`; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 34 * s, 17 * s, 0, 0, TAU); ctx.stroke();
            }
          } else if (t < 3.9) {  // stretch and gone
            const k = (t - 3.6) / 0.3, x = w.W * 0.35 + k * w.W;
            ctx.strokeStyle = `rgba(190,230,255,${1 - k})`; ctx.lineWidth = 3 * s;
            ctx.beginPath(); ctx.moveTo(w.W * 0.35 - 20, y); ctx.lineTo(x, y); ctx.stroke();
          }
        }
        if (layer === 'hud' && this.tapOwner) caption(ctx, w, { owner: this.tapOwner, label: '🖖 PICARD', text: 'Red alert! Shields up!', color: '#ff1e1e', k: clamp((t - this.tapAt) / 2.5) });
        else if (layer === 'hud') caption(ctx, w, { owner: this, label: '🖖 PICARD', text: line, color: '#7fd4ff', k: t / this.dur });
      },
    });
  },
};

const jwst = {
  id: 'jwst', weight: 1,
  create(w) {
    const x = rand(0.12, 0.88) * w.W, y = rand(0.08, 0.2) * w.H;
    // 18 hexes: centre ring of 6 and outer ring of 12, unfolding in from the sides.
    const hexes = [];
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
      const sx = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(sx)) > 2 || (q === 0 && r === 0)) continue;
      hexes.push({ q, r, side: q < -1 ? -1 : q > 1 ? 1 : 0 });
    }
    const field = [];
    return timed(6, {
      p: { x, y },
      hit(px, py) { return !this.tapOwner && near({ x, y }, px, py, 40); },
      tap(w) {
        this.tapOwner = {}; this.tapAt = this.age; this.dur = Math.max(this.dur, this.age + 4);
        for (let i = 0; i < 45; i++) field.push({ x: x + rand(-1, 1) * w.R * 0.5, y: y + rand(0.3, 1.6) * w.R * 0.25, r: rand(0.6, 2.4), c: pick(['#ffd27a', '#ff9a6b', '#cfe6ff', '#a78bfa', '#ffffff']), rot: rand(0, Math.PI), e: rand(0.3, 1) });
      },
      draw(ctx, w, layer) {
        const t = this.age, k = t / this.dur, a = env(k, 0.1, 0.2), hs = 3.2 * Math.max(1, w.R / 260);
        if (layer === 'sky' && this.tapOwner) {
          const fa = env((t - this.tapAt) / (this.dur - this.tapAt), 0.2, 0.3);
          for (const g of field) {
            ctx.fillStyle = rgba(g.c, 0.8 * fa);
            ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r * 2, g.r * 2 * g.e, g.rot, 0, TAU); ctx.fill();
          }
        }
        if (layer === 'hud' && this.tapOwner) { caption(ctx, w, { owner: this.tapOwner, label: '📸 JWST', text: 'First Deep Field: SMACS 0723. Galaxies for days.', color: '#d4af37', k: clamp((t - this.tapAt) / 4) }); return; }
        if (layer === 'sky') {
          for (const h of hexes) {
            const fold = h.side ? 1 - ease(clamp((t - 0.8) / 1.6)) : 0;  // wings fold in
            const hx = x + hs * 1.75 * (h.q + h.r / 2) + h.side * fold * hs * 3;
            const hy = y + hs * 1.5 * h.r - fold * hs * 2;
            const glint = Math.exp(-Math.pow((k - 0.6 - h.q * 0.03) * 10, 2));
            ctx.fillStyle = `rgba(${212 + 40 * glint},${175 + 60 * glint},${55 + 120 * glint},${0.85 * a})`;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) { const an = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(hx + Math.cos(an) * hs, hy + Math.sin(an) * hs); }
            ctx.closePath(); ctx.fill();
          }
        }
        if (layer === 'hud') caption(ctx, w, { owner: this, label: '🔭 JWST', text: '344 single points of failure. Zero failures.', color: '#d4af37', k });
      },
    });
  },
};

// Director pool.
export const EVENTS = [redbull, lightsout, ninenine, eagle, enterprise, jwst, hal, dns, blocked, spaghetti, beeroclock, supercell, supernova, radio, pendulum, pivot, iss, storm, bubbles, hyperspace, astrophage, voyager, approved, homelab, thinking, printing];

// Tap a planet -> its signature event. Tap the star -> the drop.
export const PLANET_EVENTS = {
  f1: combo(redbull, lightsout, 5, 0.4),
  storm: combo(storm, supercell),
  homebrew: combo(bubbles, beeroclock),
  payments: combo(approved, blocked),
  homelab: combo(homelab, dns),
  ai: combo(thinking, hal),
  printing: combo(printing, spaghetti),
  star: combo(pendulum, supernova),
};
