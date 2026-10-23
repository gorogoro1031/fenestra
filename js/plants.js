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
  // 지역 식물(실험판) 6종: 꽃씨로 살 수 없고, 그 지역(region) 슈퍼차저에 처음 들르면 씨앗을 받는다
  forsythia: Object.freeze({
    name: '개나리', price: null, region: 'capital', rule: 'sun', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '어린 가지', '꽃봉오리', '아우레아']),
    adult: Object.freeze({ name: '아우레아', meaning: '황금빛의' }),
    hint: '맑은 낮에 물을 주면 두 배로 자라요',
    en: Object.freeze({ name: 'Forsythia', stages: Object.freeze(['Seed', 'Sprout', 'Young Twigs', 'Buds', 'Aurea']), adult: 'Aurea', meaning: 'golden', hint: 'Double growth when watered on sunny days' }),
  }),
  azalea: Object.freeze({
    name: '철쭉', price: null, region: 'gangwon', rule: 'road', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '잔가지', '꽃봉오리', '몬타나']),
    adult: Object.freeze({ name: '몬타나', meaning: '산의' }),
    hint: '오늘 30km 넘게 달린 날엔 두 배로 자라요',
    en: Object.freeze({ name: 'Royal Azalea', stages: Object.freeze(['Seed', 'Sprout', 'Twigs', 'Buds', 'Montana']), adult: 'Montana', meaning: 'of the mountains', hint: 'Double growth on days you drive over 30 km' }),
  }),
  magnolia: Object.freeze({
    name: '백목련', price: null, region: 'chung', rule: 'night', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '어린 나무', '첫 꽃', '루키다']),
    adult: Object.freeze({ name: '루키다', meaning: '빛나는' }),
    hint: '달이 떠 있는 밤에 물을 주면 두 배로 자라요',
    en: Object.freeze({ name: 'White Magnolia', stages: Object.freeze(['Seed', 'Sprout', 'Sapling', 'First Bloom', 'Lucida']), adult: 'Lucida', meaning: 'shining', hint: 'Double growth when watered under the moon' }),
  }),
  camellia: Object.freeze({
    name: '동백나무', price: null, region: 'jeolla', rule: 'dry', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '윤기 잎', '꽃봉오리', '히에말리스']),
    adult: Object.freeze({ name: '히에말리스', meaning: '겨울의' }),
    hint: '물은 하루 두 번이면 충분해요. 대신 한 번에 두 배',
    en: Object.freeze({ name: 'Camellia', stages: Object.freeze(['Seed', 'Sprout', 'Glossy Leaf', 'Buds', 'Hiemalis']), adult: 'Hiemalis', meaning: 'of winter', hint: 'Two waterings a day is plenty, but each counts double' }),
  }),
  zinnia: Object.freeze({
    name: '백일홍', price: null, region: 'gyeong', rule: 'sun', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '줄기', '꽃봉오리', '페렌니스']),
    adult: Object.freeze({ name: '페렌니스', meaning: '오래가는' }),
    hint: '맑은 낮에 물을 주면 두 배로 자라요',
    en: Object.freeze({ name: 'Zinnia', stages: Object.freeze(['Seed', 'Sprout', 'Stems', 'Buds', 'Perennis']), adult: 'Perennis', meaning: 'lasting', hint: 'Double growth when watered on sunny days' }),
  }),
  tangerine: Object.freeze({
    name: '귤나무', price: null, region: 'jeju', rule: 'road', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새싹', '어린 나무', '꽃·풋귤', '인술라리스']),
    adult: Object.freeze({ name: '인술라리스', meaning: '섬의' }),
    hint: '오늘 30km 넘게 달린 날엔 두 배로 자라요',
    en: Object.freeze({ name: 'Tangerine Tree', stages: Object.freeze(['Seed', 'Sprout', 'Sapling', 'Blossoms', 'Insularis']), adult: 'Insularis', meaning: 'of the island', hint: 'Double growth on days you drive over 30 km' }),
  }),
});

export const PLANT_IDS = Object.freeze(Object.keys(PLANTS));
/** 꽃씨로 들일 수 있는 식물 (지역 식물 빼고) */
export const SHOP_PLANT_IDS = Object.freeze(PLANT_IDS.filter((id) => !PLANTS[id].region));
export const FIRST_PLANT = 'monstera';

// 도감: 원산지, 알맞은 온도(°C, 여러 원예 자료에서 겹치는 값), 소개, 단계별 한 줄 설명
const GUIDE = Object.freeze({
  monstera: {
    temp: [18, 27],
    ko: {
      tag: '햇살이 비치면 쑥쑥 자라요',
      origin: '멕시코 · 중앙아메리카',
      about: '멕시코와 중앙아메리카 열대우림에서 온 덩굴 식물이에요. 다 자란 잎에는 창처럼 구멍이 뚫리는데, 큰 잎이 바람에 찢기지 않고 아래 잎까지 빛이 닿게 해 준다고 알려져 있어요.',
      stages: ['흙 속에서 첫 물을 기다려요', '구멍 없는 하트 모양 어린 잎이 나와요', '잎 가장자리가 깃털처럼 갈라지기 시작해요', '잎 안쪽에 창 같은 구멍이 생겨요', '구멍 잎이 가득한 어른 몬스테라예요'],
    },
    en: {
      tag: 'Shoots up when the sun shines',
      origin: 'Mexico · Central America',
      about: 'A climbing plant from the rainforests of Mexico and Central America. Mature leaves get window-like holes, thought to help big leaves survive the wind and let light reach the leaves below.',
      stages: ['Waiting in the soil for its first water', 'Young heart-shaped leaves with no holes yet', 'Leaf edges start to split like feathers', 'Window-like holes open inside the leaves', 'A grown monstera full of holey leaves'],
    },
  },
  cactus: {
    temp: [20, 30],
    ko: {
      tag: '물 두 모금이면 하루가 충분해요',
      origin: '아메리카 대륙의 건조한 땅',
      about: '아메리카 대륙의 건조한 땅에서 자라는 기둥 선인장이에요. 두꺼운 줄기에 물을 저장하고, 가시는 잎이 변한 거예요. 그래서 물은 가끔, 대신 한 번에 듬뿍 마셔요.',
      stages: ['흙 속에서 첫 물을 기다려요', '가시 돋은 동그란 몸이 올라와요', '위로 곧게 자라 기둥이 돼요', '옆으로 첫 팔을 뻗어요', '해를 향해 팔을 벌린 어른 선인장이에요'],
    },
    en: {
      tag: 'Two sips of water make its day',
      origin: 'Dry lands of the Americas',
      about: 'A column cactus from the dry lands of the Americas. Its thick stem stores water, and its spines are leaves that changed shape. So it drinks rarely, but deeply.',
      stages: ['Waiting in the soil for its first water', 'A round, spiny body pops up', 'It grows straight up into a pillar', 'It reaches out its first arm', 'A grown cactus with arms open to the sun'],
    },
  },
  sansevieria: {
    temp: [18, 27],
    ko: {
      tag: '별이 뜨면 기지개를 켜요',
      origin: '서아프리카',
      about: '서아프리카에서 온 식물이에요. 낮엔 숨구멍을 닫아 물을 아끼고, 밤에 이산화탄소를 들이마시는 ‘밤 광합성’을 해요. 그래서 밤에 물을 주면 두 배로 자라요.',
      stages: ['흙 속에서 첫 물을 기다려요', '뾰족한 새순이 고개를 내밀어요', '줄무늬가 선명한 잎이 자라요', '잎이 여럿 모여 다발이 돼요', '밤처럼 짙은 잎이 가득한 어른 산세베리아예요'],
    },
    en: {
      tag: 'Stretches awake when the stars come out',
      origin: 'West Africa',
      about: 'A plant from West Africa. It keeps its pores closed by day to save water and breathes in carbon dioxide at night. That night-time habit is why it grows double when watered at night.',
      stages: ['Waiting in the soil for its first water', 'A pointed shoot peeks out', 'Leaves with bold stripes grow tall', 'Leaves gather into a bundle', 'A grown sansevieria full of night-dark leaves'],
    },
  },
  rubber: {
    temp: [15, 24],
    ko: {
      tag: '멀리 달릴수록 신이 나요',
      origin: '인도 북동부 · 동남아시아',
      about: '인도 북동부와 동남아시아에서 온 나무예요. 줄기에서 고무의 원료가 되는 하얀 수액이 나오고, 자연에서는 30m 넘게 자라기도 해요. 멀리 달릴수록 쑥쑥 자라는 길 떠나는 나무예요.',
      stages: ['흙 속에서 첫 물을 기다려요', '동그란 떡잎 두 장이 나와요', '윤기 나는 잎이 달린 줄기 하나', '줄기가 둘로 늘어나요', '길 떠날 준비를 마친 어른 고무나무예요'],
    },
    en: {
      tag: 'The farther you drive, the happier it gets',
      origin: 'Northeast India · Southeast Asia',
      about: 'A tree from Northeast India and Southeast Asia. Its stem gives a white sap once used for rubber, and in the wild it can grow over 30 m tall. The farther you drive, the faster this traveler grows.',
      stages: ['Waiting in the soil for its first water', 'Two round seed leaves appear', 'One stem with glossy leaves', 'The stem becomes two', 'A grown rubber tree, ready for the road'],
    },
  },
  forsythia: {
    temp: [10, 25],
    ko: {
      tag: '봄볕에 노랗게 깨어나요',
      origin: '한국',
      about: '한국에서만 자라는 키 작은 나무예요. 봄이 오면 잎보다 먼저 노란 꽃이 가지마다 가득 피어나고, 꽃 모양이 종을 닮아 영어로는 골든벨이라고도 불러요. 수도권 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '가는 가지에 연한 새잎이 돋아요', '가지가 여럿으로 갈라져 뻗어요', '가지마다 노란 꽃봉오리가 맺혀요', '가지 가득 노란 꽃이 핀 어른 개나리예요'],
    },
    en: {
      tag: 'Wakes up yellow in the spring sun',
      origin: 'Korea',
      about: 'A small shrub native to Korea. In spring, yellow flowers fill every branch before the leaves come, and their bell shape gives it the name golden bell. This seed came from a Capital Area Supercharger.',
      stages: ['Waiting in the soil for its first water', 'Soft new leaves on a thin twig', 'The twig branches out', 'Yellow buds form on every branch', 'A grown forsythia covered in yellow flowers'],
    },
  },
  azalea: {
    temp: [10, 25],
    ko: {
      tag: '산길을 달릴수록 신이 나요',
      origin: '한국 · 중국 북동부의 산',
      about: '봄이면 산등성이를 연분홍으로 물들이는 키 작은 나무예요. 진달래와 닮았지만 먹을 수 없어 예전엔 ‘개꽃’이라고도 불렀대요. 강원 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '작은 새잎이 돋아요', '잔가지가 여럿으로 퍼져요', '연분홍 꽃봉오리가 맺혀요', '산을 물들이는 어른 철쭉이에요'],
    },
    en: {
      tag: 'Loves a long mountain drive',
      origin: 'Mountains of Korea · Northeast China',
      about: 'A small shrub that paints Korean ridges pale pink in spring. It looks like the edible jindallae azalea but is not edible, so people once called it the false flower. This seed came from a Gangwon Supercharger.',
      stages: ['Waiting in the soil for its first water', 'Small new leaves appear', 'Twigs spread out', 'Pale pink buds form', 'A grown azalea that colors the mountains'],
    },
  },
  magnolia: {
    temp: [10, 25],
    ko: {
      tag: '달빛 아래 하얗게 빛나요',
      origin: '중국',
      about: '이른 봄, 잎보다 먼저 커다란 흰 꽃을 피우는 나무예요. 꽃봉오리 끝이 북쪽을 향한다고 해서 ‘북향화’라는 별명도 있어요. 충청 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '윤기 나는 새잎이 나와요', '가지가 자라 어린 나무가 돼요', '솜털 봉오리에서 첫 꽃이 열려요', '흰 꽃이 가득한 어른 백목련이에요'],
    },
    en: {
      tag: 'Glows white under the moon',
      origin: 'China',
      about: 'A tree that opens big white flowers in early spring, before its leaves. In Korea it is nicknamed the north-facing flower, as its bud tips are said to point north. This seed came from a Chungcheong Supercharger.',
      stages: ['Waiting in the soil for its first water', 'Glossy new leaves come out', 'Branches grow into a sapling', 'The first flower opens from a fuzzy bud', 'A grown magnolia full of white flowers'],
    },
  },
  camellia: {
    temp: [8, 22],
    ko: {
      tag: '물은 아껴 마시고 겨울에 피어요',
      origin: '한국 남해안 · 일본 · 중국',
      about: '겨울부터 이른 봄까지 붉은 꽃을 피우는 늘푸른나무예요. 벌이 드문 추운 계절이라 동박새가 꿀을 먹으며 꽃가루를 옮겨 줘요. 전라 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '작은 새잎이 돋아요', '윤기 나는 짙은 잎이 늘어요', '붉은 꽃봉오리가 맺혀요', '겨울에도 붉게 핀 어른 동백나무예요'],
    },
    en: {
      tag: 'Sips little water and blooms in winter',
      origin: 'Southern coast of Korea · Japan · China',
      about: 'An evergreen that blooms red from winter into early spring. With few bees in the cold, little white-eye birds sip its nectar and carry its pollen. This seed came from a Jeolla Supercharger.',
      stages: ['Waiting in the soil for its first water', 'Small new leaves appear', 'Glossy dark leaves fill in', 'Red buds form', 'A grown camellia blooming red even in winter'],
    },
  },
  zinnia: {
    temp: [18, 30],
    ko: {
      tag: '햇살 아래 오래오래 피어요',
      origin: '멕시코',
      about: '여름부터 가을까지 백 일 가까이 꽃이 핀다고 해서 백일홍이라 불러요. 햇볕과 더위를 좋아하고, 분홍·빨강·주황으로 겹겹이 핀 꽃이 오래가요. 경상 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '떡잎 사이로 새잎이 나와요', '줄기가 여럿으로 자라요', '동그란 꽃봉오리가 맺혀요', '알록달록 꽃이 오래가는 어른 백일홍이에요'],
    },
    en: {
      tag: 'Blooms long under the sun',
      origin: 'Mexico',
      about: 'Its Korean name means a hundred days of red, for flowers that last from summer into fall. It loves sun and heat, and its layered pink, red and orange blooms keep going. This seed came from a Gyeongsang Supercharger.',
      stages: ['Waiting in the soil for its first water', 'New leaves rise between the seed leaves', 'Several stems grow up', 'Round buds form', 'A grown zinnia with long-lasting colorful flowers'],
    },
  },
  tangerine: {
    temp: [15, 28],
    ko: {
      tag: '먼 섬까지 달려 온 나무',
      origin: '중국 남부 · 일본',
      about: '따뜻한 제주 바닷바람 속에서 자라는 귤나무예요. 봄에 하얀 꽃이 향기롭게 피고, 초록 풋귤이 가을·겨울이면 주황빛으로 익어요. 제주 슈퍼차저에서 받은 씨앗이에요.',
      stages: ['흙 속에서 첫 물을 기다려요', '윤기 나는 새잎이 돋아요', '가지가 자라 어린 나무가 돼요', '하얀 꽃과 초록 풋귤이 달려요', '주황 귤이 주렁주렁 열린 어른 귤나무예요'],
    },
    en: {
      tag: 'A tree worth the long trip to the island',
      origin: 'Southern China · Japan',
      about: 'A tangerine tree that grows in Jeju’s warm sea breeze. Fragrant white flowers open in spring, and green fruits ripen to orange by fall and winter. This seed came from a Jeju Supercharger.',
      stages: ['Waiting in the soil for its first water', 'Glossy new leaves appear', 'Branches grow into a sapling', 'White blossoms and green fruits appear', 'A grown tangerine tree heavy with orange fruit'],
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

/** 도감 글: 알맞은 온도 [최저, 최고], 이름 아래 한 줄, 원산지, 소개, 단계별 한 줄 설명 (지금 언어) */
export function guideOf(id) {
  const g = GUIDE[id] || GUIDE[FIRST_PLANT];
  const text = isEn() ? g.en : g.ko;
  return { temp: g.temp, tag: text.tag, origin: text.origin, about: text.about, stages: text.stages };
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
