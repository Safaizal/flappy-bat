# Flappy Bat

A retro-styled Flappy Bird clone built with React + Vite. Instead of a bird you fly a
**bat that faces right**, weaving through pipe barriers and grabbing coins.

![stack](https://img.shields.io/badge/React-19-61dafb) ![vite](https://img.shields.io/badge/Vite-8-646cff)

## Run

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # production build → dist/
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Controls

| Input | Action |
|---|---|
| `Space` / `↑` / `W` / `Enter` | Flap · Start · Restart |
| Click or tap | Flap · Start · Restart |
| `P` / `Esc` | Pause / resume |
| `M` | Mute / unmute |

The game auto-pauses when the tab is hidden or the window loses focus.

## Gameplay

- Gravity pulls the bat down; a flap gives it an instant upward impulse. The ceiling is
  solid but harmless — only pipes and the ground kill you.
- The body rotates to follow its velocity, and the wings flap on every press.
- **Coins** sit in most pipe gaps. Each one you grab is worth a coin and a sparkle burst.
- Pipes speed up and gaps tighten the longer you survive.
- Best score and lifetime coin total persist in `localStorage`
  (`flappyBatBest`, `flappyBatCoins`), as does the mute preference.

## Architecture

Gameplay runs on a `<canvas>`; React owns the shell (HUD, overlays, buttons). The engine
holds all mutable state in one object and pushes a small snapshot to React **only when a
displayed value changes**, so there is no per-frame re-render.

```
src/
├── main.jsx            React entry
├── index.css           reset, base styles, CRT scanline + vignette
├── App.css             HUD, overlays, buttons, stage frame
├── App.jsx             React shell: canvas host, HUD, overlays, input
└── game/
    ├── config.js       every tunable constant in one place
    ├── engine.js       fixed-timestep loop, physics, spawns, collision, state machine
    ├── sprites.js      procedural canvas art: sky, hills, pipes, coins, the bat
    ├── particles.js    coin sparkles, flap dust, death poof
    └── audio.js        WebAudio sound effects (no asset files)
```

### The coordinate rule

Everything — pipes, bat, coins, ground, collision boxes — lives in **one logical
480 × 700 space** where `y = PLAY_H` (616) is the ground line. The canvas backing store is
scaled to whatever CSS size the stage gets, so the game is resolution independent and the
collision box always matches what is drawn.

> This is the bug that broke the previous DOM version: pipes and the bat were positioned
> with `bottom` against the full 700px screen while all the pipe math assumed a 620px play
> area, so every gap rendered ~80px away from its own hitbox.

### Timing

The loop is a fixed `1/60s` timestep with an accumulator (max 5 catch-up steps), so
physics are identical at 24, 60 or 144 fps. Pipes spawn on **distance travelled**, not on a
timer, so spacing stays constant as the game speeds up.

### Difficulty

| | start | limit |
|---|---|---|
| Speed | 188 px/s | 272 px/s (+7 every 5 points) |
| Gap | 172 px | 140 px (−5 every 6 points) |
| Pipe spacing | 268 px | 218 px (−8 every 4 points) |

Consecutive gaps never differ by more than 105px vertically, and gaps always keep a 64px
margin from the ceiling and the ground.

## Retro styling

- CRT scanline + vignette overlays
- Night sky with a moon, twinkling stars, drifting clouds and two parallax hill layers
- Scrolling grass and dirt ground
- Gold aura, squash-and-stretch and a two-layer (far/near) wing flap on the bat
- Screen shake and particle bursts on impact
- Press Start 2P from Google Fonts

## Testing

The game is verified headlessly by driving the real engine in Node: an autopilot bot plays
it through the actual `requestAnimationFrame` loop, and the drawn pipe geometry is compared
against the engine's own collision test. It checks the state machine, scoring, coin pickup,
gap-placement invariants, framerate independence and a clean unmount with zero console
errors.
