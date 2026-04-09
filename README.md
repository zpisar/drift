# Drift Pilot Manual

Drift is a minimalist deep-space lane survival game about timing, pressure, and surviving one more second.

Runs are short. Progression persists locally. Every run feeds permanent upgrades while run perks shape your next build.

## World Brief

Earth's high-tech civilization collapsed in a chain event.
You are a Drifter flying blind through unstable lanes, scavenging signal and scrap in hostile space.

Tone target: isolation, speed, and cosmic dread.

## Play Online

Play in your browser through GitHub Pages:

[Drift on GitHub Pages](https://zpisar.github.io/drift/)

## Control Protocol

- Press `Space` on desktop, or tap the playfield on touch devices.
- Each input switches between two lanes.
- Dodge incoming threats by moving to the safe lane.
- Survive longer to raise score and pressure.
- After game over, save your run to the top-10 leaderboard (`Drifter` is used if name is empty).

## HUD Readout

- `Score`: current run score.
- `Scrap`: scrap earned this run (`1 Scrap` every `20 score`).
- `Shields`: current run shield charges.
- `Active Perk`: active run perk (hover on desktop / tap on mobile for tooltip copy). Shows `(Charged)` while Paradox Lens is armed.
- `Event`: current world state (`Warmup`, `Cruise`, `Overdrive`, `Collapse`).
- `Best`: best locally saved score.

## Threat Catalog

- `Normal`: baseline lane blocker.
- `Heavy`: larger blocker with telegraph styling.
- `Phantom`: telegraphs, then swaps lane mid-approach.
- `Splitter`: telegraphs, then splits into two fragments across both lanes.
- `Splitter Fragment`: faster shard created by a Splitter split.

Scanner upgrades improve warning timing for Phantom swaps and Splitter splits.

## Scrap Economy And Upgrades

Scrap is permanent currency. At game over, run scrap is added to your saved total.

Upgrades can be purchased only between runs.

- `Flow`: boosts passive score gain.
- `Shield`: adds starting shield charges per level.
- `Scanner`: improves warning timing for advanced enemy behavior.
- `Hyperdrive`: consumable emergency phase-dash charge for lethal-hit recovery windows.

Core branches have `Lv 0` to `Lv 6` (`Flow`, `Shield`, `Scanner`).
`Hyperdrive` is charge-based, not level-based.

Upgrade costs by level:

- `Flow`: 3, 5, 8, 11, 16, 22 Scrap
- `Shield`: 2, 4, 7, 10, 14, 19 Scrap
- `Scanner`: 3, 5, 8, 11, 15, 20 Scrap
- `Hyperdrive`: 100 Scrap per charge (up to 2 ready)

## Run Perk Rotation

At game over you receive a `2-choice` perk offer for the next run.

Perk families:

- `Tempo`
- `Precision`
- `Safety`

Current perk pool:

- `Tempo - Afterburn Rhythm`: perfect dodges trigger short rhythm windows with slower spawns.
- `Tempo - Chaos Reactor`: extreme base speed pressure, tighter dodge timing, and a powerful slowdown pulse on perfect dodges.
- `Precision - Deadeye Line`: wider perfect-dodge window and extra dodge score with lower passive gain.
- `Precision - Paradox Lens`: perfect dodges charge your next lane switch. The next switch triggers a `Lane Blast` in the destination lane, consumes the charge, destroys up to 2 nearest incoming threats, and applies a short lane-only slow (`0.85x` for `1.0s`).
- `Safety - Guardrail Protocol`: +1 starting shield with calmer pace and lower perfect-dodge reward.
- `Safety - Emergency Stasis`: +2 starting shields with stronger slowdown pulse behavior, balanced by weaker economy tempo.
- `Safety - Last Signal`: the first otherwise-lethal hit per run is consumed, triggering an extended emergency time-dilation window (`2.7s`) and an instant `+1.5` score pulse instead of immediate game over.

Paradox Lens feedback flow:

- `Paradox Charged!`: charge armed for 3.0s after a perfect dodge.
- `Lane Blast xN! +X.X`: blast hit and bonus score awarded once.
- `Lane Blast Missed`: charge spent on switch but no valid targets in destination lane.
- `Paradox Faded`: charge expired before use.

## Perk Tree (Family Progression)

Perk choices also advance a persistent family tree:

- Families: `Tempo`, `Precision`, `Safety`
- Each family progresses from `Lv 0` to `Lv 3`
- At `Lv 3`, each family unlocks a permanent boost
- Tree nodes are read-only UI; progression comes from run perk selections

## Event Phases

Events define macro pacing and enemy pressure:

- `Warmup`: opening phase with lower speed and easier readability.
- `Cruise`: main pressure phase; heavy threats become common.
- `Overdrive`: faster movement and tighter spawn cadence.
- `Collapse`: maximum pressure state with peak speed/spawn intensity.
- `Surge!`: short burst event during Cruise/Overdrive that briefly spikes spawn tempo and movement speed.

After the first Collapse, phases can rotate between Cruise, Overdrive, and Collapse instead of ending immediately.

## Progression Depth

- Core upgrades: `3` branches x `6` levels (`18` total levels)
- Hyperdrive stock: `0` to `2` ready consumable charges
- Perk tree: `3` families x `3` levels with permanent family boosts
- Run perk pool: `7` perks across `3` families

## Local Play

Open `index.html` in a browser. No install step is required.

## Local Saves

Best score, latest submitted score, scrap, and upgrade levels are stored in browser `localStorage`.

## License

MIT
