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
const scoreboardListEl = document.getElementById('scoreboard-list');
const frame = document.querySelector('.game-frame');

const STORAGE_KEY = 'drift-best-score';
const LEADERBOARD_KEY = 'drift-leaderboard';

const state = {
  mode: 'start',
  lane: 1,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  lastTime: 0,
  spawnTimer: 0,
  spawnDelay: 1.05,
  speed: 180,
  obstacles: [],
  graceTime: 0.9,
  lastSpawnLane: null,
  countdown: 0,
  savedScore: false
};

bestEl.textContent = state.best.toFixed(1);
renderLeaderboard();
positionPlayer();

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
  countdownEl.textContent = '';
  obstaclesEl.innerHTML = '';
  scoreEl.textContent = '0.0';
  positionPlayer();
}

function startGame() {
  resetGame();
  state.countdown = 3;
  setMode('countdown');
  requestAnimationFrame(loop);
}

function gameOver() {
  setMode('gameover');
  finalScoreEl.textContent = state.score.toFixed(1);
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.best));
    bestEl.textContent = state.best.toFixed(1);
  }
  playerNameEl.value = '';
  playerNameEl.focus();
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
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

function renderLeaderboard() {
  const entries = loadLeaderboard().sort((a, b) => b.score - a.score);
  if (entries.length === 0) {
    scoreboardListEl.innerHTML = '<li class="score-row"><span class="score-name">No scores yet</span><span class="score-value">-</span></li>';
    return;
  }

  scoreboardListEl.innerHTML = entries.slice(0, 5).map((entry, index) => (
    `<li class="score-row"><span class="score-name">${index + 1}. ${escapeHtml(entry.name)}</span><span class="score-value">${Number(entry.score).toFixed(1)}</span></li>`
  )).join('');
}

function submitScore() {
  if (state.savedScore || state.mode !== 'gameover') {
    return;
  }

  const name = playerNameEl.value.trim() || 'Player';
  const entries = loadLeaderboard();
  entries.push({ name, score: state.score });
  entries.sort((a, b) => b.score - a.score);
  saveLeaderboard(entries.slice(0, 5));
  renderLeaderboard();
  state.savedScore = true;
}

function toggleLane() {
  state.lane = state.lane === 0 ? 1 : 0;
  positionPlayer();
}

function spawnObstacle() {
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';
  const lane = pickLane();
  const y = laneTop(lane);
  obstacle.dataset.lane = String(lane);
  obstacle.style.top = `${y}px`;
  obstacle.style.left = '100%';
  obstaclesEl.appendChild(obstacle);
  state.obstacles.push({
    el: obstacle,
    lane,
    x: frame.getBoundingClientRect().width + 20
  });
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
      countdownEl.textContent = String(Math.ceil(state.countdown));
      requestAnimationFrame(loop);
      return;
    }

    countdownEl.textContent = '';
    setMode('playing');
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
  state.speed = Math.min(520, 180 + state.score * 14);
  state.spawnDelay = Math.max(0.22, 1.05 - state.score * 0.055);
  state.spawnTimer += dt;
  scoreEl.textContent = state.score.toFixed(1);

  if (state.spawnTimer >= state.spawnDelay) {
    state.spawnTimer -= state.spawnDelay;
    spawnObstacle();
    if (state.score > 8 && Math.random() < Math.min(0.4, 0.1 + state.score * 0.01)) {
      state.spawnTimer -= state.spawnDelay * 0.3;
    }
  }

  const playerRect = playerEl.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const playerX = playerRect.left - frameRect.left + playerRect.width / 2;

  for (let i = state.obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = state.obstacles[i];
    obstacle.x -= state.speed * dt;
    obstacle.el.style.left = `${obstacle.x}px`;

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

  if (state.mode === 'start' || state.mode === 'gameover') {
    return;
  }

  if (state.mode === 'countdown') {
    return;
  }

  if (event.type === 'keydown') {
    event.preventDefault();
  }

  toggleLane();
}

saveScoreButton.addEventListener('click', submitScore);
restartButton.addEventListener('click', () => {
  submitScore();
  startGame();
});
document.addEventListener('keydown', handleAction);
playerNameEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitScore();
  }
});
startButton.addEventListener('click', startGame);

window.addEventListener('resize', () => {
  positionPlayer();
  state.obstacles.forEach((obstacle) => {
    obstacle.el.style.top = `${laneTop(obstacle.lane)}px`;
  });
});
