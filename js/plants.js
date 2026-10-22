// 식물 종류. 종마다 값(꽃씨), 자라는 데 필요한 점수, 잘 자라는 조건, 단계 이름이 다르다.
// 다 자라면 라틴어 이름을 얻는다(앱 이름 Fenestra도 라틴어 '창'). 뜻은 잘 자라는 조건과 이어진다
/**
 * @typedef {'sun'|'dry'|'night'|'road'} Rule
 *  sun: 햇빛이 있을 때 물을 주면 두 배 (햇빛을 쓴다)
 *  dry: 물은 하루 두 번까지만, 대신 한 번에 두 배
 *  night: 달이 떠 있는 밤에 주면 두 배
 *  road: 오늘 많이 달린 날엔 두 배
 */
export const PLANTS = Object.freeze({
  monstera: Object.freeze({
    name: '몬스테라', price: 0, rule: 'sun', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '하트 잎', '첫 갈래', '구멍 잎', '페네스트라']),
    adult: Object.freeze({ name: '페네스트라', meaning: '창' }),
    hint: '햇빛이 있을 때 물을 주면 두 배로 자라요',
  }),
  cactus: Object.freeze({
    name: '선인장', price: 120, rule: 'dry', thresholds: Object.freeze([0, 2, 8, 16, 28]),
    stages: Object.freeze(['씨앗', '꼬마 공', '기둥', '첫 팔', '솔라리스']),
    adult: Object.freeze({ name: '솔라리스', meaning: '해의' }),
    hint: '물은 하루 두 번이면 충분해요. 대신 한 번에 두 배',
  }),
  sansevieria: Object.freeze({
    name: '산세베리아', price: 200, rule: 'night', thresholds: Object.freeze([0, 2, 8, 18, 32]),
    stages: Object.freeze(['씨앗', '새순', '줄무늬 잎', '잎 다발', '녹투르나']),
    adult: Object.freeze({ name: '녹투르나', meaning: '밤의' }),
    hint: '달이 떠 있는 밤에 물을 주면 두 배로 자라요',
  }),
  rubber: Object.freeze({
    name: '고무나무', price: 300, rule: 'road', thresholds: Object.freeze([0, 2, 10, 22, 38]),
    stages: Object.freeze(['씨앗', '떡잎', '한 줄기', '두 줄기', '비아토르']),
    adult: Object.freeze({ name: '비아토르', meaning: '길 떠나는 사람' }),
    hint: '오늘 30km 넘게 달린 날엔 두 배로 자라요',
  }),
});

export const PLANT_IDS = Object.freeze(Object.keys(PLANTS));
export const FIRST_PLANT = 'monstera';

/** 다 자란 이름과 라틴어 뜻 */
export const adultOf = (id) => ({ ...(PLANTS[id] || PLANTS[FIRST_PLANT]).adult });

/** 식물·단계에 맞는 이름. 모르는 식물은 몬스테라, 넘치는 단계는 마지막 이름 */
export function stageName(id, stage) {
  const { stages } = PLANTS[id] || PLANTS[FIRST_PLANT];
  return stages[Math.min(stages.length - 1, Math.max(0, stage))];
}

/** 단계별 그림. 씨앗(0단계)은 모든 종이 같은 그림을 쓴다 */
export const plantImage = (id, stage) => (stage === 0 ? 'assets/plants/seed.webp' : `assets/plants/${id}-${stage}.webp`);
