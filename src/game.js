export const LANE_WIDTH = 3.35;
export const ROOF = 3.6;
export const POWER_DURATION = 12;
export const JETPACK_HEIGHT = 8;
export const RUNNER_HEIGHT = 2.6;
export const OVERHEAD_CLEARANCE = JETPACK_HEIGHT + RUNNER_HEIGHT + 1.5;
export const TRAIN_HALF_LENGTH = 7.3;
export const TRAFFIC_GAP = 3;
const solidHalfLength = entity => entity.type === 'train' ? TRAIN_HALF_LENGTH : entity.type === 'ramp' ? 4 : .4;
const isSolid = entity => ['train', 'ramp', 'barrier', 'gate'].includes(entity.type);
export const POWERS = ['magnet', 'sneakers', 'multiplier', 'jetpack'];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export class Game {
  constructor(random = Math.random) { this.random = random; this.serial = 0; this.reset(); this.state = 'home'; }
  add(type, lane, z, extra = {}) {
    const entity = { id: ++this.serial, type, lane, x: lane * LANE_WIDTH, z, y: 1.2, ...extra };
    this.entities.push(entity);
    return entity;
  }
  line(lane, from, count = 7, height = 1.2, spacing = 2.5) {
    for (let i = 0; i < count; i++) this.add('coin', lane, from - i * spacing, { y: height });
  }
  train(lane, z, ramp = false, moving = false) {
    this.add('train', lane, z, { length: 14, moving });
    if (ramp) {
      this.add('ramp', lane, z + 11, { length: 8 });
      for (let i = 0; i < 5; i++) this.add('coin', lane, z + 14 - i * 1.5, { y: 1.2 + i * .675 });
      this.line(lane, z + 6, 6, ROOF + 1.2, 2);
    }
  }
  reset() {
    Object.assign(this, { state: 'running', entities: [], events: [], lane: 0, x: 0, y: 0, vy: 0,
      slide: 0, grounded: true, distance: 0, score: 0, coins: 0, speed: 17, time: 0,
      board: 0, boards: 3, grace: 0, nextChunk: 0, chunk: 0, powerIndex: 0,
      powers: { magnet: 0, sneakers: 0, multiplier: 0, jetpack: 0 }, roofDistance: 0 });
    this.line(0, -10, 8);
    this.add('barrier', 0, -38);
    this.line(0, -36, 5, 2.4, 2);
    this.train(-1, -58);
    this.add('gate', 0, -69);
    this.line(1, -52, 6);
    this.train(1, -105, true);
    this.add('magnet', 0, -94);
    this.line(0, -103, 8);
    this.line(-1, -103, 8);
    this.nextChunk = 36;
  }
  action(action) {
    if (this.state !== 'running') return;
    if (action === 'left' || action === 'right') {
      this.lane = clamp(this.lane + (action === 'left' ? -1 : 1), -1, 1);
    }
    if (action === 'jump' && this.grounded && !this.powers.jetpack) {
      this.vy = this.powers.sneakers ? 16.8 : 11.8;
      this.grounded = false; this.slide = 0; this.events.push({ type: 'jump' });
    }
    if (action === 'slide' && !this.powers.jetpack) {
      this.slide = .85;
      if (!this.grounded) this.vy = -20;
    }
    if (action === 'board' && !this.board && this.boards > 0 && !this.powers.jetpack) {
      this.board = 30; this.boards--; this.events.push({ type: 'board' });
    }
  }
  spawnChunk() {
    const z = -145;
    const free = Math.floor(this.random() * 3) - 1;
    const other = [-1, 0, 1].filter(l => l !== free);
    const pattern = this.chunk++ % 5;
    if (pattern === 0) {
      this.train(other[0], z, true);
      this.add('barrier', other[1], z + 4);
    } else if (pattern === 1) {
      this.train(other[0], z, false, this.distance > 350);
      this.add('gate', other[1], z + 3);
    } else if (pattern === 2) {
      this.add('barrier', other[0], z);
      this.add('gate', other[1], z);
    } else if (pattern === 3) {
      this.train(other[0], z, true);
      this.train(other[1], z);
    } else {
      this.add('gate', other[0], z);
      this.add('barrier', other[1], z + 1);
    }
    this.line(free, z + 12, 12);
    if (this.chunk % 2 === 0) {
      const power = POWERS[this.powerIndex++ % POWERS.length];
      this.add(power, free, z + 15, { y: 1.4 });
    }
  }
  moveTraffic(step) {
    // The track scroll moves every object equally. Only train motion needs lane clearance.
    for (const entity of this.entities) entity.z += step;
    const solids = this.entities.filter(isSolid).sort((a, b) => b.z - a.z);
    for (let index = 0; index < solids.length; index++) {
      const train = solids[index];
      if (train.type !== 'train' || !train.moving) continue;
      let travel = step * .45;
      // Resolve front to back, including stopped trains, ramps, and barricades.
      for (let ahead = 0; ahead < index; ahead++) {
        const obstacle = solids[ahead];
        if (obstacle.lane !== train.lane) continue;
        const clearance = obstacle.z - solidHalfLength(obstacle)
          - (train.z + TRAIN_HALF_LENGTH) - TRAFFIC_GAP;
        travel = Math.min(travel, Math.max(0, clearance));
      }
      train.z += travel;
    }
  }
  hit(entity) {
    if (this.grace || this.powers.jetpack) return;
    if (this.board) {
      this.board = 0; this.grace = 2.5;
      this.entities = this.entities.filter(e => !['train', 'barrier', 'gate', 'ramp'].includes(e.type) || Math.abs(e.z) > 24);
      this.events.push({ type: 'shield' });
    } else {
      this.state = 'over'; this.events.push({ type: 'crash', obstacle: entity.type });
    }
  }
  update(dt) {
    if (this.state !== 'running') return;
    dt = clamp(dt, 0, 1 / 30);
    this.time += dt;
    this.speed = Math.min(32, 17 + this.distance / 160);
    const step = this.speed * dt;
    this.distance += step;
    this.score += step * (this.powers.multiplier ? 6 : 3);
    this.x += (this.lane * LANE_WIDTH - this.x) * (1 - Math.exp(-22 * dt));
    this.slide = Math.max(0, this.slide - dt);
    this.grace = Math.max(0, this.grace - dt);
    this.board = Math.max(0, this.board - dt);
    for (const p of POWERS) {
      const old = this.powers[p];
      this.powers[p] = Math.max(0, old - dt);
      if (p === 'jetpack' && old > 0 && !this.powers[p]) { this.grace = 2; this.vy = 0; }
    }
    this.nextChunk -= step;
    if (this.nextChunk <= 0) { this.spawnChunk(); this.nextChunk += 42; }
    this.moveTraffic(step);
    let floor = 0;
    for (const e of this.entities) {
      if (Math.abs(e.x - this.x) >= 1.5) continue;
      if (e.type === 'ramp' && Math.abs(e.z) <= 4) floor = Math.max(floor, (e.z + 4) / 8 * ROOF);
      if (e.type === 'train' && Math.abs(e.z) <= TRAIN_HALF_LENGTH && this.y >= ROOF - .22) floor = Math.max(floor, ROOF);
    }
    if (this.powers.jetpack) {
      this.y += (JETPACK_HEIGHT - this.y) * (1 - Math.exp(-7 * dt));
      this.vy = 0; this.grounded = false; this.slide = 0;
      if (Math.floor((this.distance - step) / 3) !== Math.floor(this.distance / 3)) {
        for (const l of [-1, 0, 1]) this.add('coin', l, -65, { y: JETPACK_HEIGHT + 1.1 });
      }
    } else {
      this.vy -= 31 * dt;
      this.y += this.vy * dt;
      if (this.y <= floor) { this.y = floor; this.vy = 0; this.grounded = true; }
      else this.grounded = false;
    }
    if (floor >= ROOF - .1) this.roofDistance += step;
    const collected = new Set();
    for (const e of this.entities) {
      const dx = Math.abs(e.x - this.x);
      const dz = Math.abs(e.z);
      const dy = Math.abs(e.y - (this.y + 1.1));
      if (e.type === 'coin') {
        const magnetic = this.powers.magnet && dz < 15 && dy < 5;
        if (magnetic) {
          e.x += (this.x - e.x) * Math.min(1, dt * 15);
          e.y += (this.y + 1.1 - e.y) * Math.min(1, dt * 15);
          e.z += (0 - e.z) * Math.min(1, dt * 12);
        }
        if ((dx < .85 && dz < .95 && dy < 1) || (magnetic && dz < 1.7)) {
          collected.add(e.id); this.coins++; this.score += 10;
          this.events.push({ type: 'coin', x: e.x, y: e.y });
        }
      } else if (POWERS.includes(e.type)) {
        if (dx < 1 && dz < 1.2 && dy < 1.5) {
          collected.add(e.id); this.powers[e.type] = POWER_DURATION;
          this.events.push({ type: 'power', power: e.type });
        }
      } else if (e.type !== 'ramp' && dx < 1.5) {
        const touching = dz < (e.type === 'train' ? TRAIN_HALF_LENGTH : .65);
        if (!touching) continue;
        const collision = e.type === 'train' ? this.y < ROOF - .2
          : e.type === 'barrier' ? this.y < 1.15
          : this.y < 2.9 && this.y + (this.slide > 0 ? .72 : 2) > 1.35;
        if (collision) this.hit(e);
        if (this.state === 'over') break;
      }
    }
    this.entities = this.entities.filter(e => e.z < 24 && !collected.has(e.id));
  }
  drainEvents() { return this.events.splice(0); }
}
