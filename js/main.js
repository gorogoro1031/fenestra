import { RULES, createState, sanitize, rollDay, addDistance, addChargeMinutes, water, stageOf, buyPlant, selectPlant, STAGE_NAMES } from './state.js';
import { PLANTS } from './plants.js';
import { loadState, saveState, loadPrefs, savePrefs, clearAll } from './storage.js';
import { plantLayout, createArcs, createFx } from './scene.js';
import { createPlant } from './plant.js';
import { createSky, orbPosition } from './sky.js';
import { renderStatus, renderGreenhouse, renderChip, toast } from './ui.js';
import { setAmbient, drip, chime, unlock, rustle, leafTouch } from './sound.js';
import { watchDriving } from './drive.js';
import { createTutorial } from './tutorial.js';
import { renderAlbum } from './album-card.js';

// 인트로: 로고만 보이는 시간, 그 뒤 식물이 자라 오르는 동안 막이 걷힌다
const LOGO_MS = 2000;
const OPENING_FADE_MS = 1000;
// 식물 그림이 늦어도 인트로는 이 시간 뒤엔 넘어간다 (그림은 오는 대로 나타난다)
const PLANT_WAIT_MS = 4000;
const CHARGE_TICK_MS = 60000;
const DRIVING_SPEED_KMH = 5;
const DRIVING_HOLD_MS = 15000;
const DEMO_DRIVE_MS = 8000;

const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
// 확인용 주소 옵션: ?scene=day|night 로 정오·자정 고정, ?hour=0~24 로 시각 고정, ?noloading 으로 로딩 건너뛰기 (저장하지 않음)
const query = new URLSearchParams(location.search);
const SCENE_OVERRIDE = ['day', 'night'].includes(query.get('scene')) ? query.get('scene') : null;
const HOUR_OVERRIDE = query.has('hour') && Number.isFinite(Number(query.get('hour'))) ? Number(query.get('hour')) : null;
const todayKey = () => new Date().toLocaleDateString('sv-SE');

// ?preview=0~4 : 해당 단계로 꾸민 임시 상태로 보기, ?plant=cactus 처럼 종도 고를 수 있다 (저장하지 않음)
const PREVIEW_STAGE = query.has('preview') ? Math.min(4, Math.max(0, Number(query.get('preview')) || 0)) : null;
const PREVIEW_PLANT = PLANTS[query.get('plant')] ? query.get('plant') : 'monstera';
const previewState = (stage) => {
  const plant = { growth: PLANTS[PREVIEW_PLANT].thresholds[stage], waterToday: 0, grown: false };
  const plants = { monstera: { growth: 9, waterToday: 0, grown: false }, [PREVIEW_PLANT]: plant };
  return { ...createState(todayKey()), active: PREVIEW_PLANT, plants, drops: 6, light: 60, todayKm: 8.2, totalKm: 164.5, waterCount: 31, coins: 140 };
};

let state = PREVIEW_STAGE !== null ? previewState(PREVIEW_STAGE) : rollDay(sanitize(loadState(), todayKey()), todayKey());
let prefs = loadPrefs();
let charging = false;
let chargeTimer = 0;
let drivingUntil = 0;
let stopGps = () => {};

const plant = createPlant($('plant-layer'));
const sky = createSky($('sky'), $('orb'));
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
  stageEl.style.width = `${W}px`;
  stageEl.style.height = `${H}px`;
  ['arcs', 'fx'].forEach((id) => { $(id).width = W; $(id).height = H; });
  layout = plantLayout(W, H, prefs.hand);
  plant.setLayout(layout);
  const ring = plant.ring();
  sky.setLayout(ring, { W, H, horizon: layout.base });
  arcs.set({ x: ring.x, y: ring.y });
  anchor = plant.anchor();
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
const currentScene = () => (orbPosition(currentHours()).isDay ? 'day' : 'night');

/** @returns {Promise<void>} 식물 그림이 새 단계로 준비되면 끝난다 */
function applyScene() {
  const scene = currentScene();
  stageEl.dataset.scene = scene;
  stageEl.dataset.hand = prefs.hand;
  stageEl.dataset.weather = prefs.weather;
  const ready = plant.setStage(state.active, stageOf(state)).catch(() => toast('식물 그림을 불러오지 못했어요 · 연결을 확인해 주세요'));
  sky.draw({ hours: currentHours(), raining: prefs.weather === 'rain' });
  fx.setRain(prefs.weather === 'rain');
  renderChip(prefs.weather);
  syncAmbient();
  return ready;
}

const isDriving = () => Date.now() < drivingUntil;

/* ---------- 앰비언트 소리: 첫 터치 뒤부터, 장면·날씨가 바뀔 때만 다시 고른다 ---------- */
let audioReady = false;
let moodKey = '';
function syncAmbient() {
  if (!audioReady) return;
  const mood = prefs.sound ? { scene: currentScene(), weather: prefs.weather } : null;
  const key = mood ? `${mood.scene}-${mood.weather}` : 'off';
  if (key === moodKey) return;
  moodKey = key;
  setAmbient(mood);
}

function render() {
  renderStatus(state, { charging, driving: isDriving(), isNight: currentScene() === 'night' });
}

function commit(next) {
  state = next;
  if (PREVIEW_STAGE === null) saveState(state);
  render();
}

/* ---------- 잎 터치·바람 ---------- */
const GUST_EVERY_MS = [6000, 14000];

// 무대 바깥 UI가 아닌 빈 곳을 누르면 잎을 건드린 것인지 본다
stageEl.addEventListener('pointerdown', (e) => {
  if (e.target !== stageEl && !e.target.closest('.scene')) return;
  const rect = stageEl.getBoundingClientRect();
  const scale = rect.width / stageEl.offsetWidth;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  if (plant.poke(x, y)) onLeafTouched(x, y);
});

function onLeafTouched(x, y) {
  fx.burst(x, y);
  if (prefs.sound && audioReady) leafTouch(currentScene());
}

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
  if (prefs.sound && audioReady) rustle(strength);
}

/* ---------- 돌보기 ---------- */
$('water-btn').addEventListener('click', () => {
  if (isDriving()) return;
  const before = stageOf(state);
  const result = water(state, { isNight: currentScene() === 'night' });
  if (!result.grew) return;
  fx.water(anchor);
  if (prefs.sound) drip();
  plant.glow();
  commit(result.state);
  if (result.stageUp) {
    const stage = stageOf(state);
    setTimeout(() => {
      applyScene();
      if (result.grownNow) toast(`${PLANTS[state.active].name}가 다 자랐어요 · 꽃씨 +${RULES.GROWN_REWARD}`);
      else toast(stage === before + 1 ? `한 뼘 자랐어요 · ${STAGE_NAMES[stage]}` : '한 뼘 자랐어요');
      if (prefs.sound) chime();
    }, 600);
  } else {
    toast(result.bonus ? `두 배로 +${result.grew}` : `+${result.grew}`);
  }
});

function setCharging(on) {
  charging = on;
  clearInterval(chargeTimer);
  if (on) chargeTimer = setInterval(() => commit(addChargeMinutes(state, 1)), CHARGE_TICK_MS);
  arcs.set({ active: on });
  render();
}
$('charge-btn').addEventListener('click', () => { if (!isDriving()) setCharging(!charging); });

/* ---------- 주행 ---------- */
function markDriving(kmh) {
  if (kmh <= DRIVING_SPEED_KMH) return;
  drivingUntil = Date.now() + DRIVING_HOLD_MS;
  if (charging) setCharging(false);
  render();
  setTimeout(render, DRIVING_HOLD_MS + 100);
}

function setGps(on) {
  stopGps();
  stopGps = () => {};
  if (!on) return;
  stopGps = watchDriving({
    onDistance: (km) => commit(addDistance(rollDay(state, todayKey()), km)),
    onSpeed: markDriving,
    onError: (msg) => toast(msg),
  });
}

/* ---------- 기록·설정 시트 ---------- */
const scrim = document.createElement('div');
scrim.className = 'scrim';
stageEl.append(scrim);

/* 온실: 가진 식물로 바꿔 키우거나, 꽃씨로 새 식물을 들인다 */
function renderGreenhouseSheet() {
  renderGreenhouse(state, (action, id) => {
    const next = action === 'buy' ? buyPlant(state, id) : selectPlant(state, id);
    if (next === state) return;
    commit(next);
    applyScene();
    renderGreenhouseSheet();
    toast(action === 'buy' ? `${PLANTS[id].name}를 들였어요` : `${PLANTS[id].name}를 키워요`);
    if (action === 'buy' && prefs.sound) chime();
  });
}

function openSheet(sheet) {
  if (sheet.id === 'greenhouse-sheet') renderGreenhouseSheet();
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
scrim.addEventListener('click', closeSheets);

function syncSettings() {
  $('pref-sound').setAttribute('aria-checked', String(prefs.sound));
  $('pref-gps').setAttribute('aria-checked', String(prefs.useGps));
  [['pref-scene', prefs.scene], ['pref-weather', prefs.weather], ['pref-hand', prefs.hand], ['demo-stage', String(stageOf(state))]].forEach(([id, value]) => {
    $(id).querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
  });
}

function updatePrefs(patch) {
  prefs = { ...prefs, ...patch };
  savePrefs(prefs);
  syncSettings();
}

$('pref-sound').addEventListener('click', () => {
  updatePrefs({ sound: !prefs.sound });
  syncAmbient();
});
$('pref-gps').addEventListener('click', () => {
  updatePrefs({ useGps: !prefs.useGps });
  setGps(prefs.useGps);
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
  if (value) { updatePrefs({ weather: value }); applyScene(); }
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
  toast(STAGE_NAMES[stage]);
});
$('demo-km').addEventListener('click', () => { commit(addDistance(state, 30)); toast('30km 달렸어요 · 물방울 +3 · 꽃씨 +30'); });
$('demo-coins').addEventListener('click', () => { commit({ ...state, coins: state.coins + 100 }); toast('꽃씨 +100'); });
$('demo-charge').addEventListener('click', () => { commit(addChargeMinutes(state, 10)); toast(`햇빛 +${10 * RULES.LIGHT_PER_MINUTE}`); });
$('demo-drive').addEventListener('click', () => {
  closeSheets();
  drivingUntil = Date.now() + DEMO_DRIVE_MS;
  render();
  setTimeout(render, DEMO_DRIVE_MS + 100);
});
$('demo-reset').addEventListener('click', () => {
  clearAll();
  setCharging(false);
  commit(createState(todayKey()));
  applyScene();
  closeSheets();
});

/* ---------- 처음 안내: 처음 한 번만. ?tutorial 이면 항상, 확인용 주소(?preview·?noloading)에선 건너뛴다 ---------- */
const tutorial = createTutorial($('tour'), {
  onOpen: () => scrim.classList.add('show'),
  onClose: () => {
    scrim.classList.remove('show');
    if (!prefs.tutorialSeen) updatePrefs({ tutorialSeen: true });
  },
});
$('open-tour').addEventListener('click', () => { closeSheets(); tutorial.open(); });
const shouldShowTutorial = () => query.has('tutorial') || (!prefs.tutorialSeen && PREVIEW_STAGE === null && !query.has('noloading'));

/* ---------- 인트로: 로고 → 막이 걷히며 화분에서 식물이 자라 오름 → UI가 올라온다. 누르면 로고 단계를 건너뛴다 ---------- */
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
    setTimeout(reveal, LOGO_MS);
    opening.addEventListener('click', reveal, { once: true });
  });
}

/* ---------- 시작 ---------- */
addEventListener('pointerdown', () => {
  unlock();
  audioReady = true;
  syncAmbient();
}, { once: true });

setInterval(() => { state = rollDay(state, todayKey()); applyScene(); render(); renderAlbum(todayKey()); }, 60000);

stageEl.classList.add('booting');
renderAlbum(todayKey());
startIntro(applyScene()).then(() => { if (shouldShowTutorial()) tutorial.open(); });
render();
syncSettings();
requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('booting')));
if (prefs.useGps) setGps(true);
scheduleGust();
