import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LANE_WIDTH, ROOF, POWERS } from './game.js';
const materials = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
const rounded = new RoundedBoxGeometry(1, 1, 1, 2, .13);
const sphere = new THREE.SphereGeometry(1, 12, 10);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
const coinGeo = new THREE.CylinderGeometry(.38, .38, .11, 20);
const coinRing = new THREE.TorusGeometry(.28, .025, 5, 20);
const reusable = new Map();
const C = { blue: '#188cdb', navy: '#154870', cream: '#fff0bd', red: '#ee513e', gold: '#ffca28', skin: '#e5a873' };
function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: 0 }));
  return materials.get(color);
}
function mesh(parent, geometry, color, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geometry, material(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(p, c, x, y, z, w, h, d, soft = false) { return mesh(p, soft ? rounded : cube, c, x, y, z, w, h, d); }
function ball(p, c, x, y, z, sx, sy = sx, sz = sx) { return mesh(p, sphere, c, x, y, z, sx, sy, sz); }
function group(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function bake(g) {
  g.updateMatrixWorld(true);
  const inverse = g.matrixWorld.clone().invert();
  const batches = new Map();
  g.traverse(o => {
    if (!o.isMesh) return;
    if (!batches.has(o.material)) batches.set(o.material, []);
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    batches.get(o.material).push(geo);
  });
  g.clear();
  for (const [mat, geos] of batches) {
    const merged = mergeGeometries(geos, false);
    const m = new THREE.Mesh(merged, mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
    geos.forEach(geo => geo.dispose());
  }
  return g;
}
function label(text, foreground, background, width = 256, height = 128) {
  const key = `${text}|${foreground}|${background}`;
  if (reusable.has(key)) return reusable.get(key);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = foreground; ctx.font = `900 ${height * .52}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2, width - 18);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex }); reusable.set(key, mat); return mat;
}
function sign(p, text, x, y, z, w, h, fg = '#fff0bd', bg = '#188cdb') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), label(text, fg, bg)); m.position.set(x, y, z); p.add(m); return m;
}
function graffitiTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.translate(256, 128); ctx.rotate(-.08); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'italic 900 103px Arial'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#f5f6ed'; ctx.lineWidth = 22; ctx.strokeText('RUSH!', 0, 0);
  ctx.strokeStyle = '#213f76'; ctx.lineWidth = 13; ctx.strokeText('RUSH!', 0, 0);
  ctx.fillStyle = '#ffcb25'; ctx.fillText('RUSH!', 0, 0);
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
}
const graffitiMat = graffitiTexture();
function graffiti(p, x, y, z, ry = 0, scale = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4 * scale, 2 * scale), graffitiMat); m.position.set(x, y, z); m.rotation.y = ry; p.add(m);
}
function tree(p, x, z, scale = 1) {
  const g = group(p, x, 0, z); g.scale.setScalar(scale);
  mesh(g, cylinder, '#9b6e45', 0, 2.3, 0, .22, 4.6, .22);
  ball(g, '#4bba45', 0, 4.6, 0, 1.5, 1.8, 1.5);
  ball(g, '#78d64c', -.8, 5, 0, 1.15, 1.3, 1.1);
  ball(g, '#36a547', .9, 4.4, .1, 1.1, 1.3, 1.1);
}
function buildSegment(index) {
  const g = new THREE.Group();
  box(g, '#a99070', 0, -.26, -9, 11, .35, 18);
  for (const lane of [-1, 0, 1]) {
    for (let z = -.5; z > -18; z -= 1.4) box(g, '#806249', lane * LANE_WIDTH, -.025, z, 2.8, .12, .27);
    for (const x of [-.91, .91]) {
      box(g, '#8b9695', lane * LANE_WIDTH + x, .09, -9, .14, .2, 18);
      box(g, '#d1d9c9', lane * LANE_WIDTH + x, .2, -9, .1, .04, 18);
    }
  }
  for (const side of [-1, 1]) {
    box(g, '#e4d3a6', side * 6.3, .15, -9, 1.7, .65, 18);
    box(g, '#ed905f', side * 7.15, 1.15, -9, .45, 2.1, 18);
    box(g, '#f6ca88', side * 7.15, 2.3, -9, .62, .22, 18);
    for (let y = .45; y < 2.2; y += .46) {
      box(g, '#c06b4d', side * 6.91, y, -9, .01, .035, 18);
      for (let z = -1; z > -18; z -= 1.8) box(g, '#c06b4d', side * 6.9, y + .23, z + (y % .9 < .5 ? 0 : .9), .02, .45, .028);
    }
    if (index % 3 !== 1) {
      const building = group(g, side * 10.5, 0, -9);
      const height = 8 + index % 4 * 2;
      const colors = ['#f6c57b', '#e98e69', '#79c9cd', '#eaa28d', '#b6d6a5', '#f5dca0'];
      box(building, colors[(index + (side > 0 ? 2 : 0)) % colors.length], 0, height / 2, 0, 5, height, 12);
      box(building, '#fff0c9', 0, height, 0, 5.5, .4, 12.5);
      box(building, '#d77958', 0, height + .45, 0, 5, .6, 12);
      for (let y = 3.8; y < height - .5; y += 2.4) {
        for (let z = -4; z <= 4; z += 2.7) {
          box(building, '#fff2cf', -side * 2.54, y, z, .14, 1.9, 1.4);
          box(building, '#427c99', -side * 2.63, y + .08, z, .07, 1.55, 1.07);
          box(building, '#bce3dc', -side * 2.68, y + .15, z, .02, .07, 1.05);
          box(building, '#fff2cf', -side * 2.69, y + .08, z, .03, 1.56, .07);
        }
      }
      for (let dz = -4; dz <= 4; dz += 4) {
        box(building, '#337a92', -side * 2.56, 1.55, dz, .08, 2.6, 2.3);
        for (let stripe = 0; stripe < 6; stripe++) box(building, stripe % 2 ? '#fff1cd' : '#ee6750', -side * 2.85, 2.8, dz - 1.2 + stripe * .48, .9, .18, .48);
      }
    }
    tree(g, side * 8.5, -1.5, .9 + index % 3 * .12);
    if (index % 3 === 1) tree(g, side * 9.6, -10, 1.4);
    mesh(g, cylinder, '#466a72', side * 6.2, 2.7, -4, .07, 5.4, .07);
    box(g, '#466a72', side * 5.85, 5.35, -4, .85, .12, .13);
    box(g, '#fff0a8', side * 5.55, 5.2, -4, .55, .17, .38, true);
    if (index % 2 === 0) {
      box(g, '#228d95', side * 6.3, .7, -11, .62, 1.2, .62, true);
      box(g, '#f5d68b', side * 6.3, 1.35, -11, .7, .12, .7, true);
    }
  }
  if (index % 2 === 0) {
    for (const x of [-5.6, 5.6]) box(g, '#678d91', x, 3.8, -16, .2, 7.6, .2);
    box(g, '#678d91', 0, 7.5, -16, 11.4, .28, .25);
    for (const x of [-3.35, 0, 3.35]) box(g, '#678d91', x, 7.1, -16, .06, .7, .06);
  }
  if (index === 4 || index === 9) {
    for (const side of [-1, 1]) box(g, '#bf7957', side * 6, 4.5, -11, .6, 8, 5);
    box(g, '#ca8d63', 0, 8, -11, 12.8, 1.3, 5);
    box(g, '#f4cd91', 0, 8.75, -11, 13.3, .25, 5.3);
  }
  bake(g);
  if (index % 3 === 0) {
    graffiti(g, -6.88, 1.25, -6, Math.PI / 2, .65);
    graffiti(g, 6.88, 1.25, -12, -Math.PI / 2, .7);
    const stationSign = sign(g, 'CENTRAL', 0, 6.8, -15.82, 3.4, .7);
    stationSign.userData.overhead = true;
  }
  return g;
}
function trainModel(color) {
  const g = new THREE.Group();
  box(g, '#3d5666', 0, .36, 0, 2.48, .55, 13.9, true);
  box(g, color, 0, 1.88, 0, 2.72, 2.9, 14, true);
  box(g, '#ffe190', 0, 3.38, 0, 2.78, .44, 14.02, true);
  box(g, '#e9f4dd', 0, 2.5, 0, 2.77, 1.12, 13.7, true);
  box(g, '#164d77', 0, 2.53, 7.015, 2.12, .82, .035, true);
  box(g, '#9adee7', -.63, 2.75, 7.04, .65, .08, .03);
  box(g, color, 0, 2.52, 7.055, .12, .84, .06);
  box(g, '#d04536', 0, 1.05, 7.04, 2.2, .14, .08);
  for (const x of [-.86, .86]) {
    box(g, '#455d64', x, 1.35, 7.02, .53, .43, .09, true);
    box(g, '#fff1b0', x, 1.35, 7.08, .36, .27, .09, true);
  }
  box(g, '#314959', 0, .53, 7.1, 1.6, .3, .35, true);
  for (const side of [-1, 1]) {
    for (let z = -5.5; z <= 5.6; z += 2.2) {
      box(g, '#164d77', side * 1.397, 2.54, z, .04, .8, 1.65, true);
      box(g, '#85cad6', side * 1.422, 2.78, z - .25, .025, .08, .9);
    }
    box(g, '#ffd64a', side * 1.39, 1.77, 0, .04, .14, 13.5);
    for (const z of [-4.8, 4.8]) mesh(g, cylinder, '#34434d', side * 1.08, .38, z, .3, .3, .3).rotation.z = Math.PI / 2;
  }
  bake(g);
  sign(g, 'M 01', 0, 3.17, 7.15, .95, .23, '#fff0bd', '#154870');
  graffiti(g, 1.423, 1.25, -.3, Math.PI / 2, .64);
  graffiti(g, -1.423, 1.25, -.3, -Math.PI / 2, .64);
  return g;
}
function rampModel() {
  const g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(-4, 0); shape.lineTo(4, 0); shape.lineTo(4, ROOF); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.68, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); geo.translate(-1.34, 0, 0);
  const m = new THREE.Mesh(geo, material('#bc8552')); m.castShadow = true; m.receiveShadow = true; g.add(m);
  // The low end is at +Z; the high end meets the train at -Z.
  for (let i = 0; i < 10; i++) box(g, '#e6b879', 0, (i / 9) * ROOF + .025, 4 - (i / 9) * 8, 2.68, .07, .22);
  return bake(g);
}
function barrierModel(gate) {
  const g = new THREE.Group();
  for (const x of [-1.1, 1.1]) {
    box(g, '#667783', x, gate ? 1.52 : .6, 0, .14, gate ? 3.04 : 1.2, .18);
    box(g, '#536b71', x, .1, 0, .48, .14, .64);
  }
  const y = gate ? 2.22 : .73, h = gate ? 1.72 : .92;
  box(g, '#fff6dc', 0, y, 0, 2.6, h, .36, true);
  for (let x = -1.05; x < 1.2; x += .53) {
    const stripe = box(g, '#ed5143', x, y, .19, .27, h * .88, .035);
    stripe.rotation.z = -.24;
  }
  if (gate) box(g, '#2f87af', 0, 3.19, 0, 2.68, .18, .43, true);
  else for (const x of [-1, 1]) ball(g, '#ffbb25', x, 1.35, 0, .16);
  return bake(g);
}
function coinModel() {
  const g = new THREE.Group();
  mesh(g, coinGeo, '#f8b91d', 0, 0, 0).rotation.x = Math.PI / 2;
  mesh(g, coinRing, '#ffe984', 0, 0, .065);
  box(g, '#ffe984', 0, 0, .07, .07, .32, .03, true);
  return bake(g);
}
function powerModel(type) {
  const g = new THREE.Group();
  if (type === 'magnet') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.43, .16, 8, 16, Math.PI), material('#ee4841'));
    arc.rotation.z = Math.PI; g.add(arc);
    for (const x of [-.43, .43]) { box(g, '#ed4841', x, .14, 0, .32, .32, .32, true); box(g, '#e4f4fa', x, .42, 0, .32, .23, .32, true); }
  } else if (type === 'jetpack') {
    for (const x of [-.28, .28]) { mesh(g, cylinder, '#eeeeda', x, 0, 0, .2, 1.04, .2); ball(g, '#ea5141', x, .52, 0, .22); ball(g, '#ffb627', x, -.65, 0, .14, .3, .14); }
    box(g, '#479ccd', 0, 0, .1, .3, .5, .3, true);
  } else if (type === 'sneakers') {
    for (const x of [-.31, .31]) { box(g, '#5bc74c', x, -.1, 0, .44, .32, .9, true); box(g, '#fff7d2', x, -.28, 0, .47, .1, .92, true); box(g, '#fff7d2', x, .02, -.15, .31, .05, .3); }
  } else {
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2; const r = i % 2 ? .3 : .65; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .16, bevelEnabled: false }), material('#ffce27')); g.add(m);
  }
  return bake(g);
}
export function createRunner(inspector = false) {
  const root = new THREE.Group(), body = group(root);
  const shirt = inspector ? '#386197' : '#f5ead2', trousers = inspector ? '#284366' : '#3c80be';
  const torso = box(body, shirt, 0, 1.32, 0, .73, .86, .5, true);
  ball(body, shirt, 0, 1.69, .04, .45, .22, .32);
  box(body, inspector ? '#284366' : '#cb443e', 0, 1.28, .31, .47, .59, .22, true);
  box(body, '#f2c766', 0, 1.22, .44, .35, .26, .07, true);
  ball(body, C.skin, 0, 2, -.02, .37, .42, .33);
  ball(body, '#69462d', 0, 2.18, .02, .38, .29, .34);
  const cap = ball(body, inspector ? '#284366' : '#eb493c', 0, 2.25, -.015, .42, .23, .37);
  box(body, inspector ? '#284366' : '#eb493c', 0, 2.17, .36, .53, .085, .33, true);
  box(body, '#f4d8a4', 0, 2.22, .367, .19, .08, .03, true);
  for (const x of [-.13, .13]) { ball(body, '#fff9e1', x, 2.03, -.317, .09, .1, .035); ball(body, '#303c43', x, 2.03, -.351, .043, .061, .022); }
  ball(body, C.skin, 0, 1.94, -.37, .08, .08, .08);
  const arms = [], legs = [];
  for (const side of [-1, 1]) {
    const arm = group(body, side * .45, 1.61); arms.push(arm);
    mesh(arm, cylinder, shirt, 0, -.22, 0, .16, .43, .16);
    ball(arm, shirt, 0, -.4, 0, .16);
    mesh(arm, cylinder, shirt, 0, -.49, -.08, .13, .28, .13).rotation.x = .3;
    ball(arm, C.skin, 0, -.67, -.13, .14, .16, .14);
    const leg = group(body, side * .22, .95); legs.push(leg);
    box(leg, trousers, 0, -.35, 0, .29, .69, .34, true);
    box(leg, inspector ? '#2b374a' : '#b6d9e8', 0, -.65, 0, .31, .15, .36, true);
    box(leg, inspector ? '#233445' : '#dd4b3e', 0, -.79, -.11, .37, .22, .6, true);
    box(leg, '#fff4d7', 0, -.89, -.11, .39, .07, .62, true);
    box(leg, '#fff4d7', 0, -.68, -.24, .24, .04, .17);
  }
  const board = group(root, 0, .07, 0);
  box(board, '#ee5c37', 0, 0, 0, .95, .16, 1.9, true);
  box(board, '#ffc72d', 0, .085, 0, .23, .035, 1.6, true);
  for (const side of [-1, 1]) box(board, '#72e1f0', side * .4, -.07, 0, .09, .08, 1.55, true);
  board.visible = false;
  const jet = powerModel('jetpack'); jet.position.set(0, 1.4, .5); jet.scale.setScalar(.7); body.add(jet); jet.visible = false;
  return { root, body, arms, legs, board, jet, torso, cap };
}
function dogModel() {
  const g = new THREE.Group();
  box(g, '#b08251', 0, .46, 0, .48, .48, .9, true); ball(g, '#bd925c', 0, .73, -.45, .31, .33, .31);
  box(g, '#624731', 0, .59, -.71, .3, .22, .27, true);
  for (const s of [-1, 1]) { ball(g, '#674c35', s * .25, .9, -.39, .12, .25, .13); for (const z of [-.3, .3]) box(g, '#b08251', s * .18, .16, z, .14, .34, .17, true); }
  box(g, '#e34b37', 0, .58, -.26, .5, .11, .18); return g;
}
export class World {
  constructor(canvas) {
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#83d5f6'); this.scene.fog = new THREE.Fog('#a4e1f6', 55, 160);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(53, 1, .1, 210);
    this.scene.add(new THREE.HemisphereLight('#fff7df', '#b0a185', 2.25));
    const sun = new THREE.DirectionalLight('#fff2d1', 2.25); sun.position.set(-18, 30, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 25, bottom: -30, far: 85 }); sun.shadow.bias = -.001; this.scene.add(sun);
    const ground = box(this.scene, '#8cc672', 0, -.7, -80, 250, .3, 240); ground.castShadow = false;
    this.segments = [];
    for (let i = 0; i < 12; i++) { const s = buildSegment(i); s.position.z = 18 - i * 18; this.scene.add(s); this.segments.push(s); }
    const clouds = new THREE.Group(); this.scene.add(clouds);
    for (let i = 0; i < 16; i++) { const x = (i % 2 ? -1 : 1) * (20 + i * 3); const z = -50 - i * 7; ball(clouds, '#f4fcf3', x, 21 + i % 4 * 2, z, 6, 2, 3); ball(clouds, '#f4fcf3', x + 2, 23 + i % 4 * 2, z, 3, 3, 3); }
    bake(clouds); clouds.traverse(o => o.castShadow = false);
    this.runner = createRunner(); this.scene.add(this.runner.root);
    this.inspector = createRunner(true); this.inspector.root.scale.setScalar(1.15); this.scene.add(this.inspector.root);
    this.dog = dogModel(); this.scene.add(this.dog);
    this.prototypes = { train: [trainModel('#2698dd'), trainModel('#ecb735'), trainModel('#da5d4c')], ramp: rampModel(), barrier: barrierModel(false), gate: barrierModel(true), coin: coinModel() };
    for (const p of POWERS) this.prototypes[p] = powerModel(p);
    this.meshes = new Map(); this.particles = []; this.particleGeo = new THREE.IcosahedronGeometry(.09, 0);
    this.camera.position.set(0, 4.8, 11); this.lookTarget = new THREE.Vector3(); this.cameraTarget = new THREE.Vector3(); this.resize();
  }
  resize() {
    this.width = innerWidth; this.height = innerHeight; this.camera.aspect = innerWidth / innerHeight;
    this.camera.fov = innerWidth < 600 ? 61 : 53; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight);
  }
  skin(index) {
    this.runner.torso.material = material(['#f5ead2', '#53c2b3', '#ffbf48'][index]);
    this.runner.cap.material = material(['#eb493c', '#774caf', '#268dcc'][index]);
  }
  burst(x, y, color = '#ffe05f', count = 7) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count && this.particles.length < 100; i++) {
      const m = new THREE.Mesh(this.particleGeo, material(color)); m.position.set(x, y, 0); this.scene.add(m);
      this.particles.push({ mesh: m, life: .5, vx: (Math.random() - .5) * 5, vy: Math.random() * 4, vz: (Math.random() - .5) * 5 });
    }
  }
  render(game, dt, clock) {
    const home = game.state === 'home'; const live = game.state === 'running';
    if (live) for (const s of this.segments) { s.position.z += game.speed * dt; if (s.position.z > 36) s.position.z -= 216; }
    for (const segment of this.segments) for (const child of segment.children) {
      if (child.userData.overhead) child.visible = segment.position.z + child.position.z < -1;
    }
    const present = new Set(game.entities.map(e => e.id));
    for (const [id, m] of this.meshes) if (!present.has(id)) { this.scene.remove(m); this.meshes.delete(id); }
    for (const e of game.entities) {
      let m = this.meshes.get(e.id);
      if (!m) { const proto = e.type === 'train' ? this.prototypes.train[e.id % 3] : this.prototypes[e.type]; if (!proto) continue; m = proto.clone(); this.meshes.set(e.id, m); this.scene.add(m); }
      m.position.set(e.x, e.type === 'coin' || POWERS.includes(e.type) ? e.y : 0, e.z);
      if (e.type === 'coin') m.rotation.y = this.reducedMotion ? .15 : clock * 2.4 + e.z * .05;
      if (POWERS.includes(e.type)) { m.rotation.y = this.reducedMotion ? 0 : clock * 1.8; m.position.y += this.reducedMotion ? 0 : Math.sin(clock * 4) * .16; m.scale.setScalar(1.3); }
    }
    const r = this.runner;
    r.root.position.set(home ? -.6 : game.x, home ? .1 : game.y + (game.board ? .13 : 0), home ? -1 : 0);
    r.root.scale.setScalar(home ? 1.2 : 1);
    r.root.rotation.y = home ? Math.PI + .3 : 0;
    r.body.rotation.z = home ? -.04 : (game.lane * LANE_WIDTH - game.x) * -.085;
    r.body.rotation.x = game.slide && !home ? -1.15 : 0;
    r.body.position.y = game.slide && !home ? .65 : 0;
    r.body.scale.y = game.slide && !home ? .52 : 1;
    r.board.visible = game.board > 0 && !home; r.board.rotation.z = Math.sin(clock * 5) * .06;
    r.jet.visible = game.powers.jetpack > 0;
    const stride = live && game.grounded && !game.board ? Math.sin(game.time * 18) : 0;
    r.legs.forEach((l, i) => { l.rotation.x = stride * .85 * (i ? -1 : 1); l.rotation.z = game.board ? (i ? -.2 : .2) : 0; });
    r.arms.forEach((a, i) => { a.rotation.x = home ? -.2 : -stride * .8 * (i ? -1 : 1); a.rotation.z = home ? (i ? -.1 : .1) : (game.board || !game.grounded) ? (i ? -.6 : .6) : 0; });
    if (home && !this.reducedMotion) { r.body.position.y = Math.sin(clock * 2) * .04; r.arms[0].rotation.x = -.5 + Math.sin(clock * 2) * .15; }
    r.root.visible = !game.grace || Math.floor(clock * 12) % 2 === 0 || this.reducedMotion;
    const chase = home || game.time < 4 || game.state === 'over';
    this.inspector.root.visible = chase; this.dog.visible = chase;
    this.inspector.root.position.set(home ? 2.8 : game.x + .6, 0, home ? -.5 : game.state === 'over' ? 1.5 : 4 + game.time * .8);
    this.dog.position.set(home ? 1.5 : game.x - .9, Math.abs(Math.sin(clock * 10)) * .07, home ? -.8 : this.inspector.root.position.z - .3);
    this.inspector.root.rotation.y = home ? Math.PI + .2 : 0;
    this.inspector.legs.forEach((l, i) => l.rotation.x = home ? 0 : Math.sin(game.time * 16) * (i ? -.6 : .6));
    this.inspector.arms.forEach((a, i) => a.rotation.x = home ? 0 : Math.sin(game.time * 16) * (i ? .6 : -.6));
    for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.life -= dt; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.vy -= dt * 8; p.mesh.scale.setScalar(Math.max(0, p.life * 2)); if (p.life <= 0) { this.scene.remove(p.mesh); this.particles.splice(i, 1); } }
    const mobile = this.width < 700;
    const cameraY = home ? 4.1 : (mobile ? 6.5 : 5.65) + game.y * .62;
    this.cameraTarget.set(home ? 0 : game.x * (mobile ? .3 : .16), cameraY, home ? 11 : mobile ? 13.5 : 10);
    this.camera.position.lerp(this.cameraTarget, 1 - Math.exp(-dt * 7));
    this.lookTarget.set(home ? 0 : game.x * .12, home ? 2.3 : 1.9 + game.y * .55, home ? -8 : -17);
    this.camera.lookAt(this.lookTarget); this.renderer.render(this.scene, this.camera);
  }
}
