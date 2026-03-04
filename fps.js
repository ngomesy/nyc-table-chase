const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const levelEl = document.getElementById("level");
const healthEl = document.getElementById("health");
const weaponEl = document.getElementById("weapon");
const ammoEl = document.getElementById("ammo");
const zombiesEl = document.getElementById("zombies");
const objectiveEl = document.getElementById("objective");
const statusEl = document.getElementById("status");

const VIEW_W = 320;
const VIEW_H = 180;
const FOV = Math.PI / 3;
const PLAYER_RADIUS = 0.22;

const view = document.createElement("canvas");
view.width = VIEW_W;
view.height = VIEW_H;
const vctx = view.getContext("2d");
vctx.imageSmoothingEnabled = false;

const MAP = [
  "####################",
  "#S........#.......W#",
  "#.####.##.#.####...#",
  "#....#....#....#...#",
  "#.##.#.##.#.##.#.#.#",
  "#....#....#....#...#",
  "#.##.####.####.#.#.#",
  "#..................#",
  "#.##.#.######.#.##.#",
  "#....#...##...#....#",
  "#.####.#.##.#.####.#",
  "#......#....#......#",
  "#.####.######.####.#",
  "#W....#......#....W#",
  "#.##..#.####.#..##.#",
  "#....S...........P.#",
  "####################",
];

const WEAPONS = {
  pistol: {
    id: "pistol",
    name: "Pistol",
    damage: 1,
    pellets: 1,
    spread: 0.02,
    fireMs: 210,
    ammoPerShot: 1,
    range: 13,
    accuracy: 0.94,
    pickupAmmo: 28,
    spriteColor: "#5f667e",
    flashScale: 0.85,
  },
  shotgun: {
    id: "shotgun",
    name: "Shotgun",
    damage: 1,
    pellets: 5,
    spread: 0.11,
    fireMs: 520,
    ammoPerShot: 1,
    range: 7.5,
    accuracy: 0.72,
    pickupAmmo: 16,
    spriteColor: "#6d5136",
    flashScale: 1.25,
  },
  rifle: {
    id: "rifle",
    name: "Rifle",
    damage: 2,
    pellets: 1,
    spread: 0.012,
    fireMs: 150,
    ammoPerShot: 1,
    range: 15,
    accuracy: 0.97,
    pickupAmmo: 36,
    spriteColor: "#4c5e53",
    flashScale: 1.05,
  },
};

const WEAPON_ORDER = ["pistol", "shotgun", "rifle"];

const playerSpawn = { x: 1.5, y: 1.5 };
const princessPos = { x: 18.2, y: 15.5 };
const zombieSpawns = [];
const pickupSpawns = [];

for (let y = 0; y < MAP.length; y += 1) {
  for (let x = 0; x < MAP[y].length; x += 1) {
    const c = MAP[y][x];
    if (c === "S") zombieSpawns.push({ x: x + 0.5, y: y + 0.5 });
    if (c === "W") pickupSpawns.push({ x: x + 0.5, y: y + 0.5 });
    if (c === "P") {
      princessPos.x = x + 0.5;
      princessPos.y = y + 0.5;
    }
  }
}

const state = {
  mode: "intro", // intro | playing | dead | intermission
  level: 1,
  player: {
    x: playerSpawn.x,
    y: playerSpawn.y,
    angle: 0,
    health: 100,
    weapon: "pistol",
    ammo: 28,
  },
  zombies: [],
  weaponPickups: [],
  zBuffer: new Array(VIEW_W).fill(Infinity),
  keys: new Set(),
  shotCooldownMs: 0,
  muzzleMs: 0,
  flashNoise: 0,
  lastTime: performance.now(),
  hintPickup: null,
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, duration, type = "square", volume = 0.15, slide = 0, whenOffset = 0) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime + whenOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide !== 0) {
      osc.frequency.linearRampToValueAtTime(Math.max(40, freq + slide), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration = 0.08, volume = 0.12, whenOffset = 0) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime + whenOffset;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    const bass = [82.41, 82.41, 92.5, 98, 82.41, 73.42, 92.5, 98];
    const lead = [196, 220, 233, 262, 233, 220, 196, 174];

    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      if (state.mode === "dead") return;
      const i = this.musicStep % bass.length;
      const levelMod = Math.min(0.03 * state.level, 0.18);
      this.tone(bass[i], 0.2, "square", 0.06 + levelMod);
      this.tone(lead[i], 0.13, "triangle", 0.055, 0, 0.06);
      if (this.musicStep % 4 === 0) {
        this.tone(41.2, 0.08, "square", 0.045);
      }
      this.musicStep += 1;
    }, 250);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  shoot(weaponId) {
    this.ensure();
    if (!this.ctx) return;
    if (weaponId === "shotgun") {
      this.tone(120, 0.09, "square", 0.16, -55);
      this.noise(0.07, 0.17);
    } else if (weaponId === "rifle") {
      this.tone(220, 0.05, "sawtooth", 0.11, -90);
      this.noise(0.04, 0.06);
    } else {
      this.tone(180, 0.05, "square", 0.1, -35);
      this.noise(0.03, 0.05);
    }
  }

  hit() {
    this.ensure();
    this.tone(330, 0.04, "square", 0.06, -60);
  }

  kill() {
    this.ensure();
    this.tone(165, 0.07, "square", 0.08, -90);
    this.tone(110, 0.1, "triangle", 0.08, -50, 0.05);
  }

  hurt() {
    this.ensure();
    this.tone(96, 0.08, "sawtooth", 0.1, -40);
  }

  pickup() {
    this.ensure();
    this.tone(392, 0.06, "square", 0.08);
    this.tone(523, 0.07, "triangle", 0.07, 0, 0.04);
  }

  levelClear() {
    this.ensure();
    this.tone(330, 0.08, "square", 0.09);
    this.tone(392, 0.08, "square", 0.09, 0, 0.08);
    this.tone(523, 0.15, "triangle", 0.09, 0, 0.16);
  }
}

const audioEngine = new AudioEngine();

function normalizeAngle(a) {
  let out = a;
  while (out > Math.PI) out -= Math.PI * 2;
  while (out < -Math.PI) out += Math.PI * 2;
  return out;
}

function cellAt(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (iy < 0 || iy >= MAP.length || ix < 0 || ix >= MAP[0].length) return "#";
  const c = MAP[iy][ix];
  return c === "#" ? "#" : ".";
}

function isWall(x, y) {
  return cellAt(x, y) === "#";
}

function canMoveTo(x, y) {
  return (
    !isWall(x - PLAYER_RADIUS, y - PLAYER_RADIUS) &&
    !isWall(x + PLAYER_RADIUS, y - PLAYER_RADIUS) &&
    !isWall(x - PLAYER_RADIUS, y + PLAYER_RADIUS) &&
    !isWall(x + PLAYER_RADIUS, y + PLAYER_RADIUS)
  );
}

function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const steps = Math.max(4, Math.ceil(d * 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isWall(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function updateHud() {
  levelEl.textContent = String(state.level);
  healthEl.textContent = String(Math.max(0, Math.round(state.player.health)));
  weaponEl.textContent = WEAPONS[state.player.weapon].name;
  ammoEl.textContent = String(state.player.ammo);
  zombiesEl.textContent = String(state.zombies.filter((z) => z.alive).length);
}

function randomWeaponForLevel(level) {
  const roll = Math.random();
  if (level >= 4 && roll < 0.5) return "rifle";
  if (level >= 2 && roll < 0.8) return "shotgun";
  return "pistol";
}

function spawnLevel(level, fromAdvance = false) {
  state.player.x = playerSpawn.x;
  state.player.y = playerSpawn.y;
  state.player.angle = 0;
  if (fromAdvance) {
    state.player.health = Math.min(100, state.player.health + 22);
    state.player.ammo += 10 + Math.floor(level * 1.5);
  }

  state.zombies = [];
  state.weaponPickups = [];
  state.hintPickup = null;

  const zombieCount = Math.min(8 + level * 3, 44);
  for (let i = 0; i < zombieCount; i += 1) {
    const spawn = zombieSpawns[i % zombieSpawns.length];
    const jitterX = rand(-0.35, 0.35);
    const jitterY = rand(-0.35, 0.35);
    state.zombies.push({
      x: spawn.x + jitterX,
      y: spawn.y + jitterY,
      hp: 2 + Math.floor(level / 2),
      alive: true,
      attackMs: rand(0, 500),
      memoryMs: 0,
      speedBase: 0.95 + level * 0.11 + Math.random() * 0.22,
      damage: 7 + level * 1.4,
      aggroRange: 8.5 + level * 0.9,
      sprintBias: 0.24 + Math.min(0.4, level * 0.03),
    });
  }

  const pickupCount = Math.min(2 + Math.floor(level / 2), pickupSpawns.length);
  for (let i = 0; i < pickupCount; i += 1) {
    const p = pickupSpawns[i % pickupSpawns.length];
    const weapon = randomWeaponForLevel(level + i);
    state.weaponPickups.push({
      x: p.x,
      y: p.y,
      weapon,
      ammo: WEAPONS[weapon].pickupAmmo + Math.floor(level * 2),
      bob: Math.random() * Math.PI * 2,
    });
  }

  state.shotCooldownMs = 0;
  state.muzzleMs = 0;

  objectiveEl.textContent = "Eliminate all zombies";
  statusEl.textContent = `Level ${level}: breach the castle.`;
  updateHud();
}

function resetFullGame() {
  state.mode = "intro";
  state.level = 1;
  state.player.health = 100;
  state.player.weapon = "pistol";
  state.player.ammo = WEAPONS.pistol.pickupAmmo;
  spawnLevel(1, false);
  statusEl.textContent = "Click canvas or press Enter to begin.";
}

function startIfNeeded() {
  if (state.mode === "intro") {
    state.mode = "playing";
    statusEl.textContent = "";
  }
}

function beginNextLevel() {
  state.mode = "playing";
  spawnLevel(state.level, true);
  statusEl.textContent = `Level ${state.level}: zombies are more aggressive.`;
}

function damageZombie(zombie, amount) {
  zombie.hp -= amount;
  if (zombie.hp <= 0) {
    zombie.alive = false;
    audioEngine.kill();
    if (Math.random() < 0.4) {
      const better = Math.min(2, Math.floor((state.level + 1) / 2));
      const weaponId = WEAPON_ORDER[Math.max(0, better - Math.floor(Math.random() * 2))] || "pistol";
      state.weaponPickups.push({
        x: zombie.x,
        y: zombie.y,
        weapon: weaponId,
        ammo: WEAPONS[weaponId].pickupAmmo,
        bob: Math.random() * Math.PI * 2,
      });
    }
    const alive = state.zombies.filter((z) => z.alive).length;
    if (alive === 0) {
      objectiveEl.textContent = "Reach the princess";
      statusEl.textContent = "Horde cleared. Reach the princess chamber.";
      audioEngine.levelClear();
    }
  } else {
    audioEngine.hit();
  }
}

function castBullet(angle, range, damage) {
  const step = 0.09;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  for (let d = 0.2; d <= range; d += step) {
    const bx = state.player.x + dx * d;
    const by = state.player.y + dy * d;
    if (isWall(bx, by)) return false;

    for (const zombie of state.zombies) {
      if (!zombie.alive) continue;
      const dist = Math.hypot(zombie.x - bx, zombie.y - by);
      if (dist < 0.32) {
        damageZombie(zombie, damage);
        return true;
      }
    }
  }

  return false;
}

function shoot() {
  if (state.mode === "dead" || state.mode === "intermission") return;
  startIfNeeded();
  if (state.mode !== "playing") return;

  if (state.shotCooldownMs > 0) return;

  const weapon = WEAPONS[state.player.weapon];
  if (state.player.ammo < weapon.ammoPerShot) {
    statusEl.textContent = "Out of ammo. Find a weapon pickup.";
    return;
  }

  state.player.ammo -= weapon.ammoPerShot;
  state.shotCooldownMs = weapon.fireMs;
  state.muzzleMs = 90;
  state.flashNoise = Math.random();
  audioEngine.shoot(state.player.weapon);

  let anyHit = false;
  for (let i = 0; i < weapon.pellets; i += 1) {
    const spread = (Math.random() - 0.5) * weapon.spread;
    const accuracyPenalty = (1 - weapon.accuracy) * (Math.random() - 0.5) * 0.12;
    const rayAngle = state.player.angle + spread + accuracyPenalty;
    if (castBullet(rayAngle, weapon.range, weapon.damage)) anyHit = true;
  }

  if (anyHit) {
    statusEl.textContent = "Direct hit.";
  }

  updateHud();
}

function tryPickupWeapon() {
  if (state.mode !== "playing") return;
  let nearest = null;
  let nearestDist = Infinity;

  for (const pickup of state.weaponPickups) {
    const d = Math.hypot(pickup.x - state.player.x, pickup.y - state.player.y);
    if (d < 1.1 && d < nearestDist) {
      nearest = pickup;
      nearestDist = d;
    }
  }

  if (!nearest) return;

  const oldWeapon = state.player.weapon;
  const oldAmmo = state.player.ammo;

  state.player.weapon = nearest.weapon;
  state.player.ammo = nearest.ammo;

  state.weaponPickups = state.weaponPickups.filter((p) => p !== nearest);
  state.weaponPickups.push({
    x: nearest.x,
    y: nearest.y,
    weapon: oldWeapon,
    ammo: Math.max(8, Math.floor(oldAmmo * 0.55)),
    bob: Math.random() * Math.PI * 2,
  });

  statusEl.textContent = `Swapped to ${WEAPONS[state.player.weapon].name}.`;
  audioEngine.pickup();
  updateHud();
}

function updatePlayer(dt) {
  const turnSpeed = 2.55;
  const moveSpeed = 3.0;
  const strafeSpeed = 2.7;

  if (state.keys.has("ArrowLeft")) state.player.angle -= turnSpeed * dt;
  if (state.keys.has("ArrowRight")) state.player.angle += turnSpeed * dt;

  const dx = Math.cos(state.player.angle);
  const dy = Math.sin(state.player.angle);
  const rx = Math.cos(state.player.angle + Math.PI / 2);
  const ry = Math.sin(state.player.angle + Math.PI / 2);

  let vx = 0;
  let vy = 0;

  if (state.keys.has("KeyW")) {
    vx += dx * moveSpeed;
    vy += dy * moveSpeed;
  }
  if (state.keys.has("KeyS")) {
    vx -= dx * moveSpeed;
    vy -= dy * moveSpeed;
  }
  if (state.keys.has("KeyA")) {
    vx -= rx * strafeSpeed;
    vy -= ry * strafeSpeed;
  }
  if (state.keys.has("KeyD")) {
    vx += rx * strafeSpeed;
    vy += ry * strafeSpeed;
  }

  const nx = state.player.x + vx * dt;
  const ny = state.player.y + vy * dt;

  if (canMoveTo(nx, state.player.y)) state.player.x = nx;
  if (canMoveTo(state.player.x, ny)) state.player.y = ny;
}

function updateZombies(dt) {
  for (const zombie of state.zombies) {
    if (!zombie.alive) continue;

    const dx = state.player.x - zombie.x;
    const dy = state.player.y - zombie.y;
    const dist = Math.hypot(dx, dy);

    zombie.attackMs -= dt * 1000;
    zombie.memoryMs -= dt * 1000;

    const seesPlayer = dist < zombie.aggroRange && hasLineOfSight(zombie.x, zombie.y, state.player.x, state.player.y);
    if (seesPlayer) {
      zombie.memoryMs = 2600 + state.level * 180;
    }

    if (dist < 0.85) {
      if (zombie.attackMs <= 0) {
        zombie.attackMs = Math.max(360, 720 - state.level * 40);
        state.player.health -= zombie.damage;
        statusEl.textContent = "A zombie ripped into you!";
        audioEngine.hurt();
        if (state.player.health <= 0) {
          state.player.health = 0;
          state.mode = "dead";
          statusEl.textContent = "You were overrun. Press R to restart.";
        }
        updateHud();
      }
      continue;
    }

    if (zombie.memoryMs > 0) {
      const sprintBoost = dist < 3.2 || Math.random() < zombie.sprintBias ? 1.35 : 1;
      const speed = zombie.speedBase * sprintBoost;

      const stepX = (dx / Math.max(0.001, dist)) * speed * dt;
      const stepY = (dy / Math.max(0.001, dist)) * speed * dt;

      const zx = zombie.x + stepX;
      const zy = zombie.y + stepY;

      if (!isWall(zx, zombie.y)) zombie.x = zx;
      if (!isWall(zombie.x, zy)) zombie.y = zy;
    }
  }
}

function castWalls() {
  const dirX = Math.cos(state.player.angle);
  const dirY = Math.sin(state.player.angle);
  const planeScale = Math.tan(FOV / 2);
  const planeX = -dirY * planeScale;
  const planeY = dirX * planeScale;

  for (let x = 0; x < VIEW_W; x += 1) {
    const cameraX = (2 * x) / VIEW_W - 1;
    const rayDirX = dirX + planeX * cameraX;
    const rayDirY = dirY + planeY * cameraX;

    let mapX = Math.floor(state.player.x);
    let mapY = Math.floor(state.player.y);

    const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
    const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

    let stepX;
    let stepY;
    let sideDistX;
    let sideDistY;

    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (state.player.x - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - state.player.x) * deltaDistX;
    }

    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (state.player.y - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - state.player.y) * deltaDistY;
    }

    let side = 0;
    while (true) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      if (cellAt(mapX + 0.5, mapY + 0.5) === "#") break;
    }

    const perpWallDist =
      side === 0
        ? (mapX - state.player.x + (1 - stepX) / 2) / rayDirX
        : (mapY - state.player.y + (1 - stepY) / 2) / rayDirY;

    state.zBuffer[x] = perpWallDist;

    const lineHeight = Math.floor(VIEW_H / Math.max(0.001, perpWallDist));
    const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + VIEW_H / 2));
    const drawEnd = Math.min(VIEW_H - 1, Math.floor(lineHeight / 2 + VIEW_H / 2));

    const shade = Math.max(0.24, 1 - perpWallDist / 11.5);
    const levelTint = Math.min(45, state.level * 4);
    const base = side ? [96, 80, 116] : [120, 100, 146];
    const r = Math.floor((base[0] + levelTint * 0.3) * shade);
    const g = Math.floor((base[1] - levelTint * 0.1) * shade);
    const b = Math.floor((base[2] + levelTint * 0.25) * shade);
    vctx.fillStyle = `rgb(${r},${g},${b})`;
    vctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);

    if (((drawStart + drawEnd) >> 3) % 2 === 0) {
      vctx.fillStyle = `rgb(${Math.max(0, r - 16)},${Math.max(0, g - 16)},${Math.max(0, b - 16)})`;
      vctx.fillRect(x, Math.floor((drawStart + drawEnd) / 2), 1, 1);
    }
  }
}

function drawBackdrop() {
  const sky = vctx.createLinearGradient(0, 0, 0, VIEW_H / 2);
  sky.addColorStop(0, "#281325");
  sky.addColorStop(1, "#5a2f3f");
  vctx.fillStyle = sky;
  vctx.fillRect(0, 0, VIEW_W, VIEW_H / 2);

  const floor = vctx.createLinearGradient(0, VIEW_H / 2, 0, VIEW_H);
  floor.addColorStop(0, "#3f2121");
  floor.addColorStop(0.4, "#642821");
  floor.addColorStop(1, "#a03c1f");
  vctx.fillStyle = floor;
  vctx.fillRect(0, VIEW_H / 2, VIEW_W, VIEW_H / 2);

  const t = performance.now() * 0.008;
  for (let i = 0; i < 26; i += 1) {
    const x = (i * 29 + Math.sin(t + i) * 4 + 9) % VIEW_W;
    const y = VIEW_H / 2 + ((i * 17 + Math.cos(t * 0.7 + i) * 5) % (VIEW_H / 2));
    vctx.fillStyle = i % 2 ? "#ff6f2d28" : "#ffd16620";
    vctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
  }
}

function projectEntity(worldX, worldY) {
  const dx = worldX - state.player.x;
  const dy = worldY - state.player.y;

  const dirX = Math.cos(state.player.angle);
  const dirY = Math.sin(state.player.angle);
  const planeScale = Math.tan(FOV / 2);
  const planeX = -dirY * planeScale;
  const planeY = dirX * planeScale;

  const invDet = 1.0 / (planeX * dirY - dirX * planeY);
  const tx = invDet * (dirY * dx - dirX * dy);
  const tz = invDet * (-planeY * dx + planeX * dy);

  if (tz <= 0.08) return null;

  const screenX = Math.floor((VIEW_W / 2) * (1 + tx / tz));
  const size = Math.abs(Math.floor(VIEW_H / tz));

  return { screenX, size, depth: tz };
}

function drawPatternEntity(entity, palette, pattern) {
  const proj = projectEntity(entity.x, entity.y);
  if (!proj) return;

  const { screenX, size, depth } = proj;
  if (size < 2) return;

  const left = screenX - size / 2;
  const top = VIEW_H / 2 - size / 2;

  const patternH = pattern.length;
  const patternW = pattern[0].length;
  const pxW = size / patternW;
  const pxH = size / patternH;

  const col = Math.max(0, Math.min(VIEW_W - 1, screenX));
  if (depth > state.zBuffer[col]) return;

  for (let py = 0; py < patternH; py += 1) {
    for (let px = 0; px < patternW; px += 1) {
      const key = pattern[py][px];
      if (key === ".") continue;
      const color = palette[key];
      if (!color) continue;

      const x = Math.floor(left + px * pxW);
      const y = Math.floor(top + py * pxH);
      const rw = Math.max(1, Math.ceil(pxW));
      const rh = Math.max(1, Math.ceil(pxH));

      if (x + rw < 0 || x >= VIEW_W || y + rh < 0 || y >= VIEW_H) continue;
      vctx.fillStyle = color;
      vctx.fillRect(x, y, rw, rh);
    }
  }
}

const zombiePatterns = [
  [
    "......GGGGGG......",
    ".....GGGGGGGG.....",
    "....GGGWGGWGGG....",
    "...GGGGGGGGGGGG...",
    "...GGGKKGGKKGGG...",
    "...GGGGGGGGGGGG...",
    "....GGTTTTTTGG....",
    "....GTTGGGGTTG....",
    "...TTTGGGGGGTTT...",
    "...TTTGGGGGGTTT...",
    "..TTTTGGGGGGTTTT..",
    "..TT...GGGG...TT..",
    "..TT...GGGG...TT..",
    "..T....GGGG....T..",
    ".......GGGG.......",
    "......TT..TT......",
  ],
  [
    "......GGGGGG......",
    ".....GGGGGGGG.....",
    "....GGGWGGWGGG....",
    "...GGGGGGGGGGGG...",
    "...GGGKKGGKKGGG...",
    "...GGGGGGGGGGGG...",
    "....GGTTTTTTGG....",
    "....GTTGGGGTTG....",
    "...TTTGGGGGGTTT...",
    "..TTTTGGGGGGTTTT..",
    "..TTTTGGGGGGTTTT..",
    "...T..GGGG..T.....",
    ".....TGGGG..TT....",
    "....TTGGGG...T....",
    "......GGGG........",
    ".....TT..TT.......",
  ],
];

const princessPattern = [
  "......YYYYYY......",
  ".....YPPPPPPY.....",
  "....YPPPPPPPPY....",
  "...YPPWWPPWWPPY...",
  "...YPPPPPPPPPPY...",
  "....YPPKPPKPPY....",
  "....YPPPPPPPPY....",
  ".....YPPPPPPY.....",
  "......YPPPPY......",
  "......RPPPPY......",
  ".....RRPPPPYY.....",
  "....RRRPPPPYYY....",
  "....RRRPPPPYYY....",
  ".....BB....BB.....",
  "....BB......BB....",
  "...BB........BB...",
];

function drawEntities() {
  const entities = [];

  for (const z of state.zombies) {
    if (!z.alive) continue;
    const d2 = (z.x - state.player.x) ** 2 + (z.y - state.player.y) ** 2;
    entities.push({ type: "zombie", x: z.x, y: z.y, d2 });
  }

  for (const p of state.weaponPickups) {
    const d2 = (p.x - state.player.x) ** 2 + (p.y - state.player.y) ** 2;
    entities.push({ type: "pickup", x: p.x, y: p.y, d2, pickup: p });
  }

  entities.push({
    type: "princess",
    x: princessPos.x,
    y: princessPos.y,
    d2: (princessPos.x - state.player.x) ** 2 + (princessPos.y - state.player.y) ** 2,
  });

  entities.sort((a, b) => b.d2 - a.d2);

  const frame = Math.floor(performance.now() / 190) % zombiePatterns.length;

  for (const e of entities) {
    if (e.type === "zombie") {
      drawPatternEntity(
        e,
        {
          G: "#78ca70",
          W: "#ececec",
          K: "#1a1a1a",
          T: "#4e596d",
        },
        zombiePatterns[frame],
      );
    } else if (e.type === "princess") {
      drawPatternEntity(
        e,
        {
          Y: "#ffd166",
          P: "#f49ac2",
          W: "#f7f7f7",
          K: "#a54f6b",
          R: "#d35f6d",
          B: "#6478bd",
        },
        princessPattern,
      );
    } else {
      const weapon = WEAPONS[e.pickup.weapon];
      const bob = Math.sin(performance.now() * 0.006 + e.pickup.bob) * 0.08;
      drawPatternEntity(
        { x: e.x, y: e.y + bob },
        {
          A: weapon.spriteColor,
          B: "#d8c38a",
          C: "#222732",
        },
        [
          ".....AA.....",
          "....AAAA....",
          "...AACCAA...",
          "...AACCAA...",
          "....BBBB....",
          ".....CC.....",
        ],
      );
    }
  }
}

function drawWeaponView() {
  const weapon = WEAPONS[state.player.weapon];
  const sway = Math.sin(performance.now() * 0.01) * 2;
  const weaponY = VIEW_H - 26 + sway;

  vctx.fillStyle = "#1f2332";
  vctx.fillRect(VIEW_W / 2 - 21, weaponY, 42, 20);

  vctx.fillStyle = weapon.spriteColor;
  if (state.player.weapon === "shotgun") {
    vctx.fillRect(VIEW_W / 2 - 16, weaponY - 7, 32, 8);
    vctx.fillStyle = "#2b2b2b";
    vctx.fillRect(VIEW_W / 2 - 5, weaponY - 10, 10, 4);
  } else if (state.player.weapon === "rifle") {
    vctx.fillRect(VIEW_W / 2 - 18, weaponY - 8, 36, 9);
    vctx.fillStyle = "#2c3330";
    vctx.fillRect(VIEW_W / 2 - 3, weaponY - 12, 6, 5);
  } else {
    vctx.fillRect(VIEW_W / 2 - 12, weaponY - 6, 24, 7);
  }

  vctx.fillStyle = "#ffdca8";
  vctx.fillRect(VIEW_W / 2 - 2, VIEW_H / 2 - 6, 4, 12);
  vctx.fillRect(VIEW_W / 2 - 7, VIEW_H / 2 - 1, 14, 2);

  if (state.muzzleMs > 0) {
    const flashSize = 9 * weapon.flashScale;
    const flicker = 1 + state.flashNoise * 0.9;
    const fx = VIEW_W / 2 + rand(-1.5, 1.5);
    const fy = VIEW_H / 2 + rand(-1.5, 1.5);

    vctx.fillStyle = "#fff5cc";
    vctx.fillRect(fx - flashSize * flicker * 0.5, fy - flashSize * 0.5, flashSize * flicker, flashSize);
    vctx.fillStyle = "#ffb347";
    vctx.fillRect(fx - flashSize * 0.35, fy - flashSize * 0.35, flashSize * 0.7, flashSize * 0.7);
    vctx.fillStyle = "#ff6f2d";
    vctx.fillRect(fx - flashSize * 0.18, fy - flashSize * 0.18, flashSize * 0.36, flashSize * 0.36);
  }
}

function render() {
  drawBackdrop();
  castWalls();
  drawEntities();
  drawWeaponView();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(view, 0, 0, canvas.width, canvas.height);

  if (state.mode === "intro") {
    ctx.fillStyle = "#0000009e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffd166";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Courier New";
    ctx.fillText("Castle Siege FPS", canvas.width / 2, canvas.height / 2 - 34);
    ctx.fillStyle = "#f5f0dc";
    ctx.font = "19px Courier New";
    ctx.fillText("Zombie horde grows each level", canvas.width / 2, canvas.height / 2 + 6);
    ctx.fillText("Rescue the princess and descend deeper", canvas.width / 2, canvas.height / 2 + 34);
  }

  if (state.mode === "dead") {
    ctx.fillStyle = "#000000b0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff8b6a";
    ctx.textAlign = "center";
    ctx.font = "bold 38px Courier New";
    ctx.fillText("Defeated", canvas.width / 2, canvas.height / 2 - 18);
    ctx.fillStyle = "#f4e8d8";
    ctx.font = "20px Courier New";
    ctx.fillText("Press R to restart your run", canvas.width / 2, canvas.height / 2 + 22);
  }

  if (state.mode === "intermission") {
    ctx.fillStyle = "#0000008f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffd166";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Courier New";
    ctx.fillText(`Level ${state.level - 1} Cleared`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#f5f0dc";
    ctx.font = "20px Courier New";
    ctx.fillText("Press Enter to descend to next floor", canvas.width / 2, canvas.height / 2 + 20);
  }
}

function updateObjectiveAndPrompts() {
  const alive = state.zombies.filter((z) => z.alive).length;
  if (alive > 0) {
    objectiveEl.textContent = "Eliminate all zombies";
  } else {
    objectiveEl.textContent = "Reach the princess";
  }

  state.hintPickup = null;
  let nearest = Infinity;
  for (const pickup of state.weaponPickups) {
    const d = Math.hypot(pickup.x - state.player.x, pickup.y - state.player.y);
    if (d < 1.1 && d < nearest) {
      nearest = d;
      state.hintPickup = pickup;
    }
  }

  if (state.mode === "playing" && state.hintPickup) {
    const target = WEAPONS[state.hintPickup.weapon].name;
    statusEl.textContent = `Press E to swap for ${target}.`;
  }
}

function update(deltaMs) {
  const dt = Math.min(deltaMs / 1000, 0.035);

  if (state.shotCooldownMs > 0) state.shotCooldownMs -= deltaMs;
  if (state.muzzleMs > 0) state.muzzleMs -= deltaMs;

  if (state.mode !== "playing") return;

  updatePlayer(dt);
  updateZombies(dt);
  updateObjectiveAndPrompts();

  const alive = state.zombies.filter((z) => z.alive).length;
  if (alive === 0) {
    const d = Math.hypot(state.player.x - princessPos.x, state.player.y - princessPos.y);
    if (d < 0.95) {
      state.level += 1;
      state.mode = "intermission";
      statusEl.textContent = "Princess safe. Prepare for the next floor.";
      updateHud();
    }
  }

  updateHud();
}

function tick(now) {
  const deltaMs = now - state.lastTime;
  state.lastTime = now;
  update(deltaMs);
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === "Enter") {
    audioEngine.startMusic();
    if (state.mode === "intro") {
      state.mode = "playing";
      statusEl.textContent = "";
    } else if (state.mode === "intermission") {
      beginNextLevel();
    }
  }

  if (e.code === "Space") shoot();
  if (e.code === "KeyE") tryPickupWeapon();
  if (e.code === "KeyR") {
    resetFullGame();
    audioEngine.startMusic();
  }

  state.keys.add(e.code);
});

window.addEventListener("keyup", (e) => {
  state.keys.delete(e.code);
});

canvas.addEventListener("click", () => {
  audioEngine.startMusic();
  if (state.mode === "intermission") {
    beginNextLevel();
  } else {
    startIfNeeded();
    shoot();
  }
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock?.();
  }
});

window.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas && state.mode === "playing") {
    state.player.angle += e.movementX * 0.0027;
  }
});

window.addEventListener("blur", () => {
  state.keys.clear();
});

resetFullGame();
requestAnimationFrame(tick);
