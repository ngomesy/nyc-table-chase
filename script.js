const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");

const W = canvas.width;
const H = canvas.height;
const GROUND_H = 90;

const state = {
  running: false,
  gameOver: false,
  score: 0,
  best: Number(localStorage.getItem("flappyBest") || 0),
  bird: {
    x: 96,
    y: H / 2,
    vy: 0,
    r: 14,
  },
  gravity: 0.35,
  flapPower: -6.2,
  pipes: [],
  pipeW: 64,
  pipeGap: 170,
  pipeSpeed: 2.25,
  spawnEveryMs: 1450,
  lastSpawnMs: 0,
  lastFrameMs: performance.now(),
};

bestEl.textContent = state.best;

function resetGame() {
  state.running = false;
  state.gameOver = false;
  state.score = 0;
  scoreEl.textContent = "0";
  state.bird.y = H / 2;
  state.bird.vy = 0;
  state.pipes = [];
  state.lastSpawnMs = 0;
  statusEl.textContent = "Press Space / Click to start";
}

function startGame() {
  if (!state.running && !state.gameOver) {
    state.running = true;
    statusEl.textContent = "";
  }
}

function flap() {
  if (state.gameOver) {
    resetGame();
    return;
  }
  startGame();
  state.bird.vy = state.flapPower;
}

function spawnPipe(now) {
  const minTop = 70;
  const maxTop = H - GROUND_H - state.pipeGap - 70;
  const topH = Math.random() * (maxTop - minTop) + minTop;
  state.pipes.push({
    x: W + 20,
    topH,
    passed: false,
  });
  state.lastSpawnMs = now;
}

function birdHitsPipe(pipe) {
  const bx = state.bird.x;
  const by = state.bird.y;
  const br = state.bird.r;
  const withinX = bx + br > pipe.x && bx - br < pipe.x + state.pipeW;
  if (!withinX) return false;
  const hitsTop = by - br < pipe.topH;
  const bottomStart = pipe.topH + state.pipeGap;
  const hitsBottom = by + br > bottomStart;
  return hitsTop || hitsBottom;
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("flappyBest", String(state.best));
    bestEl.textContent = String(state.best);
  }
  statusEl.textContent = "Game Over - Press Space / Click to restart";
}

function update(now) {
  const dt = Math.min(33, now - state.lastFrameMs);
  state.lastFrameMs = now;
  if (!state.running) return;

  state.bird.vy += state.gravity * (dt / 16.67);
  state.bird.y += state.bird.vy * (dt / 16.67);

  if (now - state.lastSpawnMs > state.spawnEveryMs) {
    spawnPipe(now);
  }

  for (const pipe of state.pipes) {
    pipe.x -= state.pipeSpeed * (dt / 16.67);

    if (!pipe.passed && pipe.x + state.pipeW < state.bird.x) {
      pipe.passed = true;
      state.score += 1;
      scoreEl.textContent = String(state.score);
    }

    if (birdHitsPipe(pipe)) {
      endGame();
      return;
    }
  }

  state.pipes = state.pipes.filter((p) => p.x + state.pipeW > -8);

  if (state.bird.y - state.bird.r < 0) {
    state.bird.y = state.bird.r;
    state.bird.vy = 0;
  }

  if (state.bird.y + state.bird.r > H - GROUND_H) {
    state.bird.y = H - GROUND_H - state.bird.r;
    endGame();
  }
}

function drawBackground() {
  ctx.fillStyle = "#d6f8d6";
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
  ctx.fillStyle = "#abdfab";
  for (let i = 0; i < W; i += 36) {
    ctx.fillRect(i, H - GROUND_H + 26, 18, 6);
  }
}

function drawBird() {
  const { x, y, r, vy } = state.bird;
  const tilt = Math.max(-0.5, Math.min(1, vy * 0.06));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = "#ffca3a";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(4, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(6, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff7f11";
  ctx.beginPath();
  ctx.moveTo(r - 1, 1);
  ctx.lineTo(r + 11, 4);
  ctx.lineTo(r - 1, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  for (const pipe of state.pipes) {
    const x = pipe.x;
    const topH = pipe.topH;
    const bottomY = topH + state.pipeGap;
    ctx.fillStyle = "#26b24b";
    ctx.fillRect(x, 0, state.pipeW, topH);
    ctx.fillRect(x - 5, topH - 24, state.pipeW + 10, 24);
    ctx.fillRect(x, bottomY, state.pipeW, H - GROUND_H - bottomY);
    ctx.fillRect(x - 5, bottomY, state.pipeW + 10, 24);
    ctx.fillStyle = "#209b42";
    ctx.fillRect(x + state.pipeW - 10, 0, 10, topH);
    ctx.fillRect(x + state.pipeW - 10, bottomY, 10, H - GROUND_H - bottomY);
  }
}

function draw(now) {
  ctx.clearRect(0, 0, W, H);
  drawPipes();
  drawBackground();
  drawBird();

  if (!state.running && !state.gameOver) {
    ctx.fillStyle = "#00000066";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 30px Trebuchet MS";
    ctx.fillText("Flappy-esque", W / 2, H / 2 - 20);
    ctx.font = "20px Trebuchet MS";
    ctx.fillText("Tap / Space to fly", W / 2, H / 2 + 18);
  }

  if (state.gameOver) {
    ctx.fillStyle = "#0000007a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Trebuchet MS";
    ctx.fillText("Game Over", W / 2, H / 2 - 25);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText(`Score: ${state.score}`, W / 2, H / 2 + 8);
    ctx.fillText("Tap / Space to restart", W / 2, H / 2 + 42);
  }

  update(now);
  requestAnimationFrame(draw);
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener("pointerdown", flap);

resetGame();
requestAnimationFrame(draw);
