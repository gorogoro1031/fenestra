import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUESTS, GUEST_RULES, guestWeights, pickGuest, shouldSpawn } from '../js/guests.js';
import { createState, catchGuest, rollDay, sanitize } from '../js/state.js';

const day = { isNight: false, raining: false, plant: 'monstera', stage: 2 };

test('낮 맑은 날엔 나비·꿀벌·무당벌레, 반딧불·달팽이는 안 나온다', () => {
  const w = guestWeights(day);
  assert.ok(w.butterfly > 0 && w.bee > 0 && w.ladybug > 0);
  assert.equal(w.firefly, 0);
  assert.equal(w.snail, 0);
  assert.equal(w.lizard, 0);
});

test('밤엔 반딧불, 비 오는 날엔 달팽이, 선인장을 키우면 도마뱀', () => {
  assert.ok(guestWeights({ ...day, isNight: true }).firefly > 0);
  assert.equal(guestWeights({ ...day, isNight: true }).butterfly, 0);
  assert.ok(guestWeights({ ...day, raining: true }).snail > 0);
  assert.equal(guestWeights({ ...day, raining: true }).butterfly, 0);
  assert.ok(guestWeights({ ...day, plant: 'cactus' }).lizard > 0);
});

test('꽃 핀 선인장(다 자람)엔 꿀벌이 더 잘 온다', () => {
  assert.ok(guestWeights({ ...day, plant: 'cactus', stage: 4 }).bee > guestWeights(day).bee);
});

test('뽑기는 가중치에 맞는 손님만 고른다', () => {
  for (let r = 0; r < 1; r += 0.05) {
    const id = pickGuest({ ...day, isNight: true }, () => r);
    assert.ok(['ladybug', 'firefly'].includes(id), id);
  }
});

test('나오는지: 확률, 쉬는 시간, 이미 있는 손님, 운전 중', () => {
  const ok = { now: 1e6, lastAt: 0, present: false, driving: false };
  assert.equal(shouldSpawn(ok, () => 0), true);
  assert.equal(shouldSpawn(ok, () => 0.99), false);
  assert.equal(shouldSpawn({ ...ok, lastAt: ok.now - 1000 }, () => 0), false);
  assert.equal(shouldSpawn({ ...ok, present: true }, () => 0), false);
  assert.equal(shouldSpawn({ ...ok, driving: true }, () => 0), false);
});

test('손님을 만나면 도감에 쌓이고 꽃씨를 받는데, 하루 한도까지만', () => {
  let s = { ...createState('d1'), coins: 0 };
  s = catchGuest(s, 'snail');
  assert.equal(s.coins, GUESTS.snail.coins);
  assert.equal(s.guestbook.snail, 1);
  for (let i = 0; i < 20; i += 1) s = catchGuest(s, 'lizard');
  assert.equal(s.guestCoinsToday, GUEST_RULES.DAILY_COINS);
  assert.equal(s.coins, GUEST_RULES.DAILY_COINS);
  assert.equal(s.guestbook.lizard, 20);
  assert.equal(rollDay(s, 'd2').guestCoinsToday, 0);
  assert.equal(catchGuest(s, 'nope'), s);
});

test('도감은 저장값이 깨져도 아는 손님만 숫자로 남긴다', () => {
  const s = sanitize({ guestbook: { bee: 3, hacker: 9, snail: 'x' }, guestCoinsToday: 999 }, 'd');
  assert.deepEqual(s.guestbook, { bee: 3 });
  assert.equal(s.guestCoinsToday, GUEST_RULES.DAILY_COINS);
});
