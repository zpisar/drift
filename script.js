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
const feedbackEl = document.getElementById('feedback');
const frame = document.querySelector('.game-frame');
<<<<<<< ours
const hudScrapEl = document.getElementById('hud-scrap');
const hudShieldsEl = document.getElementById('hud-shields');
const hudPerkEl = document.getElementById('hud-perk');
const runScrapEarnedEl = document.getElementById('run-scrap-earned');
const perkInfoCopyEl = document.getElementById('perk-info-copy');
=======
const perkOptionsEl = document.getElementById('perk-options');
>>>>>>> theirs

const STORAGE_KEY = 'drift-best-score';
const PROGRESS_STORAGE_KEY = 'drift-progress';
const PROGRESS_SCHEMA_VERSION = 1;
const DEFAULT_PROGRESS = Object.freeze({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  bestScore: 0
});
const SUPABASE_URL = 'https://csswxdyrfvmjgcnygmrp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8aa4QwHmN_5IEGrZ0xkR6g_gMuPbsiF';
const SCORE_TABLE = 'scores';
const supabaseClient = createSupabaseClient();
const PERKS = [
  { id: 'buffer', name: 'Buffer', description: '+0.35s starting grace', apply: (s) => { s.graceTime += 0.35; } },
  { id: 'calm', name: 'Calm Start', description: '-18 speed this run', apply: (s) => { s.baseSpeedOffset -= 18; } },
  { id: 'precision', name: 'Precision', description: 'Perfect Dodge +0.8', apply: (s) => { s.perfectDodgeBonus = 0.8; } }
];

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

function resetProgress() {
  const nextProgress = { ...DEFAULT_PROGRESS };
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage errors.
  }
  return nextProgress;
}

const initialProgress = loadProgress();

const state = {
  mode: 'start',
  lane: 1,
  score: 0,
  best: initialProgress.bestScore,
  progress: initialProgress,
  lastTime: 0,
  spawnTimer: 0,
  spawnDelay: 1.05,
  speed: 180,
  obstacles: [],
  graceTime: 0.9,
  lastSpawnLane: null,
  countdown: 0,
  savedScore: false,
  switchPulseTimeout: null,
  feedbackTimeout: null,
  scoreFlashTimeout: null,
  goTimeout: null,
  selectedPerkId: 'buffer',
  activePerkId: null,
  perfectDodgeBonus: 0.5,
  baseSpeedOffset: 0
};

bestEl.textContent = state.best.toFixed(1);
resetProgressionUi();
renderLeaderboard();
positionPlayer();
renderPerkOptions();

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
}

function resetProgressionUi() {
  if (hudScrapEl) {
    hudScrapEl.textContent = '0';
  }
  if (hudShieldsEl) {
    hudShieldsEl.textContent = '0';
  }
  if (hudPerkEl) {
    hudPerkEl.textContent = 'None';
  }
  if (runScrapEarnedEl) {
    runScrapEarnedEl.textContent = '0';
  }
  if (perkInfoCopyEl) {
    perkInfoCopyEl.textContent = 'No active perk this run.';
  }
}

function resetGame() {
  state.lane = 1;
  state.score = 0;
  state.lastTime = 0;
  state.spawnTimer = 0;
  state.spawnDelay = 1.05;
  state.speed = 180;
  state.obstacles = [];
  state.graceTime = 0.9;
  state.lastSpawnLane = null;
  state.countdown = 0;
  state.savedScore = false;
  state.activePerkId = null;
  state.perfectDodgeBonus = 0.5;
  state.baseSpeedOffset = 0;
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
  scoreboardStatusEl.textContent = supabaseClient ? '' : 'Configure Supabase to enable the shared leaderboard.';
  saveScoreButton.disabled = false;
  resetProgressionUi();
  obstaclesEl.innerHTML = '';
  scoreEl.textContent = '0.0';
  positionPlayer();
}

function startGame() {
  resetGame();
  applySelectedPerk();
  state.countdown = 3;
  setMode('countdown');
  requestAnimationFrame(loop);
}

function renderPerkOptions() {
  if (!perkOptionsEl) {
    return;
  }
  perkOptionsEl.innerHTML = PERKS.map((perk) => (
    `<button class="perk-option${state.selectedPerkId === perk.id ? ' is-selected' : ''}" type="button" data-perk-id="${perk.id}" role="radio" aria-checked="${state.selectedPerkId === perk.id}">
      <span class="perk-name">${perk.name}</span>
      <span class="perk-desc">${perk.description}</span>
    </button>`
  )).join('');
}

function selectPerk(perkId) {
  if (!PERKS.some((perk) => perk.id === perkId)) {
    return;
  }
  state.selectedPerkId = perkId;
  renderPerkOptions();
}

function applySelectedPerk() {
  const perk = PERKS.find((entry) => entry.id === state.selectedPerkId);
  if (!perk) {
    return;
  }
  state.activePerkId = perk.id;
  perk.apply(state);
}

function gameOver() {
  setMode('gameover');
  finalScoreEl.textContent = state.score.toFixed(1);
  if (runScrapEarnedEl) {
    runScrapEarnedEl.textContent = '0';
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
    .limit(5);

  if (error) {
    scoreboardStatusEl.textContent = 'Could not load leaderboard.';
    return [];
  }

  scoreboardStatusEl.textContent = '';
  return data ?? [];
}

async function renderLeaderboard() {
  const entries = await fetchLeaderboard();
  if (entries.length === 0) {
    scoreboardListEl.innerHTML = '<li class="score-row"><span class="score-name">No scores yet</span><span class="score-value">-</span></li>';
    return;
  }

  scoreboardListEl.innerHTML = entries.slice(0, 5).map((entry, index) => (
    `<li class="score-row"><span class="score-name">${index + 1}. ${escapeHtml(entry.name)}</span><span class="score-value">${Number(entry.score).toFixed(1)}</span></li>`
  )).join('');
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

  const { error } = await supabaseClient.from(SCORE_TABLE).insert({
    name,
    score: Number(state.score.toFixed(1))
  });

  saveScoreButton.disabled = false;

  if (error) {
    scoreboardStatusEl.textContent = 'Could not save score.';
    return false;
  }

  state.savedScore = true;
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

function showFeedback(message) {
  feedbackEl.textContent = message;
  feedbackEl.classList.remove('is-visible');
  clearTimeout(state.feedbackTimeout);
  requestAnimationFrame(() => {
    feedbackEl.classList.add('is-visible');
  });
  state.feedbackTimeout = setTimeout(() => {
    feedbackEl.classList.remove('is-visible');
  }, 560);
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
  state.score += state.perfectDodgeBonus;
  scoreEl.textContent = state.score.toFixed(1);
  flashScoreLabel();
  triggerNearMissFeedback();
  showFeedback(`Perfect Dodge +${state.perfectDodgeBonus.toFixed(1)}`);
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
    const obstacleFront = obstacle.x + 18;
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

  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle is-entering';
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
    perfectDodged: false
  });
  return true;
}

function pickLane() {
  if (state.lastSpawnLane === null) {
    state.lastSpawnLane = Math.random() < 0.5 ? 0 : 1;
    return state.lastSpawnLane;
  }

  const sameLaneChance = state.score < 8 ? 0.35 : 0.5;
  const lane = Math.random() < sameLaneChance ? state.lastSpawnLane : (state.lastSpawnLane === 0 ? 1 : 0);
  state.lastSpawnLane = lane;
  return lane;
}

// Core loop: advance time, scale difficulty, move obstacles, and check collisions.
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

  state.score += dt;
  state.graceTime = Math.max(0, state.graceTime - dt);
  state.speed = Math.min(500, 172 + state.score * 12.5 + state.baseSpeedOffset);
  state.spawnDelay = Math.max(0.28, 1.15 - state.score * 0.048);
  state.spawnTimer += dt;
  scoreEl.textContent = state.score.toFixed(1);

  if (state.spawnTimer >= state.spawnDelay) {
    state.spawnTimer -= state.spawnDelay;
    const spawned = spawnObstacle();
    if (spawned && state.score > 8 && Math.random() < Math.min(0.4, 0.1 + state.score * 0.01)) {
      state.spawnTimer -= state.spawnDelay * 0.3;
    }
  }

  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;

  for (let i = state.obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = state.obstacles[i];
    obstacle.age += dt;
    obstacle.x -= state.speed * dt;
    obstacle.el.style.left = `${obstacle.x}px`;
    if (obstacle.age > 0.08) {
      obstacle.el.classList.remove('is-entering');
    }

    // Collision: only end the run when an obstacle reaches the player in the same lane.
    const obstacleX = obstacle.x;
    if (state.graceTime <= 0 && obstacle.lane === state.lane && obstacleX <= playerX + 10 && obstacleX + 18 >= playerX - 10) {
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
  await submitScore();
  startGame();
});
document.addEventListener('keydown', handleAction);
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
perkOptionsEl?.addEventListener('click', (event) => {
  const option = event.target.closest('[data-perk-id]');
  if (!option) {
    return;
  }
  selectPerk(option.dataset.perkId);
});

window.addEventListener('resize', () => {
  positionPlayer();
  state.obstacles.forEach((obstacle) => {
    obstacle.el.style.top = `${laneTop(obstacle.lane)}px`;
  });
});
