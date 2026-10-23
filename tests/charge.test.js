import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARGE_RULES, chargers, chargerNear, updateSession, fertDue, isCharging, msToNextFert, settleCharge, cleanStamps } from '../js/charge.js';
import { SUPERCHARGERS } from '../js/superchargers.js';
import { createState, fertilize, sanitize, stageOf, LAST_STAGE } from '../js/state.js';
import { PLANTS } from '../js/plants.js';

const MIN = 60 * 1000;
const ALL = chargers();
const parnas = ALL.find((c) => c.id === 1115);

test('국내 슈퍼차저 목록은 한국 안의 좌표와 한국어·영어 도시 이름이 있다', () => {
  assert.ok(SUPERCHARGERS.length > 100);
  ALL.forEach((c) => {
    assert.ok(c.lat > 33 && c.lat < 39 && c.lon > 124 && c.lon < 132, `${c.id}`);
    assert.ok(c.ko && c.en, `${c.id}`);
  });
  assert.equal(new Set(ALL.map((c) => c.id)).size, ALL.length);
});

test('반경 150m 안이면 그 슈퍼차저, 벗어나면 null', () => {
  assert.equal(chargerNear({ lat: parnas.lat + 0.0005, lon: parnas.lon })?.id, 1115);
  assert.equal(chargerNear({ lat: parnas.lat + 0.003, lon: parnas.lon }), null);
});

test('같은 곳에 머물면 시작 시각을 지키고, 떠나면 끝, 다른 곳이면 새로', () => {
  const s = updateSession(null, parnas, 0);
  assert.equal(updateSession(s, parnas, 5 * MIN), s);
  assert.equal(updateSession(s, null, 6 * MIN), null);
  assert.equal(updateSession(s, ALL[1], 7 * MIN).since, 7 * MIN);
});

test('10분마다 비료 하나, 10분이 지나야 충전 중', () => {
  const s = updateSession(null, parnas, 0);
  assert.equal(isCharging(s, 9 * MIN), false);
  assert.equal(isCharging(s, 10 * MIN), true);
  assert.equal(fertDue(s, 23 * MIN), 2);
  assert.equal(msToNextFert(s, 23 * MIN), 7 * MIN);
});

test('처음 간 곳은 도장과 꽃씨 덤, 받은 비료는 다시 주지 않는다', () => {
  let session = updateSession(null, parnas, 0);
  let r = settleCharge(createState(), session, 12 * MIN, '2026-10-23');
  assert.deepEqual([r.fert, r.newStamp, r.state.fert, r.state.coins], [1, true, 1, CHARGE_RULES.FIRST_STAMP_COINS]);
  assert.equal(r.state.stamps[1115], '2026-10-23');
  session = r.session;
  r = settleCharge(r.state, session, 15 * MIN, '2026-10-23');
  assert.equal(r.fert, 0);
  r = settleCharge(r.state, session, 21 * MIN, '2026-10-23');
  assert.deepEqual([r.fert, r.newStamp, r.state.coins], [1, false, CHARGE_RULES.FIRST_STAMP_COINS]);
});

test('비료는 9개까지만 모인다', () => {
  const session = updateSession(null, parnas, 0);
  const r = settleCharge({ ...createState(), fert: 8 }, session, 40 * MIN, '2026-10-23');
  assert.equal(r.state.fert, CHARGE_RULES.MAX_FERT);
});

test('비료를 쓰면 성장 +3, 비료가 없거나 다 자랐으면 그대로', () => {
  const s = { ...createState(), fert: 1 };
  const r = fertilize(s);
  assert.equal(r.grew, CHARGE_RULES.FERT_GROWTH);
  assert.equal(r.state.fert, 0);
  assert.equal(fertilize(r.state).grew, 0);
  const grown = { ...s, plants: { monstera: { growth: PLANTS.monstera.thresholds[LAST_STAGE], waterToday: 0, grown: true } } };
  assert.equal(fertilize(grown).grew, 0);
});

test('비료로 다 자라면 꽃씨 덤', () => {
  const last = PLANTS.monstera.thresholds[LAST_STAGE];
  const s = { ...createState(), fert: 1, plants: { monstera: { growth: last - 1, waterToday: 0, grown: false } } };
  const r = fertilize(s);
  assert.equal(r.grownNow, true);
  assert.equal(stageOf(r.state), LAST_STAGE);
  assert.ok(r.state.coins > 0);
});

test('저장된 비료·도장책은 범위와 모양을 맞춘다', () => {
  const s = sanitize({ fert: 99, stamps: { 1115: '2026-10-23', 1: '2026-10-23', 1116: 'hack' } });
  assert.equal(s.fert, CHARGE_RULES.MAX_FERT);
  assert.deepEqual(s.stamps, { 1115: '2026-10-23' });
  assert.deepEqual(cleanStamps(null), {});
});
