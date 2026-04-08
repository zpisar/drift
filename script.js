const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const finalScoreEl = document.getElementById('final-score');
const playerEl = document.getElementById('player');
const obstaclesEl = document.getElementById('obstacles');
const overlayStart = document.getElementById('overlay-start');
const overlayOver = document.getElementById('overlay-over');
const startButton = document.getElementById('start-button');
const saveScoreButton = document.getElementById('save-score-button');
const restartButton = document.getElementById('restart-button');
const countdownEl = document.getElementById('countdown');
const playerNameEl = document.getElementById('player-name');
const scoreboardStatusEl = document.getElementById('scoreboard-status');
const scoreboardListEl = document.getElementById('scoreboard-list');
const scoreboardToggleButton = document.getElementById('scoreboard-toggle');
const scoreboardPanelEl = document.querySelector('.scoreboard.mobile-collapsible');
const feedbackEl = document.getElementById('feedback');
const frame = document.querySelector('.game-frame');
const hudScrapEl = document.getElementById('hud-scrap');
const hudShieldsEl = document.getElementById('hud-shields');
const hudPerkEl = document.getElementById('hud-perk');
const hudPerkItemEl = document.querySelector('.hud-item-perk');
const runScrapEarnedEl = document.getElementById('run-scrap-earned');
const hudEventEl = document.getElementById('hud-event');
const perkInfoCopyEl = document.getElementById('perk-info-copy');
const perkChoicesEl = document.getElementById('perk-choices');
const upgradePointsEl = document.getElementById('upgrade-points');
const flowLevelEl = document.getElementById('flow-level');
const shieldLevelEl = document.getElementById('shield-level');
const scannerLevelEl = document.getElementById('scanner-level');
const buyFlowButton = document.getElementById('buy-flow');
const buyShieldButton = document.getElementById('buy-shield');
const buyScannerButton = document.getElementById('buy-scanner');
const upgradesSubcopyEl = document.getElementById('upgrades-subcopy');
const upgradeStatusEl = document.getElementById('upgrade-status');
const upgradesToggleButton = document.getElementById('upgrades-toggle');
const upgradesPanelEl = document.querySelector('.upgrades.mobile-collapsible');
const saveStatusEl = document.getElementById('save-status');
const mobilePanelQuery = window.matchMedia('(max-width: 640px)');
let mobilePanelMode = null;
let lastPerkTooltipAt = 0;

const STORAGE_KEY = 'drift-best-score';
const PROGRESS_STORAGE_KEY = 'drift-progress';
const PROGRESS_SCHEMA_VERSION = 1;
const UPGRADE_KEY = 'drift-upgrades-v02';
const LATEST_SCORE_KEY = 'drift-latest-score-v01';
const LEADERBOARD_LIMIT = 10;
const UPGRADE_POINT_STEP = 20;
const UPGRADE_SCRAP_PER_STEP = 1;
const MAX_UPGRADE_LEVEL = 6;
const BASE_SPEED = 156;
const MIN_SPEED = 96;
const MAX_SPEED = 560;
const BASE_SPAWN_DELAY = 1.2;
const MIN_SPAWN_DELAY = 0.34;
const SURGE_UNLOCK_DIFFICULTY = 35;
const SURGE_COOLDOWN = 8;
const SURGE_DURATION = 2;
const SURGE_BURST_SPAWNS = 3;
const SURGE_SPAWN_DELAY_MULTIPLIER = 0.45;
const SURGE_OBSTACLE_SPEED_MULTIPLIER = 1.35;
const PARADOX_BLAST_MAX_TARGETS = 2;
const PARADOX_LANE_SLOW_DURATION = 1.0;
const PARADOX_LANE_SLOW_MULTIPLIER = 0.85;
const PARADOX_BLAST_HIT_DURATION = 0.14;
// Gameplay tuning grouped for quick balancing passes.
const SPAWN_FAIRNESS_TUNING = Object.freeze({
  earlyWindowDifficulty: 20,
  earlyLeadDistance: 220,
  midLeadDistance: 176,
  defaultLeadDistance: 140,
  earlyLanePressureStart: 0.34
});
const ENEMY_VARIETY_TUNING = Object.freeze({
  recentTypeWindow: 6,
  phantomUnlockDifficulty: 32,
  phantomMaxWeight: 0.2,
  phantomRecentCap: 1,
  phantomSwapTelegraphProgress: 0.28,
  phantomSwapProgress: 0.46,
  splitterUnlockDifficulty: 48,
  splitterMaxWeight: 0.16,
  splitterRecentCap: 1,
  splitterTelegraphProgress: 0.22,
  splitterSplitProgress: 0.36,
  splitterChildOffset: 84,
  splitterFragmentHitHalfWidth: 7,
  splitterFragmentSpeedMultiplier: 1.1
});
const EVADE_FEEDBACK_TUNING = Object.freeze({
  phantom: 'Phantom evaded!',
  splitter: 'Splitter evaded!',
  duration: 620
});
const FEEDBACK_DURATION_MULTIPLIER = 1.2;
const UPGRADE_COSTS = Object.freeze({
  flow: [3, 5, 8, 11, 16, 22],
  shield: [2, 4, 7, 10, 14, 19],
  scanner: [3, 5, 8, 11, 15, 20]
});
const UPGRADE_DEFS = Object.freeze([
  { id: 'flow', levelEl: flowLevelEl, buttonEl: buyFlowButton, maxLabel: 'Flow Maxed', buyLabel: 'Buy Flow' },
  { id: 'shield', levelEl: shieldLevelEl, buttonEl: buyShieldButton, maxLabel: 'Shield Maxed', buyLabel: 'Buy Shield' },
  { id: 'scanner', levelEl: scannerLevelEl, buttonEl: buyScannerButton, maxLabel: 'Scanner Maxed', buyLabel: 'Buy Scanner' }
]);
const PHASE_DURATIONS = Object.freeze({
  Cruise: [8, 12],
  Overdrive: [12, 18],
  Collapse: [8, 12]
});
const DEFAULT_PROGRESS = Object.freeze({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  bestScore: 0
});
const RUN_PERKS = [
  {
    id: 'tempo_afterburn',
    family: 'Tempo',
    name: 'Afterburn Rhythm',
    description: 'Perfect dodges trigger short rhythm windows with slower spawns.',
    perfectDodgeBonus: 0.35,
    baseSpeedOffset: 0,
    flowMultiplierOffset: 0,
    perfectDodgeWindowBonus: 0,
    startingShieldBonus: 0,
    tempoWindowDuration: 1.3,
    tempoSpawnDelayMultiplier: 1.16,
    tempoSpeedOffset: 12
  },
  {
    id: 'precision_deadeye',
    family: 'Precision',
    name: 'Deadeye Line',
    description: 'Wider perfect-dodge window and extra dodge score, but lower passive gain.',
    perfectDodgeBonus: 0.75,
    baseSpeedOffset: 0,
    flowMultiplierOffset: -0.08,
    perfectDodgeWindowBonus: 24,
    startingShieldBonus: 0,
    tempoWindowDuration: 0,
    tempoSpawnDelayMultiplier: 1,
    tempoSpeedOffset: 0
  },
  {
    id: 'safety_guardrail',
    family: 'Safety',
    name: 'Guardrail Protocol',
    description: 'Begin each run with +1 shield and calmer pace, but weaker perfect-dodge rewards.',
    perfectDodgeBonus: -0.15,
    baseSpeedOffset: -12,
    flowMultiplierOffset: -0.03,
    perfectDodgeWindowBonus: 8,
    startingShieldBonus: 1,
    tempoWindowDuration: 0,
    tempoSpawnDelayMultiplier: 1,
    tempoSpeedOffset: 0
  },
  {
    id: 'precision_paradox_lens',
    family: 'Precision',
    name: 'Paradox Lens',
    description: 'Perfect dodges charge your next lane switch. That switch blasts the destination lane.',
    perfectDodgeBonus: 0.35,
    baseSpeedOffset: 0,
    flowMultiplierOffset: -0.05,
    perfectDodgeWindowBonus: 14,
    startingShieldBonus: 0,
    tempoWindowDuration: 0,
    tempoSpawnDelayMultiplier: 1,
    tempoSpeedOffset: 0,
    paradoxWindowDuration: 3.0,
    paradoxRewindDistance: 220,
    paradoxBonusScore: 1.3
  },
  {
    id: 'tempo_chaos_reactor',
    family: 'Tempo',
    name: 'Chaos Reactor',
    description: 'Extremely high base speed and tighter dodge window, but perfect dodges trigger a long slowdown pulse with bonus score.',
    perfectDodgeBonus: 0.55,
    baseSpeedOffset: 120,
    flowMultiplierOffset: -0.02,
    perfectDodgeWindowBonus: -12,
    startingShieldBonus: 0,
    tempoWindowDuration: 1.7,
    tempoSpawnDelayMultiplier: 1.3,
    tempoSpeedOffset: -58
  },
  {
    id: 'safety_emergency_stasis',
    family: 'Safety',
    name: 'Emergency Stasis',
    description: 'Start with +2 shields and faster baseline pressure, but perfect dodges trigger a long emergency slowdown pulse.',
    perfectDodgeBonus: -0.1,
    baseSpeedOffset: 18,
    flowMultiplierOffset: -0.1,
    perfectDodgeWindowBonus: 6,
    startingShieldBonus: 2,
    tempoWindowDuration: 2.1,
    tempoSpawnDelayMultiplier: 1.4,
    tempoSpeedOffset: -92
  }
];
const HEAVY_OBSTACLE_DIFFICULTY_THRESHOLD = 25;
const HEAVY_OBSTACLE_MAX_WEIGHT = 0.35;
const HEAVY_OBSTACLE_RECENT_WINDOW = 4;
const HEAVY_OBSTACLE_RECENT_CAP = 1;
const HEAVY_OBSTACLE_COLLAPSE_MAX_WEIGHT = 0.65;
const HEAVY_OBSTACLE_COLLAPSE_RECENT_WINDOW = 5;
const HEAVY_OBSTACLE_COLLAPSE_RECENT_CAP = 2;
const NORMAL_OBSTACLE_PROFILE = Object.freeze({
  type: 'normal',
  hitHalfWidth: 9,
  speedMultiplier: 1,
  baseClasses: []
});
const HEAVY_OBSTACLE_PROFILE = Object.freeze({
  type: 'heavy',
  hitHalfWidth: 16,
  speedMultiplier: 0.84,
  baseClasses: ['is-heavy', 'is-telegraph']
});
const PHANTOM_OBSTACLE_PROFILE = Object.freeze({
  type: 'phantom',
  hitHalfWidth: 12,
  speedMultiplier: 0.9,
  baseClasses: ['is-heavy']
});
const SPLITTER_OBSTACLE_PROFILE = Object.freeze({
  type: 'splitter',
  hitHalfWidth: 13,
  speedMultiplier: 0.86,
  baseClasses: ['is-heavy']
});
const RECENT_SPAWN_TYPES_LIMIT = Math.max(
  HEAVY_OBSTACLE_COLLAPSE_RECENT_WINDOW,
  ENEMY_VARIETY_TUNING.recentTypeWindow
);

const SUPABASE_URL = 'https://csswxdyrfvmjgcnygmrp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8aa4QwHmN_5IEGrZ0xkR6g_gMuPbsiF';
const SCORE_TABLE = 'scores';
const supabaseClient = createSupabaseClient();

function readLegacyBestScore() {
  try {
    const legacyBest = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(legacyBest) ? legacyBest : DEFAULT_PROGRESS.bestScore;
  } catch (error) {
    return DEFAULT_PROGRESS.bestScore;
  }
}

function migrateProgress(rawProgress) {
  const progress =
    rawProgress && typeof rawProgress === 'object' && !Array.isArray(rawProgress)
      ? rawProgress
      : {};
  const bestFromProgress = Number(progress.bestScore);
  const bestScore = Number.isFinite(bestFromProgress)
    ? bestFromProgress
    : readLegacyBestScore();

  return {
    ...DEFAULT_PROGRESS,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    bestScore
  };
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) {
      return migrateProgress(null);
    }

    const parsed = JSON.parse(stored);
    return migrateProgress(parsed);
  } catch (error) {
    return migrateProgress(null);
  }
}

function saveProgress(progress) {
  const nextProgress = migrateProgress(progress);
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
    localStorage.setItem(STORAGE_KEY, String(nextProgress.bestScore));
  } catch (error) {
    // Ignore storage errors so gameplay can continue in restricted environments.
  }
  return nextProgress;
}

function loadLatestScore() {
  try {
    const raw = localStorage.getItem(LATEST_SCORE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const score = Number(parsed.score);
    if (!Number.isFinite(score)) {
      return null;
    }
    return {
      name: String(parsed.name || 'Drifter'),
      score
    };
  } catch (error) {
    return null;
  }
}

function persistLatestScore(scoreEntry) {
  try {
    localStorage.setItem(LATEST_SCORE_KEY, JSON.stringify(scoreEntry));
  } catch (error) {
    // Ignore storage errors so the shared leaderboard still works.
  }
}

function loadUpgrades() {
  const fallback = { points: 0, flow: 0, shield: 0, scanner: 0 };
  try {
    const raw = localStorage.getItem(UPGRADE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return sanitizeUpgrades(parsed);
  } catch (error) {
    return fallback;
  }
}

function sanitizeUpgrades(raw) {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw
      : {};
  return {
    points: Math.max(0, Math.floor(Number(source.points) || 0)),
    flow: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, Math.floor(Number(source.flow) || 0))),
    shield: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, Math.floor(Number(source.shield) || 0))),
    scanner: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, Math.floor(Number(source.scanner) || 0)))
  };
}

function persistUpgrades() {
  try {
    localStorage.setItem(UPGRADE_KEY, JSON.stringify(state.upgrades));
  } catch (error) {
    // Ignore storage errors so gameplay can continue in restricted environments.
  }
}

const initialProgress = loadProgress();
const initialLatestScore = loadLatestScore();

const state = {
  mode: 'start',
  lane: 1,
  score: 0,
  latestSubmittedScore: initialLatestScore,
  difficultyScore: 0,
  best: initialProgress.bestScore,
  progress: initialProgress,
  lastTime: 0,
  spawnTimer: 0,
  spawnDelay: BASE_SPAWN_DELAY,
  speed: BASE_SPEED,
  obstacles: [],
  graceTime: 0.9,
  lastSpawnLane: null,
  countdown: 0,
  savedScore: false,
  switchPulseTimeout: null,
  feedbackTimeout: null,
  scoreFlashTimeout: null,
  goTimeout: null,
  runShieldCharges: 0,
  upgrades: loadUpgrades(),
  perkChoices: [],
  selectedPerkId: null,
  activePerkId: null,
  runPerkState: {
    perfectDodgeBonus: 0,
    baseSpeedOffset: 0,
    flowMultiplierOffset: 0,
    perfectDodgeWindowBonus: 0,
    startingShieldBonus: 0,
    tempoWindowDuration: 0,
    tempoSpawnDelayMultiplier: 1,
    tempoSpeedOffset: 0,
    paradoxWindowDuration: 0,
    paradoxRewindDistance: 0,
    paradoxBonusScore: 0
  },
  perkTempoTimer: 0,
  precisionParadoxTimer: 0,
  recentSpawnTypes: [],
  eventLabel: 'Warmup',
  eventPhase: 'Warmup',
  eventPhaseTimer: 0,
  hasEnteredCollapse: false,
  surgeCooldown: SURGE_COOLDOWN,
  surgeTimer: 0,
  surgeBurstSpawns: 0,
  surgeSpawnTimerBoosted: false,
  scannerCueCooldown: 0,
  paradoxChargeVisualActive: false,
  paradoxLaneSlow: {
    lane: null,
    timer: 0,
    multiplier: 1
  },
  lastPerkOfferKey: null,
  nextEvadeGroupId: 1,
  evadeGroupRemaining: {}
};

if (hudPerkEl) {
  hudPerkEl.tabIndex = 0;
}

bestEl.textContent = state.best.toFixed(1);
resetProgressionUi();
renderLeaderboard();
positionPlayer();
renderUpgrades();
syncMobilePanels(true);

function createSupabaseClient() {
  if (
    !window.supabase ||
    SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
    SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY'
  ) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function laneTop(laneIndex) {
  const rect = frame.getBoundingClientRect();
  return laneIndex === 0 ? rect.height * 0.25 : rect.height * 0.75;
}

function positionPlayer() {
  playerEl.style.top = `${laneTop(state.lane)}px`;
}

function setMode(mode) {
  state.mode = mode;
  overlayStart.classList.toggle('is-visible', mode === 'start' || mode === 'countdown');
  overlayOver.classList.toggle('is-visible', mode === 'gameover');
  syncParadoxChargeState();
  renderUpgrades();
}

function setMobilePanelState(panelRoot, button, expanded) {
  if (!panelRoot || !button) {
    return;
  }

  panelRoot.classList.toggle('is-open', expanded);
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = expanded
    ? (button.dataset.openLabel || 'Hide')
    : (button.dataset.closedLabel || 'Show');
}

function syncMobilePanels(forceDefault = false) {
  const isMobile = mobilePanelQuery.matches;
  const isInitialMobile = mobilePanelMode === null && isMobile;
  const enteredMobile = mobilePanelMode === false && isMobile;

  if (isMobile) {
    if (forceDefault || isInitialMobile || enteredMobile) {
      setMobilePanelState(scoreboardPanelEl, scoreboardToggleButton, false);
      setMobilePanelState(upgradesPanelEl, upgradesToggleButton, false);
    }
  } else {
    setMobilePanelState(scoreboardPanelEl, scoreboardToggleButton, true);
    setMobilePanelState(upgradesPanelEl, upgradesToggleButton, true);
  }

  mobilePanelMode = isMobile;
}

function currentPerk() {
  return RUN_PERKS.find((perk) => perk.id === state.activePerkId) ?? null;
}

function selectedPerk() {
  return RUN_PERKS.find((perk) => perk.id === state.selectedPerkId) ?? null;
}

function activePerkTooltipText() {
  const perk = currentPerk();
  if (!perk) {
    return 'No active perk selected for this run.';
  }
  return `${perk.family} - ${perk.name}: ${perk.description}`;
}

function isParadoxChargeActive() {
  return state.mode === 'playing' && state.runPerkState.paradoxWindowDuration > 0 && state.precisionParadoxTimer > 0;
}

function syncParadoxChargeState() {
  const paradoxChargeActive = isParadoxChargeActive();
  playerEl.classList.toggle('is-paradox-charged', paradoxChargeActive);
  if (state.paradoxChargeVisualActive !== paradoxChargeActive) {
    state.paradoxChargeVisualActive = paradoxChargeActive;
    syncActivePerkHud();
  }
}

function syncActivePerkHud() {
  if (!hudPerkEl) {
    return;
  }
  const perk = currentPerk();
  const chargedSuffix = perk && state.paradoxChargeVisualActive ? ' (Charged)' : '';
  hudPerkEl.textContent = perk ? `${perk.name}${chargedSuffix}` : 'None';
  hudPerkEl.title = activePerkTooltipText();
}

function applySelectedPerk() {
  const perk = selectedPerk();
  state.activePerkId = perk ? perk.id : null;
  state.runPerkState = {
    perfectDodgeBonus: perk ? perk.perfectDodgeBonus : 0,
    baseSpeedOffset: perk ? perk.baseSpeedOffset : 0,
    flowMultiplierOffset: perk ? perk.flowMultiplierOffset : 0,
    perfectDodgeWindowBonus: perk ? perk.perfectDodgeWindowBonus : 0,
    startingShieldBonus: perk ? perk.startingShieldBonus : 0,
    tempoWindowDuration: perk ? perk.tempoWindowDuration : 0,
    tempoSpawnDelayMultiplier: perk ? perk.tempoSpawnDelayMultiplier : 1,
    tempoSpeedOffset: perk ? perk.tempoSpeedOffset : 0,
    paradoxWindowDuration: perk ? perk.paradoxWindowDuration || 0 : 0,
    paradoxRewindDistance: perk ? perk.paradoxRewindDistance || 0 : 0,
    paradoxBonusScore: perk ? perk.paradoxBonusScore || 0 : 0
  };
  state.perkTempoTimer = 0;
  state.precisionParadoxTimer = 0;
  state.paradoxChargeVisualActive = false;
  syncParadoxChargeState();
  syncActivePerkHud();
}

function perkOfferKey(perks) {
  return perks
    .map((perk) => perk.id)
    .sort()
    .join('|');
}

function rollPerkChoices() {
  if (RUN_PERKS.length <= 2) {
    state.perkChoices = [...RUN_PERKS];
    state.lastPerkOfferKey = perkOfferKey(state.perkChoices);
  } else {
    const pairs = [];
    for (let i = 0; i < RUN_PERKS.length; i += 1) {
      for (let j = i + 1; j < RUN_PERKS.length; j += 1) {
        pairs.push([RUN_PERKS[i], RUN_PERKS[j]]);
      }
    }

    let candidatePairs = pairs;
    if (state.lastPerkOfferKey) {
      const nonRepeatingPairs = pairs.filter((pair) => perkOfferKey(pair) !== state.lastPerkOfferKey);
      if (nonRepeatingPairs.length > 0) {
        candidatePairs = nonRepeatingPairs;
      }
    }

    const pickedPair = candidatePairs[Math.floor(Math.random() * candidatePairs.length)] ?? pairs[0];
    state.perkChoices = [...pickedPair];
    state.lastPerkOfferKey = perkOfferKey(state.perkChoices);
  }

  if (!state.perkChoices.some((perk) => perk.id === state.selectedPerkId)) {
    state.selectedPerkId = state.perkChoices[0]?.id ?? null;
  }
}

function renderPerkChoices() {
  if (!perkChoicesEl) {
    return;
  }

  perkChoicesEl.innerHTML = '';
  state.perkChoices.forEach((perk) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-secondary perk-choice';
    button.setAttribute('aria-pressed', String(perk.id === state.selectedPerkId));
    button.innerHTML = `<strong>${perk.family}: ${perk.name}${perk.id === state.selectedPerkId ? ' (Selected)' : ''}</strong><span>${perk.description}</span>`;
    button.addEventListener('click', () => {
      state.selectedPerkId = perk.id;
      renderPerkChoices();
      if (perkInfoCopyEl) {
        perkInfoCopyEl.textContent = `${perk.name} selected for the next run.`;
      }
    });
    perkChoicesEl.appendChild(button);
  });
}

function resetProgressionUi() {
  if (hudEventEl) {
    hudEventEl.textContent = state.eventLabel;
  }
  if (hudScrapEl) {
    hudScrapEl.textContent = '0';
  }
  if (hudShieldsEl) {
    hudShieldsEl.textContent = '0';
  }
  syncActivePerkHud();
  if (runScrapEarnedEl) {
    runScrapEarnedEl.textContent = '0';
  }
  if (perkInfoCopyEl) {
    const perk = currentPerk();
    perkInfoCopyEl.textContent = perk ? `${perk.name} active this run.` : 'No active perk this run.';
  }
}

function scrapEarnedFromScore(score) {
  const steps = Math.max(0, Math.floor(score / UPGRADE_POINT_STEP));
  return steps * UPGRADE_SCRAP_PER_STEP;
}

function upgradeCost(type) {
  const costTable = UPGRADE_COSTS[type];
  if (!costTable) {
    return Infinity;
  }
  return costTable[state.upgrades[type]] ?? Infinity;
}

function canPurchase(type) {
  const canBuyBetweenRuns = state.mode === 'start' || state.mode === 'gameover';
  return canBuyBetweenRuns && state.upgrades[type] < MAX_UPGRADE_LEVEL && state.upgrades.points >= upgradeCost(type);
}

function renderUpgrades() {
  if (!upgradePointsEl) {
    return;
  }
  if (upgradesSubcopyEl) {
    upgradesSubcopyEl.textContent = 'Permanent';
  }
  if (upgradeStatusEl) {
    upgradeStatusEl.textContent = `Earn ${UPGRADE_SCRAP_PER_STEP} scrap every ${UPGRADE_POINT_STEP} score`;
  }
  upgradePointsEl.textContent = String(state.upgrades.points);
  UPGRADE_DEFS.forEach((upgrade) => {
    if (!upgrade.levelEl || !upgrade.buttonEl) {
      return;
    }
    upgrade.levelEl.textContent = `Lv ${state.upgrades[upgrade.id]}`;
    upgrade.buttonEl.disabled = !canPurchase(upgrade.id);
    upgrade.buttonEl.textContent = state.upgrades[upgrade.id] >= MAX_UPGRADE_LEVEL
      ? upgrade.maxLabel
      : `${upgrade.buyLabel} (${upgradeCost(upgrade.id)} Scrp)`;
  });
}

function purchaseUpgrade(type) {
  if (!canPurchase(type)) {
    return;
  }
  state.upgrades.points -= upgradeCost(type);
  state.upgrades[type] += 1;
  persistUpgrades();
  renderUpgrades();
}

function resetGame() {
  state.lane = 1;
  state.score = 0;
  state.difficultyScore = 0;
  state.lastTime = 0;
  state.spawnTimer = 0;
  state.spawnDelay = BASE_SPAWN_DELAY;
  state.speed = BASE_SPEED;
  state.obstacles = [];
  state.graceTime = 0.9;
  state.lastSpawnLane = null;
  state.recentSpawnTypes = [];
  state.countdown = 0;
  state.savedScore = false;
  state.eventLabel = 'Warmup';
  state.eventPhase = 'Warmup';
  state.eventPhaseTimer = 0;
  state.hasEnteredCollapse = false;
  state.surgeCooldown = SURGE_COOLDOWN;
  state.surgeTimer = 0;
  state.surgeBurstSpawns = 0;
  state.surgeSpawnTimerBoosted = false;
  state.precisionParadoxTimer = 0;
  state.scannerCueCooldown = 0;
  state.paradoxLaneSlow = { lane: null, timer: 0, multiplier: 1 };
  state.nextEvadeGroupId = 1;
  state.evadeGroupRemaining = {};
  state.latestSubmittedScore = loadLatestScore();
  applySelectedPerk();
  state.runShieldCharges = state.upgrades.shield + state.runPerkState.startingShieldBonus;
  clearTimeout(state.switchPulseTimeout);
  clearTimeout(state.feedbackTimeout);
  clearTimeout(state.scoreFlashTimeout);
  clearTimeout(state.goTimeout);
  playerEl.classList.remove('is-switching');
  playerEl.classList.remove('is-near-miss');
  playerEl.classList.remove('is-paradox-charged');
  countdownEl.textContent = '';
  countdownEl.classList.remove('is-go');
  countdownEl.classList.remove('is-pop');
  feedbackEl.textContent = '';
  feedbackEl.classList.remove('is-visible');
  scoreEl.classList.remove('is-flashing');
  overlayOver.classList.remove('is-saved');
  if (saveStatusEl) {
    saveStatusEl.hidden = true;
    saveStatusEl.textContent = '';
  }
  scoreboardStatusEl.textContent = supabaseClient ? '' : 'Configure Supabase to enable the shared leaderboard.';
  saveScoreButton.disabled = false;
  obstaclesEl.innerHTML = '';
  scoreEl.textContent = '0.0';
  if (hudScrapEl) {
    hudScrapEl.textContent = '0';
  }
  positionPlayer();
  resetProgressionUi();
  renderUpgrades();
}

function startGame() {
  resetGame();
  state.countdown = 3;
  setMode('countdown');
  requestAnimationFrame(loop);
}

function gameOver() {
  setMode('gameover');
  overlayOver.classList.remove('is-saved');
  if (saveStatusEl) {
    saveStatusEl.hidden = true;
    saveStatusEl.textContent = '';
  }
  finalScoreEl.textContent = state.score.toFixed(1);
  if (runScrapEarnedEl) {
    runScrapEarnedEl.textContent = String(scrapEarnedFromScore(state.score));
  }
  if (state.score > state.best) {
    state.best = state.score;
    state.progress = saveProgress({
      ...state.progress,
      bestScore: state.best
    });
    bestEl.textContent = state.best.toFixed(1);
  }
  playerNameEl.value = '';
  playerNameEl.focus();
  window.setTimeout(() => {
    playerNameEl.focus({ preventScroll: true });
  }, 80);
  window.setTimeout(() => playerNameEl.focus(), 80);
  const earnedPoints = scrapEarnedFromScore(state.score);
  if (earnedPoints > 0) {
    state.upgrades.points += earnedPoints;
    persistUpgrades();
    renderUpgrades();
    showFeedback(`+${earnedPoints} Scrap`);
  }

  rollPerkChoices();
  renderPerkChoices();
  const pendingPerk = selectedPerk();
  if (perkInfoCopyEl) {
    perkInfoCopyEl.textContent = pendingPerk
      ? `${pendingPerk.name} selected for the next run.`
      : 'Choose one perk for your next run.';
  }

  renderUpgrades();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

async function fetchLeaderboard() {
  if (!supabaseClient) {
    scoreboardStatusEl.textContent = 'Configure Supabase to enable the shared leaderboard.';
    return [];
  }

  scoreboardStatusEl.textContent = 'Loading scores...';
  const { data, error } = await supabaseClient
    .from(SCORE_TABLE)
    .select('name, score')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    scoreboardStatusEl.textContent = 'Could not load leaderboard.';
    return [];
  }

  scoreboardStatusEl.textContent = '';
  return data ?? [];
}

async function renderLeaderboard() {
  const entries = await fetchLeaderboard();
  const visibleEntries = entries.slice(0, LEADERBOARD_LIMIT);
  const latest = state.latestSubmittedScore;
  const latestIsVisible = latest && visibleEntries.some((entry) => (
    String(entry.name) === latest.name &&
    Number(entry.score).toFixed(1) === latest.score.toFixed(1)
  ));

  if (visibleEntries.length === 0 && !latest) {
    scoreboardListEl.innerHTML = '<li class="score-row"><span class="score-name">No scores yet</span><span class="score-value">-</span></li>';
    return;
  }

  const rows = visibleEntries.map((entry, index) => (
    `<li class="score-row"><span class="score-name">${index + 1}. ${escapeHtml(entry.name)}</span><span class="score-value">${Number(entry.score).toFixed(1)}</span></li>`
  ));

  if (latest && !latestIsVisible) {
    rows.push(`<li class="score-row"><span class="score-name">Your latest: ${escapeHtml(latest.name)}</span><span class="score-value">${latest.score.toFixed(1)}</span></li>`);
  }

  scoreboardListEl.innerHTML = rows.join('');
}

async function submitScore() {
  if (state.savedScore || state.mode !== 'gameover') {
    return true;
  }

  const name = playerNameEl.value.trim() || 'Drifter';
  if (!supabaseClient) {
    scoreboardStatusEl.textContent = 'Add Supabase credentials in script.js to save scores online.';
    return false;
  }

  scoreboardStatusEl.textContent = 'Saving score...';
  saveScoreButton.disabled = true;

  const score = Number(state.score.toFixed(1));
  const { error } = await supabaseClient.from(SCORE_TABLE).insert({
    name,
    score
  });

  saveScoreButton.disabled = false;

  if (error) {
    scoreboardStatusEl.textContent = 'Could not save score.';
    return false;
  }

  state.savedScore = true;
  state.latestSubmittedScore = { name, score };
  persistLatestScore(state.latestSubmittedScore);
  overlayOver.classList.add('is-saved');
  if (saveStatusEl) {
    saveStatusEl.textContent = 'Your survival has been saved!';
    saveStatusEl.hidden = false;
  }
  playerNameEl.blur();
  await renderLeaderboard();
  scoreboardStatusEl.textContent = 'Score saved.';
  return true;
}

function canControlGameplay() {
  return state.mode === 'playing';
}

function flashScoreLabel() {
  scoreEl.classList.remove('is-flashing');
  clearTimeout(state.scoreFlashTimeout);
  scoreEl.classList.add('is-flashing');
  state.scoreFlashTimeout = setTimeout(() => {
    scoreEl.classList.remove('is-flashing');
  }, 180);
}

function showFeedback(message, duration = 560) {
  const scaledDuration = Math.max(140, Math.round(duration * FEEDBACK_DURATION_MULTIPLIER));
  feedbackEl.textContent = message;
  feedbackEl.classList.remove('is-visible');
  clearTimeout(state.feedbackTimeout);
  requestAnimationFrame(() => {
    feedbackEl.classList.add('is-visible');
  });
  state.feedbackTimeout = setTimeout(() => {
    feedbackEl.classList.remove('is-visible');
  }, scaledDuration);
}

function triggerCountdownPop() {
  countdownEl.classList.remove('is-pop');
  void countdownEl.offsetWidth;
  countdownEl.classList.add('is-pop');
}

function triggerScannerCue(message) {
  if (state.upgrades.scanner <= 0 || state.scannerCueCooldown > 0) {
    return;
  }
  state.scannerCueCooldown = 0.75;
  showFeedback(message, 680);
}

function triggerNearMissFeedback() {
  playerEl.classList.remove('is-near-miss');
  playerEl.classList.add('is-near-miss');
  clearTimeout(state.switchPulseTimeout);
  state.switchPulseTimeout = setTimeout(() => {
    playerEl.classList.remove('is-switching');
    playerEl.classList.remove('is-near-miss');
  }, 130);
}

function awardPerfectDodge() {
  const perfectDodgeBonus = 0.5 + state.runPerkState.perfectDodgeBonus;
  state.score += perfectDodgeBonus;
  scoreEl.textContent = state.score.toFixed(1);
  flashScoreLabel();
  triggerNearMissFeedback();
  showFeedback(`Perfect Dodge +${perfectDodgeBonus.toFixed(1)}`);
  if (state.runPerkState.tempoWindowDuration > 0) {
    state.perkTempoTimer = state.runPerkState.tempoWindowDuration;
  }
  if (state.runPerkState.paradoxWindowDuration > 0) {
    state.precisionParadoxTimer = state.runPerkState.paradoxWindowDuration;
    showFeedback('Paradox Charged!', 760);
  }
  syncParadoxChargeState();
}

function triggerPrecisionParadox() {
  if (state.precisionParadoxTimer <= 0) {
    return;
  }
  state.precisionParadoxTimer = 0;
  syncParadoxChargeState();

  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;

  const targets = state.obstacles
    .filter((obstacle) => {
      if (obstacle.lane !== state.lane || obstacle.blastTimer > 0) {
        return false;
      }
      const laneDistance = obstacle.x - playerX;
      return laneDistance >= -24;
    })
    .sort((a, b) => (a.x - playerX) - (b.x - playerX))
    .slice(0, PARADOX_BLAST_MAX_TARGETS);

  state.paradoxLaneSlow = {
    lane: state.lane,
    timer: PARADOX_LANE_SLOW_DURATION,
    multiplier: PARADOX_LANE_SLOW_MULTIPLIER
  };

  if (targets.length === 0) {
    showFeedback('Lane Blast Missed', 760);
    return;
  }

  targets.forEach((targetObstacle) => {
    targetObstacle.blastTimer = PARADOX_BLAST_HIT_DURATION;
    targetObstacle.swapTelegraphed = false;
    targetObstacle.splitTelegraphed = false;
    targetObstacle.el.classList.remove('is-entering');
    targetObstacle.el.classList.remove('is-telegraph');
    targetObstacle.el.classList.add('is-paradox-blast');
  });

  const paradoxBonus = state.runPerkState.paradoxBonusScore;
  state.score += paradoxBonus;
  scoreEl.textContent = state.score.toFixed(1);
  flashScoreLabel();
  showFeedback(`Lane Blast x${targets.length}! +${paradoxBonus.toFixed(1)}`, 820);
}

function checkPerfectDodge(previousLane) {
  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;
  const dodgeWindow = 48 + state.runPerkState.perfectDodgeWindowBonus;

  const closeThreat = state.obstacles.find((obstacle) => {
    if (obstacle.lane !== previousLane || obstacle.perfectDodged) {
      return false;
    }
    const obstacleFront = obstacle.x + obstacle.hitHalfWidth;
    return obstacleFront >= playerX - dodgeWindow && obstacleFront <= playerX + dodgeWindow;
  });

  if (closeThreat) {
    closeThreat.perfectDodged = true;
    awardPerfectDodge();
  }
}

function toggleLane() {
  const previousLane = state.lane;
  state.lane = state.lane === 0 ? 1 : 0;
  positionPlayer();
  playerEl.classList.remove('is-switching');
  clearTimeout(state.switchPulseTimeout);
  playerEl.classList.add('is-switching');
  state.switchPulseTimeout = setTimeout(() => {
    playerEl.classList.remove('is-switching');
  }, 110);
  if (previousLane !== state.lane) {
    triggerPrecisionParadox();
    checkPerfectDodge(previousLane);
  }
}

function rememberSpawnType(type) {
  state.recentSpawnTypes.push(type);
  if (state.recentSpawnTypes.length > RECENT_SPAWN_TYPES_LIMIT) {
    state.recentSpawnTypes.shift();
  }
}

function countRecentSpawnType(type, windowSize) {
  const recentTypes = state.recentSpawnTypes.slice(-windowSize);
  return recentTypes.filter((entry) => entry === type).length;
}

function defaultEvadeCueType(profileType) {
  if (profileType === PHANTOM_OBSTACLE_PROFILE.type) {
    return 'phantom';
  }
  if (profileType === SPLITTER_OBSTACLE_PROFILE.type) {
    return 'splitter';
  }
  return null;
}

function nextEvadeGroupId() {
  const groupId = state.nextEvadeGroupId;
  state.nextEvadeGroupId += 1;
  return groupId;
}

function hasTrackedEvadeGroup(groupId) {
  return Object.prototype.hasOwnProperty.call(state.evadeGroupRemaining, groupId);
}

function registerObstacleEvadeTracking(obstacleState) {
  if (obstacleState.evadeCueType !== 'splitter') {
    return;
  }
  if (!Number.isInteger(obstacleState.evadeCueGroupId)) {
    obstacleState.evadeCueGroupId = nextEvadeGroupId();
  }
  const tracked = state.evadeGroupRemaining[obstacleState.evadeCueGroupId] ?? 0;
  state.evadeGroupRemaining[obstacleState.evadeCueGroupId] = tracked + 1;
}

function consumeSplitterEvadeMember(obstacle, triggerFeedback) {
  if (!Number.isInteger(obstacle.evadeCueGroupId)) {
    return;
  }
  if (!hasTrackedEvadeGroup(obstacle.evadeCueGroupId)) {
    return;
  }
  const remaining = state.evadeGroupRemaining[obstacle.evadeCueGroupId] - 1;
  if (remaining > 0) {
    state.evadeGroupRemaining[obstacle.evadeCueGroupId] = remaining;
    return;
  }
  delete state.evadeGroupRemaining[obstacle.evadeCueGroupId];
  if (triggerFeedback) {
    showFeedback(EVADE_FEEDBACK_TUNING.splitter, EVADE_FEEDBACK_TUNING.duration);
  }
}

function resolveObstacleRemoval(obstacle, wasEvaded) {
  if (obstacle.evadeCueType === 'phantom' && wasEvaded) {
    showFeedback(EVADE_FEEDBACK_TUNING.phantom, EVADE_FEEDBACK_TUNING.duration);
    return;
  }
  if (obstacle.evadeCueType === 'splitter') {
    if (wasEvaded) {
      consumeSplitterEvadeMember(obstacle, true);
      return;
    }
    delete state.evadeGroupRemaining[obstacle.evadeCueGroupId];
  }
}

function removeObstacleAt(index, wasEvaded) {
  const obstacle = state.obstacles[index];
  if (!obstacle) {
    return;
  }
  resolveObstacleRemoval(obstacle, wasEvaded);
  obstacle.el.remove();
  state.obstacles.splice(index, 1);
}

function spawnLeadDistance() {
  const dynamicLeadDistance = state.speed * 0.42;
  if (state.difficultyScore < SPAWN_FAIRNESS_TUNING.earlyWindowDifficulty) {
    return Math.max(SPAWN_FAIRNESS_TUNING.earlyLeadDistance, dynamicLeadDistance + 48);
  }
  if (state.difficultyScore < SURGE_UNLOCK_DIFFICULTY) {
    return Math.max(SPAWN_FAIRNESS_TUNING.midLeadDistance, dynamicLeadDistance + 24);
  }
  return Math.max(SPAWN_FAIRNESS_TUNING.defaultLeadDistance, dynamicLeadDistance);
}

function hasEarlyLaneSaturation(frameWidth) {
  if (state.difficultyScore >= SPAWN_FAIRNESS_TUNING.earlyWindowDifficulty) {
    return false;
  }

  const pressureStartX = frameWidth * SPAWN_FAIRNESS_TUNING.earlyLanePressureStart;
  let topLaneThreat = false;
  let bottomLaneThreat = false;

  state.obstacles.forEach((obstacle) => {
    if (obstacle.x < pressureStartX) {
      return;
    }
    if (obstacle.lane === 0) {
      topLaneThreat = true;
      return;
    }
    bottomLaneThreat = true;
  });

  return topLaneThreat && bottomLaneThreat;
}

function canSpawnObstacleNow(frameWidth) {
  const rightmostObstacleX = state.obstacles.reduce(
    (maxX, obstacle) => Math.max(maxX, obstacle.x),
    Number.NEGATIVE_INFINITY
  );
  if (Number.isFinite(rightmostObstacleX) && rightmostObstacleX > frameWidth - spawnLeadDistance()) {
    return false;
  }
  if (hasEarlyLaneSaturation(frameWidth)) {
    return false;
  }
  return true;
}

function buildObstacleElement(lane, x, classNames) {
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle is-entering';
  classNames.forEach((className) => obstacle.classList.add(className));
  obstacle.dataset.lane = String(lane);
  obstacle.style.top = `${laneTop(lane)}px`;
  obstacle.style.left = `${x}px`;
  obstaclesEl.appendChild(obstacle);
  return obstacle;
}

function addObstacleInstance(profile, lane, x, options = {}) {
  const classNames = options.baseClasses ?? profile.baseClasses ?? [];
  const obstacle = buildObstacleElement(lane, x, classNames);
  const evadeCueType = options.evadeCueType ?? defaultEvadeCueType(profile.type);
  const obstacleState = {
    el: obstacle,
    lane,
    x,
    spawnX: x,
    age: options.age ?? 0,
    perfectDodged: false,
    type: options.type ?? profile.type,
    hitHalfWidth: options.hitHalfWidth ?? profile.hitHalfWidth,
    speedMultiplier: options.speedMultiplier ?? profile.speedMultiplier,
    eventSpeedMultiplier:
      options.eventSpeedMultiplier ??
      (state.surgeSpawnTimerBoosted ? SURGE_OBSTACLE_SPEED_MULTIPLIER : 1),
    evadeCueType,
    evadeCueGroupId: options.evadeCueGroupId ?? null,
    blastTimer: options.blastTimer ?? 0,
    hasSwapped: Boolean(options.hasSwapped),
    swapTelegraphed: Boolean(options.swapTelegraphed),
    hasSplit: Boolean(options.hasSplit),
    splitTelegraphed: Boolean(options.splitTelegraphed)
  };
  registerObstacleEvadeTracking(obstacleState);
  state.obstacles.push(obstacleState);

  if (options.trackSpawnType !== false) {
    rememberSpawnType(profile.type);
  }

  return obstacleState;
}

function spawnObstacle() {
  const frameWidth = frame.getBoundingClientRect().width;
  if (!canSpawnObstacleNow(frameWidth)) {
    return false;
  }

  const profile = pickObstacleProfile();
  const lane = pickLane();
  addObstacleInstance(profile, lane, frameWidth + 20);
  return true;
}

function obstacleTravelProgress(obstacle, playerX) {
  const totalTravelDistance = Math.max(1, obstacle.spawnX - playerX);
  return clamp((obstacle.spawnX - obstacle.x) / totalTravelDistance, 0, 1);
}

function updatePhantomObstacle(obstacle, playerX) {
  if (obstacle.type !== PHANTOM_OBSTACLE_PROFILE.type || obstacle.hasSwapped) {
    return;
  }

  const travelProgress = obstacleTravelProgress(obstacle, playerX);
  const scannerAssist = state.upgrades.scanner * 0.03;
  const telegraphProgress = clamp(
    ENEMY_VARIETY_TUNING.phantomSwapTelegraphProgress - scannerAssist,
    0.12,
    0.5
  );
  const swapProgress = clamp(
    ENEMY_VARIETY_TUNING.phantomSwapProgress + scannerAssist * 0.85,
    telegraphProgress + 0.12,
    0.88
  );

  if (!obstacle.swapTelegraphed && travelProgress >= telegraphProgress) {
    obstacle.swapTelegraphed = true;
    obstacle.el.classList.add('is-telegraph');
    triggerScannerCue('Scanner: Phantom incoming!');
  }

  if (travelProgress >= swapProgress) {
    obstacle.hasSwapped = true;
    obstacle.swapTelegraphed = false;
    obstacle.lane = obstacle.lane === 0 ? 1 : 0;
    obstacle.el.dataset.lane = String(obstacle.lane);
    obstacle.el.style.top = `${laneTop(obstacle.lane)}px`;
    obstacle.el.classList.remove('is-telegraph');
  }
}

function splitObstacleIntoFragments(obstacle) {
  if (obstacle.hasSplit) {
    return;
  }

  obstacle.hasSplit = true;
  obstacle.splitTelegraphed = false;
  obstacle.type = 'splitter_fragment';
  obstacle.hitHalfWidth = ENEMY_VARIETY_TUNING.splitterFragmentHitHalfWidth;
  obstacle.speedMultiplier *= ENEMY_VARIETY_TUNING.splitterFragmentSpeedMultiplier;
  obstacle.el.classList.remove('is-heavy', 'is-telegraph');
  obstacle.el.classList.add('is-entering');

  const splitLane = obstacle.lane === 0 ? 1 : 0;
  const splitChildX = obstacle.x + ENEMY_VARIETY_TUNING.splitterChildOffset;
  addObstacleInstance(SPLITTER_OBSTACLE_PROFILE, splitLane, splitChildX, {
    type: 'splitter_fragment',
    hitHalfWidth: ENEMY_VARIETY_TUNING.splitterFragmentHitHalfWidth,
    speedMultiplier: obstacle.speedMultiplier,
    eventSpeedMultiplier: obstacle.eventSpeedMultiplier,
    evadeCueType: obstacle.evadeCueType,
    evadeCueGroupId: obstacle.evadeCueGroupId,
    baseClasses: [],
    trackSpawnType: false
  });
}

function updateSplitterObstacle(obstacle, playerX) {
  if (obstacle.type !== SPLITTER_OBSTACLE_PROFILE.type || obstacle.hasSplit) {
    return;
  }

  const travelProgress = obstacleTravelProgress(obstacle, playerX);
  const scannerAssist = state.upgrades.scanner * 0.03;
  const telegraphProgress = clamp(
    ENEMY_VARIETY_TUNING.splitterTelegraphProgress - scannerAssist,
    0.1,
    0.45
  );
  const splitProgress = clamp(
    ENEMY_VARIETY_TUNING.splitterSplitProgress + scannerAssist * 0.8,
    telegraphProgress + 0.1,
    0.86
  );

  if (!obstacle.splitTelegraphed && travelProgress >= telegraphProgress) {
    obstacle.splitTelegraphed = true;
    obstacle.el.classList.add('is-telegraph');
    triggerScannerCue('Scanner: Splitter incoming!');
  }

  if (travelProgress >= splitProgress) {
    splitObstacleIntoFragments(obstacle);
  }
}

function updateObstacleBehavior(obstacle, playerX) {
  if (obstacle.type === PHANTOM_OBSTACLE_PROFILE.type) {
    updatePhantomObstacle(obstacle, playerX);
    return;
  }
  if (obstacle.type === SPLITTER_OBSTACLE_PROFILE.type) {
    updateSplitterObstacle(obstacle, playerX);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function progressBetween(value, start, end) {
  return clamp((value - start) / (end - start), 0, 1);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function setEventPhase(phase) {
  state.eventPhase = phase;
  state.eventLabel = phase;
  const duration = PHASE_DURATIONS[phase];
  state.eventPhaseTimer = duration ? randomBetween(duration[0], duration[1]) : 0;
}

function pickNextEventPhase() {
  if (state.eventPhase === 'Collapse') {
    return 'Overdrive';
  }

  if (state.eventPhase === 'Cruise') {
    return 'Overdrive';
  }

  const roll = Math.random();
  if (roll < 0.45) {
    return 'Collapse';
  }
  if (roll < 0.7) {
    return 'Cruise';
  }
  return 'Overdrive';
}

function updateEventPhase(dt) {
  const difficulty = state.difficultyScore;

  if (!state.hasEnteredCollapse) {
    if (difficulty < 20) {
      setEventPhase('Warmup');
      return;
    }
    if (difficulty < 55) {
      setEventPhase('Cruise');
      return;
    }
    if (difficulty < 90) {
      setEventPhase('Overdrive');
      return;
    }
    state.hasEnteredCollapse = true;
    setEventPhase('Collapse');
    return;
  }

  state.eventPhaseTimer = Math.max(0, state.eventPhaseTimer - dt);
  if (state.eventPhaseTimer <= 0) {
    setEventPhase(pickNextEventPhase());
  } else {
    state.eventLabel = state.eventPhase;
  }
}

function pickBaseObstacleProfile() {
  if (state.difficultyScore < HEAVY_OBSTACLE_DIFFICULTY_THRESHOLD) {
    return NORMAL_OBSTACLE_PROFILE;
  }

  const isCollapse = state.eventPhase === 'Collapse';
  const recentWindow = isCollapse ? HEAVY_OBSTACLE_COLLAPSE_RECENT_WINDOW : HEAVY_OBSTACLE_RECENT_WINDOW;
  const recentCap = isCollapse ? HEAVY_OBSTACLE_COLLAPSE_RECENT_CAP : HEAVY_OBSTACLE_RECENT_CAP;
  const heavyCount = countRecentSpawnType(HEAVY_OBSTACLE_PROFILE.type, recentWindow);
  if (heavyCount >= recentCap) {
    return NORMAL_OBSTACLE_PROFILE;
  }

  const heavyProgress = progressBetween(state.difficultyScore, HEAVY_OBSTACLE_DIFFICULTY_THRESHOLD, 90);
  const phaseBonus = isCollapse
    ? 0.28
    : state.eventPhase === 'Overdrive'
      ? 0.12
      : state.hasEnteredCollapse && state.eventPhase === 'Cruise'
        ? -0.12
        : 0;
  const heavyMaxWeight = isCollapse ? HEAVY_OBSTACLE_COLLAPSE_MAX_WEIGHT : 0.5;
  const heavyWeight = clamp(lerp(0.1, HEAVY_OBSTACLE_MAX_WEIGHT, heavyProgress) + phaseBonus, 0.1, heavyMaxWeight);
  return Math.random() < heavyWeight ? HEAVY_OBSTACLE_PROFILE : NORMAL_OBSTACLE_PROFILE;
}

function canSpawnPhantom() {
  if (state.eventPhase === 'Warmup') {
    return false;
  }
  if (state.difficultyScore < ENEMY_VARIETY_TUNING.phantomUnlockDifficulty) {
    return false;
  }
  return countRecentSpawnType(PHANTOM_OBSTACLE_PROFILE.type, ENEMY_VARIETY_TUNING.recentTypeWindow)
    < ENEMY_VARIETY_TUNING.phantomRecentCap;
}

function canSpawnSplitter() {
  if (state.eventPhase !== 'Overdrive' && state.eventPhase !== 'Collapse') {
    return false;
  }
  if (state.difficultyScore < ENEMY_VARIETY_TUNING.splitterUnlockDifficulty) {
    return false;
  }
  if (state.surgeTimer > 0) {
    return false;
  }
  return countRecentSpawnType(SPLITTER_OBSTACLE_PROFILE.type, ENEMY_VARIETY_TUNING.recentTypeWindow)
    < ENEMY_VARIETY_TUNING.splitterRecentCap;
}

function pickSpecialObstacleProfile() {
  if (canSpawnSplitter()) {
    const splitterProgress = progressBetween(state.difficultyScore, ENEMY_VARIETY_TUNING.splitterUnlockDifficulty, 95);
    const splitterPhaseBonus = state.eventPhase === 'Collapse' ? 0.06 : 0.03;
    const splitterWeight = clamp(
      lerp(0.05, ENEMY_VARIETY_TUNING.splitterMaxWeight, splitterProgress) + splitterPhaseBonus,
      0.05,
      ENEMY_VARIETY_TUNING.splitterMaxWeight
    );
    if (Math.random() < splitterWeight) {
      return SPLITTER_OBSTACLE_PROFILE;
    }
  }

  if (canSpawnPhantom()) {
    const phantomProgress = progressBetween(state.difficultyScore, ENEMY_VARIETY_TUNING.phantomUnlockDifficulty, 92);
    const phantomPhaseBonus = state.eventPhase === 'Collapse' ? 0.05 : state.eventPhase === 'Overdrive' ? 0.03 : 0;
    const phantomWeight = clamp(
      lerp(0.06, ENEMY_VARIETY_TUNING.phantomMaxWeight, phantomProgress) + phantomPhaseBonus,
      0.06,
      ENEMY_VARIETY_TUNING.phantomMaxWeight
    );
    if (Math.random() < phantomWeight) {
      return PHANTOM_OBSTACLE_PROFILE;
    }
  }

  return null;
}

function pickObstacleProfile() {
  const specialProfile = pickSpecialObstacleProfile();
  if (specialProfile) {
    return specialProfile;
  }
  return pickBaseObstacleProfile();
}

function pickLane() {
  if (state.lastSpawnLane === null) {
    state.lastSpawnLane = Math.random() < 0.5 ? 0 : 1;
    return state.lastSpawnLane;
  }

  const baseSameLaneChance = state.difficultyScore < 20 ? 0.56 : state.difficultyScore < 40 ? 0.48 : 0.44;
  const phaseLanePressure = state.eventPhase === 'Collapse' ? 0.2 : state.eventPhase === 'Overdrive' ? 0.08 : 0;
  const maxSameLaneChance = state.eventPhase === 'Collapse' ? 0.68 : 0.58;
  const sameLaneChance = clamp(baseSameLaneChance + phaseLanePressure, 0.35, maxSameLaneChance);
  const lane = Math.random() < sameLaneChance ? state.lastSpawnLane : (state.lastSpawnLane === 0 ? 1 : 0);
  state.lastSpawnLane = lane;
  return lane;
}

function currentIntensityState() {
  const difficulty = state.difficultyScore;

  if (state.hasEnteredCollapse) {
    if (state.eventPhase === 'Cruise') {
      return {
        label: 'Cruise',
        speed: 350,
        spawnDelay: 0.58
      };
    }

    if (state.eventPhase === 'Overdrive') {
      return {
        label: 'Overdrive',
        speed: 500,
        spawnDelay: 0.36
      };
    }

    return {
      label: 'Collapse',
      speed: MAX_SPEED,
      spawnDelay: MIN_SPAWN_DELAY
    };
  }

  if (difficulty < 20) {
    const progress = progressBetween(difficulty, 0, 20);
    return {
      label: 'Warmup',
      speed: lerp(BASE_SPEED, 220, progress),
      spawnDelay: lerp(BASE_SPAWN_DELAY, 0.95, progress)
    };
  }

  if (difficulty < 55) {
    const progress = progressBetween(difficulty, 20, 55);
    return {
      label: 'Cruise',
      speed: lerp(220, 330, progress),
      spawnDelay: lerp(0.95, 0.62, progress)
    };
  }

  if (difficulty < 90) {
    const progress = progressBetween(difficulty, 55, 90);
    return {
      label: 'Overdrive',
      speed: lerp(330, 500, progress),
      spawnDelay: lerp(0.62, 0.38, progress)
    };
  }

  return {
    label: 'Collapse',
    speed: MAX_SPEED,
    spawnDelay: MIN_SPAWN_DELAY
  };
}

function resetSurgeBurstState() {
  state.surgeTimer = 0;
  state.surgeBurstSpawns = 0;
  state.surgeSpawnTimerBoosted = false;
}

function startSurgeBurst() {
  state.surgeCooldown = SURGE_COOLDOWN;
  state.surgeTimer = SURGE_DURATION;
  state.surgeBurstSpawns = SURGE_BURST_SPAWNS;
  state.surgeSpawnTimerBoosted = true;
  showFeedback('Surge!', SURGE_DURATION * 1000);
  state.spawnTimer = Math.max(state.spawnTimer, state.spawnDelay * SURGE_SPAWN_DELAY_MULTIPLIER);
}

function shouldStartSurgeBurst() {
  return (
    (state.eventPhase === 'Cruise' || state.eventPhase === 'Overdrive') &&
    state.difficultyScore >= SURGE_UNLOCK_DIFFICULTY &&
    state.surgeCooldown <= 0 &&
    state.surgeTimer <= 0 &&
    Math.random() < Math.min(0.24, 0.06 + state.difficultyScore * 0.002)
  );
}

function loop(timestamp) {
  if (state.mode === 'countdown') {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
    state.lastTime = timestamp;
    state.countdown -= dt;

    if (state.countdown > 0) {
      const nextCountdown = String(Math.ceil(state.countdown));
      countdownEl.classList.remove('is-go');
      if (countdownEl.textContent !== nextCountdown) {
        countdownEl.textContent = nextCountdown;
        triggerCountdownPop();
      }
      requestAnimationFrame(loop);
      return;
    }

    countdownEl.textContent = 'Go';
    countdownEl.classList.add('is-go');
    triggerCountdownPop();
    setMode('playing');
    clearTimeout(state.goTimeout);
    state.goTimeout = setTimeout(() => {
      countdownEl.classList.remove('is-go');
      countdownEl.classList.remove('is-pop');
      countdownEl.textContent = '';
    }, 260);
    state.lastTime = timestamp;
    requestAnimationFrame(loop);
    return;
  }

  if (state.mode !== 'playing') {
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  const flowMultiplier = Math.max(0.5, 1 + (state.upgrades.flow * 0.11) + state.runPerkState.flowMultiplierOffset);
  state.score += dt * flowMultiplier;
  state.graceTime = Math.max(0, state.graceTime - dt);
  state.difficultyScore += dt;
  const perkSpeedOffset = state.runPerkState.baseSpeedOffset;
  state.perkTempoTimer = Math.max(0, state.perkTempoTimer - dt);
  const tempoActive = state.perkTempoTimer > 0;
  const tempoSpawnMultiplier = tempoActive ? state.runPerkState.tempoSpawnDelayMultiplier : 1;
  const tempoSpeedOffset = tempoActive ? state.runPerkState.tempoSpeedOffset : 0;
  updateEventPhase(dt);
  const intensity = currentIntensityState();
  state.eventLabel = intensity.label;
  state.speed = clamp(intensity.speed + perkSpeedOffset + tempoSpeedOffset, MIN_SPEED, MAX_SPEED);
  state.spawnDelay = clamp(intensity.spawnDelay * tempoSpawnMultiplier, MIN_SPAWN_DELAY, BASE_SPAWN_DELAY * 1.24);
  state.spawnTimer += dt;
  state.surgeCooldown = Math.max(0, state.surgeCooldown - dt);
  state.surgeTimer = Math.max(0, state.surgeTimer - dt);
  const previousParadoxTimer = state.precisionParadoxTimer;
  state.precisionParadoxTimer = Math.max(0, state.precisionParadoxTimer - dt);
  if (
    previousParadoxTimer > 0 &&
    state.precisionParadoxTimer <= 0 &&
    state.runPerkState.paradoxWindowDuration > 0
  ) {
    showFeedback('Paradox Faded', 700);
  }
  syncParadoxChargeState();
  if (state.paradoxLaneSlow.timer > 0) {
    state.paradoxLaneSlow.timer = Math.max(0, state.paradoxLaneSlow.timer - dt);
    if (state.paradoxLaneSlow.timer <= 0) {
      state.paradoxLaneSlow.lane = null;
      state.paradoxLaneSlow.multiplier = 1;
    }
  }
  state.scannerCueCooldown = Math.max(0, state.scannerCueCooldown - dt);
  if (state.eventPhase === 'Collapse') {
    resetSurgeBurstState();
  } else if (state.surgeTimer <= 0 || state.surgeBurstSpawns <= 0) {
    resetSurgeBurstState();
  }
  scoreEl.textContent = state.score.toFixed(1);
  if (hudScrapEl) {
    hudScrapEl.textContent = String(scrapEarnedFromScore(state.score));
  }
  if (hudShieldsEl) {
    hudShieldsEl.textContent = String(state.runShieldCharges);
  }
  if (hudEventEl) {
    hudEventEl.textContent = state.eventLabel;
  }

  const surgeActive = state.surgeTimer > 0 && state.surgeBurstSpawns > 0;
  const effectiveSpawnDelay = surgeActive ? state.spawnDelay * SURGE_SPAWN_DELAY_MULTIPLIER : state.spawnDelay;
  state.surgeSpawnTimerBoosted = surgeActive;

  if (state.spawnTimer >= effectiveSpawnDelay) {
    state.spawnTimer -= effectiveSpawnDelay;
    const spawned = spawnObstacle();
    if (spawned && surgeActive) {
      state.surgeBurstSpawns -= 1;
      if (state.surgeBurstSpawns <= 0) {
        resetSurgeBurstState();
      }
    }
    if (spawned && shouldStartSurgeBurst()) {
      startSurgeBurst();
    }
  }

  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;

  for (let i = state.obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = state.obstacles[i];
    if (obstacle.blastTimer > 0) {
      obstacle.blastTimer = Math.max(0, obstacle.blastTimer - dt);
      if (obstacle.blastTimer <= 0) {
        removeObstacleAt(i, false);
      }
      continue;
    }
    obstacle.age += dt;
    const laneSlowMultiplier =
      state.paradoxLaneSlow.timer > 0 && obstacle.lane === state.paradoxLaneSlow.lane
        ? state.paradoxLaneSlow.multiplier
        : 1;
    obstacle.x -= state.speed * obstacle.speedMultiplier * obstacle.eventSpeedMultiplier * laneSlowMultiplier * dt;
    obstacle.el.style.left = `${obstacle.x}px`;
    if (obstacle.age > 0.08) {
      obstacle.el.classList.remove('is-entering');
    }
    if (obstacle.type === 'heavy' && obstacle.age > 0.22) {
      obstacle.el.classList.remove('is-telegraph');
    }
    updateObstacleBehavior(obstacle, playerX);

    const obstacleX = obstacle.x;
    const collisionDistance = 10 + obstacle.hitHalfWidth;
    if (state.graceTime <= 0 && obstacle.lane === state.lane && Math.abs(obstacleX - playerX) <= collisionDistance) {
      if (state.runShieldCharges > 0) {
        state.runShieldCharges -= 1;
        removeObstacleAt(i, false);
        showFeedback(`Shield Block (${state.runShieldCharges} left)`);
        renderUpgrades();
        continue;
      }
      gameOver();
      return;
    }

    if (obstacle.x < -40) {
      removeObstacleAt(i, true);
    }
  }

  requestAnimationFrame(loop);
}

function handleAction(event) {
  if (event.type === 'keydown' && event.code !== 'Space') {
    return;
  }

  if (!canControlGameplay()) {
    return;
  }

  if (event.type === 'keydown') {
    event.preventDefault();
  }

  toggleLane();
}

saveScoreButton.addEventListener('click', async () => {
  await submitScore();
});
restartButton.addEventListener('click', async () => {
  submitScore();
  startGame();
});
document.addEventListener('keydown', handleAction);
document.addEventListener('keydown', async (event) => {
  if (state.mode === 'gameover' && event.code === 'Enter') {
    event.preventDefault();
    submitScore();
    startGame();
  }
  if ((state.mode === 'start' || state.mode === 'countdown') && event.code === 'Space') {
    event.preventDefault();
    if (state.mode === 'start') {
      startGame();
    }
  }
});
frame.addEventListener('pointerdown', (event) => {
  if (!canControlGameplay()) {
    return;
  }
  if (event.target.closest('.overlay')) {
    return;
  }
  toggleLane();
});
hudPerkItemEl?.addEventListener('pointerdown', (event) => {
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasHover && event.pointerType === 'mouse') {
    return;
  }
  const now = performance.now();
  if (now - lastPerkTooltipAt < 500) {
    return;
  }
  lastPerkTooltipAt = now;
  showFeedback(activePerkTooltipText(), 900);
});
playerNameEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveScoreButton.click();
  }
});
startButton.addEventListener('click', startGame);
buyFlowButton.addEventListener('click', () => purchaseUpgrade('flow'));
buyShieldButton.addEventListener('click', () => purchaseUpgrade('shield'));
buyScannerButton?.addEventListener('click', () => purchaseUpgrade('scanner'));
scoreboardToggleButton?.addEventListener('click', () => {
  if (!mobilePanelQuery.matches || !scoreboardPanelEl) {
    return;
  }
  const expanded = !scoreboardPanelEl.classList.contains('is-open');
  setMobilePanelState(scoreboardPanelEl, scoreboardToggleButton, expanded);
});
upgradesToggleButton?.addEventListener('click', () => {
  if (!mobilePanelQuery.matches || !upgradesPanelEl) {
    return;
  }
  const expanded = !upgradesPanelEl.classList.contains('is-open');
  setMobilePanelState(upgradesPanelEl, upgradesToggleButton, expanded);
});

window.addEventListener('resize', () => {
  syncMobilePanels();
  positionPlayer();
  state.obstacles.forEach((obstacle) => {
    obstacle.el.style.top = `${laneTop(obstacle.lane)}px`;
  });
});
