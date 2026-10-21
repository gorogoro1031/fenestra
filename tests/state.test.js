import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, createState, stageFor, progressToNext, addDistance, addChargeMinutes, water, rollDay, sanitize, LAST_STAGE,
} from '../js/state.js';

test('1km마다 물방울이 하나씩 쌓이고 자투리는 이어서 센다', () => {
  const s1 = addDistance(createState(), 0.6);
  assert.equal(s1.drops, 0);
  const s2 = addDistance(s1, 0.6);
  assert.equal(s2.drops, 1);
  assert.ok(Math.abs(s2.kmRemainder - 0.2) < 1e-9);
  assert.ok(Math.abs(s2.todayKm - 1.2) < 1e-9);
});

test('물방울은 최대치를 넘지 않는다', () => {
  const s = addDistance(createState(), 100);
  assert.equal(s.drops, RULES.MAX_DROPS);
  assert.equal(s.kmRemainder, 0);
  assert.equal(s.totalKm, 100);
});

test('음수나 숫자가 아닌 거리는 무시한다', () => {
  const s = createState();
  assert.equal(addDistance(s, -3), s);
  assert.equal(addDistance(s, Number.NaN), s);
});

test('원래 상태를 바꾸지 않는다', () => {
  const s = createState();
  addDistance(s, 5);
  assert.equal(s.drops, 0);
});

test('충전 시간만큼 햇빛이 차고 최대치에서 멈춘다', () => {
  assert.equal(addChargeMinutes(createState(), 3).light, 30);
  assert.equal(addChargeMinutes(createState(), 99).light, RULES.MAX_LIGHT);
});

test('물방울이 없으면 물을 줄 수 없다', () => {
  const result = water(createState());
  assert.equal(result.grew, 0);
  assert.equal(result.state.growth, 0);
});

test('햇빛이 충분하면 물 줄 때 더 자라고 햇빛을 쓴다', () => {
  const s = { ...createState(), drops: 2, light: 30 };
  const result = water(s);
  assert.equal(result.grew, RULES.GROWTH_WITH_LIGHT);
  assert.equal(result.usedLight, true);
  assert.equal(result.state.light, 10);
  assert.equal(result.state.drops, 1);
});

test('단계 경계를 넘으면 stageUp이 참', () => {
  const s = { ...createState(), drops: 1, growth: RULES.STAGE_THRESHOLDS[1] - 1 };
  const result = water(s);
  assert.equal(result.stageUp, true);
  assert.equal(stageFor(result.state.growth), 1);
});

test('단계와 다음 단계까지 진행률', () => {
  assert.equal(stageFor(0), 0);
  assert.equal(stageFor(10), 2);
  assert.equal(stageFor(999), LAST_STAGE);
  assert.equal(progressToNext(7), 0.5);
  assert.equal(progressToNext(999), 1);
});

test('날짜가 바뀌면 오늘 거리만 초기화', () => {
  const s = { ...createState('2026-10-21'), todayKm: 12, totalKm: 40 };
  const next = rollDay(s, '2026-10-22');
  assert.equal(next.todayKm, 0);
  assert.equal(next.totalKm, 40);
  assert.equal(rollDay(s, '2026-10-21'), s);
});

test('저장소 값이 깨져 있어도 안전한 상태로 복구', () => {
  assert.deepEqual(sanitize(null, 'd'), createState('d'));
  const s = sanitize({ drops: 999, light: -5, growth: 'x', today: 3 }, 'd');
  assert.equal(s.drops, RULES.MAX_DROPS);
  assert.equal(s.light, 0);
  assert.equal(s.growth, 0);
  assert.equal(s.today, 'd');
});
