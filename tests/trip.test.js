import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRIP_RULES, startTrip, addToTrip, markMoving, tripEnded, worthShowing } from '../js/trip.js';

const s = (drops, coins, light) => ({ drops, coins, light });

test('달린 거리와 늘어난 이슬·꽃씨·햇빛을 모은다', () => {
  let t = startTrip(0);
  t = addToTrip(t, s(2, 10, 0), s(3, 22, 0), { km: 12, now: 1000 });
  t = addToTrip(t, s(3, 22, 0), s(3, 22, 2), { now: 2000 });
  assert.deepEqual({ km: t.km, drops: t.drops, coins: t.coins, light: t.light }, { km: 12, drops: 1, coins: 12, light: 2 });
});

test('줄어든 값(물을 줘서 쓴 이슬·햇빛)은 빼지 않는다', () => {
  const t = addToTrip(startTrip(0), s(3, 5, 40), s(2, 5, 20), { now: 1 });
  assert.equal(t.drops, 0);
  assert.equal(t.light, 0);
});

test('2분 동안 움직임이 없으면 끝, 거리가 늘거나 속도가 나면 다시 센다', () => {
  let t = startTrip(0);
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS - 1), false);
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS), true);
  t = addToTrip(t, s(0, 0, 0), s(0, 1, 0), { km: 0.5, now: 100000 });
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS), false);
  t = markMoving(t, 200000);
  assert.equal(tripEnded(t, 200000 + TRIP_RULES.END_IDLE_MS - 1), false);
  // 햇빛만 늘어난 건 움직임이 아니다
  const idle = addToTrip(startTrip(0), s(0, 0, 0), s(0, 0, 2), { now: 50000 });
  assert.equal(idle.lastMoveAt, 0);
});

test('1km 넘게 달렸을 때만 요약을 보여 준다', () => {
  assert.equal(worthShowing({ ...startTrip(0), km: 0.9 }), false);
  assert.equal(worthShowing({ ...startTrip(0), km: TRIP_RULES.MIN_KM }), true);
});
