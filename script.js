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
const runScrapEarnedEl = document.getElementById('run-scrap-earned');
const hudEventEl = document.getElementById('hud-event');
const perkInfoCopyEl = document.getElementById('perk-info-copy');
const perkChoicesEl = document.getElementById('perk-choices');
const upgradePointsEl = document.getElementById('upgrade-points');
const flowLevelEl = document.getElementById('flow-level');
const shieldLevelEl = document.getElementById('shield-level');
const buyFlowButton = document.getElementById('buy-flow');
const buyShieldButton = document.getElementById('buy-shield');
const upgradeStatusEl = document.getElementById('upgrade-status');
const upgradesToggleButton = document.getElementById('upgrades-toggle');
const upgradesPanelEl = document.querySelector('.upgrades.mobile-collapsible');
const saveStatusEl = document.getElementById('save-status');
const mobilePanelQuery = window.matchMedia('(max-width: 640px)');
let mobilePanelMode = null;

const STORAGE_KEY = 'drift-best-score';
const PROGRESS_STORAGE_KEY = 'drift-progress';
const PROGRESS_SCHEMA_VERSION = 1;
const UPGRADE_KEY = 'drift-upgrades-v02';
const LATEST_SCORE_KEY = 'drift-latest-score-v01';
const LEADERBOARD_LIMIT = 10;
const UPGRADE_POINT_STEP = 8;
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
const UPGRADE_COSTS = Object.freeze({
  flow: [2, 3, 5, 7, 10, 14],
  shield: [2, 4, 6, 9, 12, 16]
});
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
    id: 'precision_drift',
    name: 'Precision Drift',
    description: 'Perfect dodges grant +1.0 bonus score this run.',
    perfectDodgeBonus: 1,
    baseSpeedOffset: 0
  },
  {
    id: 'soft_launch',
    name: 'Soft Launch',
    description: 'Start the run with -26 base speed for readability.',
    perfectDodgeBonus: 0,
    baseSpeedOffset: -26
  },
  {
    id: 'pulse_step',
    name: 'Pulse Step',
    description: 'Perfect dodges grant +0.6, but base speed is +12.',
    perfectDodgeBonus: 0.6,
    baseSpeedOffset: 12
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
  speedMultiplier: 1
});
const HEAVY_OBSTACLE_PROFILE = Object.freeze({
  type: 'heavy',
  hitHalfWidth: 16,
  speedMultiplier: 0.84
});

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
      name: String(parsed.name || 'Player'),
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
  const fallback = { points: 0, flow: 0, shield: 0 };
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
  return {
    points: Math.max(0, Math.floor(Number(raw.points) || 0)),
    flow: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, Math.floor(Number(raw.flow) || 0))),
    shield: Math.min(MAX_UPGRADE_LEVEL, Math.max(0, Math.floor(Number(raw.shield) || 0)))
  };
}

function persistUpgrades() {
  localStorage.setItem(UPGRADE_KEY, JSON.stringify(state.upgrades));
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
    baseSpeedOffset: 0
  },
  recentSpawnTypes: [],
  eventLabel: 'Warmup',
  eventPhase: 'Warmup',
  eventPhaseTimer: 0,
  hasEnteredCollapse: false,
  surgeCooldown: SURGE_COOLDOWN,
  surgeTimer: 0,
  surgeBurstSpawns: 0,
  surgeSpawnTimerBoosted: false
};

bestEl.textContent = state.best.toFixed(1);
resetProgressionUi();
renderLeaderboard();
positionPlayer();
renderUpgrades();
syncMobilePanels(true);
rollPerkChoices();
renderPerkChoices();

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

function applySelectedPerk() {
  const perk = selectedPerk();
  state.activePerkId = perk ? perk.id : null;
  state.runPerkState = {
    perfectDodgeBonus: perk ? perk.perfectDodgeBonus : 0,
    baseSpeedOffset: perk ? perk.baseSpeedOffset : 0
  };
}

function rollPerkChoices() {
  const pool = [...RUN_PERKS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  state.perkChoices = pool.slice(0, 2);

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
    button.innerHTML = `<strong>${perk.name}${perk.id === state.selectedPerkId ? ' (Selected)' : ''}</strong><span>${perk.description}</span>`;
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
  if (hudPerkEl) {
    const perk = currentPerk();
    hudPerkEl.textContent = perk ? perk.name : 'None';
  }
  if (runScrapEarnedEl) {
    runScrapEarnedEl.textContent = '0';
  }
  if (perkInfoCopyEl) {
    const perk = currentPerk();
    perkInfoCopyEl.textContent = perk ? `${perk.name} active this run.` : 'No active perk this run.';
  }
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
  if (!upgradePointsEl || !flowLevelEl || !shieldLevelEl) {
    return;
  }
  upgradePointsEl.textContent = String(state.upgrades.points);
  flowLevelEl.textContent = `Lv ${state.upgrades.flow}`;
  shieldLevelEl.textContent = `Lv ${state.upgrades.shield}`;
  buyFlowButton.disabled = !canPurchase('flow');
  buyShieldButton.disabled = !canPurchase('shield');
  buyFlowButton.textContent = state.upgrades.flow >= MAX_UPGRADE_LEVEL ? 'Flow Maxed' : `Buy Flow (${upgradeCost('flow')})`;
  buyShieldButton.textContent = state.upgrades.shield >= MAX_UPGRADE_LEVEL ? 'Shield Maxed' : `Buy Shield (${upgradeCost('shield')})`;
  if (upgradeStatusEl) {
    upgradeStatusEl.textContent = state.mode === 'playing' || state.mode === 'countdown'
      ? ''
      : `Earn 1 scrap every ${UPGRADE_POINT_STEP} score`;
  }
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
  state.latestSubmittedScore = loadLatestScore();
  applySelectedPerk();
  state.runShieldCharges = state.upgrades.shield;
  clearTimeout(state.switchPulseTimeout);
  clearTimeout(state.feedbackTimeout);
  clearTimeout(state.scoreFlashTimeout);
  clearTimeout(state.goTimeout);
  playerEl.classList.remove('is-switching');
  playerEl.classList.remove('is-near-miss');
  countdownEl.textContent = '';
  countdownEl.classList.remove('is-go');
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
    runScrapEarnedEl.textContent = String(Math.max(0, Math.floor(state.score / UPGRADE_POINT_STEP)));
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
  const earnedPoints = Math.max(0, Math.floor(state.score / UPGRADE_POINT_STEP));
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

  const name = playerNameEl.value.trim() || 'Player';
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
  feedbackEl.textContent = message;
  feedbackEl.classList.remove('is-visible');
  clearTimeout(state.feedbackTimeout);
  requestAnimationFrame(() => {
    feedbackEl.classList.add('is-visible');
  });
  state.feedbackTimeout = setTimeout(() => {
    feedbackEl.classList.remove('is-visible');
  }, duration);
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
}

function checkPerfectDodge(previousLane) {
  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;
  const dodgeWindow = 48;

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
    checkPerfectDodge(previousLane);
  }
}

function spawnObstacle() {
  const frameWidth = frame.getBoundingClientRect().width;
  const lastObstacle = state.obstacles[state.obstacles.length - 1];
  if (lastObstacle && lastObstacle.x > frameWidth - Math.max(140, state.speed * 0.42)) {
    return false;
  }

  const profile = pickObstacleProfile();
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle is-entering';
  if (profile.type === 'heavy') {
    obstacle.classList.add('is-heavy', 'is-telegraph');
  }
  const lane = pickLane();
  const y = laneTop(lane);
  obstacle.dataset.lane = String(lane);
  obstacle.style.top = `${y}px`;
  obstacle.style.left = '100%';
  obstaclesEl.appendChild(obstacle);
  state.obstacles.push({
    el: obstacle,
    lane,
    x: frameWidth + 20,
    age: 0,
    perfectDodged: false,
    type: profile.type,
    hitHalfWidth: profile.hitHalfWidth,
    speedMultiplier: profile.speedMultiplier,
    eventSpeedMultiplier: state.surgeSpawnTimerBoosted ? SURGE_OBSTACLE_SPEED_MULTIPLIER : 1
  });
  state.recentSpawnTypes.push(profile.type);
  if (state.recentSpawnTypes.length > HEAVY_OBSTACLE_COLLAPSE_RECENT_WINDOW) {
    state.recentSpawnTypes.shift();
  }
  return true;
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

function pickObstacleProfile() {
  if (state.difficultyScore < HEAVY_OBSTACLE_DIFFICULTY_THRESHOLD) {
    return NORMAL_OBSTACLE_PROFILE;
  }

  const isCollapse = state.eventPhase === 'Collapse';
  const recentWindow = isCollapse ? HEAVY_OBSTACLE_COLLAPSE_RECENT_WINDOW : HEAVY_OBSTACLE_RECENT_WINDOW;
  const recentCap = isCollapse ? HEAVY_OBSTACLE_COLLAPSE_RECENT_CAP : HEAVY_OBSTACLE_RECENT_CAP;
  const recentTypes = state.recentSpawnTypes.slice(-recentWindow);
  const heavyCount = recentTypes.filter((type) => type === HEAVY_OBSTACLE_PROFILE.type).length;
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

function pickLane() {
  if (state.lastSpawnLane === null) {
    state.lastSpawnLane = Math.random() < 0.5 ? 0 : 1;
    return state.lastSpawnLane;
  }

  const baseSameLaneChance = state.difficultyScore < 10 ? 0.36 : 0.44;
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

function loop(timestamp) {
  if (state.mode === 'countdown') {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
    state.lastTime = timestamp;
    state.countdown -= dt;

    if (state.countdown > 0) {
      countdownEl.classList.remove('is-go');
      countdownEl.textContent = String(Math.ceil(state.countdown));
      requestAnimationFrame(loop);
      return;
    }

    countdownEl.textContent = 'Go';
    countdownEl.classList.add('is-go');
    setMode('playing');
    clearTimeout(state.goTimeout);
    state.goTimeout = setTimeout(() => {
      countdownEl.classList.remove('is-go');
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

  const flowMultiplier = 1 + (state.upgrades.flow * 0.12);
  state.score += dt * flowMultiplier;
  state.graceTime = Math.max(0, state.graceTime - dt);
  state.difficultyScore += dt;
  const perkSpeedOffset = state.runPerkState.baseSpeedOffset;
  updateEventPhase(dt);
  const intensity = currentIntensityState();
  state.eventLabel = intensity.label;
  state.speed = clamp(intensity.speed + perkSpeedOffset, MIN_SPEED, MAX_SPEED);
  state.spawnDelay = clamp(intensity.spawnDelay, MIN_SPAWN_DELAY, BASE_SPAWN_DELAY);
  state.spawnTimer += dt;
  state.surgeCooldown = Math.max(0, state.surgeCooldown - dt);
  state.surgeTimer = Math.max(0, state.surgeTimer - dt);
  if (state.surgeTimer <= 0 || state.surgeBurstSpawns <= 0 || state.eventPhase === 'Collapse') {
    state.surgeTimer = 0;
    state.surgeBurstSpawns = 0;
    state.surgeSpawnTimerBoosted = false;
  }
  scoreEl.textContent = state.score.toFixed(1);
  if (hudScrapEl) {
    hudScrapEl.textContent = String(Math.floor(state.score / UPGRADE_POINT_STEP));
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
        state.surgeTimer = 0;
        state.surgeSpawnTimerBoosted = false;
      }
    }
    if (
      spawned &&
      (state.eventPhase === 'Cruise' || state.eventPhase === 'Overdrive') &&
      state.difficultyScore >= SURGE_UNLOCK_DIFFICULTY &&
      state.surgeCooldown <= 0 &&
      Math.random() < Math.min(0.24, 0.06 + state.difficultyScore * 0.002)
    ) {
      state.surgeCooldown = SURGE_COOLDOWN;
      state.surgeTimer = SURGE_DURATION;
      state.surgeBurstSpawns = SURGE_BURST_SPAWNS;
      state.surgeSpawnTimerBoosted = true;
      showFeedback('Surge!', SURGE_DURATION * 1000);
      state.spawnTimer = Math.max(state.spawnTimer, state.spawnDelay * SURGE_SPAWN_DELAY_MULTIPLIER);
    }
  }

  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;

  for (let i = state.obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = state.obstacles[i];
    obstacle.age += dt;
    obstacle.x -= state.speed * obstacle.speedMultiplier * obstacle.eventSpeedMultiplier * dt;
    obstacle.el.style.left = `${obstacle.x}px`;
    if (obstacle.age > 0.08) {
      obstacle.el.classList.remove('is-entering');
    }
    if (obstacle.type === 'heavy' && obstacle.age > 0.22) {
      obstacle.el.classList.remove('is-telegraph');
    }

    const obstacleX = obstacle.x;
    const collisionDistance = 10 + obstacle.hitHalfWidth;
    if (state.graceTime <= 0 && obstacle.lane === state.lane && Math.abs(obstacleX - playerX) <= collisionDistance) {
      if (state.runShieldCharges > 0) {
        state.runShieldCharges -= 1;
        obstacle.el.remove();
        state.obstacles.splice(i, 1);
        showFeedback(`Shield Block (${state.runShieldCharges} left)`);
        renderUpgrades();
        continue;
      }
      gameOver();
      return;
    }

    if (obstacle.x < -40) {
      obstacle.el.remove();
      state.obstacles.splice(i, 1);
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
playerNameEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveScoreButton.click();
  }
});
startButton.addEventListener('click', startGame);
buyFlowButton.addEventListener('click', () => purchaseUpgrade('flow'));
buyShieldButton.addEventListener('click', () => purchaseUpgrade('shield'));
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
