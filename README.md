# Drift

Drift is a minimalist post-apocalyptic lane survival game about timing, pressure, and staying alive for one more second.

Runs are short, progression persists locally, and each retry feeds long-term upgrades while your run perk choices shape a distinct build every attempt.

## Play Online

Play in your browser through GitHub Pages:

[Drift on GitHub Pages](https://zpisar.github.io/drift/)

## How to Play

- Press `Space` on desktop, or tap the playfield on touch devices.
- Each input switches between the two lanes.
- Dodge incoming threats by moving into the safe lane.
- Survive to raise score and difficulty.
- After game over, save your run to the top-10 leaderboard (`Drifter` is used if name is empty).

## HUD Guide

- `Score`: current run score.
- `Scrap`: Scrap earned this run. You earn `1 Scrap every 20 score`.
- `Shields`: current run shield charges.
- `Active Perk`: currently active run perk (hover on desktop / tap on mobile for tooltip copy). Shows `(Charged)` while Paradox Lens is armed.
- `Event`: current world state (`Warmup`, `Cruise`, `Overdrive`, `Collapse`).
- `Best`: best locally saved score.

## Enemies

- `Normal`: baseline fast lane blocker.
- `Heavy`: larger blocker with higher threat profile and telegraph styling.
- `Phantom`: lane-swap enemy that telegraphs before crossing lanes.
- `Splitter`: telegraphs then splits into two fragments across both lanes.
- `Splitter Fragment`: faster follow-up shard created by a Splitter split.

Scanner upgrades improve warning timing for Phantom swaps and Splitter splits.

## Scrap And Upgrades

Scrap is the permanent currency. At game over, run Scrap is added to your saved total.

Upgrades can be purchased only between runs.

- `Flow`: boosts passive score gain.
- `Shield`: adds starting shield charges per level.
- `Scanner`: improves warning timing for advanced enemy behavior.

Each upgrade branch has `Lv 0` to `Lv 6`.

Upgrade costs by level:

- `Flow`: 3, 5, 8, 11, 16, 22 Scrap
- `Shield`: 2, 4, 7, 10, 14, 19 Scrap
- `Scanner`: 3, 5, 8, 11, 15, 20 Scrap

## Run Perks

At game over you get a `2-choice` perk offer for the next run.

Perk families:

- `Tempo`
- `Precision`
- `Safety`

Current perk pool:

- `Tempo - Afterburn Rhythm`: perfect dodges trigger short rhythm windows with slower spawns.
- `Tempo - Chaos Reactor`: extreme base speed pressure, tighter dodge timing, and powerful slowdown pulse on perfect dodges.
- `Precision - Deadeye Line`: wider perfect-dodge window and extra dodge score with lower passive gain.
- `Precision - Paradox Lens`: perfect dodges charge your next lane switch. The next switch triggers a `Lane Blast` in the destination lane, consumes the charge, destroys up to 2 nearest incoming threats, and applies a short lane-only slow (`0.85x` for `1.0s`).
- `Safety - Guardrail Protocol`: +1 starting shield with calmer pace and lower perfect-dodge reward.
- `Safety - Emergency Stasis`: +2 starting shields with stronger slowdown pulse behavior, balanced by weaker economy tempo.

Paradox Lens feedback flow:

- `Paradox Charged!`: charge armed for 3.0s after a perfect dodge.
- `Lane Blast xN! +X.X`: blast hit and bonus score awarded once.
- `Lane Blast Missed`: charge spent on switch but no valid targets in destination lane.
- `Paradox Faded`: charge expired before use.

## Events

Events define macro pacing and enemy pressure:

- `Warmup`: opening phase with lower speed and easier readability.
- `Cruise`: main pressure phase; heavy threats become common.
- `Overdrive`: faster movement and tighter spawn cadence.
- `Collapse`: maximum pressure state with peak speed/spawn intensity.
- `Surge!`: short burst event during Cruise/Overdrive that briefly spikes spawn tempo and movement speed.

After the first Collapse, phases can rotate between Cruise/Overdrive/Collapse instead of ending immediately.

## Progression Depth

- Permanent progression: `3` branches x `6` levels (`18` total levels).
- Run perk pool: `6` perks across `3` families.

## Local Play

Open `index.html` in a browser. No install step is required.

## Local Saves

Best score, latest submitted score, Scrap, and upgrade levels are stored in browser `localStorage`.

## License

MIT
