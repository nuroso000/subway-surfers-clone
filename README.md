# Subway Rush

An independently built Three.js browser runner inspired by Subway Surfers. This is not an official version or a reproduction of the original game's proprietary assets. All characters, models, textures and interface elements are authored locally.

## Start

```sh
npm install
npm run dev
```

## Validate and build

```sh
npm test
npm run build
npm run preview
```

## Controls

- Arrow keys / WASD: change lanes, jump, roll.
- Space / double-tap: activate one of three hoverboards per run.
- P / Escape: pause or resume.
- Touch: swipe or use the visible direction buttons.

## Features

- Three lanes, trains, oncoming traffic, low barriers, overhead barriers.
- Ramps, train roofs, jumping between roofs, airborne fast-roll.
- Hoverboards: 30 seconds of protection, consumed on one crash.
- Coin magnet, super sneakers, jetpack, and double distance score: 12 seconds each.
- Coin trails, pickup particles, optional synthesized sounds, increasing speed.
- Inspector and dog chase introduction, pause, game over, retry, two run missions.
- Three freely selectable runner colorways.
- Personal best, total coins and colorway stored only in local storage.
- Automatic pause when hidden, reduced optional motion, keyboard focus and touch controls.

## Structure

`src/game.js`: deterministic simulation, spawning, collisions and scoring; no rendering dependencies.
`src/world.js`: procedural models, batched environment geometry, scene and character animations.
`src/main.js`: interface, controls, persistence, audio and fixed-step simulation loop.
`src/game.test.js`: behavior tests for collisions, movement, ramps, powers and spawning.

Serve `dist/` using a static host. Map unknown paths to `404.html`. The development server listens only on localhost. This project has no backend, analytics, external API, or account system. Public deployment is not configured. The original game also has many systems not reproduced here, including its full character catalog, events, economy, social services and production assets.
