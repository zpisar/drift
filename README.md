# Drift

Drift is a minimalist post-apocalyptic survival game about timing, pressure, and staying alive for one more second.

You pilot a survivor through two lanes while the world escalates from readable danger into full collapse. Runs are short, upgrades persist locally, and each retry gives you another chance to earn Scrap and push further.

## Play Online

Play in your browser through GitHub Pages:

[Drift on GitHub Pages](https://zpisar.github.io/drift/)

## How to Play

- Press `Space` on desktop, or tap the playfield on touch devices.
- Your action switches between the two lanes.
- Avoid incoming blocks by moving into the safe lane.
- Survive longer to increase your score.
- Enter your name after a run to save a top-10 score.

## HUD Guide

- `Score`: your current run score.
- `Scrap`: temporary Scrap earned this run. You earn 1 Scrap every 8 score.
- `Shields`: hit blocks available for the current run.
- `Active Perk`: the perk selected for this run.
- `Event`: the current world state: `Warmup`, `Cruise`, `Overdrive`, or `Collapse`.
- `Best`: your best locally saved score.

## Scrap And Upgrades

Scrap is the permanent upgrade currency. At game over, the Scrap earned during the run is added to your saved Scrap total.

Upgrades can be bought between runs, not during active play.

- `Flow`: increases score gain by 12% per level, which also helps earn Scrap faster.
- `Shield`: adds one hit block per level at the start of each run.

Upgrade costs increase by level:

- `Flow`: 2, 3, 5, 7, 10, 14 Scrap
- `Shield`: 2, 4, 6, 9, 12, 16 Scrap

## Run Perks

Before a run, choose one temporary perk for that run:

- `Precision Drift`: perfect dodges grant +1.0 bonus score.
- `Soft Launch`: starts the run with lower base speed for readability.
- `Pulse Step`: perfect dodges grant +0.6 bonus score, but base speed is higher.

## Events

Events describe how hostile the world is right now.

- `Warmup`: the opening phase. Blocks are slower and easier to read.
- `Cruise`: the main survival phase. Heavy blocks start appearing and pressure builds steadily.
- `Overdrive`: a dangerous high-speed phase. Blocks move faster and lane pressure increases.
- `Collapse`: the catastrophic phase. Movement is fastest, spawn pressure is capped, heavy blocks are more common, and the game is at its harshest.
- `Surge!`: a short popup-only spike that can happen during Cruise or Overdrive. Surge-spawned blocks arrive faster and move faster, but the Event HUD stays on the current phase.

After the first Collapse, the world can shift back down into Overdrive or briefly into Cruise before ramping up again. Warmup only happens at the start of a run.

## Local Play

Open `index.html` in a browser.

No install step is required.

## Local Saves

Best score, leaderboard entries, Scrap, and upgrades are stored in your browser with `localStorage`. They stay on your device and can be cleared by clearing site data for the page.

## License

MIT
