// 게임 규칙과 상태 변화. 화면·브라우저에 의존하지 않는 순수 함수만 둔다

export const RULES = Object.freeze({
  KM_PER_DROP: 1,
  MAX_DROPS: 12,
  LIGHT_PER_MINUTE: 10,
  MAX_LIGHT: 100,
  LIGHT_COST: 20,
  GROWTH_PER_WATER: 1,
  GROWTH_WITH_LIGHT: 2,
  // 단계별 필요한 누적 성장 점수: 씨앗, 새싹, 첫 잎, 큰 잎, 다 자람
  STAGE_THRESHOLDS: Object.freeze([0, 4, 10, 20, 35]),
});

export const STAGE_NAMES = Object.freeze(['씨앗', '새싹', '첫 잎', '큰 잎', '다 자람']);
export const LAST_STAGE = RULES.STAGE_THRESHOLDS.length - 1;

/** @returns {{drops:number, kmRemainder:number, light:number, growth:number, totalKm:number, todayKm:number, today:string, waterCount:number}} */
export function createState(today = '') {
  return { drops: 0, kmRemainder: 0, light: 0, growth: 0, totalKm: 0, todayKm: 0, today, waterCount: 0 };
}

export function stageFor(growth) {
  let stage = 0;
  RULES.STAGE_THRESHOLDS.forEach((need, i) => { if (growth >= need) stage = i; });
  return stage;
}

/** 다음 단계까지 진행률 0~1. 마지막 단계면 1 */
export function progressToNext(growth) {
  const stage = stageFor(growth);
  if (stage === LAST_STAGE) return 1;
  const from = RULES.STAGE_THRESHOLDS[stage];
  const to = RULES.STAGE_THRESHOLDS[stage + 1];
  return (growth - from) / (to - from);
}

/** 날짜가 바뀌면 오늘 거리를 0으로 */
export function rollDay(state, today) {
  if (state.today === today) return state;
  return { ...state, today, todayKm: 0 };
}

/** 달린 거리만큼 물방울을 모은다. 1km 미만 자투리는 다음에 이어서 센다 */
export function addDistance(state, km) {
  if (!(km > 0)) return state;
  const pool = state.kmRemainder + km;
  const earned = Math.floor(pool / RULES.KM_PER_DROP);
  const drops = Math.min(RULES.MAX_DROPS, state.drops + earned);
  return {
    ...state,
    drops,
    kmRemainder: drops === RULES.MAX_DROPS ? 0 : pool - earned * RULES.KM_PER_DROP,
    totalKm: state.totalKm + km,
    todayKm: state.todayKm + km,
  };
}

/** 충전한 시간만큼 햇빛을 채운다 */
export function addChargeMinutes(state, minutes) {
  if (!(minutes > 0)) return state;
  return { ...state, light: Math.min(RULES.MAX_LIGHT, state.light + minutes * RULES.LIGHT_PER_MINUTE) };
}

export function canWater(state) {
  return state.drops > 0;
}

/**
 * 물방울 하나로 물을 준다. 햇빛이 충분하면 함께 써서 더 자란다
 * @returns {{state: object, grew: number, stageUp: boolean, usedLight: boolean}}
 */
export function water(state) {
  if (!canWater(state)) return { state, grew: 0, stageUp: false, usedLight: false };
  const usedLight = state.light >= RULES.LIGHT_COST;
  const grew = usedLight ? RULES.GROWTH_WITH_LIGHT : RULES.GROWTH_PER_WATER;
  const before = stageFor(state.growth);
  const next = {
    ...state,
    drops: state.drops - 1,
    light: usedLight ? state.light - RULES.LIGHT_COST : state.light,
    growth: state.growth + grew,
    waterCount: state.waterCount + 1,
  };
  return { state: next, grew, stageUp: stageFor(next.growth) > before, usedLight };
}

/** 저장소에서 읽은 값을 믿지 않고 숫자 범위를 맞춘다 */
export function sanitize(raw, today = '') {
  const base = createState(today);
  if (!raw || typeof raw !== 'object') return base;
  const num = (v, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);
  return {
    drops: Math.floor(num(raw.drops, 0, RULES.MAX_DROPS)),
    kmRemainder: num(raw.kmRemainder, 0, RULES.KM_PER_DROP),
    light: num(raw.light, 0, RULES.MAX_LIGHT),
    growth: num(raw.growth, 0, 1e6),
    totalKm: num(raw.totalKm, 0, 1e7),
    todayKm: num(raw.todayKm, 0, 1e5),
    today: typeof raw.today === 'string' ? raw.today : today,
    waterCount: Math.floor(num(raw.waterCount, 0, 1e7)),
  };
}
