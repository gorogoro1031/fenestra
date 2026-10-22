import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRIP_RULES, startTrip, addToTrip, markMoving, tripEnded, worthShowing } from '../js/trip.js';

const s = (drops, coins) => ({ drops, coins });

test('달린 거리와 늘어난 이슬·꽃씨를 모은다', () => {
  let t = startTrip(0);
  t = addToTrip(t, s(2, 10), s(3, 22), { km: 12, now: 1000 });
  t = addToTrip(t, s(3, 22), s(4, 30), { km: 9, now: 2000 });
  assert.deepEqual({ km: t.km, drops: t.drops, coins: t.coins }, { km: 21, drops: 2, coins: 20 });
});

test('줄어든 값(물을 줘서 쓴 이슬)은 빼지 않는다', () => {
  const t = addToTrip(startTrip(0), s(3, 5), s(2, 5), { now: 1 });
  assert.equal(t.drops, 0);
});

test('2분 동안 움직임이 없으면 끝, 거리가 늘거나 속도가 나면 다시 센다', () => {
  let t = startTrip(0);
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS - 1), false);
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS), true);
  t = addToTrip(t, s(0, 0), s(0, 1), { km: 0.5, now: 100000 });
  assert.equal(tripEnded(t, TRIP_RULES.END_IDLE_MS), false);
  t = markMoving(t, 200000);
  assert.equal(tripEnded(t, 200000 + TRIP_RULES.END_IDLE_MS - 1), false);
  // 거리가 늘지 않은 변화는 움직임이 아니다
  const idle = addToTrip(startTrip(0), s(0, 0), s(0, 2), { now: 50000 });
  assert.equal(idle.lastMoveAt, 0);
});

test('1km 넘게 달렸을 때만 요약을 보여 준다', () => {
  assert.equal(worthShowing({ ...startTrip(0), km: 0.9 }), false);
  assert.equal(worthShowing({ ...startTrip(0), km: TRIP_RULES.MIN_KM }), true);
});
