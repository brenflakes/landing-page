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
function caption(ctx, w, { label, text, color = '#58a6ff', k, x, y, size = 13 }) {
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
    return caption(ctx, w, { label, text, color, k, x, y, size: Math.max(8, Math.floor(size * (w.W - 16) / bw)) });
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
  inst.update = (dt, w) => { inst.age += dt; u?.call(inst, dt, w, inst.age / dur); return inst.age < dur; };
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
    const radio = opts.quiet ? null : Math.random() < 0.6 ? pick(RADIO) : null;
    const trail = [];
    let prev = null;
    return timed(opts.dur || rand(5, 6.5), {
      kind: 'car',
      update(dt, w, k) {
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
        if (layer === 'hud' && radio) caption(ctx, w, { label: '📻 ' + radio[0], text: radio[1], color: RB.yellow, k: clamp(this.age / 4) });
        if (layer !== 'front' || !this.p) return;
        for (const [col, off, lw] of [[lv.trail[0], -1, 2], [lv.trail[1], 1, 1.2]]) {
          for (let i = 1; i < trail.length; i++) {
            ctx.strokeStyle = rgba(col, (i / trail.length) * 0.55); ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y + off); ctx.lineTo(trail[i].x, trail[i].y + off); ctx.stroke();
          }
        }
        drawCar(ctx, this.p.x, this.p.y, this.heading, Math.max(24, w.R * 0.1), lv);
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
        if (t >= go && t < go + 3) caption(ctx, w, { label: '🎙 CROFTY', text: 'IT\'S LIGHTS OUT AND AWAY WE GO!', color: '#ff1e1e', k: (t - go) / 3 });
        if (t >= go + raceDur * 0.75) caption(ctx, w, { label: '🏁 P1', text: 'MAX VERSTAPPEN. Simply lovely.', color: RB.yellow, k: clamp((t - go - raceDur * 0.75) / (this.dur - go - raceDur * 0.75)) });
      },
    });
  },
};

// Tapping F1: another car (in the next livery), or with four already out, the race start.
const f1tap = {
  id: 'f1tap', weight: 0, cooldown: 0.6,
  create(w) {
    if (w.count('car') >= 4 && !w.count('lightsout')) { w.fire(lightsout); return { update: () => false }; }
    return redbull.create(w);
  },
};

const radio = {
  id: 'radio', weight: 1.5,
  create(w) {
    const [who, line] = pick(RADIO);
    return timed(4.5, {
      update(dt, w, k) { w.planetGlow.f1 = env(k) * 0.8; },
      draw(ctx, w, layer) { if (layer === 'hud') caption(ctx, w, { label: '📻 ' + who, text: line, color: RB.yellow, k: this.age / this.dur }); },
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
      draw(ctx, w, layer) { if (layer === 'hud') caption(ctx, w, { label: '♪ NOW PLAYING', text: `Pendulum · ${track}`, color: '#22d3ee', k: this.age / this.dur }); },
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

const iss = {
  id: 'iss', weight: 2,
  create(w) {
    const ltr = Math.random() < 0.5;
    const y0 = rand(0.06, 0.2) * w.H, y1 = y0 + rand(-0.06, 0.08) * w.H;
    return timed(rand(7, 9), {
      draw(ctx, w, layer) {
        if (layer !== 'sky') return;
        const k = this.age / this.dur;
        const x = ltr ? -40 + (w.W + 80) * k : w.W + 40 - (w.W + 80) * k;
        const y = y0 + (y1 - y0) * k;
        const s = Math.max(1, w.R / 220);
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(200,210,230,0.9)'; ctx.fillRect(-11, -0.6, 22, 1.2);  // truss
        ctx.fillStyle = 'rgba(150,175,230,0.85)';
        for (const px of [-10, -6, 4, 8]) { ctx.fillRect(px, -5, 2.5, 4); ctx.fillRect(px, 1, 2.5, 4); }  // solar arrays
        ctx.fillStyle = 'rgba(235,235,240,1)'; ctx.fillRect(-2, -1.5, 4, 3);  // modules
        if (Math.floor(this.age * 1.5) % 2 === 0) { ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(11, 0, 1.3, 0, TAU); ctx.fill(); }
        ctx.restore();
        ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(200,215,240,${0.55 * env(k, 0.1, 0.1)})`;
        ctx.fillText('ISS · 27,600 km/h', x, y + 16 * s);
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
        if (layer === 'hud' && say) caption(ctx, w, { label: '⚡ STORM', text: 'Purple pride.', color: STORM.gold, k: this.age / this.dur });
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
        if (layer === 'hud' && say) caption(ctx, w, { label: '🍺 BREWDAY', text: 'Fermentation: vigorous.', color: '#d9a441', k: this.age / this.dur });
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
      update(dt, w) {
        const t = this.age;
        w.streak = t < 1.5 ? ease(t / 1.5) : t < 1.8 ? 1 : Math.max(0, 1 - (t - 1.8) / 1.0);
        if (t > 1.5 && t < 1.9) w.flash = { color: '#cfe6ff', a: 0.35 * (1 - (t - 1.5) / 0.4) };
      },
      draw(ctx, w, layer) {
        const t = this.age;
        if (layer === 'front' && t < 1.6) {
          const x = -40 + (w.W * 0.55) * Math.pow(t / 1.6, 2.2);
          drawFalcon(ctx, x, y, Math.max(1, w.R / 200), clamp(t));
        }
        if (layer === 'hud') caption(ctx, w, { label: '✦', text: 'Punch it, Chewie.', color: '#cfe6ff', k: t / this.dur });
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
          if (t < 4.8) caption(ctx, w, { label: '🚀 HAIL MARY', text: '...Astrophage?', color: '#ff8a65', k: clamp((t - 1.2) / 3.6) });
          else caption(ctx, w, { label: '🕷 ROCKY', text: 'Fist my bump. ✊', color: '#ff8a65', k: clamp((t - 4.8) / 2.7) });
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
    return timed(9, {
      draw(ctx, w, layer) {
        if (layer !== 'sky') return;
        const k = this.age / this.dur, a = env(k, 0.15, 0.2);
        const x = x0 + vx * this.age, y = y0 + vy * this.age;
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

// Director pool.
export const EVENTS = [redbull, lightsout, radio, pendulum, pivot, iss, storm, bubbles, hyperspace, astrophage, voyager, approved, homelab, thinking, printing];

// Tap a planet -> its signature event. Tap the star -> the drop.
export const PLANET_EVENTS = {
  f1: f1tap, storm, homebrew: bubbles, payments: approved, homelab, ai: thinking, printing, star: pendulum,
};
