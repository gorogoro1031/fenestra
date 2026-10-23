// 충전 리워드(실험판): 슈퍼차저 근처에 10분 넘게 서 있으면 충전 중으로 보고, 10분마다 비료를 준다
// 처음 간 슈퍼차저는 도장책에 도장 하나와 꽃씨 덤. 실제로 충전하는지는 알 수 없어서 근처에 서 있기만 해도 인정된다
// 화면·브라우저에 의존하지 않는 순수 함수만 둔다
import { SUPERCHARGERS } from './superchargers.js';

export const CHARGE_RULES = Object.freeze({
  RADIUS_M: 150,
  FERT_EVERY_MS: 10 * 60 * 1000,
  FERT_GROWTH: 3,
  MAX_FERT: 9,
  FIRST_STAMP_COINS: 20,
  // 먼 곳(근처 25km 안에 다른 슈퍼차저가 없거나 제주)은 첫 도장 꽃씨가 세 배
  FAR_MULT: 3,
  // 지역 도장: 한 곳이면 지역 식물 씨앗, 두 곳이면 배지와 꽃씨, 지역 주민
  REGION_GOAL: 2,
  REGION_COINS: 100,
});

/** 지역 묶음과 첫 도장에 받는 지역 식물 (plant: 그림 이름). 지역 주민은 guests.js */
export const REGIONS = Object.freeze([
  { id: 'capital', ko: '수도권', en: 'Capital Area', plant: 'forsythia', plantKo: '개나리', plantEn: 'Forsythia' },
  { id: 'gangwon', ko: '강원', en: 'Gangwon', plant: 'azalea', plantKo: '철쭉', plantEn: 'Royal Azalea' },
  { id: 'chung', ko: '충청', en: 'Chungcheong', plant: 'magnolia', plantKo: '백목련', plantEn: 'White Magnolia' },
  { id: 'jeolla', ko: '전라', en: 'Jeolla', plant: 'camellia', plantKo: '동백나무', plantEn: 'Camellia' },
  { id: 'gyeong', ko: '경상', en: 'Gyeongsang', plant: 'zinnia', plantKo: '백일홍', plantEn: 'Zinnia' },
  { id: 'jeju', ko: '제주', en: 'Jeju', plant: 'tangerine', plantKo: '귤나무', plantEn: 'Tangerine Tree' },
]);
export const regionById = (id) => REGIONS.find((r) => r.id === id) || REGIONS[0];

/** @typedef {{id:number, ko:string, en:string, labelKo:string, labelEn:string, lat:number, lon:number, region:string, far:boolean}} Charger 도시와 자리 이름(없으면 빈 글자), 지역, 먼 곳 */

/** @returns {Charger[]} */
export const chargers = (list = SUPERCHARGERS) => list.map(([id, ko, en, labelKo, labelEn, lat, lon, region, far]) => ({ id, ko, en, labelKo, labelEn, lat, lon, region, far: far === 1 }));
const ALL = chargers();
export const chargerById = (id, all = ALL) => all.find((c) => c.id === id) || null;

/** 도장책에서 이 지역 도장 수 */
export const regionCount = (stamps, region, all = ALL) => all.filter((c) => c.region === region && stamps[c.id]).length;

/** 이 충전소의 첫 도장 꽃씨 (먼 곳은 세 배) */
export const stampCoins = (charger) => CHARGE_RULES.FIRST_STAMP_COINS * (charger?.far ? CHARGE_RULES.FAR_MULT : 1);

/** 두 좌표 사이 거리(km) */
export const distanceKm = (a, b) => distanceM(a, b) / 1000;

function distanceM(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 이 위치에서 반경 안의 가장 가까운 슈퍼차저. 없으면 null @param {{lat:number, lon:number}} pos */
export function chargerNear(pos, all = ALL) {
  let best = null;
  let bestM = CHARGE_RULES.RADIUS_M;
  all.forEach((c) => {
    const m = distanceM(pos, c);
    if (m <= bestM) { best = c; bestM = m; }
  });
  return best;
}

/**
 * @typedef {{id:number, since:number, paid:number}} ChargeSession 같은 슈퍼차저 근처에 머문 한 번. paid: 이미 준 비료 수
 */

/** 지금 근처 슈퍼차저(없으면 null)로 머무는 중인지 갱신한다. 떠나면 null, 다른 곳이면 새로 */
export function updateSession(session, charger, now) {
  if (!charger) return null;
  if (session && session.id === charger.id) return session;
  return { id: charger.id, since: now, paid: 0 };
}

/** 머문 시간으로 이제까지 받을 비료 수 (10분마다 1개) */
export const fertDue = (session, now) => (session ? Math.floor(Math.max(0, now - session.since) / CHARGE_RULES.FERT_EVERY_MS) : 0);
/** 10분을 넘겨 충전 중으로 인정됐는지 */
export const isCharging = (session, now) => fertDue(session, now) >= 1;
/** 다음 비료까지 남은 시간(ms) */
export const msToNextFert = (session, now) => CHARGE_RULES.FERT_EVERY_MS - (Math.max(0, now - session.since) % CHARGE_RULES.FERT_EVERY_MS);

/**
 * 밀린 비료를 주고, 처음 간 곳이면 도장을 찍는다. 도장을 찍으면 꽃씨(먼 곳은 세 배),
 * 그 지역 첫 도장이면 지역 식물 씨앗, 두 번째면 배지와 꽃씨
 * @returns {{state:object, session:ChargeSession|null, fert:number, newStamp:boolean, coins:number, regionStep:0|1|2}}
 *  coins: 이번에 받은 꽃씨 합, regionStep: 1 지역 첫 도장 · 2 지역 목표 달성 · 0 그 밖
 */
export function settleCharge(state, session, now, today, all = ALL) {
  const due = fertDue(session, now) - (session?.paid ?? 0);
  if (due <= 0) return { state, session, fert: 0, newStamp: false, coins: 0, regionStep: 0 };
  const fert = Math.max(0, Math.min(due, CHARGE_RULES.MAX_FERT - state.fert));
  const newStamp = !state.stamps[session.id];
  let coins = 0;
  let regionStep = 0;
  let stamps = state.stamps;
  if (newStamp) {
    const charger = all.find((c) => c.id === session.id);
    stamps = { ...state.stamps, [session.id]: today };
    coins += stampCoins(charger);
    const n = charger ? regionCount(stamps, charger.region, all) : 0;
    if (n === 1) regionStep = 1;
    if (n === CHARGE_RULES.REGION_GOAL) { regionStep = 2; coins += CHARGE_RULES.REGION_COINS; }
  }
  const next = { ...state, fert: state.fert + fert, coins: state.coins + coins, stamps };
  return { state: next, session: { ...session, paid: session.paid + due }, fert, newStamp, coins, regionStep };
}

/** 저장된 도장책을 믿지 않고 아는 슈퍼차저와 날짜 모양만 남긴다 */
export function cleanStamps(raw, all = ALL) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(all.filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(raw[c.id])).map((c) => [c.id, raw[c.id]]));
}
