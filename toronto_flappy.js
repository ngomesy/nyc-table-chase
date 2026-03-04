const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("best");
const menuEl = document.getElementById("menu");
const menuTitleEl = document.getElementById("menu-title");
const birdPickerEl = document.getElementById("bird-picker");
const startBtn = document.getElementById("start-btn");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 72;

const BIRDS = [
  {
    id: "blue_jay",
    name: "Blue Jay",
    note: "Bold crest and blue wings",
    body: "#5f9bd6",
    wing: "#2e5f8c",
    chest: "#ecf6ff",
    beak: "#d39738",
  },
  {
    id: "cardinal",
    name: "Cardinal",
    note: "Vibrant red city classic",
    body: "#c83d32",
    wing: "#9a2a24",
    chest: "#ffd2cd",
    beak: "#f6a449",
  },
  {
    id: "robin",
    name: "American Robin",
    note: "Warm orange chest",
    body: "#6f5b50",
    wing: "#53423a",
    chest: "#c9784c",
    beak: "#dab15e",
  },
  {
    id: "chickadee",
    name: "Black-capped Chickadee",
    note: "Small and quick woodland flyer",
    body: "#d8d8d2",
    wing: "#434950",
    chest: "#f2f4f1",
    beak: "#b58f59",
  },
];

const state = {
  mode: "menu", // menu | playing | gameover
  selectedBird: BIRDS[0],
  bird: { x: 220, y: H * 0.45, vy: 0, r: 16 },
  obstacles: [],
  score: 0,
  level: 1,
  best: Number(localStorage.getItem("torontoFlappyBest") || 0),
  speed: 3.1,
  gapSize: 230,
  spawnMs: 1650,
  sinceSpawn: 0,
  scroll: 0,
  keys: { up: false, down: false },
  wingPhase: 0,
  lastTime: performance.now(),
};

bestEl.textContent = String(state.best);

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.running = false;
    this.step = 0;
    this.timer = null;
    this.intensity = 0.15;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }

  setIntensity(v) {
    this.intensity = Math.max(0.1, Math.min(1, v));
  }

  tone(freq, dur, type = "triangle", vol = 0.08, when = 0, slide = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) {
      osc.frequency.linearRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  noise(dur = 0.05, vol = 0.04, when = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    filt.type = "bandpass";
    filt.frequency.value = 900 + this.intensity * 500;
    gain.gain.value = vol;
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  playStep() {
    if (!this.running || !this.ctx) return;
    const bass = [130.81, 146.83, 164.81, 174.61, 196.0, 174.61];
    const pad = [261.63, 293.66, 329.63, 349.23, 392.0, 349.23];
    const i = this.step % bass.length;
    const tempoMs = Math.max(180, 530 - this.intensity * 260);

    const calmVol = 0.04 + this.intensity * 0.03;
    const pulseVol = 0.04 + this.intensity * 0.05;
    this.tone(bass[i], 0.34, "triangle", calmVol, 0);
    this.tone(pad[i], 0.45, "sine", pulseVol, 0.05);

    if (this.intensity > 0.45) {
      this.tone(pad[(i + 2) % pad.length] * 2, 0.12, "square", 0.03 + this.intensity * 0.04, 0.1);
    }
    if (this.intensity > 0.68 && this.step % 2 === 0) {
      this.noise(0.03, 0.018 + this.intensity * 0.03, 0.03);
    }

    this.step += 1;
    this.timer = setTimeout(() => this.playStep(), tempoMs);
  }

  start() {
    this.ensure();
    if (!this.ctx || this.running) return;
    this.ctx.resume();
    this.running = true;
    this.playStep();
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

const music = new MusicEngine();

function updateDifficulty() {
  state.level = Math.floor(state.score / 10) + 1;
  const l = state.level - 1;
  state.speed = 2.95 + l * 0.2 + l * l * 0.03;
  state.gapSize = Math.max(126, 242 - l * 5 - l * l * 0.55);
  state.spawnMs = Math.max(760, 1780 - l * 36 - l * l * 2.6);
  levelEl.textContent = String(state.level);

  const musicIntensity = Math.min(1, 0.14 + l * 0.028 + l * l * 0.0085);
  music.setIntensity(musicIntensity);
}

function createObstacle() {
  const margin = 66;
  const gapY = margin + Math.random() * (GROUND_Y - margin * 2 - state.gapSize);
  const l = state.level - 1;
  const baseWidth = Math.min(142, 88 + l * 2.2);
  const width = baseWidth + Math.random() * 32;
  const topType = Math.random() < 0.55 ? "branch" : "wire";
  const bottomType = Math.random() < 0.6 ? "tree" : "log";

  state.obstacles.push({
    x: W + 24,
    width,
    gapY,
    passed: false,
    topType,
    bottomType,
  });
}

function startGame() {
  state.mode = "playing";
  state.score = 0;
  state.level = 1;
  state.bird.x = 220;
  state.bird.y = H * 0.45;
  state.bird.vy = 0;
  state.obstacles = [];
  state.sinceSpawn = -420;
  state.scroll = 0;
  state.keys.up = false;
  state.keys.down = false;
  updateDifficulty();
  scoreEl.textContent = "0";
  menuEl.classList.add("hidden");
  music.start();
}

function endGame() {
  state.mode = "gameover";
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("torontoFlappyBest", String(state.best));
    bestEl.textContent = String(state.best);
  }
  menuTitleEl.textContent = "Flight Ended - Try Again";
  startBtn.textContent = "Restart Flight";
  menuEl.classList.remove("hidden");
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, "#9fd0f5");
  g.addColorStop(0.56, "#d4ecfb");
  g.addColorStop(1, "#f5f5ea");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GROUND_Y);

  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 220 - state.scroll * 0.16) % (W + 260)) - 120;
    const y = 66 + (i % 3) * 48;
    ctx.fillStyle = "#ffffff88";
    ctx.beginPath();
    ctx.ellipse(x, y, 62, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 44, y + 8, 48, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTorontoBackdrop() {
  const offset = state.scroll * 0.34;
  ctx.fillStyle = "#7890a8";
  for (let i = -1; i < 8; i += 1) {
    const baseX = i * 170 - (offset % 170);
    const h = 120 + (i % 3) * 35;
    ctx.fillRect(baseX, GROUND_Y - h - 72, 56, h);
    ctx.fillRect(baseX + 62, GROUND_Y - h * 0.85 - 72, 44, h * 0.85);
    ctx.fillRect(baseX + 110, GROUND_Y - h * 0.65 - 72, 50, h * 0.65);
  }

  const cnX = 820 - (offset % 1024);
  ctx.fillStyle = "#6e8399";
  ctx.fillRect(cnX, GROUND_Y - 284, 12, 212);
  ctx.beginPath();
  ctx.arc(cnX + 6, GROUND_Y - 86, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cnX + 3.5, GROUND_Y - 330, 5, 46);
}

function drawParkMidground() {
  const offset = state.scroll * 0.8;

  ctx.fillStyle = "#8ca98d";
  ctx.fillRect(0, GROUND_Y - 55, W, 55);

  for (let i = -1; i < 15; i += 1) {
    const x = i * 86 - (offset % 86);
    ctx.fillStyle = "#6b5b44";
    ctx.fillRect(x + 38, GROUND_Y - 105, 9, 50);

    const canopy = ctx.createRadialGradient(x + 42, GROUND_Y - 118, 5, x + 42, GROUND_Y - 118, 34);
    canopy.addColorStop(0, "#5d8c5c");
    canopy.addColorStop(1, "#375437");
    ctx.fillStyle = canopy;
    ctx.beginPath();
    ctx.arc(x + 42, GROUND_Y - 118, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#b8a78d";
  ctx.fillRect(0, GROUND_Y - 20, W, 20);
  ctx.fillStyle = "#8a7a64";
  for (let i = 0; i < W; i += 22) {
    ctx.fillRect(i, GROUND_Y - 20, 12, 2);
  }
}

function drawObstacle(o) {
  const topH = o.gapY;
  const bottomY = o.gapY + state.gapSize;
  const bottomH = GROUND_Y - bottomY;

  if (o.topType === "branch") {
    const bark = ctx.createLinearGradient(o.x, 0, o.x + o.width, 0);
    bark.addColorStop(0, "#5f4635");
    bark.addColorStop(1, "#7c5a41");
    ctx.fillStyle = bark;
    ctx.fillRect(o.x, 0, o.width, topH);
    ctx.fillStyle = "#496544";
    for (let y = 24; y < topH; y += 26) {
      ctx.beginPath();
      ctx.ellipse(o.x + 16 + (y % 11), y, 20, 8, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#2f3f4a";
    ctx.fillRect(o.x + o.width * 0.45, 0, 12, topH);
    ctx.fillStyle = "#4b5f6c";
    for (let y = 16; y < topH; y += 18) {
      ctx.fillRect(o.x, y, o.width, 3);
    }
  }

  if (o.bottomType === "tree") {
    ctx.fillStyle = "#654b36";
    ctx.fillRect(o.x + o.width * 0.42, bottomY, 16, bottomH);
    const leaves = ctx.createRadialGradient(
      o.x + o.width / 2,
      bottomY + 16,
      8,
      o.x + o.width / 2,
      bottomY + 16,
      52,
    );
    leaves.addColorStop(0, "#659466");
    leaves.addColorStop(1, "#335333");
    ctx.fillStyle = leaves;
    ctx.beginPath();
    ctx.arc(o.x + o.width / 2, bottomY + 18, 52, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const log = ctx.createLinearGradient(o.x, bottomY, o.x + o.width, bottomY);
    log.addColorStop(0, "#8b6847");
    log.addColorStop(1, "#6f4f35");
    ctx.fillStyle = log;
    ctx.fillRect(o.x, bottomY, o.width, bottomH);
    ctx.fillStyle = "#4d3625";
    for (let y = bottomY + 8; y < GROUND_Y; y += 16) {
      ctx.fillRect(o.x + 5, y, o.width - 10, 2);
    }
  }

  ctx.fillStyle = "#2f3b43";
  ctx.fillRect(o.x - 3, topH - 6, o.width + 6, 6);
  ctx.fillRect(o.x - 3, bottomY, o.width + 6, 6);
}

function drawBird() {
  const b = state.bird;
  const spec = state.selectedBird;
  const wingOsc = Math.sin(state.wingPhase) * 8;
  const tilt = Math.max(-0.55, Math.min(0.65, b.vy * 0.08));

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(tilt);

  const body = ctx.createRadialGradient(-4, -5, 3, 0, 0, 24);
  body.addColorStop(0, spec.chest);
  body.addColorStop(1, spec.body);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 16, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = spec.wing;
  ctx.beginPath();
  ctx.ellipse(-3, 3, 12, 8 + wingOsc * 0.1, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(8, -4, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#202020";
  ctx.beginPath();
  ctx.arc(9, -4, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = spec.beak;
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(30, 5);
  ctx.lineTo(18, 8);
  ctx.closePath();
  ctx.fill();

  if (spec.id === "blue_jay" || spec.id === "cardinal") {
    ctx.fillStyle = spec.wing;
    ctx.beginPath();
    ctx.moveTo(-2, -14);
    ctx.lineTo(3, -24);
    ctx.lineTo(8, -13);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawGround() {
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  g.addColorStop(0, "#7a9f72");
  g.addColorStop(1, "#5f7c57");
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.fillStyle = "#48603f";
  for (let i = 0; i < W; i += 18) {
    const x = (i - state.scroll * 1.6) % (W + 18);
    ctx.fillRect(x, GROUND_Y + 10, 8, 12);
  }
}

function updateBird(dt) {
  const gravity = 820;
  const upForce = 1420;
  const downForce = 930;
  const drag = 0.986;

  if (state.keys.up) state.bird.vy -= upForce * dt;
  if (state.keys.down) state.bird.vy += downForce * dt;
  state.bird.vy += gravity * dt;
  state.bird.vy *= drag;
  state.bird.vy = Math.max(-420, Math.min(520, state.bird.vy));

  state.bird.y += state.bird.vy * dt;
  state.wingPhase += dt * (state.keys.up ? 26 : 14);
}

function updateObstacles(dt) {
  state.sinceSpawn += dt * 1000;
  if (state.sinceSpawn >= state.spawnMs) {
    createObstacle();
    state.sinceSpawn = 0;
  }

  for (const o of state.obstacles) {
    o.x -= state.speed * 60 * dt;

    if (!o.passed && o.x + o.width < state.bird.x) {
      o.passed = true;
      state.score += 1;
      scoreEl.textContent = String(state.score);
      updateDifficulty();
    }
  }

  state.obstacles = state.obstacles.filter((o) => o.x + o.width > -20);
}

function collide() {
  const b = state.bird;
  if (b.y - b.r <= 0 || b.y + b.r >= GROUND_Y) return true;

  for (const o of state.obstacles) {
    const overlapX = b.x + b.r > o.x && b.x - b.r < o.x + o.width;
    if (!overlapX) continue;
    const gapTop = o.gapY;
    const gapBottom = o.gapY + state.gapSize;
    if (b.y - b.r < gapTop || b.y + b.r > gapBottom) return true;
  }
  return false;
}

function frame(now) {
  const dt = Math.min(0.033, (now - state.lastTime) / 1000);
  state.lastTime = now;

  drawSky();
  drawTorontoBackdrop();
  drawParkMidground();

  if (state.mode === "playing") {
    state.scroll += state.speed * 60 * dt;
    updateBird(dt);
    updateObstacles(dt);
    if (collide()) endGame();
  }

  for (const o of state.obstacles) {
    drawObstacle(o);
  }

  drawGround();
  drawBird();

  requestAnimationFrame(frame);
}

function renderBirdPicker() {
  birdPickerEl.innerHTML = "";
  for (const bird of BIRDS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bird-option";
    if (bird.id === state.selectedBird.id) btn.classList.add("active");
    btn.innerHTML = `<strong>${bird.name}</strong><small>${bird.note}</small>`;
    btn.addEventListener("click", () => {
      state.selectedBird = bird;
      renderBirdPicker();
    });
    birdPickerEl.appendChild(btn);
  }
}

function setMenuForStart() {
  menuTitleEl.textContent = "Choose Your Toronto Bird";
  startBtn.textContent = "Start Flight";
  menuEl.classList.remove("hidden");
}

startBtn.addEventListener("click", () => {
  startGame();
});

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp") {
    e.preventDefault();
    state.keys.up = true;
  } else if (e.code === "ArrowDown") {
    e.preventDefault();
    state.keys.down = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowUp") {
    e.preventDefault();
    state.keys.up = false;
  } else if (e.code === "ArrowDown") {
    e.preventDefault();
    state.keys.down = false;
  }
});

renderBirdPicker();
setMenuForStart();
requestAnimationFrame(frame);
