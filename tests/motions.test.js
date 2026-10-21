import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIONS, MOTION_MS, pickMotion, combine } from '../js/motions.js';

test('모든 모션은 끝날 즈음 거의 제자리로 돌아온다', () => {
  const end = MOTION_MS / 1000;
  Object.entries(MOTIONS).forEach(([name, fn]) => {
    const p = fn(end, 1);
    const size = Math.abs(p.skew) / 10 + Math.abs(p.sx) + Math.abs(p.sy) + Math.abs(p.dy) / 30;
    assert.ok(size < 0.03, `${name} 남은 움직임 ${size}`);
  });
});

test('같은 모션이 연달아 나오지 않는다', () => {
  ['wobble', 'lean', 'boing', 'hop', 'shiver'].forEach((prev) => {
    for (let r = 0; r < 1; r += 0.07) assert.notEqual(pickMotion(prev, () => r), prev);
  });
});

test('기울기 모션은 누른 반대쪽으로 기운다', () => {
  assert.ok(MOTIONS.lean(0.05, 1).skew < 0);
  assert.ok(MOTIONS.lean(0.05, -1).skew > 0);
});

test('여러 모션이 겹치면 값이 더해진다', () => {
  const now = 1000;
  const one = combine([{ type: 'wobble', born: 900, dir: 1 }], now);
  const two = combine([{ type: 'wobble', born: 900, dir: 1 }, { type: 'wobble', born: 900, dir: 1 }], now);
  assert.ok(Math.abs(two.skew - one.skew * 2) < 1e-9);
});
