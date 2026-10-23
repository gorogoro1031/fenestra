import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbPosition, sunTimes, speedTier, ORB_SIZES } from '../js/sky.js';

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

test('서울 10월 23일 해 뜨고 지는 시각은 6시 46분·17시 44분 언저리 (몇 분 오차)', () => {
  const { rise, set } = sunTimes(new Date(2026, 9, 23, 12), 37.57, 126.98, 9 * 60);
  assert.ok(Math.abs(rise - (6 + 46 / 60)) < 0.1, String(rise));
  assert.ok(Math.abs(set - (17 + 44 / 60)) < 0.1, String(set));
});

test('위치를 모르거나 백야·극야면 6시·18시', () => {
  assert.deepEqual(sunTimes(new Date(2026, 5, 21), NaN, 0, 0), { rise: 6, set: 18 });
  assert.deepEqual(sunTimes(new Date(2026, 5, 21), 80, 0, 0), { rise: 6, set: 18 });
});

test('실제 해 뜨는 시각을 넘기면 낮', () => {
  const sun = { rise: 6.77, set: 17.73 };
  assert.equal(orbPosition(6.7, sun).isDay, false);
  assert.equal(orbPosition(6.8, sun).isDay, true);
  assert.equal(orbPosition(17.8, sun).isDay, false);
});

test('속도 단계: 30·50·100 km/h를 넘을 때마다 하나씩', () => {
  assert.deepEqual([0, 29, 30, 49, 50, 99, 100, 130].map(speedTier), [0, 0, 1, 1, 2, 2, 3, 3]);
});

test('해·달 크기는 작게 < 보통 < 크게이고, 크게가 원래 크기다', () => {
  assert.ok(ORB_SIZES.small < ORB_SIZES.medium && ORB_SIZES.medium < ORB_SIZES.large);
  assert.equal(ORB_SIZES.large, 1);
  assert.equal(ORB_SIZES.medium, 0.7);
});
