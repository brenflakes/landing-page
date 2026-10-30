# bren.id.au — v2 "one year" design spec

Status: draft from Bren's questionnaire, 30 Oct 2026. Nothing built yet.
Birthday: 26 Dec (first commit 2025-12-26).

## Concept

A solar system that is Bren. `bren.id.au` is the star; his interests orbit it as planets.
Packets still fly between planets, so the network-topology DNA of v1 carries over.
Mood: **chill and ambient — busy, never overwhelming.**

## Direction change (30 Oct, Bren): engaging, not rare

"I don't really want rare anymore, I want engaging, so stuff happens and it's obvious but add a
bit of randomness... I want people to be like hang on a sec." So: an event every 6-14 s, chosen at
random with no repeats in the last three, each with its own random variations, and **every planet
does its own thing when tapped** (the star triggers the Pendulum drop). Implemented in
`src/cosmos/events.js`; `?force=<id>` repeats one event for testing. The rarity tiers below are
kept as the original idea, now mostly superseded.

## The soul: rarity, not key combos

v1's easter eggs were never triggers. They were weighted randomness: a 5% amber packet, a 1%
red giant star, a title animation you only catch if you wait. v2 keeps that and deepens it into a
rarity table. Nothing is announced or documented on the page. No key combos.

| Tier | Roughly | Feel |
|---|---|---|
| Common | constantly | the ambient base layer |
| Uncommon | every minute or two | "huh, nice" |
| Rare | ~1 in 100 events | noticed by people who leave the tab open |
| Very rare | ~1 in 500 | worth a screenshot |
| Legendary | ~1 in 2,000+ | a handful of visitors ever |

## Planets (draft)

- **Payments** — the day job
- **Homelab** — racks, blinking lights
- **F1** — current Red Bull livery colours
- **3D printing** — layer lines
- **AI**
- **Homebrew** — bubbles rising off it
- **Melbourne Storm** — purple and gold

Pop culture (Brooklyn Nine-Nine, Friends, Star Wars, Scrubs, Project Hail Mary) lives in the
rarity events, not as planets.

## Rarity events (candidates)

**Common:** planet orbits, coloured packets between planets, starfield drift, title cycling.

**Uncommon:** shooting stars · amber packet · the ISS crossing with its blinking light ·
Hubble drifting past.

**Rare:**
- Red Bull car slingshots round the F1 planet
- Singapore night race: the F1 planet's floodlights come on (Bren has been four times)
- Parker Solar Probe skims the star
- Voyager drifting out, with a glint off the golden record
- New Horizons passes a small, distant, heart-marked Pluto
- A packet changes direction mid-flight to "PIVOT!" (Friends)
- Pendulum drop: everything pulses together at 174 BPM for one bar, then settles

**Very rare:**
- JWST unfolds its gold mirror
- The Millennium Falcon jumps to lightspeed
- The Enterprise-D goes to warp (for Patrick Stewart, died 28 Oct 2026)
- Astrophage: the star dims for a moment, then a small ship with a fist-bump flyby
  (Project Hail Mary)

**Legendary:** a team-radio style caption, very briefly, from a rotating pool:
- Max / Iceman lines ("Leave me alone, I know what I'm doing", "Simply lovely")
- "Is that Glock?"
- "inchident"
- The title decodes to "Nine-Nine!" or "cool cool cool" instead of `bren.id.au`, then corrects
  itself (B99)
- Scrubs: "Eagle!"

**Date-based:**
- 26 Dec — birthday: `uptime: 365 days` in the boot animation, firework packets from the star
- Storm game days — purple and gold packets boosted (fixtures hard-coded per season)
- F1 race weekends — the F1 planet glows

## Palette

Keep v1's dark space palette: electric blue `#58a6ff`, cyan `#22d3ee`, purple `#a78bfa`,
mint `#34d399`, rare amber `#fbbf24`.

Additions, reserved for their events so they stay special:

- Red Bull navy `#1e41ff`, red `#e10600`, yellow `#ffcc00`
- Storm purple `#632390`, gold `#ffc72c`
- JWST / golden-record gold `#d4af37`

## Type

No longer tied to monospace. That was a workaround for bugs in v1's glyph-by-glyph title.
The v2 title renders each character in its own fixed box, so proportional fonts animate cleanly.

Proposal: **Space Grotesk** for the title and headings, **Inter** for body copy, and
**JetBrains Mono** kept only for terminal or radio captions.

## Engineering

- **Mobile first**, portrait layout designed before desktop. Orbits scale to the viewport.
- **One canvas, one animation loop on refs.** No React state updates per frame (v1 made about
  six per frame, which is why phones suffered).
- Pause when the tab is hidden. Respect `prefers-reduced-motion`: static scene, no particles.
- The rarity table is a single data file, so events are easy to add, tune or retire.
- Debug override, not linked anywhere: `?force=<event>` previews an event for testing.
- Open Graph and Twitter meta tags for link previews.
- Bump React and Vite to current.

## Still open

- Is the contact card still right? Job title, the six links, whether X is still live.
- A line a stranger should remember.
- Anything off-limits.
