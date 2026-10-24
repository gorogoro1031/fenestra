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
  // 충전 프렌즈는 충전하는 동안 오래 머문다
  CHARGE_STAY_MS: 20 * 60 * 1000,
});
// 길고양이: 서 있는 채로 이만큼(분) 켜 두면, 여우: 오늘 이만큼(km) 달리면
const PARKED_CAT_MIN = 30;
const FOX_KM = 100;

/**
 * @typedef {{isNight:boolean, raining:boolean, plant:string, stage:number, lab?:boolean, hour?:number, month?:number, parkedMin?:number, todayKm?:number}} GuestContext
 * weight: 지금 상황에서 얼마나 잘 오는지 (0이면 안 옴). lab: 실험판에서만 오는 프렌즈
 *  hour: 0~24 시각, month: 1~12월, parkedMin: 서 있는 채로 앱을 켜 둔 분, todayKm: 오늘 달린 거리
 */
const between = (v, from, to) => Number.isFinite(v) && v >= from && v < to;
export const GUESTS = Object.freeze({
  ladybug: { name: '무당벌레', coins: 3, weight: () => 3 },
  butterfly: { name: '나비', coins: 5, weight: (c) => (!c.isNight && !c.raining ? 2 : 0) },
  bee: { name: '꿀벌', coins: 5, weight: (c) => (c.isNight || c.raining ? 0 : c.plant === 'cactus' && c.stage === 4 ? 4 : 1) },
  firefly: { name: '반딧불', coins: 5, weight: (c) => (c.isNight && !c.raining ? 2 : 0) },
  snail: { name: '달팽이', coins: 8, weight: (c) => (c.raining ? 3 : 0) },
  lizard: { name: '도마뱀', coins: 10, weight: (c) => (c.plant === 'cactus' ? 1 : 0) },
  // 실험판 잎 프렌즈 7종: 흔함(2~3) · 계절(2) · 까다로움(1) · 드묾(0.5)
  sparrow: { name: '참새', coins: 5, lab: true, weight: (c) => (between(c.hour, 6, 9) && !c.raining ? 3 : 0) },
  dragonfly: { name: '잠자리', coins: 5, lab: true, weight: (c) => (between(c.month, 6, 9) && !c.isNight && !c.raining ? 2 : 0) },
  squirrel: { name: '다람쥐', coins: 8, lab: true, weight: (c) => (between(c.month, 9, 12) && !c.isNight ? 2 : 0) },
  cat: { name: '길고양이', coins: 10, lab: true, weight: (c) => ((c.parkedMin ?? 0) >= PARKED_CAT_MIN ? 1 : 0) },
  hedgehog: { name: '고슴도치', coins: 10, lab: true, weight: (c) => (c.isNight && c.plant === 'cactus' ? 1 : 0) },
  owl: { name: '부엉이', coins: 15, lab: true, weight: (c) => (between(c.hour, 0, 4) ? 0.5 : 0) },
  fox: { name: '여우', coins: 15, lab: true, weight: (c) => ((c.todayKm ?? 0) >= FOX_KM ? 0.5 : 0) },
});
export const GUEST_IDS = Object.freeze(Object.keys(GUESTS));
/** 잎을 흔들면 나올 수 있는 프렌즈 (실험판이면 새 잎 프렌즈까지) */
export const leafGuestIds = (lab) => GUEST_IDS.filter((id) => lab || !GUESTS[id].lab);
const GUEST_EN = Object.freeze({
  ladybug: 'Ladybug', butterfly: 'Butterfly', bee: 'Bee', firefly: 'Firefly', snail: 'Snail', lizard: 'Lizard',
  sparrow: 'Sparrow', dragonfly: 'Dragonfly', squirrel: 'Squirrel', cat: 'Street Cat', hedgehog: 'Hedgehog', owl: 'Owl', fox: 'Fox',
});

// 충전 프렌즈(실험판): 슈퍼차저에서 10분 넘게 충전하면 가끔 찾아온다. 잎을 흔들어선 안 나온다
// 흰 고래는 동해 바닷가 여섯 곳, 도시 프렌즈는 그 도시의 아무 슈퍼차저. 만나기 전엔 어디인지 밝히지 않는다
export const EAST_SEA_CHARGERS = Object.freeze([1418, 5053, 7229, 3948, 1396, 5762]);
// 도시: 슈퍼차저 목록의 도시 이름(구 이름 포함)과 지역. 경기 광주처럼 이름이 같은 다른 도시는 지역으로 가른다
export const CITIES = Object.freeze({
  seoul: { names: ['서울', '송파', '강남', '강서'], region: 'capital' },
  busan: { names: ['부산'], region: 'gyeong' },
  incheon: { names: ['인천', '강화'], region: 'capital' },
  daegu: { names: ['대구', '수성'], region: 'gyeong' },
  daejeon: { names: ['대전'], region: 'chung' },
  gwangju: { names: ['서구', '광산'], region: 'jeolla' },
});
export const CHARGE_FRIENDS = Object.freeze({
  beluga: { ko: '흰 고래', en: 'Beluga', coins: 30, chance: 1 / 4 },
  mallard: { ko: '청둥오리', en: 'Mallard', coins: 15, chance: 1 / 2, city: 'seoul' },
  gull: { ko: '갈매기', en: 'Gull', coins: 15, chance: 1 / 2, city: 'busan' },
  crane: { ko: '두루미', en: 'Red-crowned Crane', coins: 15, chance: 1 / 2, city: 'incheon' },
  // 매미는 여름(6~8월)에만
  cicada: { ko: '매미', en: 'Cicada', coins: 15, chance: 1 / 2, city: 'daegu', months: [6, 7, 8] },
  raccoon: { ko: '빵 굽는 너구리', en: 'Baker Raccoon Dog', coins: 15, chance: 1 / 2, city: 'daejeon' },
  moth: { ko: '빛 나방', en: 'Light Moth', coins: 15, chance: 1 / 2, city: 'gwangju' },
});
export const CHARGE_FRIEND_IDS = Object.freeze(Object.keys(CHARGE_FRIENDS));
export const isChargeFriend = (id) => Object.hasOwn(CHARGE_FRIENDS, id);

/** 이 슈퍼차저가 있는 큰 도시 (없으면 null) @param {{ko:string, region:string}} charger */
export const cityOf = (charger) => Object.keys(CITIES).find((c) => CITIES[c].region === charger?.region && CITIES[c].names.includes(charger.ko)) ?? null;

/**
 * 이 슈퍼차저에서 충전할 때 올 수 있는 프렌즈와 확률 (없으면 null)
 * @param {{id:number, ko:string, region:string}} charger
 * @param {number} month 1~12
 */
export function chargeFriendAt(charger, month) {
  if (!charger) return null;
  if (EAST_SEA_CHARGERS.includes(charger.id)) return 'beluga';
  const city = cityOf(charger);
  const id = CHARGE_FRIEND_IDS.find((f) => CHARGE_FRIENDS[f].city === city && city);
  if (!id) return null;
  const { months } = CHARGE_FRIENDS[id];
  return !months || months.includes(month) ? id : null;
}

/** 충전 한 번에 한 번만 굴린다: 올 프렌즈가 있고 확률에 걸리면 그 id, 아니면 null */
export function rollChargeFriend(charger, month, random = Math.random) {
  const id = chargeFriendAt(charger, month);
  return id && random() < CHARGE_FRIENDS[id].chance ? id : null;
}
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
/** 도감에 보일 프렌즈: 잎 프렌즈, 실험판이면 새 잎 프렌즈·충전 프렌즈·지역 주민까지 */
export const friendIds = (lab) => (lab ? [...GUEST_IDS, ...CHARGE_FRIEND_IDS, ...RESIDENT_IDS] : leafGuestIds(false));
/** 만나면 받는 꽃씨 (지역 주민은 0) */
export const friendCoins = (id) => GUESTS[id]?.coins ?? CHARGE_FRIENDS[id]?.coins ?? 0;
/** 도감에 쌓일 수 있는 모든 프렌즈 */
export const ALL_FRIEND_IDS = Object.freeze([...GUEST_IDS, ...CHARGE_FRIEND_IDS, ...RESIDENT_IDS]);

/** 지금 언어의 프렌즈 이름 */
export const guestName = (id) => {
  if (isResident(id)) return getLang() === 'en' ? RESIDENTS[id].en : RESIDENTS[id].ko;
  if (isChargeFriend(id)) return getLang() === 'en' ? CHARGE_FRIENDS[id].en : CHARGE_FRIENDS[id].ko;
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
  sparrow: {
    ko: { tag: '아침 일찍 짹짹 인사하러 와요', about: '사람 사는 곳 가까이에서 지내는 작은 새예요. 해가 뜨고 얼마 안 된 아침에 가장 부지런히 돌아다녀요.', when: '아침 6~9시' },
    en: { tag: 'Chirps hello early in the morning', about: 'A little bird that lives close to people. It is busiest in the first hours after sunrise.', when: '6–9 a.m.' },
  },
  dragonfly: {
    ko: { tag: '여름 햇살 속을 맴돌아요', about: '커다란 눈으로 사방을 보며 날아다니는 곤충이에요. 날개를 앞뒤로 따로 움직여서 공중에 멈춰 있을 수도 있어요.', when: '여름 맑은 낮' },
    en: { tag: 'Hovers in the summer sun', about: 'An insect that sees in every direction with its huge eyes. It moves each pair of wings separately, so it can even hover in place.', when: 'Clear summer days' },
  },
  squirrel: {
    ko: { tag: '가을이면 도토리를 모으러 와요', about: '겨울을 나려고 가을 내내 도토리와 열매를 모아 숨겨 두는 친구예요. 숨긴 곳을 잊어버린 도토리는 나무로 자라기도 해요.', when: '가을 9~11월' },
    en: { tag: 'Comes gathering acorns in autumn', about: 'It spends autumn hiding acorns and nuts for winter. The acorns it forgets sometimes grow into trees.', when: 'Autumn, Sep–Nov' },
  },
  cat: {
    ko: { tag: '조용히 서 있는 차를 좋아해요', about: '동네를 느긋하게 돌아다니는 고양이예요. 오래 서 있는 차 곁이 따뜻하고 조용해서 슬쩍 다가와요.', when: '주차한 채로 30분 넘게' },
    en: { tag: 'Likes a quietly parked car', about: 'A cat that strolls around the neighborhood. A car that has been parked a while is warm and quiet, so it wanders over.', when: 'Parked for over 30 minutes' },
  },
  hedgehog: {
    ko: { tag: '밤에 선인장 곁으로 와요', about: '밤에 움직이는 작은 동물이에요. 등의 가시가 선인장과 닮아서인지 밤마다 선인장 곁을 기웃거려요.', when: '선인장을 키우는 밤' },
    en: { tag: 'Visits the cactus at night', about: 'A small animal that comes out at night. Maybe because its spines look like a cactus, it pokes around the cactus after dark.', when: 'Nights while growing a cactus' },
  },
  owl: {
    ko: { tag: '깊은 밤에만 눈을 떠요', about: '모두 잠든 깊은 밤에 조용히 날아다니는 새예요. 깃털이 부드러워서 날갯짓 소리가 거의 나지 않아요.', when: '자정~새벽 4시' },
    en: { tag: 'Only opens its eyes deep in the night', about: 'A bird that flies silently while everyone sleeps. Its soft feathers make almost no sound as it flaps.', when: 'Midnight–4 a.m.' },
  },
  fox: {
    ko: { tag: '먼 길을 달린 날 마중 나와요', about: '넓은 땅을 누비며 사는 동물이에요. 오늘 멀리 달려 온 차의 냄새를 맡고 꼬리를 흔들며 나타나요.', when: '하루 100km 넘게 달린 날' },
    en: { tag: 'Greets you after a long drive', about: 'An animal that roams far and wide. It catches the scent of a car that has come a long way and turns up wagging its tail.', when: 'Days over 100 km' },
  },
});

// 충전 프렌즈 도감 글. 언제 오는지는 장소를 숨긴 채 알려 준다
const CITY_WHEN = { ko: '큰 도시에서 충전하면 만나요', en: 'Charge in a big city to meet it' };
const CHARGE_INFO = Object.freeze({
  beluga: {
    ko: { tag: '동해 바다에서 온 전설의 친구', about: '온몸이 하얀 고래예요. 둥근 이마로 소리를 모아 바닷속을 살피고, 웃는 것 같은 얼굴로 유명해요. 여러 번 찾아가야 겨우 만날 수 있어요.', when: '동해 바다에서 충전하면 가끔 나타나요' },
    en: { tag: 'A legendary friend from the East Sea', about: 'A whale that is white all over. It listens to the sea with its round forehead and is famous for its smiling face. It usually takes several visits to meet it.', when: 'Sometimes appears when you charge by the East Sea' },
  },
  mallard: {
    ko: { tag: '한강에서 헤엄치는 서울 친구', about: '초록 머리가 반짝이는 오리예요. 서울 한강 둔치에서 겨울을 나는 모습을 자주 볼 수 있어요.', when: CITY_WHEN.ko },
    en: { tag: 'A Seoul local who swims the Han River', about: 'A duck with a shining green head. You can often see it spending the winter along the banks of the Han River in Seoul.', when: CITY_WHEN.en },
  },
  gull: {
    ko: { tag: '부산 바다의 갈매기', about: '부산을 대표하는 새예요. 바닷바람을 타고 항구와 해변 위를 날아다녀요.', when: CITY_WHEN.ko },
    en: { tag: 'The seagull of Busan’s sea', about: 'The bird of Busan. It rides the sea breeze over the harbors and beaches.', when: CITY_WHEN.en },
  },
  crane: {
    ko: { tag: '인천 갯벌의 우아한 두루미', about: '머리 꼭대기가 빨간 하얀 새예요. 인천을 대표하는 새로, 겨울이면 갯벌과 논에 찾아와요.', when: CITY_WHEN.ko },
    en: { tag: 'An elegant crane from Incheon’s tidal flats', about: 'A white bird with a red crown. It is the bird of Incheon and visits the tidal flats and fields in winter.', when: CITY_WHEN.en },
  },
  cicada: {
    ko: { tag: '대구의 뜨거운 여름을 노래해요', about: '여름 내내 나무에 붙어 크게 우는 곤충이에요. 더운 날일수록 더 힘차게 울어요. 여름에만 만날 수 있어요.', when: CITY_WHEN.ko },
    en: { tag: 'Sings through Daegu’s hot summers', about: 'An insect that clings to trees and sings loudly all summer. The hotter the day, the louder it sings. You can only meet it in summer.', when: CITY_WHEN.en },
  },
  raccoon: {
    ko: { tag: '빵 냄새를 따라 온 대전 친구', about: '갓 구운 빵을 품에 안고 다니는 너구리예요. 빵이 맛있기로 이름난 대전에서 왔어요.', when: CITY_WHEN.ko },
    en: { tag: 'A Daejeon friend who follows the smell of bread', about: 'A raccoon dog that carries freshly baked bread. It comes from Daejeon, a city known for its bakeries.', when: CITY_WHEN.en },
  },
  moth: {
    ko: { tag: '빛고을 광주에서 날아왔어요', about: '은은하게 빛나는 나방이에요. ‘빛고을’이라 불리는 광주의 불빛을 닮았어요.', when: CITY_WHEN.ko },
    en: { tag: 'Flew in from Gwangju, the City of Light', about: 'A softly glowing moth. It takes after the lights of Gwangju, known as Bitgoeul, the City of Light.', when: CITY_WHEN.en },
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
export const guestInfo = (id) => (GUEST_INFO[id] ?? CHARGE_INFO[id] ?? RESIDENT_INFO[id])?.[getLang() === 'en' ? 'en' : 'ko'] ?? GUEST_INFO.ladybug.ko;

/** @param {GuestContext} ctx */
export function guestWeights(ctx) {
  return Object.fromEntries(leafGuestIds(ctx.lab).map((id) => [id, GUESTS[id].weight(ctx)]));
}

/** 지금 상황에 맞춰 손님 하나를 고른다 */
export function pickGuest(ctx, random = Math.random) {
  const weights = guestWeights(ctx);
  const ids = Object.keys(weights);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = random() * total;
  return ids.find((id) => (roll -= weights[id]) < 0) ?? 'ladybug';
}

/**
 * 잎을 흔든 이번에 손님이 나오는지. 운전 중이거나 이미 손님이 있거나 쉬는 시간이면 안 나온다
 * @param {{now:number, lastAt:number, present:boolean, driving:boolean}} at
 */
export function shouldSpawn({ now, lastAt, present, driving }, random = Math.random) {
  if (driving || present || now - lastAt < GUEST_RULES.COOLDOWN_MS) return false;
  return random() < GUEST_RULES.SPAWN_CHANCE;
}
