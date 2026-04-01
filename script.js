const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const finalScoreEl = document.getElementById('final-score');
const playerEl = document.getElementById('player');
const obstaclesEl = document.getElementById('obstacles');
const overlayStart = document.getElementById('overlay-start');
const overlayOver = document.getElementById('overlay-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const frame = document.querySelector('.game-frame');

const STORAGE_KEY = 'drift-best-score';

const state = {
  mode: 'start',
  lane: 1,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  lastTime: 0,
  spawnTimer: 0,
  spawnDelay: 1.1,
  speed: 180,
  obstacles: []
};

bestEl.textContent = state.best.toFixed(1);
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
  overlayStart.classList.toggle('is-visible', mode === 'start');
  overlayOver.classList.toggle('is-visible', mode === 'gameover');
}

function resetGame() {
  state.lane = 1;
  state.score = 0;
  state.lastTime = 0;
  state.spawnTimer = 0;
  state.spawnDelay = 1.1;
  state.speed = 180;
  state.obstacles = [];
  obstaclesEl.innerHTML = '';
  scoreEl.textContent = '0.0';
  positionPlayer();
}

function startGame() {
  resetGame();
  setMode('playing');
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
}

function toggleLane() {
  if (state.mode === 'start') {
    startGame();
    return;
  }

  if (state.mode === 'gameover') {
    startGame();
    return;
  }

  state.lane = state.lane === 0 ? 1 : 0;
  positionPlayer();
}

function spawnObstacle() {
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';
  const lane = Math.random() < 0.5 ? 0 : 1;
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

// Core loop: advance time, scale difficulty, move obstacles, and check collisions.
function loop(timestamp) {
  if (state.mode !== 'playing') {
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  state.score += dt;
  state.speed += dt * 3.5;
  state.spawnDelay = Math.max(0.42, 1.1 - state.score * 0.03);
  state.spawnTimer += dt;
  scoreEl.textContent = state.score.toFixed(1);

  if (state.spawnTimer >= state.spawnDelay) {
    state.spawnTimer = 0;
    spawnObstacle();
    if (Math.random() < 0.18) {
      state.spawnTimer = -state.spawnDelay * 0.35;
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
    if (obstacle.lane === state.lane && obstacleX <= playerX + 10 && obstacleX + 18 >= playerX - 10) {
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

  if (event.type === 'keydown') {
    event.preventDefault();
  }

  toggleLane();
}

startButton.addEventListener('click', handleAction);
restartButton.addEventListener('click', handleAction);
document.addEventListener('keydown', handleAction);
document.addEventListener('pointerdown', (event) => {
  if (event.target === startButton || event.target === restartButton) {
    return;
  }
  handleAction(event);
}, { passive: true });

window.addEventListener('resize', () => {
  positionPlayer();
  state.obstacles.forEach((obstacle) => {
    obstacle.el.style.top = `${laneTop(obstacle.lane)}px`;
  });
});
