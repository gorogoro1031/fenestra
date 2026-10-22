// 온실 손님: 잎을 흔들면 가끔 숨어 있던 손님이 나와 잎에 앉는다. 누르면 만나고 꽃씨를 받는다.
// 시간·날씨·키우는 식물에 따라 오는 손님이 다르다
import { getLang } from './i18n.js';

export const GUEST_RULES = Object.freeze({
  // 잎을 한 번 흔들 때 손님이 나올 확률, 한 번 나온 뒤 쉬는 시간, 하루에 손님으로 받는 꽃씨 한도
  SPAWN_CHANCE: 1 / 8,
  COOLDOWN_MS: 3 * 60 * 1000,
  DAILY_COINS: 30,
  // 아무도 누르지 않으면 이만큼 머물다 떠난다
  STAY_MS: 45 * 1000,
});

/**
 * @typedef {{isNight:boolean, raining:boolean, plant:string, stage:number}} GuestContext
 * weight: 지금 상황에서 얼마나 잘 오는지 (0이면 안 옴)
 */
export const GUESTS = Object.freeze({
  ladybug: { name: '무당벌레', coins: 3, weight: () => 3 },
  butterfly: { name: '나비', coins: 5, weight: (c) => (!c.isNight && !c.raining ? 2 : 0) },
  bee: { name: '꿀벌', coins: 5, weight: (c) => (c.isNight || c.raining ? 0 : c.plant === 'cactus' && c.stage === 4 ? 4 : 1) },
  firefly: { name: '반딧불', coins: 5, weight: (c) => (c.isNight && !c.raining ? 2 : 0) },
  snail: { name: '달팽이', coins: 8, weight: (c) => (c.raining ? 3 : 0) },
  lizard: { name: '도마뱀', coins: 10, weight: (c) => (c.plant === 'cactus' ? 1 : 0) },
});
export const GUEST_IDS = Object.freeze(Object.keys(GUESTS));
const GUEST_EN = Object.freeze({ ladybug: 'Ladybug', butterfly: 'Butterfly', bee: 'Bee', firefly: 'Firefly', snail: 'Snail', lizard: 'Lizard' });
/** 지금 언어의 손님 이름 */
export const guestName = (id) => (getLang() === 'en' ? GUEST_EN[id] : GUESTS[id]?.name);
export const guestImage = (id) => `assets/guests/${id}.webp`;

/** @param {GuestContext} ctx */
export function guestWeights(ctx) {
  return Object.fromEntries(GUEST_IDS.map((id) => [id, GUESTS[id].weight(ctx)]));
}

/** 지금 상황에 맞춰 손님 하나를 고른다 */
export function pickGuest(ctx, random = Math.random) {
  const weights = guestWeights(ctx);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = random() * total;
  return GUEST_IDS.find((id) => (roll -= weights[id]) < 0) ?? 'ladybug';
}

/**
 * 잎을 흔든 이번에 손님이 나오는지. 운전 중이거나 이미 손님이 있거나 쉬는 시간이면 안 나온다
 * @param {{now:number, lastAt:number, present:boolean, driving:boolean}} at
 */
export function shouldSpawn({ now, lastAt, present, driving }, random = Math.random) {
  if (driving || present || now - lastAt < GUEST_RULES.COOLDOWN_MS) return false;
  return random() < GUEST_RULES.SPAWN_CHANCE;
}
