import test from 'node:test';
import assert from 'node:assert/strict';
import { overheadParts, STATION_SIGN } from './track-layout.js';
import { Game, ROOF, JETPACK_HEIGHT, RUNNER_HEIGHT } from './game.js';
function sandbox() { const g = new Game(() => .5); g.reset(); g.entities = []; g.nextChunk = 1e9; return g; }
function run(g, seconds) { for (let t = 0; t < seconds; t += 1 / 120) g.update(1 / 120); }
test('lane changes are clamped and smoothly reach their target', () => { const g = sandbox(); g.action('left'); g.action('left'); run(g, .4); assert.equal(g.lane, -1); assert.ok(Math.abs(g.x + 3.35) < .01); });
test('jump clears a low barrier and lands', () => { const g = sandbox(); g.add('barrier', 0, -7); g.action('jump'); run(g, 1); assert.equal(g.state, 'running'); assert.equal(g.y, 0); });
test('low barriers collide without a jump', () => { const g = sandbox(); g.add('barrier', 0, -3); run(g, .3); assert.equal(g.state, 'over'); });
test('roll clears a gate while standing collides', () => { for (const roll of [false, true]) { const g = sandbox(); g.add('gate', 0, -4); if (roll) g.action('slide'); run(g, .4); assert.equal(g.state, roll ? 'running' : 'over'); } });
test('ramp reaches the roof and character can run along it', () => { const g = sandbox(); g.train(0, -24, true); run(g, 1.15); assert.equal(g.state, 'running'); assert.ok(Math.abs(g.y - ROOF) < .01, `height ${g.y}`); assert.ok(g.roofDistance > 0); run(g, 1.5); assert.equal(g.state, 'running'); assert.equal(g.y, 0); });
test('train fronts collide and a hoverboard absorbs exactly one collision', () => { const g = sandbox(); g.action('board'); g.add('train', 0, -9); run(g, .2); assert.equal(g.state, 'running'); assert.equal(g.board, 0); assert.equal(g.boards, 2); assert.ok(g.grace > 0); run(g, 3); g.add('train', 0, -8); run(g, .2); assert.equal(g.state, 'over'); });
test('magnet collects neighboring lane coins', () => { const g = sandbox(); g.powers.magnet = 12; g.add('coin', -1, -5); g.add('coin', 1, -7); run(g, .7); assert.equal(g.coins, 2); });
test('jetpack bypasses trains and lands safely', () => { const g = sandbox(); g.add('jetpack', 0, -.5); run(g, .1); assert.ok(g.powers.jetpack > 0); g.add('train', 0, -10); run(g, 1); assert.equal(g.state, 'running'); assert.ok(g.y > 7); run(g, 13); assert.equal(g.state, 'running'); assert.equal(g.y, 0); });
test('sneakers increase jump height and multiplier increases distance points', () => { const normal = sandbox(), powered = sandbox(); powered.powers.sneakers = 12; powered.powers.multiplier = 12; normal.action('jump'); powered.action('jump'); run(normal, .38); run(powered, .38); assert.ok(powered.y > normal.y + 1); assert.ok(Math.abs(powered.score - normal.score * 2) < .01); });
test('pause freezes simulation and reset clears power-ups and score', () => { const g = sandbox(); g.powers.magnet = 12; g.state = 'paused'; run(g, 1); assert.equal(g.distance, 0); assert.equal(g.powers.magnet, 12); g.reset(); assert.equal(g.powers.magnet, 0); assert.equal(g.score, 0); assert.equal(g.boards, 3); });
test('procedural chunks always leave at least one obstacle-free lane', () => { for (let i = 0; i < 100; i++) { const g = sandbox(); g.random = () => (i % 3) / 3; g.chunk = i; g.spawnChunk(); const blocked = new Set(g.entities.filter(e => ['train', 'barrier', 'gate'].includes(e.type)).map(e => e.lane)); assert.ok(blocked.size <= 2); } });

test('moving trains cannot overtake stationary trains, ramps, gates or barriers', () => {
  for (const type of ['train', 'ramp', 'gate', 'barrier']) {
    const g = sandbox();
    const following = g.add('train', 0, -50, { moving: true });
    const obstacle = g.add(type, 0, -25);
    const frontHalf = type === 'train' ? 7.3 : type === 'ramp' ? 4 : .4;
    for (let frame = 0; frame < 1200; frame++) {
      g.moveTraffic(32 / 120);
      assert.ok(obstacle.z - frontHalf - (following.z + 7.3) >= 3 - 1e-8, `${type}: frame ${frame}`);
    }
  }
});

test('multiple moving trains queue without intersecting, independent of insertion order', () => {
  const g = sandbox();
  const rear = g.add('train', 1, -100, { moving: true });
  const front = g.add('train', 1, -20);
  const middle = g.add('train', 1, -55, { moving: true });
  for (let i = 0; i < 1200; i++) {
    g.moveTraffic(1);
    assert.ok(front.z - middle.z >= 17.6 - 1e-8);
    assert.ok(middle.z - rear.z >= 17.6 - 1e-8);
  }
});

test('a train in another lane does not brake unobstructed oncoming traffic', () => {
  const g = sandbox();
  const moving = g.add('train', 0, -30, { moving: true });
  g.add('train', 1, -15);
  g.moveTraffic(10);
  assert.ok(Math.abs(moving.z - (-15.5)) < 1e-8);
});

test('a following train cannot kill the runner through a ramp and occupied roof', () => {
  const g = sandbox();
  g.train(0, -24, true);
  g.train(0, -50, false, true);
  run(g, 1.5);
  assert.equal(g.state, 'running');
  assert.equal(g.y, ROOF);
  const trains = g.entities.filter(e => e.type === 'train').sort((a, b) => b.z - a.z);
  assert.ok(trains[0].z - trains[1].z >= 17.6 - 1e-8);
});

test('roof support extends to the same edge as the train collision volume', () => {
  const g = sandbox(); g.y = ROOF; g.grounded = true;
  g.add('train', 0, -7.25);
  g.update(1 / 120);
  assert.equal(g.state, 'running'); assert.equal(g.y, ROOF);
});


test('jetpack ascent, flight and descent stay below every bridge, crossbeam and sign', () => {
  const head = JETPACK_HEIGHT + RUNNER_HEIGHT;
  for (let segment = 0; segment < 12; segment++) {
    for (const part of overheadParts(segment)) {
      if (Math.abs(part.x) - part.width / 2 > 4.1) continue;
      assert.ok(part.y - part.height / 2 >= head + 1, `Segment ${segment}: insufficient flight clearance`);
    }
  }
  assert.ok(STATION_SIGN.y - STATION_SIGN.height / 2 >= head + 1);
});
