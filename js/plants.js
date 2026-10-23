// 식물 종류. 종마다 값(꽃씨), 자라는 데 필요한 점수, 잘 자라는 조건, 단계 이름이 다르다.
// 다 자라면 라틴어 이름을 얻는다(앱 이름 Fenestra도 라틴어 '창'). 뜻은 잘 자라는 조건과 이어진다
// en: 영어 화면의 이름·단계·조건·뜻 (라틴어 이름은 영어에서도 그대로)
import { getLang } from './i18n.js';

/**
 * @typedef {'sun'|'dry'|'night'|'road'} Rule
 *  sun: 맑은 낮(맑음·구름 조금)에 물을 주면 두 배
 *  dry: 물은 하루 두 번까지만, 대신 한 번에 두 배
 *  night: 달이 떠 있는 밤에 주면 두 배
 *  road: 오늘 많이 달린 날엔 두 배
 */
export const PLANTS = Object.freeze({
  monstera: Object.freeze({
    name: '몬스테라', price: 0, rule: 'sun', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '하트 잎', '첫 갈래', '구멍 잎', '페네스트라']),
    adult: Object.freeze({ name: '페네스트라', meaning: '창' }),
    hint: '맑은 낮에 물을 주면 두 배로 자라요',
    en: Object.freeze({ name: 'Monstera', stages: Object.freeze(['Seed', 'Heart Leaf', 'First Split', 'Holey Leaf', 'Fenestra']), adult: 'Fenestra', meaning: 'window', hint: 'Double growth when watered on sunny days' }),
  }),
  cactus: Object.freeze({
    name: '선인장', price: 120, rule: 'dry', thresholds: Object.freeze([0, 2, 8, 16, 28]),
    stages: Object.freeze(['씨앗', '꼬마 공', '기둥', '첫 팔', '솔라리스']),
    adult: Object.freeze({ name: '솔라리스', meaning: '해의' }),
    hint: '물은 하루 두 번이면 충분해요. 대신 한 번에 두 배',
    en: Object.freeze({ name: 'Cactus', stages: Object.freeze(['Seed', 'Little Ball', 'Pillar', 'First Arm', 'Solaris']), adult: 'Solaris', meaning: 'of the sun', hint: 'Two waterings a day is plenty, but each counts double' }),
  }),
  sansevieria: Object.freeze({
    name: '산세베리아', price: 200, rule: 'night', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새순', '줄무늬 잎', '잎 다발', '녹투르나']),
    adult: Object.freeze({ name: '녹투르나', meaning: '밤의' }),
    hint: '달이 떠 있는 밤에 물을 주면 두 배로 자라요',
    en: Object.freeze({ name: 'Sansevieria', stages: Object.freeze(['Seed', 'Shoot', 'Striped Leaf', 'Leaf Bundle', 'Nocturna']), adult: 'Nocturna', meaning: 'of the night', hint: 'Double growth when watered under the moon' }),
  }),
  rubber: Object.freeze({
    name: '고무나무', price: 300, rule: 'road', thresholds: Object.freeze([0, 2, 10, 22, 38]),
    stages: Object.freeze(['씨앗', '떡잎', '한 줄기', '두 줄기', '비아토르']),
    adult: Object.freeze({ name: '비아토르', meaning: '길 떠나는 사람' }),
    hint: '오늘 30km 넘게 달린 날엔 두 배로 자라요',
    en: Object.freeze({ name: 'Rubber Plant', stages: Object.freeze(['Seed', 'Seedling', 'One Stem', 'Two Stems', 'Viator']), adult: 'Viator', meaning: 'traveler', hint: 'Double growth on days you drive over 30 km' }),
  }),
});

export const PLANT_IDS = Object.freeze(Object.keys(PLANTS));
export const FIRST_PLANT = 'monstera';

// 도감: 원산지, 알맞은 온도(°C, 여러 원예 자료에서 겹치는 값), 소개, 단계별 한 줄 설명
const GUIDE = Object.freeze({
  monstera: {
    temp: [18, 27],
    ko: {
      origin: '멕시코 · 중앙아메리카',
      about: '멕시코와 중앙아메리카 열대우림에서 온 덩굴 식물이에요. 다 자란 잎에는 창처럼 구멍이 뚫리는데, 큰 잎이 바람에 찢기지 않고 아래 잎까지 빛이 닿게 해 준다고 알려져 있어요.',
      stages: ['흙 속에서 첫 물을 기다려요', '구멍 없는 하트 모양 어린 잎이 나와요', '잎 가장자리가 깃털처럼 갈라지기 시작해요', '잎 안쪽에 창 같은 구멍이 생겨요', '구멍 잎이 가득한 어른 몬스테라예요'],
    },
    en: {
      origin: 'Mexico · Central America',
      about: 'A climbing plant from the rainforests of Mexico and Central America. Mature leaves get window-like holes, thought to help big leaves survive the wind and let light reach the leaves below.',
      stages: ['Waiting in the soil for its first water', 'Young heart-shaped leaves with no holes yet', 'Leaf edges start to split like feathers', 'Window-like holes open inside the leaves', 'A grown monstera full of holey leaves'],
    },
  },
  cactus: {
    temp: [20, 30],
    ko: {
      origin: '아메리카 대륙의 건조한 땅',
      about: '아메리카 대륙의 건조한 땅에서 자라는 기둥 선인장이에요. 두꺼운 줄기에 물을 저장하고, 가시는 잎이 변한 거예요. 그래서 물은 가끔, 대신 한 번에 듬뿍 마셔요.',
      stages: ['흙 속에서 첫 물을 기다려요', '가시 돋은 동그란 몸이 올라와요', '위로 곧게 자라 기둥이 돼요', '옆으로 첫 팔을 뻗어요', '해를 향해 팔을 벌린 어른 선인장이에요'],
    },
    en: {
      origin: 'Dry lands of the Americas',
      about: 'A column cactus from the dry lands of the Americas. Its thick stem stores water, and its spines are leaves that changed shape. So it drinks rarely, but deeply.',
      stages: ['Waiting in the soil for its first water', 'A round, spiny body pops up', 'It grows straight up into a pillar', 'It reaches out its first arm', 'A grown cactus with arms open to the sun'],
    },
  },
  sansevieria: {
    temp: [18, 27],
    ko: {
      origin: '서아프리카',
      about: '서아프리카에서 온 식물이에요. 낮엔 숨구멍을 닫아 물을 아끼고, 밤에 이산화탄소를 들이마시는 ‘밤 광합성’을 해요. 그래서 밤에 물을 주면 두 배로 자라요.',
      stages: ['흙 속에서 첫 물을 기다려요', '뾰족한 새순이 고개를 내밀어요', '줄무늬가 선명한 잎이 자라요', '잎이 여럿 모여 다발이 돼요', '밤처럼 짙은 잎이 가득한 어른 산세베리아예요'],
    },
    en: {
      origin: 'West Africa',
      about: 'A plant from West Africa. It keeps its pores closed by day to save water and breathes in carbon dioxide at night. That night-time habit is why it grows double when watered at night.',
      stages: ['Waiting in the soil for its first water', 'A pointed shoot peeks out', 'Leaves with bold stripes grow tall', 'Leaves gather into a bundle', 'A grown sansevieria full of night-dark leaves'],
    },
  },
  rubber: {
    temp: [15, 24],
    ko: {
      origin: '인도 북동부 · 동남아시아',
      about: '인도 북동부와 동남아시아에서 온 나무예요. 줄기에서 고무의 원료가 되는 하얀 수액이 나오고, 자연에서는 30m 넘게 자라기도 해요. 멀리 달릴수록 쑥쑥 자라는 길 떠나는 나무예요.',
      stages: ['흙 속에서 첫 물을 기다려요', '동그란 떡잎 두 장이 나와요', '윤기 나는 잎이 달린 줄기 하나', '줄기가 둘로 늘어나요', '길 떠날 준비를 마친 어른 고무나무예요'],
    },
    en: {
      origin: 'Northeast India · Southeast Asia',
      about: 'A tree from Northeast India and Southeast Asia. Its stem gives a white sap once used for rubber, and in the wild it can grow over 30 m tall. The farther you drive, the faster this traveler grows.',
      stages: ['Waiting in the soil for its first water', 'Two round seed leaves appear', 'One stem with glossy leaves', 'The stem becomes two', 'A grown rubber tree, ready for the road'],
    },
  },
});
// 알맞은 범위에서 이만큼(°C)까지 벗어나면 '조금', 더 벗어나면 '너무'
export const TEMP_MARGIN = 5;

const infoOf = (id) => PLANTS[id] || PLANTS[FIRST_PLANT];
const isEn = () => getLang() === 'en';

/** 지금 언어의 식물 이름과 잘 자라는 조건 */
export const plantName = (id) => (isEn() ? infoOf(id).en.name : infoOf(id).name);
export const plantHint = (id) => (isEn() ? infoOf(id).en.hint : infoOf(id).hint);

/** 다 자란 이름과 라틴어 뜻 */
export function adultOf(id) {
  const info = infoOf(id);
  return isEn() ? { name: info.en.adult, meaning: info.en.meaning } : { ...info.adult };
}

/** 식물·단계에 맞는 이름. 모르는 식물은 몬스테라, 넘치는 단계는 마지막 이름 */
export function stageName(id, stage) {
  const stages = isEn() ? infoOf(id).en.stages : infoOf(id).stages;
  return stages[Math.min(stages.length - 1, Math.max(0, stage))];
}

/** 단계별 그림. 씨앗(0단계)은 모든 종이 같은 그림을 쓴다 */
export const plantImage = (id, stage) => (stage === 0 ? 'assets/plants/seed.webp' : `assets/plants/${id}-${stage}.webp`);

/** 도감 글: 원산지, 알맞은 온도 [최저, 최고], 소개, 단계별 한 줄 설명 (지금 언어) */
export function guideOf(id) {
  const g = GUIDE[id] || GUIDE[FIRST_PLANT];
  const text = isEn() ? g.en : g.ko;
  return { temp: g.temp, origin: text.origin, about: text.about, stages: text.stages };
}

/**
 * 지금 기온이 이 식물에게 어떤지
 * @returns {'good'|'cool'|'cold'|'warm'|'hot'|'unknown'}
 */
export function conditionFor(id, temp) {
  if (!Number.isFinite(temp)) return 'unknown';
  const [low, high] = (GUIDE[id] || GUIDE[FIRST_PLANT]).temp;
  if (temp < low) return low - temp <= TEMP_MARGIN ? 'cool' : 'cold';
  if (temp > high) return temp - high <= TEMP_MARGIN ? 'warm' : 'hot';
  return 'good';
}
