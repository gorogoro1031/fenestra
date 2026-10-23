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
});

/** @typedef {{id:number, ko:string, en:string, label:string, lat:number, lon:number}} Charger */

/** @returns {Charger[]} */
export const chargers = (list = SUPERCHARGERS) => list.map(([id, ko, en, label, lat, lon]) => ({ id, ko, en, label, lat, lon }));
const ALL = chargers();
export const chargerById = (id, all = ALL) => all.find((c) => c.id === id) || null;

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
 * 밀린 비료를 주고, 처음 간 곳이면 도장을 찍는다
 * @returns {{state:object, session:ChargeSession|null, fert:number, newStamp:boolean}}
 */
export function settleCharge(state, session, now, today) {
  const due = fertDue(session, now) - (session?.paid ?? 0);
  if (due <= 0) return { state, session, fert: 0, newStamp: false };
  const fert = Math.min(due, CHARGE_RULES.MAX_FERT - state.fert);
  const newStamp = !state.stamps[session.id];
  const next = {
    ...state,
    fert: state.fert + Math.max(0, fert),
    coins: state.coins + (newStamp ? CHARGE_RULES.FIRST_STAMP_COINS : 0),
    stamps: newStamp ? { ...state.stamps, [session.id]: today } : state.stamps,
  };
  return { state: next, session: { ...session, paid: session.paid + due }, fert: Math.max(0, fert), newStamp };
}

/** 저장된 도장책을 믿지 않고 아는 슈퍼차저와 날짜 모양만 남긴다 */
export function cleanStamps(raw, all = ALL) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(all.filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(raw[c.id])).map((c) => [c.id, raw[c.id]]));
}
