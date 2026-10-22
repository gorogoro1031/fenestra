import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, createState, kmToNextDrop, stageFor, progressToNext, addDistance, photosynthesize, lightPerMinute, water, waterCheck, rollDay, sanitize,
  buyPlant, selectPlant, growthOf, stageOf, LAST_STAGE,
} from '../js/state.js';
import { PLANTS } from '../js/plants.js';

const withGrowth = (s, growth, patch = {}) => ({ ...s, plants: { ...s.plants, [s.active]: { ...s.plants[s.active], growth, ...patch } } });
const cactusState = (patch = {}) => ({ ...createState(), active: 'cactus', plants: { monstera: { growth: 0, waterToday: 0, grown: false }, cactus: { growth: 0, waterToday: 0, grown: false } }, ...patch });

test('처음엔 이슬 2개를 선물로 받는다', () => {
  assert.equal(createState().drops, RULES.START_DROPS);
  assert.equal(RULES.START_DROPS, 2);
});

test('10km마다 이슬이 하나, 자투리는 이어서 센다', () => {
  const s1 = addDistance({ ...createState(), drops: 0 }, 6);
  assert.equal(s1.drops, 0);
  const s2 = addDistance(s1, 6);
  assert.equal(s2.drops, 1);
  assert.ok(Math.abs(s2.kmRemainder - 2) < 1e-9);
  assert.ok(Math.abs(s2.todayKm - 12) < 1e-9);
});

test('1km마다 꽃씨가 하나씩, 자투리도 이어서 센다', () => {
  const s = addDistance(addDistance(createState(), 2.6), 0.6);
  assert.equal(s.coins, 3);
  assert.ok(Math.abs(s.coinRemainder - 0.2) < 1e-9);
});

test('다음 이슬까지 남은 거리', () => {
  assert.equal(kmToNextDrop(createState()), RULES.KM_PER_DROP);
  assert.ok(Math.abs(kmToNextDrop(addDistance(createState(), 2.7)) - 7.3) < 1e-9);
  assert.equal(kmToNextDrop({ ...createState(), drops: RULES.MAX_DROPS }), 0);
});

test('이슬은 최대치를 넘지 않는다', () => {
  const s = addDistance(createState(), 1000);
  assert.equal(s.drops, RULES.MAX_DROPS);
  assert.equal(s.kmRemainder, 0);
});

test('음수나 숫자가 아닌 거리는 무시하고 원래 상태를 바꾸지 않는다', () => {
  const s = createState();
  assert.equal(addDistance(s, -3), s);
  assert.equal(addDistance(s, Number.NaN), s);
  addDistance(s, 50);
  assert.equal(s.drops, RULES.START_DROPS);
});

test('맑은 낮 광합성 10분이면 햇빛 한 번 쓸 만큼 차고 최대치에서 멈춘다', () => {
  const sunny = { kind: 'clear', isDay: true };
  assert.equal(photosynthesize(createState(), 10, sunny).light, RULES.LIGHT_COST);
  assert.equal(photosynthesize(createState(), 999, sunny).light, RULES.MAX_LIGHT);
});

test('구름 조금이면 절반, 흐림·비·눈·밤·날씨 모름이면 햇빛이 안 모인다', () => {
  const s = createState();
  assert.equal(photosynthesize(s, 10, { kind: 'partly', isDay: true }).light, 10);
  ['cloudy', 'fog', 'rain', 'snow', null].forEach((kind) => assert.equal(photosynthesize(s, 10, { kind, isDay: true }), s));
  assert.equal(photosynthesize(s, 10, { kind: 'clear', isDay: false }), s);
  assert.equal(lightPerMinute({ kind: 'clear', isDay: true }), 2);
});

test('이슬이 없으면 물을 줄 수 없다', () => {
  const dry = { ...createState(), drops: 0 };
  assert.deepEqual(waterCheck(dry), { ok: false, reason: 'no-drops' });
  assert.equal(water(dry).grew, 0);
});

test('몬스테라: 햇빛이 있으면 두 배로 자라고 햇빛을 쓴다', () => {
  const r = water({ ...createState(), drops: 2, light: 30 });
  assert.equal(r.grew, 2);
  assert.equal(r.usedLight, true);
  assert.equal(r.state.light, 10);
  assert.equal(r.state.drops, 1);
  assert.equal(water({ ...createState(), drops: 1 }).grew, 1);
});

test('선인장: 한 번에 두 배지만 하루 두 번까지, 날이 바뀌면 다시', () => {
  let s = cactusState({ drops: 5, light: 50 });
  s = water(s).state;
  const second = water(s);
  assert.equal(second.grew, 2);
  assert.equal(second.usedLight, false);
  assert.equal(second.state.light, 50);
  assert.deepEqual(waterCheck(second.state), { ok: false, reason: 'dry-limit' });
  assert.equal(waterCheck(rollDay(second.state, 'next-day')).ok, true);
});

test('산세베리아: 밤에만 두 배', () => {
  const s = { ...createState(), drops: 2, active: 'sansevieria', plants: { monstera: { growth: 0, waterToday: 0, grown: false }, sansevieria: { growth: 0, waterToday: 0, grown: false } } };
  assert.equal(water(s, { isNight: true }).grew, 2);
  assert.equal(water(s, { isNight: false }).grew, 1);
});

test('고무나무: 오늘 30km 넘게 달린 날 두 배', () => {
  const s = { ...createState(), drops: 2, active: 'rubber', plants: { monstera: { growth: 0, waterToday: 0, grown: false }, rubber: { growth: 0, waterToday: 0, grown: false } } };
  assert.equal(water({ ...s, todayKm: 31 }).grew, 2);
  assert.equal(water({ ...s, todayKm: 12 }).grew, 1);
});

test('다 자라는 순간 꽃씨 덤을 받고, 그 뒤로는 물을 줄 수 없다', () => {
  const last = PLANTS.monstera.thresholds[LAST_STAGE];
  const s = withGrowth({ ...createState(), drops: 2, coins: 5 }, last - 1);
  const r = water(s);
  assert.equal(r.grownNow, true);
  assert.equal(r.stageUp, true);
  assert.equal(r.state.coins, 5 + RULES.GROWN_REWARD);
  assert.deepEqual(waterCheck(r.state), { ok: false, reason: 'grown' });
});

test('꽃씨로 식물을 사면 바로 그 식물을 키우고, 모자라거나 이미 있으면 그대로', () => {
  const poor = { ...createState(), coins: 10 };
  assert.equal(buyPlant(poor, 'cactus'), poor);
  const rich = { ...createState(), coins: 500 };
  const bought = buyPlant(rich, 'cactus');
  assert.equal(bought.coins, 500 - PLANTS.cactus.price);
  assert.equal(bought.active, 'cactus');
  assert.equal(growthOf(bought), 0);
  assert.equal(buyPlant(bought, 'cactus'), bought);
  assert.equal(buyPlant(rich, 'nope'), rich);
});

test('가진 식물끼리만 바꿔 키울 수 있고, 식물마다 성장은 따로', () => {
  const s = buyPlant(withGrowth({ ...createState(), coins: 500 }, 9), 'cactus');
  assert.equal(growthOf(s), 0);
  const back = selectPlant(s, 'monstera');
  assert.equal(growthOf(back), 9);
  assert.equal(selectPlant(back, 'rubber'), back);
});

test('단계와 다음 단계까지 진행률은 종마다 다른 기준을 쓴다', () => {
  assert.equal(stageFor(0), 0);
  assert.equal(stageFor(2), 1);
  assert.equal(stageFor(999), LAST_STAGE);
  assert.equal(progressToNext(5), 0.5);
  assert.equal(progressToNext(999), 1);
  assert.equal(stageFor(10, PLANTS.rubber.thresholds), 2);
  assert.equal(stageOf(withGrowth(createState(), 8)), 2);
});

test('날짜가 바뀌면 오늘 거리만 초기화', () => {
  const s = { ...createState('2026-10-21'), todayKm: 12, totalKm: 40 };
  const next = rollDay(s, '2026-10-22');
  assert.equal(next.todayKm, 0);
  assert.equal(next.totalKm, 40);
  assert.equal(rollDay(s, '2026-10-21'), s);
});

test('저장소 값이 깨져 있어도 안전하게, 예전 한 종짜리 저장값은 몬스테라로 옮긴다', () => {
  assert.deepEqual(sanitize(null, 'd'), createState('d'));
  const s = sanitize({ drops: 999, light: -5, growth: 'x', today: 3 }, 'd');
  assert.equal(s.drops, RULES.MAX_DROPS);
  assert.equal(s.light, 0);
  assert.equal(growthOf(s), 0);
  assert.equal(s.today, 'd');
  const old = sanitize({ growth: 12, drops: 3 }, 'd');
  assert.equal(old.active, 'monstera');
  assert.equal(growthOf(old), 12);
  const weird = sanitize({ active: 'rubber', plants: { cactus: { growth: 4 }, hacked: { growth: 1 } } }, 'd');
  assert.equal(weird.active, 'monstera');
  assert.deepEqual(Object.keys(weird.plants).sort(), ['cactus', 'monstera']);
});
