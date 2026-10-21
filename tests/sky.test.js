import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbPosition } from '../js/sky.js';

test('정오엔 해가 가장 높고, 자정엔 달이 가장 높다', () => {
  const noon = orbPosition(12);
  assert.equal(noon.isDay, true);
  assert.ok(Math.abs(noon.lift - 1) < 1e-9);
  const midnight = orbPosition(0);
  assert.equal(midnight.isDay, false);
  assert.ok(Math.abs(midnight.lift - 1) < 1e-9);
});

test('6시에 해가 뜨고 18시에 달로 바뀐다', () => {
  assert.equal(orbPosition(5.99).isDay, false);
  assert.equal(orbPosition(6).isDay, true);
  assert.equal(orbPosition(6).lift, 0);
  assert.equal(orbPosition(17.99).isDay, true);
  assert.equal(orbPosition(18).isDay, false);
});

test('뜰 때·질 때만 노을빛이 섞이고 한낮엔 없다', () => {
  assert.equal(orbPosition(6.1).low > 0.8, true);
  assert.equal(orbPosition(12).low, 0);
  assert.equal(orbPosition(17.9).low > 0.8, true);
});

test('24시를 넘거나 음수인 값도 하루 안으로 접는다', () => {
  assert.deepEqual(orbPosition(36), orbPosition(12));
  assert.deepEqual(orbPosition(-12), orbPosition(12));
});
