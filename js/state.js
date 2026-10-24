// 게임 규칙과 상태 변화. 화면·브라우저에 의존하지 않는 순수 함수만 둔다
import { PLANTS, PLANT_IDS, FIRST_PLANT } from './plants.js';
import { GUEST_RULES, ALL_FRIEND_IDS, friendCoins, isResident, isChargeFriend } from './guests.js';
import { CHARGE_RULES, cleanStamps, regionCount } from './charge.js';

// 이슬: 달린 거리로 모아 물을 줄 때 쓴다 (코드에선 drops)
export const RULES = Object.freeze({
  KM_PER_DROP: 10,
  // 처음 켰을 때 선물: 첫날 바로 새싹을 볼 수 있게
  START_DROPS: 2,
  MAX_DROPS: 12,
  GROWTH_PER_WATER: 1,
  GROWTH_BONUS: 2,
  // 꽃씨: 1km마다 1개, 식물 하나를 다 키우면 덤
  COINS_PER_KM: 1,
  GROWN_REWARD: 50,
  // 선인장은 하루 물 두 번까지, 고무나무는 오늘 이만큼 달리면 보너스
  DRY_LIMIT: 2,
  ROAD_KM: 30,
  // 필레아는 이만큼 날을 이어서 물을 주면 그날부터 두 배
  STREAK_DAYS: 3,
});

// 동행(실험판): 만난 프렌즈 한 마리를 태우고 다닌다. 함께 달린 거리로 하트가 차고, 동행 중 새 도장은 함께 간 곳으로 남는다
export const COMPANION = Object.freeze({
  // 하트 한 칸씩 차는 함께 달린 거리(km)
  HEART_KM: Object.freeze([50, 300, 1000, 3000]),
  // 친구마다 함께 간 곳은 최근 이만큼만 남긴다
  MAX_TRIPS: 30,
});

// 단계는 씨앗(0)부터 다 자람(4)까지 다섯. 이름은 식물마다 다르다 (plants.js)
export const LAST_STAGE = 4;

// streak·lastDay: 물을 이어서 준 날 수와 마지막으로 준 날 (필레아)
const newPlant = () => ({ growth: 0, waterToday: 0, grown: false, streak: 0, lastDay: '' });

/** 'YYYY-MM-DD' 하루 전 날짜 */
function dayBefore(day) {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 오늘 물을 주면 며칠째 이어서 주는 것인지 (오늘 이미 줬으면 그 값 그대로) */
export function streakToday(plant, today) {
  if (!today) return 1;
  if (plant.lastDay === today) return plant.streak;
  return plant.lastDay && plant.lastDay === dayBefore(today) ? plant.streak + 1 : 1;
}

export function createState(today = '') {
  return {
    drops: RULES.START_DROPS, kmRemainder: 0, totalKm: 0, todayKm: 0, today, waterCount: 0,
    coins: 0, coinRemainder: 0,
    // 손님 도감(만난 횟수), 오늘 손님에게 받은 꽃씨, 처음 만나고 아직 온실에서 안 본 손님
    guestbook: {}, guestCoinsToday: 0, newGuests: [],
    // 충전 리워드(실험판): 비료 수와 충전소 도장책({슈퍼차저 id: 처음 간 날})
    fert: 0, stamps: {},
    // 동행(실험판): 태운 프렌즈, 프렌즈별 함께 달린 거리(km), 함께 간 곳([{id: 슈퍼차저 id, day}], 최근 것이 앞)
    companion: null, bond: {}, trips: {},
    active: FIRST_PLANT,
    plants: { [FIRST_PLANT]: newPlant() },
  };
}

/** 지금 키우는 식물 */
export const activePlant = (state) => state.plants[state.active];
export const growthOf = (state) => activePlant(state).growth;
export const thresholdsOf = (state) => PLANTS[state.active].thresholds;

export function stageFor(growth, thresholds = PLANTS[FIRST_PLANT].thresholds) {
  let stage = 0;
  thresholds.forEach((need, i) => { if (growth >= need) stage = i; });
  return stage;
}
export const stageOf = (state) => stageFor(growthOf(state), thresholdsOf(state));

/** 다음 단계까지 진행률 0~1. 마지막 단계면 1 */
export function progressToNext(growth, thresholds = PLANTS[FIRST_PLANT].thresholds) {
  const stage = stageFor(growth, thresholds);
  if (stage === LAST_STAGE) return 1;
  const from = thresholds[stage];
  return (growth - from) / (thresholds[stage + 1] - from);
}

const mapPlants = (state, fn) => Object.fromEntries(Object.entries(state.plants).map(([id, p]) => [id, fn(p, id)]));
const withActive = (state, patch) => ({ ...state, plants: { ...state.plants, [state.active]: { ...activePlant(state), ...patch } } });

/** 날짜가 바뀌면 오늘 거리, 오늘 물 준 횟수, 오늘 손님 꽃씨를 0으로 */
export function rollDay(state, today) {
  if (state.today === today) return state;
  return { ...state, today, todayKm: 0, guestCoinsToday: 0, plants: mapPlants(state, (p) => ({ ...p, waterToday: 0 })) };
}

/** 손님을 만났다: 도감에 쌓고 꽃씨를 받는다 (하루 한도까지). 처음 만난 손님은 새 손님으로 남긴다 */
export function catchGuest(state, id) {
  if (!ALL_FRIEND_IDS.includes(id) || isResident(id)) return state;
  // 충전 프렌즈는 충전 한 번에 한 번만 오므로 하루 한도와 상관없이 다 받는다
  const charged = isChargeFriend(id);
  const room = Math.max(0, GUEST_RULES.DAILY_COINS - state.guestCoinsToday);
  const earned = charged ? friendCoins(id) : Math.min(room, friendCoins(id));
  return {
    ...state,
    coins: state.coins + earned,
    guestCoinsToday: state.guestCoinsToday + (charged ? 0 : earned),
    guestbook: { ...state.guestbook, [id]: (state.guestbook[id] || 0) + 1 },
    newGuests: state.guestbook[id] ? state.newGuests : [...state.newGuests, id],
  };
}

/** 온실 도감을 봤다: 새 손님 표시를 지운다 */
export function markGuestsSeen(state) {
  if (state.newGuests.length === 0) return state;
  return { ...state, newGuests: [] };
}

/** 다음 이슬까지 남은 거리(km). 가득 찼으면 0 */
export function kmToNextDrop(state) {
  if (state.drops >= RULES.MAX_DROPS) return 0;
  return RULES.KM_PER_DROP - state.kmRemainder;
}

/** 달린 거리만큼 이슬과 꽃씨를 모은다. 자투리는 다음에 이어서 센다 */
export function addDistance(state, km) {
  if (!(km > 0)) return state;
  const pool = state.kmRemainder + km;
  const earned = Math.floor(pool / RULES.KM_PER_DROP);
  const drops = Math.min(RULES.MAX_DROPS, state.drops + earned);
  const coinPool = state.coinRemainder + km * RULES.COINS_PER_KM;
  const coins = Math.floor(coinPool);
  const bond = state.companion ? { ...state.bond, [state.companion]: (state.bond[state.companion] || 0) + km } : state.bond;
  return {
    ...state,
    bond,
    drops,
    kmRemainder: drops === RULES.MAX_DROPS ? 0 : pool - earned * RULES.KM_PER_DROP,
    coins: state.coins + coins,
    coinRemainder: coinPool - coins,
    totalKm: state.totalKm + km,
    todayKm: state.todayKm + km,
  };
}

/**
 * 지금 물을 줄 수 있는지와, 못 준다면 이유
 * @returns {{ok:boolean, reason:''|'no-drops'|'grown'|'dry-limit'}}
 */
export function waterCheck(state) {
  if (activePlant(state).grown || stageOf(state) === LAST_STAGE) return { ok: false, reason: 'grown' };
  if (state.drops <= 0) return { ok: false, reason: 'no-drops' };
  if (PLANTS[state.active].rule === 'dry' && activePlant(state).waterToday >= RULES.DRY_LIMIT) return { ok: false, reason: 'dry-limit' };
  return { ok: true, reason: '' };
}
export const canWater = (state) => waterCheck(state).ok;

/**
 * @typedef {{isNight?:boolean, sunny?:boolean, raining?:boolean, twilight?:boolean, charging?:boolean}} BonusContext 화면 쪽에서 알려 주는 지금 상황
 *  sunny: 실제 날씨가 맑거나 구름 조금인 낮, raining: 비·눈, twilight: 해 뜨고 지는 무렵, charging: 슈퍼차저에서 충전 중
 */

/** 이번에 물을 주면 보너스(두 배)를 받는지 @param {BonusContext} ctx */
export function bonusNow(state, ctx = {}) {
  switch (PLANTS[state.active].rule) {
    case 'sun': return Boolean(ctx.sunny);
    case 'dry': return true;
    case 'night': return Boolean(ctx.isNight);
    case 'road': return state.todayKm >= RULES.ROAD_KM;
    case 'rain': return Boolean(ctx.raining);
    case 'twilight': return Boolean(ctx.twilight);
    case 'charge': return Boolean(ctx.charging);
    case 'streak': return streakToday(activePlant(state), state.today) >= RULES.STREAK_DAYS;
    default: return false;
  }
}

/**
 * 두 배 안내용: 지금 두 배인지와, 고무나무는 남은 거리, 선인장은 오늘 남은 물 횟수, 필레아는 남은 날 수
 * @param {BonusContext} ctx
 * @returns {{rule:string, active:boolean, left?:number}}
 */
export function bonusInfo(state, ctx = {}) {
  const rule = PLANTS[state.active].rule;
  if (rule === 'road') {
    const left = Math.max(0, Number((RULES.ROAD_KM - state.todayKm).toFixed(1)));
    return { rule, active: left === 0, left };
  }
  if (rule === 'dry') {
    const left = Math.max(0, RULES.DRY_LIMIT - activePlant(state).waterToday);
    return { rule, active: left > 0, left };
  }
  if (rule === 'streak') {
    const left = Math.max(0, RULES.STREAK_DAYS - streakToday(activePlant(state), state.today));
    return { rule, active: left === 0, left };
  }
  return { rule, active: bonusNow(state, ctx) };
}

/**
 * 이슬 하나로 물을 준다. 조건이 맞으면 두 배로 자란다. 다 자라면 꽃씨 덤
 * @param {BonusContext} ctx
 * @returns {{state: object, grew: number, stageUp: boolean, bonus: boolean, grownNow: boolean}}
 */
export function water(state, ctx = {}) {
  if (!canWater(state)) return { state, grew: 0, stageUp: false, bonus: false, grownNow: false };
  const bonus = bonusNow(state, ctx);
  const grew = bonus ? RULES.GROWTH_BONUS : RULES.GROWTH_PER_WATER;
  const before = stageOf(state);
  const plant = activePlant(state);
  let next = withActive(state, { growth: plant.growth + grew, waterToday: plant.waterToday + 1, streak: streakToday(plant, state.today), lastDay: state.today });
  next = {
    ...next,
    drops: state.drops - 1,
    waterCount: state.waterCount + 1,
  };
  const after = stageOf(next);
  const grownNow = after === LAST_STAGE && !plant.grown;
  if (grownNow) next = { ...withActive(next, { grown: true }), coins: next.coins + RULES.GROWN_REWARD };
  return { state: next, grew, stageUp: after > before, bonus, grownNow };
}

/**
 * 비료 하나를 쓴다: 지금 식물이 물 세 번만큼 자란다. 다 자라면 꽃씨 덤
 * @returns {{state: object, grew: number, stageUp: boolean, grownNow: boolean}}
 */
export function fertilize(state) {
  const plant = activePlant(state);
  if (state.fert <= 0 || plant.grown || stageOf(state) === LAST_STAGE) return { state, grew: 0, stageUp: false, grownNow: false };
  const before = stageOf(state);
  let next = { ...withActive(state, { growth: plant.growth + CHARGE_RULES.FERT_GROWTH }), fert: state.fert - 1 };
  const after = stageOf(next);
  const grownNow = after === LAST_STAGE;
  if (grownNow) next = { ...withActive(next, { grown: true }), coins: next.coins + RULES.GROWN_REWARD };
  return { state: next, grew: CHARGE_RULES.FERT_GROWTH, stageUp: after > before, grownNow };
}

/** 꽃씨로 새 식물을 산다. 사면 바로 그 식물을 키운다 */
export function buyPlant(state, id) {
  const info = PLANTS[id];
  if (!info || info.region || state.plants[id] || state.coins < info.price) return state;
  return { ...state, coins: state.coins - info.price, active: id, plants: { ...state.plants, [id]: newPlant() } };
}

/** 지역 식물: 그 지역 슈퍼차저 도장이 하나라도 있으면 씨앗을 받아 키울 수 있다 */
export function grantRegionalSeeds(state) {
  const due = PLANT_IDS.filter((id) => PLANTS[id].region && !state.plants[id] && regionCount(state.stamps, PLANTS[id].region) >= 1);
  if (!due.length) return state;
  return { ...state, plants: { ...state.plants, ...Object.fromEntries(due.map((id) => [id, newPlant()])) } };
}

/** 만난 프렌즈를 태운다. 이미 태운 친구면 내려 준다 (한 번에 한 마리) */
export function toggleCompanion(state, id) {
  if (state.companion === id) return { ...state, companion: null };
  if (!state.guestbook[id]) return state;
  return { ...state, companion: id };
}

/** 함께 달린 거리로 찬 하트 수 (0~4)와 다음 하트까지 남은 km (다 찼으면 0) */
export function bondOf(state, id) {
  const km = state.bond[id] || 0;
  const hearts = COMPANION.HEART_KM.filter((need) => km >= need).length;
  const next = COMPANION.HEART_KM[hearts];
  return { km, hearts, left: next === undefined ? 0 : next - km };
}

/** 동행 중에 새 도장을 찍었으면 그 친구의 함께 간 곳에 남긴다 */
export function recordTrip(state, chargerId, day) {
  const id = state.companion;
  if (!id) return state;
  const trips = [{ id: chargerId, day }, ...(state.trips[id] || [])].slice(0, COMPANION.MAX_TRIPS);
  return { ...state, trips: { ...state.trips, [id]: trips } };
}

/** 데모(실험판): 모든 식물을 들이고 모든 프렌즈를 만난 것으로. 이미 있는 진행은 그대로 둔다 */
export function unlockAll(state) {
  const plants = Object.fromEntries(PLANT_IDS.map((id) => [id, state.plants[id] || newPlant()]));
  const guestbook = Object.fromEntries(ALL_FRIEND_IDS.map((id) => [id, state.guestbook[id] || 1]));
  return { ...state, plants, guestbook };
}

/** 가진 식물 중에서 키울 식물을 바꾼다 */
export function selectPlant(state, id) {
  if (!state.plants[id] || state.active === id) return state;
  return { ...state, active: id };
}

/** 저장소에서 읽은 값을 믿지 않고 숫자 범위를 맞춘다. 식물 한 종만 있던 예전 저장값도 옮겨 온다 */
export function sanitize(raw, today = '') {
  const base = createState(today);
  if (!raw || typeof raw !== 'object') return base;
  const num = (v, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);
  const cleanPlant = (p) => ({
    growth: num(p?.growth, 0, 1e6),
    waterToday: Math.floor(num(p?.waterToday, 0, 100)),
    grown: p?.grown === true,
    streak: Math.floor(num(p?.streak, 0, 1e5)),
    lastDay: typeof p?.lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.lastDay) ? p.lastDay : '',
  });
  const rawPlants = raw.plants && typeof raw.plants === 'object' ? raw.plants : { [FIRST_PLANT]: { growth: raw.growth } };
  const plants = Object.fromEntries(PLANT_IDS.filter((id) => rawPlants[id]).map((id) => [id, cleanPlant(rawPlants[id])]));
  if (!plants[FIRST_PLANT]) plants[FIRST_PLANT] = cleanPlant({});
  return {
    drops: Math.floor(num(raw.drops, 0, RULES.MAX_DROPS)),
    kmRemainder: num(raw.kmRemainder, 0, RULES.KM_PER_DROP),
    totalKm: num(raw.totalKm, 0, 1e7),
    todayKm: num(raw.todayKm, 0, 1e5),
    today: typeof raw.today === 'string' ? raw.today : today,
    waterCount: Math.floor(num(raw.waterCount, 0, 1e7)),
    coins: Math.floor(num(raw.coins, 0, 1e7)),
    coinRemainder: num(raw.coinRemainder, 0, 1),
    guestbook: Object.fromEntries(ALL_FRIEND_IDS.filter((id) => Number.isFinite(raw.guestbook?.[id]) && raw.guestbook[id] > 0).map((id) => [id, Math.floor(raw.guestbook[id])])),
    guestCoinsToday: Math.floor(num(raw.guestCoinsToday, 0, GUEST_RULES.DAILY_COINS)),
    newGuests: ALL_FRIEND_IDS.filter((id) => Array.isArray(raw.newGuests) && raw.newGuests.includes(id) && raw.guestbook?.[id] > 0),
    fert: Math.floor(num(raw.fert, 0, CHARGE_RULES.MAX_FERT)),
    stamps: cleanStamps(raw.stamps),
    ...cleanCompanion(raw),
    active: plants[raw.active] ? raw.active : FIRST_PLANT,
    plants,
  };
}

/** 저장된 동행 값: 아는 프렌즈만, 거리는 숫자로, 함께 간 곳은 날짜 모양과 개수를 맞춘다 */
function cleanCompanion(raw) {
  const known = (id) => ALL_FRIEND_IDS.includes(id);
  const bond = Object.fromEntries(Object.entries(raw.bond && typeof raw.bond === 'object' ? raw.bond : {})
    .filter(([id, km]) => known(id) && Number.isFinite(km) && km > 0).map(([id, km]) => [id, Math.min(km, 1e7)]));
  const trips = Object.fromEntries(Object.entries(raw.trips && typeof raw.trips === 'object' ? raw.trips : {})
    .filter(([id, list]) => known(id) && Array.isArray(list))
    .map(([id, list]) => [id, list.filter((t) => Number.isInteger(t?.id) && /^\d{4}-\d{2}-\d{2}$/.test(t?.day)).map((t) => ({ id: t.id, day: t.day })).slice(0, COMPANION.MAX_TRIPS)]));
  const companion = known(raw.companion) && raw.guestbook?.[raw.companion] > 0 ? raw.companion : null;
  return { companion, bond, trips };
}
