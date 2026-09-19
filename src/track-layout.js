import { OVERHEAD_CLEARANCE } from './game.js';

// These dimensions are shared by rendering and clearance regression tests.
export function overheadParts(index) {
  const parts = [];
  const add = (color, x, y, z, width, height, depth) => parts.push({ color, x, y, z, width, height, depth });
  if (index % 2 === 0) {
    for (const x of [-5.6, 5.6]) add('#678d91', x, (OVERHEAD_CLEARANCE + 1.5) / 2, -16, .2, OVERHEAD_CLEARANCE + 1.5, .2);
    add('#678d91', 0, OVERHEAD_CLEARANCE + 1.4, -16, 11.4, .28, .25);
    for (const x of [-3.35, 0, 3.35]) add('#678d91', x, OVERHEAD_CLEARANCE + .95, -16, .06, .7, .06);
  }
  if (index === 4 || index === 9) {
    for (const side of [-1, 1]) add('#bf7957', side * 6, OVERHEAD_CLEARANCE / 2, -11, .6, OVERHEAD_CLEARANCE, 5);
    add('#ca8d63', 0, OVERHEAD_CLEARANCE + .65, -11, 12.8, 1.3, 5);
    add('#f4cd91', 0, OVERHEAD_CLEARANCE + 1.425, -11, 13.3, .25, 5.3);
  }
  return parts;
}
export const STATION_SIGN = { y: OVERHEAD_CLEARANCE + .35, height: .7 };
