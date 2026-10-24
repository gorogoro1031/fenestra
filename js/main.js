import { RULES, createState, sanitize, rollDay, addDistance, markGuestsSeen, water, waterCheck, fertilize, stageOf, buyPlant, selectPlant, catchGuest, grantRegionalSeeds, toggleCompanion, recordTrip } from './state.js';
import { PLANTS, stageName, adultOf, plantName } from './plants.js';
import { loadState, saveState, loadPrefs, savePrefs, clearAll } from './storage.js';
import { plantLayout, createArcs, createFx } from './scene.js';
import { createPlant } from './plant.js';
import { createSky, orbPosition, sunTimes } from './sky.js';
import { renderStatus, renderGreenhouse, renderGuestbook, renderGuest, renderChip, renderTrip, renderWeatherNow, renderGuide, renderGreeting, toast } from './ui.js';
import { renderDewSheet, renderCondSheet } from './detail-ui.js';
import { setAmbient, drip, chime, unlock, rustle, leafTouch, greetSwell } from './sound.js';
import { watchDriving } from './drive.js';
import { createTutorial } from './tutorial.js';
import { renderAlbum } from './album-card.js';
import { pickGuest, shouldSpawn, guestName, guestImage, rollChargeFriend, CHARGE_FRIEND_IDS, GUEST_RULES } from './guests.js';
import { createGuestVisit } from './guest-visit.js';
import { t, setLang, applyStatic, getLang, locale, pick } from './i18n.js';
import { watchWeather, skyInfo, SKY_KINDS } from './weather.js';
import { startTrip, addToTrip, markMoving, tripEnded, worthShowing } from './trip.js';
import { greetingPeriod, cleanName } from './text.js';
import { CHARGE_RULES, chargerNear, chargerById, updateSession, settleCharge, regionById, isCharging } from './charge.js';
import { renderCharge, chargerPlace } from './charge-ui.js';
import { renderCompanionPanel } from './companion-ui.js';
import { renderMap, defaultCharger } from './map-ui.js';

// 인트로: 로고 모션 시간(끝나면 '탭하여 계속하기'), 탭한 뒤 인사가 떠 있는 시간, 그 뒤 식물이 자라 오르는 동안 막이 걷힌다
const LOGO_MS = 2600;
// 인사 단계: 로고가 사라지는 시간(css --greet-delay 0.65초) + 인사가 떠 있는 시간
const GREET_MS = 2500;
const OPENING_FADE_MS = 1000;
// 식물 그림이 늦어도 인트로는 이 시간 뒤엔 넘어간다 (그림은 오는 대로 나타난다)
const PLANT_WAIT_MS = 4000;
const DRIVING_SPEED_KMH = 5;
const DRIVING_HOLD_MS = 15000;
const DEMO_DRIVE_MS = 8000;

const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
// 확인용 주소 옵션: ?scene=day|night 로 정오·자정 고정, ?hour=0~24 로 시각 고정, ?weather=clear|partly|cloudy|fog|rain|snow 로 날씨 고정(위치를 묻지 않음),
// ?temp=22 로 기온 고정, ?noloading 으로 로딩 건너뛰기 (저장하지 않음)
const query = new URLSearchParams(location.search);
const SCENE_OVERRIDE = ['day', 'night'].includes(query.get('scene')) ? query.get('scene') : null;
const WEATHER_OVERRIDE = SKY_KINDS.includes(query.get('weather')) ? query.get('weather') : null;
const TEMP_OVERRIDE = query.has('temp') && Number.isFinite(Number(query.get('temp'))) ? Number(query.get('temp')) : null;
const HOUR_OVERRIDE = query.has('hour') && Number.isFinite(Number(query.get('hour'))) ? Number(query.get('hour')) : null;
// ?speed=65 : 달리는 속도 고정 (해·달 움직임 확인용)
const SPEED_OVERRIDE = query.has('speed') && Number.isFinite(Number(query.get('speed'))) ? Number(query.get('speed')) : null;
const todayKey = () => new Date().toLocaleDateString('sv-SE');
// ?lab: 실험판. 다듬는 중인 기능(충전 리워드)을 이 주소에서만 보인다
const LAB = query.has('lab');
if (LAB) document.querySelectorAll('[data-lab]').forEach((el) => { el.hidden = false; });

// ?preview=0~4 : 해당 단계로 꾸민 임시 상태로 보기, ?plant=cactus 처럼 종도 고를 수 있다 (저장하지 않음)
const PREVIEW_STAGE = query.has('preview') ? Math.min(4, Math.max(0, Number(query.get('preview')) || 0)) : null;
const PREVIEW_PLANT = PLANTS[query.get('plant')] ? query.get('plant') : 'monstera';
const previewState = (stage) => {
  const plant = { growth: PLANTS[PREVIEW_PLANT].thresholds[stage], waterToday: 0, grown: false };
  const plants = { monstera: { growth: 9, waterToday: 0, grown: false }, [PREVIEW_PLANT]: plant };
  return { ...createState(todayKey()), active: PREVIEW_PLANT, plants, drops: 6, todayKm: 8.2, totalKm: 164.5, waterCount: 31, coins: 140 };
};

let state = PREVIEW_STAGE !== null ? previewState(PREVIEW_STAGE) : rollDay(sanitize(loadState(), todayKey()), todayKey());
// 실험판: 이미 도장이 있는 지역의 식물 씨앗을 받는다 (지역 식물이 새로 생겨도 바로 받게)
if (LAB) state = grantRegionalSeeds(state);
let prefs = loadPrefs();
setLang(prefs.lang);
applyStatic();
let weatherWatch = null;
// 이번 주행 (실제 주행으로 이슬 모으기를 켰을 때만 쌓인다)
let trip = null;
let drivingUntil = 0;
// 슈퍼차저 근처에 머무는 중 (충전 리워드, 실험판). 두 배 조건(올리브나무)도 쓰므로 위에 둔다
let chargeSession = null;
let stopGps = () => {};

const plant = createPlant($('plant-layer'));
const sky = createSky($('sky'), $('orb'), { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches });
sky.setMode(prefs.orb);
sky.setSize(prefs.orbSize);
const arcs = createArcs($('arcs'));
const fx = createFx($('fx'));
let anchor = { cx: 960, y: 600, potTop: 800 };
let layout = plantLayout(1920, 1200);

/* ---------- 화면 맞춤: 1920×1200 기준으로 축소·확대하되, 남는 쪽은 무대를 넓혀 여백 없이 채운다 ---------- */
const DESIGN = { w: 1920, h: 1200 };
function fit() {
  const scale = Math.min(innerWidth / DESIGN.w, innerHeight / DESIGN.h);
  const W = Math.round(innerWidth / scale);
  const H = Math.round(innerHeight / scale);
  stageEl.style.setProperty('--fit', String(scale));
  // 차에서 실제로 몇 %로 보이는지 확인용 (설정 → 데모)
  $('screen-scale').textContent = `${Math.round(scale * 100)}% · ${innerWidth}×${innerHeight} · ×${window.devicePixelRatio || 1}`;
  stageEl.style.width = `${W}px`;
  stageEl.style.height = `${H}px`;
  ['arcs', 'fx', 'orb'].forEach((id) => { $(id).width = W; $(id).height = H; });
  layout = plantLayout(W, H, prefs.hand);
  plant.setLayout(layout);
  const ring = plant.ring();
  sky.setLayout(ring, { W, H, horizon: layout.base });
  arcs.set({ x: ring.x, y: ring.y });
  anchor = plant.anchor();
  placeSunTime();
  placeCompanion();
}
addEventListener('resize', () => { fit(); applyScene(); });
fit();

/* ---------- 장면: 시각에 따라 해·달 자리와 낮·밤이 정해진다. 설정에서 낮·밤을 고르면 정오·자정으로 고정 ---------- */
const FIXED_HOURS = { day: 12, night: 0 };
function currentHours() {
  if (HOUR_OVERRIDE !== null) return HOUR_OVERRIDE;
  if (SCENE_OVERRIDE) return FIXED_HOURS[SCENE_OVERRIDE];
  if (prefs.scene !== 'auto') return FIXED_HOURS[prefs.scene];
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
// 해 뜨고 지는 시각: 날씨용 대략의 위치로 계산, 아직 모르면 서울. 낮·밤·시각을 고정했으면 6·18시
const SEOUL = { lat: 37.57, lon: 126.98 };
function sunNow() {
  if (HOUR_OVERRIDE !== null || SCENE_OVERRIDE || prefs.scene !== 'auto') return { rise: 6, set: 18 };
  const coords = weatherWatch?.current().coords || SEOUL;
  return sunTimes(new Date(), coords.lat, coords.lon);
}
const currentScene = () => (orbPosition(currentHours(), sunNow()).isDay ? 'day' : 'night');

/* ---------- 날씨: 기본은 실제 날씨(대략의 위치 → Open-Meteo). 주소·설정으로 고정하면 위치를 묻지 않는다 ---------- */
const fixedSky = () => WEATHER_OVERRIDE || (prefs.sky !== 'auto' ? prefs.sky : null);
/** @returns {import('./weather.js').LiveWeather} 고정 날씨면 기온·지역은 모른다 */
function weatherNow() {
  const fixed = fixedSky();
  if (fixed) return { status: 'ok', kind: fixed, temp: TEMP_OVERRIDE, place: null, error: '', at: 0 };
  const live = weatherWatch ? weatherWatch.current() : { status: 'loading', kind: null, temp: null, place: null, error: '', at: 0 };
  return TEMP_OVERRIDE === null ? live : { ...live, temp: TEMP_OVERRIDE };
}
// 비·눈이면 화면이 젖는다 (빗줄기·어두운 하늘·달팽이·빗소리)
const isWet = () => Boolean(skyInfo(weatherNow().kind)?.wet);
/** 지금 날씨 이름. short면 카드처럼 좁은 칸용 짧은 이름 */
function weatherLabel({ short = false } = {}) {
  const w = weatherNow();
  if (w.status === 'ok') return skyInfo(w.kind, { short }).label;
  return t(w.status === 'loading' ? 'weather.loading' : 'weather.unknown');
}
// 몬스테라가 두 배로 자라는 '맑은 낮': 해가 떠 있고 맑음이나 구름 조금
const SUNNY_KINDS = ['clear', 'partly'];
// 라벤더가 두 배로 자라는 '해 뜨고 질 무렵': 해 뜨는·지는 시각 앞뒤 이만큼(시간)
const TWILIGHT_HOURS = 1;
function isTwilight() {
  const h = currentHours();
  const { rise, set } = sunNow();
  return Math.abs(h - rise) <= TWILIGHT_HOURS || Math.abs(h - set) <= TWILIGHT_HOURS;
}
/** 두 배 조건·컨디션에 넘기는 지금 상황 */
function careContext() {
  const isNight = currentScene() === 'night';
  return {
    isNight, sunny: !isNight && SUNNY_KINDS.includes(weatherNow().kind), temp: weatherNow().temp,
    raining: isWet(), twilight: isTwilight(), charging: LAB && isCharging(chargeSession, Date.now()),
  };
}
/** 위치 권한을 묻고 날씨를 받기 시작한다. 처음 안내가 끝난 뒤에 부른다 */
function startWeather() {
  if (weatherWatch || fixedSky()) return;
  weatherWatch = watchWeather(() => { applyScene(); render(); syncSettings(); }, getLang);
}

/** 지금 인사: 시간대(확인용 시각 고정도 따른다)와 이름 */
const greetingNow = () => ({ period: greetingPeriod(currentHours()), name: prefs.name });

/** @returns {Promise<void>} 식물 그림이 새 단계로 준비되면 끝난다 */
function applyScene() {
  const scene = currentScene();
  stageEl.dataset.scene = scene;
  stageEl.dataset.hand = prefs.hand;
  stageEl.dataset.theme = prefs.theme;
  stageEl.dataset.plant = state.active;
  stageEl.dataset.weather = isWet() ? 'rain' : 'clear';
  const ready = plant.setStage(state.active, stageOf(state)).catch(() => toast(t('toast.plantImgFail')));
  renderSunTime(sky.draw({ hours: currentHours(), raining: isWet(), sun: sunNow() }));
  fx.setRain(isWet());
  renderChip();
  renderGreeting($('greet'), greetingNow());
  renderWeatherNow({ temp: weatherNow().temp, label: weatherLabel(), place: fixedSky() ? t('wn.fixed') : weatherNow().place });
  syncAmbient();
  return ready;
}

// 해·달 시각 글자: 식물 가운데 위에 고정. 가장 큰 식물 잎 끝에서 gap만큼 위 (fit()이 먼저 불러서 함수 안에 둔다)
function placeSunTime(gap = 24) {
  const { x, y } = plant.labelSpot();
  $('sun-time').style.transform = `translate(calc(${x.toFixed(1)}px - 50%), calc(${(y - gap).toFixed(1)}px - 100%))`;
}

/* ---------- 동행(실험판): 태운 프렌즈가 화분 테두리에 앉아 있다. 달리는 중엔 졸고, 누르면 함께 온 거리를 말한다 ---------- */
function placeCompanion() {
  const { x, y, size } = plant.seatSpot();
  const el = $('companion');
  el.style.setProperty('--cmp-size', `${size.toFixed(0)}px`);
  el.style.transform = `translate(${(x - size / 2).toFixed(1)}px, ${(y - size).toFixed(1)}px)`;
}
function renderCompanion() {
  const el = $('companion');
  const id = LAB ? state.companion : null;
  el.hidden = !id;
  if (!id) return;
  const src = guestImage(id);
  if ($('companion-img').getAttribute('src') !== src) $('companion-img').src = src;
  el.setAttribute('aria-label', guestName(id));
  el.classList.toggle('sleep', isDriving());
}
const COMPANION_BUBBLE_MS = 2600;
let bubbleTimer = 0;
$('companion').addEventListener('click', (e) => {
  e.stopPropagation();
  if (isDriving() || !state.companion) return;
  const el = $('companion');
  el.classList.remove('hop');
  void el.offsetWidth;
  el.classList.add('hop');
  const bubble = $('companion-bubble');
  const km = Math.floor(state.bond[state.companion] || 0);
  bubble.textContent = km > 0 ? t('cmp.together', { km: km.toLocaleString(locale()) }) : t('cmp.hello');
  bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubble.hidden = true; }, COMPANION_BUBBLE_MS);
  if (prefs.effects && audioReady) chime();
});

/** 해·달 시각 글자: 낮엔 일몰, 밤엔 일출 시각 */
function renderSunTime({ isDay }) {
  const el = $('sun-time');
  el.hidden = prefs.orb === 'off';
  const hours = isDay ? sunNow().set : sunNow().rise;
  const at = new Date();
  at.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
  el.textContent = t(isDay ? 'sun.set' : 'sun.rise', { time: at.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false }) });
}

const isDriving = () => Date.now() < drivingUntil;

/* ---------- 앰비언트 소리: 첫 터치 뒤부터, 장면·날씨가 바뀔 때만 다시 고른다 ---------- */
let audioReady = false;
let moodKey = '';
function syncAmbient() {
  if (!audioReady) return;
  const mood = prefs.ambient ? { scene: currentScene(), weather: isWet() ? 'rain' : 'clear' } : null;
  const key = mood ? `${mood.scene}-${mood.weather}` : 'off';
  if (key === moodKey) return;
  moodKey = key;
  setAmbient(mood);
}

function render() {
  if (isDriving()) guests.leave();
  renderCompanion();
  renderStatus(state, { ...careContext(), driving: isDriving() });
  // 슈퍼차저 버튼: 모은 도장 수 (비료는 충전 화면과 식물 위젯에서 보여 준다)
  if (LAB) $('sc-num').textContent = String(Object.keys(state.stamps).length);
  // 설명 시트가 열려 있으면 같이 새로
  if ($('dew-sheet').open) showDewSheet();
  if ($('cond-sheet').open) showCondSheet();
}

function commit(next) {
  state = next;
  if (PREVIEW_STAGE === null) showSaved(saveState(state));
  render();
}

/* ---------- 자동 저장 표시: 저장될 때 잠깐 '저장됨', 브라우저가 저장을 막으면 계속 '저장 안 됨' ---------- */
// 주행 중엔 이슬이 자주 쌓이므로 '저장됨'은 이 간격보다 자주 띄우지 않는다
const SAVED_CHIP_EVERY_MS = 8000;
const SAVED_CHIP_SHOW_MS = 1600;
let savedChipAt = 0;
let savedChipTimer = 0;
// 마지막 저장이 됐는지 (설정의 자동 저장 줄을 언어가 바뀌어도 다시 그릴 수 있게)
let saveOk = true;
function renderSaveStatus() {
  $('save-status').textContent = t(saveOk ? 'save.on' : 'save.blocked');
  $('save-status').classList.toggle('fail', !saveOk);
}
function showSaved(ok) {
  const chip = $('save-chip');
  saveOk = ok;
  renderSaveStatus();
  if (!ok) {
    chip.textContent = t('save.chipFail');
    chip.classList.add('fail');
    return;
  }
  chip.classList.remove('fail');
  const now = Date.now();
  if (now - savedChipAt < SAVED_CHIP_EVERY_MS) return;
  savedChipAt = now;
  chip.textContent = t('save.chip');
  chip.classList.add('show');
  clearTimeout(savedChipTimer);
  savedChipTimer = setTimeout(() => chip.classList.remove('show'), SAVED_CHIP_SHOW_MS);
}

// 화면이 가려지거나 닫히기 직전에도 한 번 더 저장 (주행 중 브라우저가 닫혀도 마지막 상태가 남게)
function saveNow() {
  if (PREVIEW_STAGE === null) saveState(state);
  savePrefs(prefs);
}
addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

/* ---------- 잎 터치·바람 ---------- */
const GUST_EVERY_MS = [6000, 14000];

// 무대 바깥 UI가 아닌 빈 곳을 누르면 잎을 건드린 것인지 본다
stageEl.addEventListener('pointerdown', (e) => {
  if (e.target !== stageEl && !e.target.closest('.scene')) return;
  const rect = stageEl.getBoundingClientRect();
  const scale = rect.width / stageEl.offsetWidth;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  const hit = plant.poke(x, y);
  if (hit) onLeafTouched(x, y, hit.height);
});

/* 잎 악기: 높은 잎을 누를수록 높은 음. 흔든 잎에서 가끔 손님이 나온다 */
function onLeafTouched(x, y, height) {
  fx.burst(x, y);
  if (prefs.effects && audioReady) leafTouch(currentScene(), height);
  const now = Date.now();
  if (shouldSpawn({ now, lastAt: lastGuestAt, present: guests.present, driving: isDriving() })) {
    lastGuestAt = now;
    setTimeout(() => guests.arrive(pickGuest(guestContext()), x, y - GUEST_LIFT), GUEST_DELAY_MS);
  }
}

/* ---------- 온실 손님 ---------- */
// 손님은 흔든 잎에서 살짝 위로, 잎이 흔들린 뒤 잠깐 있다가 나타난다
const GUEST_LIFT = 30;
const GUEST_DELAY_MS = 450;
let lastGuestAt = 0;
// 서 있는 채로 켜 둔 시간(길고양이): 앱을 연 때나 마지막으로 달린 때부터
const openedAt = Date.now();
const parkedMinutes = () => (isDriving() ? 0 : (Date.now() - Math.max(openedAt, drivingUntil)) / 60000);
const guestContext = () => ({
  isNight: currentScene() === 'night', raining: isWet(), plant: state.active, stage: stageOf(state),
  lab: LAB, hour: currentHours(), month: new Date().getMonth() + 1, parkedMin: parkedMinutes(), todayKm: state.todayKm,
});
/** 충전 프렌즈를 식물 위에 앉힌다. 충전하는 동안 오래 머문다 */
function arriveChargeFriend(id) {
  const { x, y } = plant.ring();
  guests.arrive(id, x, y + 80, GUEST_RULES.CHARGE_STAY_MS);
  toast(t('toast.chargeFriend'));
  if (prefs.effects) chime();
}
const guests = createGuestVisit($('guest-layer'), {
  onCatch: (id, x, y) => {
    const before = state.coins;
    const firstTime = !state.guestbook[id];
    commit(catchGuest(state, id));
    const earned = state.coins - before;
    fx.burst(x, y);
    if (prefs.effects) chime();
    const met = t(firstTime ? 'toast.guestFirst' : 'toast.guestAgain', { name: guestName(id) });
    toast(`${met} · ${earned > 0 ? t('toast.coins', { n: earned }) : t('toast.guestCap')}`);
  },
});

function scheduleGust() {
  const [min, max] = GUST_EVERY_MS;
  setTimeout(() => {
    const strength = 0.4 + Math.random() * 0.6;
    plant.gust(strength);
    onGust(strength);
    scheduleGust();
  }, min + Math.random() * (max - min));
}

function onGust(strength) {
  if (prefs.ambient && audioReady) rustle(strength);
}

/* ---------- 돌보기 ---------- */
$('water-btn').addEventListener('click', () => {
  if (isDriving()) return;
  const before = stageOf(state);
  const result = water(state, careContext());
  if (!result.grew) return;
  fx.water(anchor);
  // 두 배로 자라면 식물 뒤로 노란 파장
  if (result.bonus) arcs.pulse();
  if (prefs.effects) drip();
  plant.glow();
  commit(result.state);
  if (result.stageUp) {
    const stage = stageOf(state);
    setTimeout(() => {
      applyScene();
      // 다 자라면 라틴어 이름을 얻는다: '몬스테라가 페네스트라가 됐어요'
      const adult = adultOf(state.active);
      if (result.grownNow) toast(t('toast.grown', { plant: plantName(state.active), adult: adult.name, meaning: adult.meaning, reward: RULES.GROWN_REWARD }));
      else toast(stage === before + 1 ? t('toast.grew', { stage: stageName(state.active, stage) }) : t('toast.grewPlain'));
      if (prefs.effects) chime();
    }, 600);
  } else {
    toast(result.bonus ? t('toast.double', { n: result.grew }) : `+${result.grew}`);
  }
});

// 로고 아래 날씨를 누르면, 날씨를 모를 때 다시 확인한다
$('weather-now').addEventListener('click', () => {
  const w = weatherNow();
  if (w.status !== 'error' || !weatherWatch) return;
  toast(t('toast.recheck', { error: t(w.error) }));
  weatherWatch.refresh();
});

// 이슬·컨디션 위젯을 누르면 설명 시트
function showDewSheet() {
  const canWater = !isDriving() && waterCheck(state).ok;
  renderDewSheet(state, { gpsOn: prefs.useGps, canWater, waterLabel: $('water-sub').textContent });
}
function showCondSheet() {
  const w = weatherNow();
  const weatherLine = [weatherStatusText(), fixedSky() ? '' : w.place].filter(Boolean).join(' · ');
  renderCondSheet(state, { ...careContext(), weatherLine, failed: w.status === 'error' && Boolean(weatherWatch) });
}
$('dew-card').addEventListener('click', () => { showDewSheet(); openSheet($('dew-sheet')); });
$('cond').addEventListener('click', () => { showCondSheet(); openSheet($('cond-sheet')); });
$('ds-water').addEventListener('click', () => { closeSheets(); $('water-btn').click(); });
$('cs-retry').addEventListener('click', () => { toast(t('toast.recheck', { error: t(weatherNow().error) })); weatherWatch?.refresh(); });

// 식물 위젯을 누르면 도감
// 도감에서 보고 있는 식물 (가진 식물은 탭으로 바꿔 보고, 안 가진 식물은 도감에서 열어 본다)
let guideId = state.active;
const showGuide = () => renderGuide(state, PLANTS[guideId] ? guideId : state.active, (id) => { guideId = id; showGuide(); });
$('grow-card').addEventListener('click', () => {
  guideId = state.active;
  showGuide();
  openSheet($('plant-sheet'));
});

/* ---------- 주행 ---------- */
function markDriving(kmh) {
  sky.setSpeed(kmh);
  if (kmh <= DRIVING_SPEED_KMH) return;
  drivingUntil = Date.now() + DRIVING_HOLD_MS;
  if (trip) trip = markMoving(trip, Date.now());
  // 다시 달리기 시작하면 요약 카드는 닫는다
  if ($('trip-sheet').open) closeSheets();
  render();
  setTimeout(render, DRIVING_HOLD_MS + 100);
}

function setGps(on) {
  stopGps();
  stopGps = () => {};
  if (!on) return;
  stopGps = watchDriving({
    onDistance: (km) => {
      const next = addDistance(rollDay(state, todayKey()), km);
      trip = addToTrip(trip ?? startTrip(Date.now()), state, next, { km, now: Date.now() });
      commit(next);
    },
    onSpeed: markDriving,
    onError: (key) => toast(t(key)),
    onPosition: (pos) => {
      lastPos = pos;
      if (!LAB) return;
      nearCharger = chargerNear(pos);
      tickCharge();
    },
  });
}

/* ---------- 충전 리워드(실험판): 슈퍼차저 근처에 10분 넘게 서 있으면 충전 중, 10분마다 비료. 처음 간 곳은 도장 ---------- */
const CHARGE_TICK_MS = 30000;
// 데모로 머물게 하는 슈퍼차저 (서울 파르나스)
const DEMO_CHARGER_ID = 1115;
const DEMO_CHARGE_MS = 10 * 60 * 1000;
// 마지막 위치에서 가까운 슈퍼차저. 서 있으면 위치가 잘 안 바뀌므로 마지막 값을 그대로 믿는다
let nearCharger = null;
// 마지막으로 받은 내 위치 (지도에서 가까운 슈퍼차저용). 주행 GPS가 없으면 날씨용 대략의 위치
let lastPos = null;
function tickCharge() {
  const now = Date.now();
  chargeSession = updateSession(chargeSession, nearCharger, now);
  const r = settleCharge(rollDay(state, todayKey()), chargeSession, now, todayKey());
  chargeSession = r.session;
  // 충전으로 인정된 첫 순간에 한 번만: 그곳에 올 충전 프렌즈가 있으면 확률로 찾아온다
  if (chargeSession && !chargeSession.friendRolled && isCharging(chargeSession, now)) {
    chargeSession = { ...chargeSession, friendRolled: true };
    const friend = rollChargeFriend(chargerById(chargeSession.id), new Date().getMonth() + 1);
    if (friend) setTimeout(() => arriveChargeFriend(friend), 1200);
  }
  if (r.fert || r.newStamp) {
    const next = grantRegionalSeeds(r.state);
    commit(r.newStamp ? recordTrip(next, chargeSession.id, todayKey()) : next);
    const charger = chargerById(chargeSession.id);
    const place = chargerPlace(charger).name;
    const region = regionById(charger.region);
    const regionText = r.regionStep === 1 ? t('toast.regionSeed', { region: pick(region.ko, region.en), plant: pick(region.plantKo, region.plantEn) })
      : r.regionStep === 2 ? t('toast.regionBadge', { region: pick(region.ko, region.en), n: CHARGE_RULES.REGION_COINS }) : '';
    const parts = [r.newStamp && t('toast.stamp', { place, n: r.coins - (r.regionStep === 2 ? CHARGE_RULES.REGION_COINS : 0) }), regionText, r.fert && t('toast.fert', { n: r.fert })].filter(Boolean);
    toast(parts.join(' · '));
    if (prefs.effects) chime();
  }
  if ($('map-sheet').open) showMap();
  if ($('charge-sheet').open) showCharge();
  if ($('map-sheet').open) showMap();
  if ($('dew-sheet').open) showDewSheet();
  if ($('cond-sheet').open) showCondSheet();
}
const showCharge = () => renderCharge({ state, session: chargeSession, now: Date.now(), gpsOn: prefs.useGps, today: todayKey() });
if (LAB) setInterval(tickCharge, CHARGE_TICK_MS);

$('open-charge').addEventListener('click', () => { showCharge(); openSheet($('charge-sheet')); });

/* 슈퍼차저 지도: 도장책에서 열고, 점을 누르면 그 충전소 카드 */
let mapSelected = null;
const myPos = () => lastPos || weatherWatch?.current().coords || null;
function showMap() {
  if (mapSelected === null) mapSelected = defaultCharger(state, myPos());
  renderMap(state, { selectedId: mapSelected, me: myPos(), onSelect: (id) => { mapSelected = id; showMap(); } });
}
$('open-map').addEventListener('click', () => { mapSelected = null; showMap(); $('map-sheet').show(); });
$('mc-car').addEventListener('click', (e) => {
  const car = e.currentTarget;
  car.classList.remove('hop');
  void car.getBoundingClientRect();
  car.classList.add('hop');
  if (prefs.effects) chime();
});
// 이스터에그: 차를 누르면 깡충, 번개가 튄다
$('cn-car').addEventListener('click', (e) => {
  const car = e.currentTarget;
  car.classList.remove('hop');
  void car.getBoundingClientRect();
  car.classList.add('hop');
  if (prefs.effects) leafTouch(currentScene(), 0.9);
});
$('fert-use').addEventListener('click', () => {
  if (isDriving()) return;
  const result = fertilize(state);
  if (!result.grew) return;
  closeSheets();
  fx.water(anchor);
  arcs.pulse();
  if (prefs.effects) drip();
  plant.glow();
  commit(result.state);
  if (!result.stageUp) { toast(t('toast.fertUsed', { n: result.grew })); return; }
  setTimeout(() => {
    applyScene();
    const adult = adultOf(state.active);
    toast(result.grownNow ? t('toast.grown', { plant: plantName(state.active), adult: adult.name, meaning: adult.meaning, reward: RULES.GROWN_REWARD }) : t('toast.grew', { stage: stageName(state.active, stageOf(state)) }));
    if (prefs.effects) chime();
  }, 600);
});
$('demo-charge').addEventListener('click', () => {
  nearCharger = chargerById(DEMO_CHARGER_ID);
  chargeSession = { id: DEMO_CHARGER_ID, since: Date.now() - DEMO_CHARGE_MS, paid: 0 };
  closeSheets();
  toast(t('toast.demoCharge'));
  setTimeout(() => { tickCharge(); showCharge(); openSheet($('charge-sheet')); }, 400);
});

/* ---------- 주행 요약: 2분 동안 멈춰 있으면 이번 주행을 끝내고, 1km 넘게 달렸으면 카드로 보여 준다 ---------- */
const TRIP_CHECK_MS = 15000;
setInterval(() => {
  if (!trip || isDriving() || !tripEnded(trip, Date.now())) return;
  const done = trip;
  trip = null;
  if (worthShowing(done)) showTrip(done);
}, TRIP_CHECK_MS);

function showTrip(done) {
  closeSheets();
  renderTrip(done, state);
  openSheet($('trip-sheet'));
}
$('trip-water').addEventListener('click', () => {
  closeSheets();
  const btn = $('water-btn');
  btn.classList.remove('nudge');
  void btn.offsetWidth;
  btn.classList.add('nudge');
});

/* ---------- 기록·설정 시트 ---------- */
const scrim = document.createElement('div');
scrim.className = 'scrim';
stageEl.append(scrim);

/* 도감(전체 화면): 식물 탭에서 바꿔 키우거나 꽃씨로 들이고, 카드를 누르면 식물 설명. 손님 탭에서 손님 설명 */
let guestId = null;
function renderGreenhouseSheet() {
  renderGreenhouse(state, (action, id) => {
    const next = action === 'buy' ? buyPlant(state, id) : selectPlant(state, id);
    if (next === state) return;
    commit(next);
    applyScene();
    renderGreenhouseSheet();
    toast(t(action === 'buy' ? 'toast.bought' : 'toast.selected', { plant: plantName(id) }));
    if (action === 'buy' && prefs.effects) chime();
  }, (id) => {
    guideId = id;
    showGuide();
    $('plant-sheet').show();
  }, { regional: LAB });
  renderGuestbook(state, (id) => {
    guestId = id;
    showGuest();
    $('guest-sheet').show();
  }, { residents: LAB });
}
function showGuest() {
  renderGuest(state, guestId);
  renderCompanionPanel(state, guestId, { lab: LAB });
}
// 같이 다니기 / 내려 주기
$('gs-cmp-btn').addEventListener('click', () => {
  if (!guestId) return;
  const riding = state.companion === guestId;
  commit(toggleCompanion(state, guestId));
  showGuest();
  renderGreenhouseSheet();
  toast(t(riding ? 'toast.cmpOff' : 'toast.cmpOn', { name: guestName(guestId) }));
});
function showHubTab(tab) {
  $('tab-plants').setAttribute('aria-selected', String(tab === 'plants'));
  $('tab-guests').setAttribute('aria-selected', String(tab === 'guests'));
  $('hub-plants').hidden = tab !== 'plants';
  $('hub-guests').hidden = tab !== 'guests';
}
$('tab-plants').addEventListener('click', () => showHubTab('plants'));
$('tab-guests').addEventListener('click', () => showHubTab('guests'));

function openSheet(sheet) {
  if (sheet.id === 'greenhouse-sheet') {
    // 새 손님이 있으면 손님 탭으로 연다. 이번에 연 도감에서는 NEW를 보여 주고, 빨간 점은 바로 지운다
    const hasNew = state.newGuests.length > 0;
    $('tab-guests-dot').hidden = !hasNew;
    showHubTab(hasNew ? 'guests' : 'plants');
    renderGreenhouseSheet();
    if (hasNew) commit(markGuestsSeen(state));
  }
  syncSettings();
  sheet.show();
  scrim.classList.add('show');
}
function closeSheets() {
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  scrim.classList.remove('show');
}
$('open-greenhouse').addEventListener('click', () => openSheet($('greenhouse-sheet')));
$('open-settings').addEventListener('click', () => openSheet($('settings-sheet')));
$('album-card').addEventListener('click', () => openSheet($('album-sheet')));
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheets));
// 식물·손님 설명의 돌아가기: 그 화면만 닫는다 (도감에서 열었으면 도감으로)
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
  b.closest('dialog').close();
  if (!document.querySelector('dialog[open]')) scrim.classList.remove('show');
}));
scrim.addEventListener('click', closeSheets);

function syncSettings() {
  $('pref-ambient').setAttribute('aria-checked', String(prefs.ambient));
  $('pref-effects').setAttribute('aria-checked', String(prefs.effects));
  $('pref-gps').setAttribute('aria-checked', String(prefs.useGps));
  // 입력 중에는 글자를 덮어쓰지 않는다 (커서가 튀지 않게)
  const nameInput = $('pref-name');
  if (document.activeElement !== nameInput) nameInput.value = prefs.name;
  nameInput.placeholder = t('name.placeholder');
  // 데모 단계 버튼은 지금 키우는 식물의 단계 이름으로
  $('demo-stage').querySelectorAll('button').forEach((b) => { b.textContent = stageName(state.active, Number(b.dataset.value)); });
  $('weather-status').textContent = weatherStatusText();
  renderSaveStatus();
  [['pref-lang', prefs.lang], ['pref-orb', prefs.orb], ['pref-orb-size', prefs.orbSize], ['pref-theme', prefs.theme], ['pref-scene', prefs.scene], ['pref-weather', prefs.sky], ['pref-hand', prefs.hand], ['demo-stage', String(stageOf(state))]].forEach(([id, value]) => {
    $(id).querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
  });
}

/** 설정의 날씨 줄: 실제 날씨를 받았는지, 언제 받았는지 */
function weatherStatusText() {
  if (fixedSky()) return t('weather.status.fixed', { label: skyInfo(fixedSky()).label });
  const w = weatherNow();
  if (w.status === 'loading') return t('weather.status.loading');
  if (w.status === 'error') return t(w.error);
  const mins = Math.round((Date.now() - w.at) / 60000);
  return t('weather.status.ok', { label: skyInfo(w.kind).label, ago: mins < 1 ? t('time.justNow') : t('time.minAgo', { n: mins }) });
}

function updatePrefs(patch) {
  prefs = { ...prefs, ...patch };
  savePrefs(prefs);
  syncSettings();
}

// 이름: 적는 대로 인사에 바로 반영, 다 적으면(완료·포커스 해제) 공백을 정리해 다시 채운다
$('pref-name').addEventListener('input', (e) => {
  updatePrefs({ name: cleanName(e.target.value) });
  renderGreeting($('greet'), greetingNow());
});
$('pref-name').addEventListener('change', (e) => { e.target.value = prefs.name; });
$('pref-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });

$('pref-effects').addEventListener('click', () => updatePrefs({ effects: !prefs.effects }));
$('pref-ambient').addEventListener('click', () => {
  updatePrefs({ ambient: !prefs.ambient });
  syncAmbient();
});
$('pref-gps').addEventListener('click', () => {
  updatePrefs({ useGps: !prefs.useGps });
  setGps(prefs.useGps);
});
// 언어: 고정 글자를 바꾸고, 글자를 그리는 화면을 모두 다시 그린다
$('pref-lang').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (!value || value === prefs.lang) return;
  updatePrefs({ lang: value });
  setLang(value);
  applyStatic();
  applyScene();
  render();
  showAlbum();
  syncSettings();
  if ($('greenhouse-sheet').open) renderGreenhouseSheet();
  if ($('plant-sheet').open) showGuide();
  if ($('guest-sheet').open && guestId) showGuest();
  if ($('charge-sheet').open) showCharge();
  // 지역 이름을 새 언어로 다시 받는다
  weatherWatch?.refresh();
});
$('pref-theme').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (value) { updatePrefs({ theme: value }); applyScene(); }
});
$('pref-orb').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (!value) return;
  updatePrefs({ orb: value });
  sky.setMode(value);
  applyScene();
});
$('pref-orb-size').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (!value) return;
  updatePrefs({ orbSize: value });
  sky.setSize(value);
  applyScene();
});
$('pref-scene').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (value) { updatePrefs({ scene: value }); applyScene(); }
});
// 버튼 위치: 운전석이면 왼쪽 아래, 조수석이면 오른쪽 아래. 식물은 남은 공간 가운데로
$('pref-hand').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (!value || value === prefs.hand) return;
  updatePrefs({ hand: value });
  fit();
  applyScene();
});
$('pref-weather').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (!value) return;
  updatePrefs({ sky: value });
  startWeather();
  applyScene();
  render();
});

// 데모: 성장 단계를 바로 바꿔 본다. 성장 점수를 그 단계 시작점으로 맞춘다
$('demo-stage').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  const stage = Number(value);
  const current = state.plants[state.active];
  commit({ ...state, plants: { ...state.plants, [state.active]: { ...current, growth: PLANTS[state.active].thresholds[stage], grown: false } } });
  applyScene();
  syncSettings();
  toast(stageName(state.active, stage));
});
$('demo-km').addEventListener('click', () => { commit(addDistance(state, 30)); toast(t('toast.demoKm')); });
$('demo-coins').addEventListener('click', () => { commit({ ...state, coins: state.coins + 100 }); toast(t('toast.coins', { n: 100 })); });
$('demo-guest').addEventListener('click', () => {
  closeSheets();
  const { x, y } = plant.ring();
  guests.arrive(pickGuest(guestContext()), x, y + 80);
});
$('demo-charge-friend').addEventListener('click', () => {
  closeSheets();
  arriveChargeFriend(CHARGE_FRIEND_IDS[Math.floor(Math.random() * CHARGE_FRIEND_IDS.length)]);
});
$('demo-drive').addEventListener('click', () => {
  closeSheets();
  drivingUntil = Date.now() + DEMO_DRIVE_MS;
  render();
  setTimeout(render, DEMO_DRIVE_MS + 100);
});
$('demo-trip').addEventListener('click', () => showTrip({ km: 32.4, drops: 3, coins: 32 }));
$('demo-reset').addEventListener('click', () => {
  clearAll();
  commit(createState(todayKey()));
  applyScene();
  closeSheets();
});

/* ---------- 오늘의 앨범: 시트의 QR은 고른 음악 앱으로 연다 (고른 앱은 저장) ---------- */
function showAlbum() {
  renderAlbum(todayKey(), {
    app: prefs.musicApp,
    onPickApp: (id) => { updatePrefs({ musicApp: id }); showAlbum(); },
  });
}

/* ---------- 처음 안내: 처음 한 번만. ?tutorial 이면 항상, 확인용 주소(?preview·?noloading)에선 건너뛴다 ---------- */
const tutorial = createTutorial($('tour'), {
  onOpen: () => scrim.classList.add('show'),
  onClose: () => {
    scrim.classList.remove('show');
    if (!prefs.tutorialSeen) updatePrefs({ tutorialSeen: true });
    startWeather();
  },
});
$('open-tour').addEventListener('click', () => { closeSheets(); tutorial.open(); });
const shouldShowTutorial = () => query.has('tutorial') || (!prefs.tutorialSeen && PREVIEW_STAGE === null && !query.has('noloading'));

/* ---------- 인트로: 로고 → 탭하여 계속하기 → (탭) 인사와 은은한 소리 → 막이 걷히며 화분에서 식물이 자라 오름 → UI가 올라온다 ---------- */
function startIntro(plantReady) {
  const opening = $('loading');
  if (query.has('noloading')) { opening.remove(); window.__fenestraReady = true; return Promise.resolve(); }
  stageEl.classList.add('intro');
  plant.hide();
  return new Promise((resolve) => {
    let revealed = false;
    const reveal = async () => {
      if (revealed) return;
      revealed = true;
      // 앱이 돌기 시작했다는 표시 (index.html의 시작 지킴이가 본다)
      window.__fenestraReady = true;
      await Promise.race([plantReady.catch(() => {}), new Promise((done) => setTimeout(done, PLANT_WAIT_MS))]);
      const assembleMs = plant.assemble();
      opening.classList.add('reveal');
      setTimeout(() => stageEl.classList.remove('intro'), Math.max(OPENING_FADE_MS, assembleMs - 600));
      setTimeout(() => {
        opening.classList.add('done');
        setTimeout(() => opening.remove(), OPENING_FADE_MS);
        resolve();
      }, Math.max(OPENING_FADE_MS, assembleMs));
    };
    renderGreeting($('opening-greet'), greetingNow());
    // 탭하면(로고 모션 중이어도) 인사로 넘어간다. 탭이 있어야 소리를 낼 수 있다
    let greeted = false;
    const greet = () => {
      if (greeted) return;
      greeted = true;
      window.__fenestraReady = true;
      opening.classList.remove('ready');
      opening.classList.add('greeting');
      unlock();
      if (prefs.effects) greetSwell(currentScene());
      setTimeout(reveal, GREET_MS);
    };
    setTimeout(() => {
      // 앱이 떴다는 표시 (시작 지킴이). 이제 탭을 기다린다
      window.__fenestraReady = true;
      if (!greeted) opening.classList.add('ready');
    }, LOGO_MS);
    opening.addEventListener('click', greet);
  });
}

/* ---------- 시작 ---------- */
addEventListener('pointerdown', () => {
  unlock();
  audioReady = true;
  syncAmbient();
}, { once: true });

setInterval(() => { state = rollDay(state, todayKey()); applyScene(); render(); showAlbum(); }, 60000);

stageEl.classList.add('booting');
showAlbum();
// 위치 권한은 인트로와 처음 안내가 끝난 뒤에 묻는다
startIntro(applyScene()).then(() => { if (shouldShowTutorial()) tutorial.open(); else startWeather(); });
render();
syncSettings();
requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('booting')));
if (prefs.useGps) setGps(true);
scheduleGust();
if (SPEED_OVERRIDE !== null) setInterval(() => sky.setSpeed(SPEED_OVERRIDE), 2000);
