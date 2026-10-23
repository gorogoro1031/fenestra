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
// 지역 주민(실험판): 한 지역 슈퍼차저 두 곳을 들르면 찾아오는 프렌즈. 잎을 흔들어선 안 나오고, 만나기 전엔 어느 지역인지 밝히지 않는다
export const RESIDENTS = Object.freeze({
  magpie: { region: 'capital', ko: '까치', en: 'Magpie' },
  goral: { region: 'gangwon', ko: '아기 산양', en: 'Baby Goral' },
  treefrog: { region: 'chung', ko: '청개구리', en: 'Tree Frog' },
  bear: { region: 'jeolla', ko: '아기 반달가슴곰', en: 'Moon Bear Cub' },
  otter: { region: 'gyeong', ko: '수달', en: 'Otter' },
  dolphin: { region: 'jeju', ko: '남방큰돌고래', en: 'Bottlenose Dolphin' },
});
export const RESIDENT_IDS = Object.freeze(Object.keys(RESIDENTS));
export const isResident = (id) => Object.hasOwn(RESIDENTS, id);
/** 도감에 보일 프렌즈: 잎 프렌즈, 실험판이면 지역 주민까지 */
export const friendIds = (withResidents) => (withResidents ? [...GUEST_IDS, ...RESIDENT_IDS] : GUEST_IDS);

/** 지금 언어의 프렌즈 이름 */
export const guestName = (id) => {
  if (isResident(id)) return getLang() === 'en' ? RESIDENTS[id].en : RESIDENTS[id].ko;
  return getLang() === 'en' ? GUEST_EN[id] : GUESTS[id]?.name;
};
export const guestImage = (id) => `assets/guests/${id}.webp`;

// 손님 도감 글: 한 줄 소개, 설명, 언제 오는지 (두 언어). 언제 오는지는 위 weight 규칙과 같게
const GUEST_INFO = Object.freeze({
  ladybug: {
    ko: { tag: '어디서나 제일 자주 놀러 와요', about: '빨간 등에 까만 점이 있는 작은 딱정벌레예요. 잎에 붙은 진딧물을 먹어서 정원사들이 반가워하는 친구예요.', when: '언제나' },
    en: { tag: 'Drops by most often of all', about: 'A tiny beetle with a red back and black spots. It eats the aphids on leaves, so gardeners are always glad to see it.', when: 'Anytime' },
  },
  butterfly: {
    ko: { tag: '맑은 낮에 팔랑팔랑 찾아와요', about: '해가 비치는 날 꽃과 잎 사이를 날아다녀요. 날개가 햇빛에 데워져야 잘 날 수 있어서 흐리거나 비 오는 날엔 쉬어요.', when: '맑은 낮' },
    en: { tag: 'Flutters by on clear days', about: 'It drifts between flowers and leaves when the sun is out. Its wings need warming up to fly, so it rests on cloudy or rainy days.', when: 'Clear days' },
  },
  bee: {
    ko: { tag: '다 자란 선인장을 특히 좋아해요', about: '꽃가루와 꿀을 모으러 다니는 부지런한 친구예요. 선인장이 다 자라 꽃이 필 무렵이면 더 자주 들러요.', when: '맑은 낮 · 다 자란 선인장' },
    en: { tag: 'Loves a fully grown cactus', about: 'A busy little friend gathering pollen and nectar. It drops by more often once the cactus is grown and ready to bloom.', when: 'Clear days · grown cactus' },
  },
  firefly: {
    ko: { tag: '맑은 밤에 반짝이며 나타나요', about: '배 끝에서 스스로 빛을 내는 곤충이에요. 깨끗한 물가와 어두운 밤을 좋아해서 맑은 밤에만 만날 수 있어요.', when: '맑은 밤' },
    en: { tag: 'Glows in on clear nights', about: 'An insect that makes its own light at the tip of its body. It loves clean water and dark skies, so you only meet it on clear nights.', when: 'Clear nights' },
  },
  snail: {
    ko: { tag: '비 오는 날 느릿느릿 찾아와요', about: '몸이 마르지 않게 축축한 날을 좋아해요. 비가 오면 껍데기에서 나와 잎 위를 천천히 산책해요.', when: '비 오는 날' },
    en: { tag: 'Slowly turns up on rainy days', about: 'It likes damp days so its body never dries out. When it rains, it comes out of its shell for a slow walk across the leaves.', when: 'Rainy days' },
  },
  lizard: {
    ko: { tag: '선인장 곁을 좋아해요', about: '따뜻한 돌과 선인장 사이에서 햇볕을 쬐는 작은 도마뱀이에요. 선인장을 키울 때만 놀러 와요.', when: '선인장을 키울 때' },
    en: { tag: 'Loves to stay by the cactus', about: 'A small lizard that basks between warm stones and cacti. It only visits while you grow a cactus.', when: 'While growing a cactus' },
  },
});
// 지역 주민 도감 글. 언제 오는지는 지역을 숨긴 채 규칙만 알려 준다
const RESIDENT_WHEN = { ko: '한 지역 슈퍼차저 두 곳', en: 'Two Superchargers in one region' };
const RESIDENT_TEXT = {
  magpie: {
    ko: { tag: '반가운 소식을 물어 오는 수도권 주민', about: '까만 머리와 흰 배, 푸른빛이 도는 꼬리를 가진 새예요. 아침에 까치가 울면 반가운 손님이 온다는 이야기가 있어요.' },
    en: { tag: 'A Capital Area local who brings good news', about: 'A bird with a black head, white belly and a blue-tinged tail. In Korea, a magpie singing in the morning means a welcome guest is on the way.' },
  },
  goral: {
    ko: { tag: '강원 바위산의 꼬마 산양', about: '가파른 바위 위를 가볍게 오르내리는 산양의 아기예요. 짧은 뿔과 보송한 털이 자랑이에요.' },
    en: { tag: 'A little goral from Gangwon’s rocky peaks', about: 'A baby goral that hops up and down steep rocks with ease. Its short horns and fluffy coat are its pride.' },
  },
  treefrog: {
    ko: { tag: '충청 논둑의 초록 친구', about: '비가 오기 전이면 더 크게 우는 작은 개구리예요. 발가락 끝의 동그란 판으로 잎에도 척척 붙어요.' },
    en: { tag: 'A green friend from Chungcheong’s rice paddies', about: 'A tiny frog that sings louder before the rain. The round pads on its toes let it stick to leaves.' },
  },
  bear: {
    ko: { tag: '전라 지리산의 아기 곰', about: '가슴에 하얀 반달 무늬가 있는 아기 곰이에요. 숲속에서 도토리와 열매를 찾아다녀요.' },
    en: { tag: 'A bear cub from Jirisan in Jeolla', about: 'A cub with a white crescent moon on its chest. It wanders the forest looking for acorns and berries.' },
  },
  otter: {
    ko: { tag: '경상 강가의 장난꾸러기', about: '맑은 강에서 헤엄치고 물장구치기를 좋아해요. 작은 앞발로 조약돌을 굴리며 놀아요.' },
    en: { tag: 'A playful otter from Gyeongsang’s rivers', about: 'It loves swimming and splashing in clear rivers, rolling pebbles around with its little paws.' },
  },
  dolphin: {
    ko: { tag: '제주 바다를 헤엄치는 돌고래', about: '제주 바닷가 가까이에서 무리 지어 사는 돌고래예요. 운이 좋으면 바닷가에서 뛰어오르는 모습을 볼 수 있어요.' },
    en: { tag: 'A dolphin from the seas around Jeju', about: 'A dolphin that lives in pods close to Jeju’s shore. With luck, you can see it leap from the coast.' },
  },
};
const RESIDENT_INFO = Object.freeze(Object.fromEntries(Object.entries(RESIDENT_TEXT).map(([id, { ko, en }]) => [id, { ko: { ...ko, when: RESIDENT_WHEN.ko }, en: { ...en, when: RESIDENT_WHEN.en } }])));

/** 지금 언어의 프렌즈 도감 글 */
export const guestInfo = (id) => (GUEST_INFO[id] ?? RESIDENT_INFO[id])?.[getLang() === 'en' ? 'en' : 'ko'] ?? GUEST_INFO.ladybug.ko;

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
