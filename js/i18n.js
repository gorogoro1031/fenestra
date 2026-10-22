// 언어: 한국어(기본)와 영어. 코드의 화면 글자는 t(키)로 고르고, index.html의 고정 글자는 data-i18n 키로 바꾼다.
// 고정 글자의 한국어는 HTML에 쓰인 그대로를 쓰고, 영어만 STATIC_EN에 둔다
import { withJosa } from './text.js';

export const LANGS = Object.freeze(['ko', 'en']);
let lang = 'ko';
export const getLang = () => lang;
export const setLang = (next) => { lang = LANGS.includes(next) ? next : 'ko'; };
/** 시각·날짜 표기용 */
export const locale = () => (lang === 'en' ? 'en-US' : 'ko-KR');
/** 데이터에 한·영 값이 나란히 있을 때 지금 언어 쪽 */
export const pick = (ko, en) => (lang === 'en' && en !== undefined ? en : ko);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const KO = {
  'loc.denied': '위치 권한이 꺼져 있어요',
  'loc.noGeo': '이 브라우저는 위치를 쓸 수 없어요',
  'loc.noPosition': '위치를 찾지 못했어요',
  'weather.fetch': '날씨를 받아 오지 못했어요',
  'weather.stale': '날씨가 오래됐어요',
  'weather.loading': '날씨 확인 중',
  'weather.unknown': '날씨 모름',
  'weather.status.fixed': ({ label }) => `확인용으로 ${label} 고정`,
  'weather.status.loading': '실제 날씨를 확인하는 중',
  'weather.status.ok': ({ label, ago }) => `실제 날씨 ${label} · ${ago} 확인`,
  'time.justNow': '방금',
  'time.minAgo': ({ n }) => `${n}분 전`,

  'save.on': '켜짐',
  'save.blocked': '저장이 막혀 있어요',
  'save.chip': '저장됨',
  'save.chipFail': '저장 안 됨',

  'toast.plantImgFail': '식물 그림을 불러오지 못했어요 · 연결을 확인해 주세요',
  'toast.guestFirst': ({ name }) => `처음 만난 ${name} · 온실 도감에 적었어요`,
  'toast.guestAgain': ({ name }) => `${withJosa(name, '을', '를')} 만났어요`,
  'toast.guestCap': '오늘 손님 꽃씨는 다 받았어요',
  'toast.coins': ({ n }) => `꽃씨 +${n}`,
  'toast.light': ({ n }) => `햇빛 +${n}`,
  'toast.grown': ({ plant, adult, meaning, reward }) => `${withJosa(plant, '이', '가')} ${withJosa(adult, '이', '가')} 됐어요 · 라틴어로 ‘${meaning}’ · 꽃씨 +${reward}`,
  'toast.grew': ({ stage }) => `한 뼘 자랐어요 · ${stage}`,
  'toast.grewPlain': '한 뼘 자랐어요',
  'toast.double': ({ n }) => `두 배로 +${n}`,
  'toast.recheck': ({ error }) => `${error} · 다시 확인할게요`,
  'toast.photoRule': ({ clear, partly }) => `맑은 낮엔 1분에 햇빛 ${clear}, 구름 조금이면 ${partly} · 흐리거나 비 오면 쉬어요`,
  'toast.bought': ({ plant }) => `${withJosa(plant, '을', '를')} 들였어요`,
  'toast.selected': ({ plant }) => `${withJosa(plant, '을', '를')} 키워요`,
  'toast.demoKm': '30km 달렸어요 · 이슬 +3 · 꽃씨 +30',

  'stage.grownSub': '다 자랐어요. 온실에서 새 식물을 들여요',
  'stage.toNext': ({ n }) => `다음 단계까지 ${n}점`,
  latin: ({ meaning }) => `라틴어로 ‘${meaning}’`,
  'greenhouse.label': '온실',
  'greenhouse.labelNew': '온실 · 새 손님',

  'photo.loading': '날씨 확인 중',
  'photo.unknown': '날씨 모름',
  'photo.night': '밤엔 쉬어요',
  'photo.weather': ({ label }) => `${label} · 쉬어요`,
  'photo.full': '햇빛 가득',
  'photo.rate': ({ label, rate }) => `${label} · 1분에 ${rate}`,

  'water.driving': '차를 세우면 줄 수 있어요',
  'water.grown': '다 자랐어요',
  'water.noDrops': ({ km }) => `다음 이슬까지 ${km}km`,
  'water.dryLimit': '오늘은 충분해요',
  'water.firstSprout': ({ n }) => `새싹까지 물 ${n}번`,
  'water.one': '이슬 1개',
  'water.bonus.sun': '햇빛과 함께 ×2',
  'water.bonus.dry': '한 번에 ×2',
  'water.bonus.night': '밤이라 ×2',
  'water.bonus.road': '많이 달린 날 ×2',

  'trip.when': ({ time }) => `이번 주행 · ${time} 도착`,
  'trip.grown': ({ plant }) => `${plant} 다 자랐어요 · 온실에서 새 식물을 들여요`,
  'trip.next': ({ plant, stage, n }) => `${plant} ‘${stage}’까지 ${n}점`,
  'trip.dropFull': '이슬 가득',
  'trip.nextDrop': ({ km }) => `다음 이슬까지 ${km}km`,

  'gh.growing': '키우는 중',
  'gh.grownDone': '다 키웠어요',
  'gh.grow': '이 식물 키우기',
  'gh.grownView': '다 키움 · 보기',
  'gh.buy': ({ n }) => `꽃씨 ${n}개로 들이기`,
  'gh.meaning': ({ plant, meaning }) => `${plant} · 라틴어로 ‘${meaning}’`,
  'gb.met': ({ n }) => `${n}번 만남`,
  'gb.reward': ({ n }) => `꽃씨 +${n}`,
  'guest.meet': ({ name }) => `${name} 만나기`,

  'album.qrLabel': ({ app }) => `${app}에서 여는 QR 코드`,
  'album.cardLabel': ({ title, artist }) => `오늘의 앨범 ${title}, ${artist}`,
  'album.date': ({ m, d }) => `${m}월 ${d}일 · 오늘의 앨범`,
  'album.track': ({ track }) => `추천 곡 ${track}`,
  'app.opens.album': '앨범이 바로 열려요',
  'app.opens.search': '검색 결과 맨 위에 있어요',

  'tour.next': '다음',
  'tour.start': '시작하기',
  'tour.1.title': '달릴수록 자라는 몬스테라',
  'tour.1.body': '페네스트라는 차 안에서 키우는 몬스테라예요. 달린 만큼 물을 주면 씨앗부터 다 자랄 때까지 네 번 자라요.',
  'tour.2.title': '달리면 이슬이 모여요',
  'tour.2.body': '10km를 달릴 때마다 이슬 한 방울. 차를 세우고 ‘물 주기’를 누르면 식물이 자라요. 처음엔 이슬 2개를 선물로 드려요. 실제 주행으로 모으려면 설정에서 켜 주세요.',
  'tour.3.title': '맑은 낮엔 광합성',
  'tour.3.body': '화면을 열어 두면 실제 날씨가 맑은 낮에 햇빛이 저절로 차올라요. 1분에 2, 구름이 조금 끼면 1. 흐리거나 비 오는 날과 밤엔 쉬어요. 몬스테라는 햇빛이 있을 때 물을 주면 두 배로 자라요. 날씨를 알려고 대략의 위치를 물어봐요.',
  'tour.4.title': '꽃씨로 새 식물을',
  'tour.4.body': '1km 달릴 때마다 꽃씨 1개, 식물을 다 키우면 50개를 더 받아요. 온실에서 선인장·산세베리아·고무나무를 들일 수 있어요. 식물마다 잘 자라는 조건이 달라요.',
  'tour.5.title': '운전 중엔 보기만',
  'tour.5.body': '차가 움직이면 돌보기 버튼이 잠겨요. 운전자는 화면 대신 길을 봐 주세요. 옆자리라면 잎을 톡 건드려 보세요. 높은 잎일수록 높은 음이 나고, 가끔 숨어 있던 손님이 나와요.',
};

const EN = {
  'loc.denied': 'Location is off',
  'loc.noGeo': "This browser can't use location",
  'loc.noPosition': "Couldn't find your location",
  'weather.fetch': "Couldn't get the weather",
  'weather.stale': 'Weather is out of date',
  'weather.loading': 'Checking…',
  'weather.unknown': 'No weather',
  'weather.status.fixed': ({ label }) => `Pinned to ${label} for testing`,
  'weather.status.loading': 'Checking live weather',
  'weather.status.ok': ({ label, ago }) => `Live: ${label} · checked ${ago}`,
  'time.justNow': 'just now',
  'time.minAgo': ({ n }) => `${n} min ago`,

  'save.on': 'On',
  'save.blocked': 'Saving is blocked',
  'save.chip': 'Saved',
  'save.chipFail': 'Not saved',

  'toast.plantImgFail': "Couldn't load the plant · Check your connection",
  'toast.guestFirst': ({ name }) => `First visit: ${name} · Added to the Visitor Log`,
  'toast.guestAgain': ({ name }) => `${name} visited`,
  'toast.guestCap': 'No more visitor pips today',
  'toast.coins': ({ n }) => `Pips +${n}`,
  'toast.light': ({ n }) => `Sunlight +${n}`,
  'toast.grown': ({ plant, adult, meaning, reward }) => `Your ${plant} became ${adult} · Latin for ‘${meaning}’ · Pips +${reward}`,
  'toast.grew': ({ stage }) => `It grew · ${stage}`,
  'toast.grewPlain': 'It grew',
  'toast.double': ({ n }) => `Double +${n}`,
  'toast.recheck': ({ error }) => `${error} · Checking again`,
  'toast.photoRule': ({ clear, partly }) => `Clear days give ${clear} sunlight/min, partly cloudy ${partly} · Rests when cloudy or wet`,
  'toast.bought': ({ plant }) => `${plant} joined your greenhouse`,
  'toast.selected': ({ plant }) => `Now growing: ${plant}`,
  'toast.demoKm': 'Drove 30 km · Dew +3 · Pips +30',

  'stage.grownSub': 'Fully grown. Get a new plant in the Greenhouse',
  'stage.toNext': ({ n }) => `${n} pts to next stage`,
  latin: ({ meaning }) => `Latin for ‘${meaning}’`,
  'greenhouse.label': 'Greenhouse',
  'greenhouse.labelNew': 'Greenhouse · new visitor',

  'photo.loading': 'Checking…',
  'photo.unknown': 'No weather',
  'photo.night': 'Resting at night',
  'photo.weather': ({ label }) => `${label} · resting`,
  'photo.full': 'Sunlight full',
  'photo.rate': ({ label, rate }) => `${label} · ${rate}/min`,

  'water.driving': 'Park to water',
  'water.grown': 'Fully grown',
  'water.noDrops': ({ km }) => `Dew in ${km} km`,
  'water.dryLimit': 'Done for today',
  'water.firstSprout': ({ n }) => `Sprout in ${n}`,
  'water.one': '1 dew',
  'water.bonus.sun': '×2 with sunlight',
  'water.bonus.dry': '×2 each time',
  'water.bonus.night': '×2 at night',
  'water.bonus.road': '×2 after 30 km',

  'trip.when': ({ time }) => `This drive · Arrived ${time}`,
  'trip.grown': ({ plant }) => `${plant} is fully grown · Get a new plant`,
  'trip.next': ({ plant, stage, n }) => `${plant}: ${n} pts to ‘${stage}’`,
  'trip.dropFull': 'Dew full',
  'trip.nextDrop': ({ km }) => `${km} km to next dew`,

  'gh.growing': 'Growing',
  'gh.grownDone': 'Fully grown',
  'gh.grow': 'Grow this',
  'gh.grownView': 'Grown · View',
  'gh.buy': ({ n }) => `Get for ${n} pips`,
  'gh.meaning': ({ plant, meaning }) => `${plant} · Latin for ‘${meaning}’`,
  'gb.met': ({ n }) => `Met ${n} ${n === 1 ? 'time' : 'times'}`,
  'gb.reward': ({ n }) => `Pips +${n}`,
  'guest.meet': ({ name }) => `Meet the ${name.toLowerCase()}`,

  'album.qrLabel': ({ app }) => `QR code to open in ${app}`,
  'album.cardLabel': ({ title, artist }) => `Today's Album: ${title}, ${artist}`,
  'album.date': ({ m, d }) => `${MONTHS[m - 1]} ${d} · Today's Album`,
  'album.track': ({ track }) => `Pick: ${track}`,
  'app.opens.album': 'Opens the album',
  'app.opens.search': 'Top of the search results',

  'tour.next': 'Next',
  'tour.start': "Let's go",
  'tour.1.title': 'A monstera that grows as you drive',
  'tour.1.body': 'Fenestra is a monstera you raise in your car. Water it with every kilometer you drive, and it grows four times from seed to full size.',
  'tour.2.title': 'Driving collects dew',
  'tour.2.body': 'One drop of dew every 10 km. Park and tap ‘Water’ to help it grow. You start with 2 dew as a gift. Turn on real driving in Settings to collect it.',
  'tour.3.title': 'Basking on clear days',
  'tour.3.body': 'Keep the screen open and sunlight fills up on clear days: 2 a minute, 1 when partly cloudy. It rests on cloudy or rainy days and at night. Monstera grows double when watered with sunlight. We ask for your approximate location to check the weather.',
  'tour.4.title': 'New plants with pips',
  'tour.4.body': 'Earn 1 pip per km, plus 50 when a plant is fully grown. Get a cactus, sansevieria or rubber plant in the Greenhouse. Each one thrives in its own way.',
  'tour.5.title': 'Look only while driving',
  'tour.5.body': 'Care buttons lock while the car moves. Drivers, eyes on the road. Passengers, tap a leaf: higher leaves play higher notes, and sometimes a hidden visitor appears.',
};

// index.html 고정 글자의 영어 (data-i18n 키). 한국어는 HTML에 쓰인 그대로
const STATIC_EN = {
  today: 'Today',
  pips: 'Pips',
  driver: 'Driver',
  passenger: 'Passenger',
  settings: 'Settings',
  menu: 'Menu',
  handLabel: 'Button side',
  drivingBanner: 'Look only while driving · Care is back when you park',
  widgetsLabel: 'Plant status and care',
  todaysAlbum: "Today's Album",
  dew: 'Dew',
  firstGift: 'First gift',
  sunlight: 'Sunlight',
  water: 'Water',
  basking: 'Basking',
  greenhouse: 'Greenhouse',
  done: 'Done',
  ghPips: '',
  pipsUnit: ' pips',
  pipsRule: '· 1 per km · +50 when fully grown',
  visitorLog: 'Visitor Log',
  totalKm: 'Total distance',
  waterings: 'Waterings',
  waterUnit: '',
  plantsGrown: 'Plants grown',
  grownUnit: '',
  thisDrive: 'This drive',
  goWater: 'Go water',
  close: 'Close',
  qrLabel: 'QR code to open in your music app',
  scanToListen: 'Scan with your phone to listen',
  musicApp: 'Music app',
  carSearch: 'To play in the car, search Apple Music for',
  general: 'General',
  calmSound: 'Calm sounds',
  calmSoundSub: 'Ambient music, wind and rain · Starts on first touch',
  autoSave: 'Auto-save',
  autoSaveSub: 'Saved on this device after every change · Picks up even if the browser closes',
  gps: 'Collect dew by driving',
  gpsSub: 'Needs location · Only while this screen is open',
  replayTour: 'Replay the intro',
  display: 'Display',
  color: 'Color',
  colorSub: 'Dark is black · Vivid gives each plant its own color, deeper at night',
  dark: 'Dark',
  vivid: 'Vivid',
  dayNight: 'Day & night',
  dayNightSub: 'Auto follows the real clock · Day/Night pin it to noon/midnight',
  auto: 'Auto',
  day: 'Day',
  night: 'Night',
  weather: 'Weather',
  weatherSub: '· Needs approximate location · Weather by Open-Meteo',
  live: 'Live',
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  demo: 'Demo',
  jumpStage: 'Jump to stage',
  jumpStageSub: 'Tap a stage',
  musicTest: 'Test Apple Music link (in car)',
  demoKm: 'Pretend 30 km',
  demoCoins: 'Pips +100',
  demoGuest: 'Call a visitor',
  demoPhoto: 'Pretend 10 min of sun',
  demoDrive: 'Preview driving mode',
  demoTrip: 'Preview drive summary',
  demoReset: 'Start over',
  skip: 'Skip',
  back: 'Back',
  next: 'Next',
  bootTitle: "Couldn't load the app",
  reload: 'Reload',
};

const DICT = { ko: KO, en: EN };
export const DICT_KEYS = Object.freeze({ ko: Object.keys(KO), en: Object.keys(EN), staticEn: Object.keys(STATIC_EN) });

/** 지금 언어의 글자. 함수면 vars를 넣어 부른다. 없는 키는 한국어, 그래도 없으면 키 그대로 */
export function t(key, vars = {}) {
  const value = DICT[lang][key] ?? KO[key];
  if (value === undefined) return key;
  return typeof value === 'function' ? value(vars) : value;
}

/** index.html의 data-i18n(글자)·data-i18n-label(읽어 주기 이름)을 지금 언어로 바꾼다 */
export function applyStatic(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el.dataset.ko === undefined) el.dataset.ko = el.textContent;
    el.textContent = lang === 'en' ? (STATIC_EN[el.dataset.i18n] ?? el.dataset.ko) : el.dataset.ko;
  });
  root.querySelectorAll('[data-i18n-label]').forEach((el) => {
    if (el.dataset.koLabel === undefined) el.dataset.koLabel = el.getAttribute('aria-label') || '';
    el.setAttribute('aria-label', lang === 'en' ? (STATIC_EN[el.dataset.i18nLabel] ?? el.dataset.koLabel) : el.dataset.koLabel);
  });
}
