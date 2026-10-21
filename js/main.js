import { RULES, createState, sanitize, rollDay, addDistance, addChargeMinutes, water, stageFor, STAGE_NAMES } from './state.js';
import { loadState, saveState, loadPrefs, savePrefs, clearAll } from './storage.js';
import { plantLayout, createArcs, createFx } from './scene.js';
import { createDotPlant } from './plant.js';
import { renderStatus, renderTimeline, renderChip, toast } from './ui.js';
import { setAmbient, drip, chime, unlock, rustle, leafTouch } from './sound.js';
import { watchDriving } from './drive.js';
import { createTutorial } from './tutorial.js';

// 인트로: 로고만 보이는 시간, 그 뒤 점이 모이는 동안 막이 걷힌다
const LOGO_MS = 2000;
const OPENING_FADE_MS = 1000;
const CHARGE_TICK_MS = 60000;
const DRIVING_SPEED_KMH = 5;
const DRIVING_HOLD_MS = 15000;
const DEMO_DRIVE_MS = 8000;

const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
// 확인용 주소 옵션: ?scene=day|night 로 장면 고정, ?noloading 으로 로딩 건너뛰기 (저장하지 않음)
const query = new URLSearchParams(location.search);
const SCENE_OVERRIDE = ['day', 'night'].includes(query.get('scene')) ? query.get('scene') : null;
const todayKey = () => new Date().toLocaleDateString('sv-SE');

// ?preview=0~4 : 해당 단계로 꾸민 임시 상태로 보기 (저장하지 않음)
const PREVIEW_STAGE = query.has('preview') ? Math.min(4, Math.max(0, Number(query.get('preview')) || 0)) : null;
const previewState = (stage) => ({ ...createState(todayKey()), growth: RULES.STAGE_THRESHOLDS[stage], drops: 6, light: 60, todayKm: 8.2, totalKm: 64.5, waterCount: 31 });

let state = PREVIEW_STAGE !== null ? previewState(PREVIEW_STAGE) : rollDay(sanitize(loadState(), todayKey()), todayKey());
let prefs = loadPrefs();
let charging = false;
let chargeTimer = 0;
let drivingUntil = 0;
let stopGps = () => {};

const plant = createDotPlant($('plant-canvas'));
const arcs = createArcs($('arcs'));
const fx = createFx($('fx'));
let anchor = { x: 960, y: 300, potTop: 1000, cx: 960 };
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
  ['arcs', 'fx', 'plant-canvas'].forEach((id) => { $(id).width = W; $(id).height = H; });
  layout = plantLayout(W, H);
  plant.setLayout(layout);
}
addEventListener('resize', () => { fit(); applyScene(); });
fit();

/* ---------- 장면 ---------- */
function currentScene() {
  if (SCENE_OVERRIDE) return SCENE_OVERRIDE;
  if (prefs.scene !== 'auto') return prefs.scene;
  const h = new Date().getHours();
  return h >= 18 || h < 6 ? 'night' : 'day';
}

/** @returns {Promise<void>} 식물 점이 새 단계로 준비되면 끝난다 */
function applyScene() {
  const scene = currentScene();
  const stage = stageFor(state.growth);
  stageEl.dataset.scene = scene;
  stageEl.dataset.weather = prefs.weather;
  const ready = plant.setStage(stage).then(() => {
    anchor = plant.anchor();
    arcs.set({ x: anchor.x, y: anchor.y });
  });
  arcs.set({ scene });
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
  renderStatus(state, { charging, driving: isDriving() });
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
  if (plant.poke(x, y)) onLeafTouched();
});

function onLeafTouched() {
  plant.gust(0.35);
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
  const before = stageFor(state.growth);
  const result = water(state);
  if (!result.grew) return;
  fx.water(anchor);
  if (prefs.sound) drip();
  plant.glow();
  commit(result.state);
  if (result.stageUp) {
    const stage = stageFor(state.growth);
    setTimeout(() => {
      applyScene();
      toast(stage === before + 1 ? `창이 열렸어요 · ${STAGE_NAMES[stage]}` : '창이 열렸어요');
      if (prefs.sound) chime();
    }, 600);
  } else {
    toast(result.usedLight ? `햇빛과 함께 +${result.grew}` : `+${result.grew}`);
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

function openSheet(sheet) {
  if (sheet.id === 'log-sheet') renderTimeline($('timeline'), state);
  syncSettings();
  sheet.show();
  scrim.classList.add('show');
}
function closeSheets() {
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  scrim.classList.remove('show');
}
$('open-log').addEventListener('click', () => openSheet($('log-sheet')));
$('open-settings').addEventListener('click', () => openSheet($('settings-sheet')));
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheets));
scrim.addEventListener('click', closeSheets);

function syncSettings() {
  $('pref-sound').setAttribute('aria-checked', String(prefs.sound));
  $('pref-gps').setAttribute('aria-checked', String(prefs.useGps));
  [['pref-scene', prefs.scene], ['pref-weather', prefs.weather], ['demo-stage', String(stageFor(state.growth))]].forEach(([id, value]) => {
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
$('pref-weather').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (value) { updatePrefs({ weather: value }); applyScene(); }
});

// 데모: 성장 단계를 바로 바꿔 본다. 성장 점수를 그 단계 시작점으로 맞춘다
$('demo-stage').addEventListener('click', (e) => {
  const value = e.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  const stage = Number(value);
  commit({ ...state, growth: RULES.STAGE_THRESHOLDS[stage] });
  applyScene();
  syncSettings();
  toast(STAGE_NAMES[stage]);
});
$('demo-km').addEventListener('click', () => { commit(addDistance(state, 5)); toast('5km 달렸어요 · 물방울 +5'); });
$('demo-charge').addEventListener('click', () => { commit(addChargeMinutes(state, 10)); toast('햇빛 +100'); });
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

/* ---------- 인트로: 로고 → 막이 걷히며 점이 모여 식물 → UI가 올라온다. 누르면 로고 단계를 건너뛴다 ---------- */
function startIntro(plantReady) {
  const opening = $('loading');
  if (query.has('noloading')) { opening.remove(); return Promise.resolve(); }
  stageEl.classList.add('intro');
  return new Promise((resolve) => {
    let revealed = false;
    const reveal = async () => {
      if (revealed) return;
      revealed = true;
      await plantReady;
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

setInterval(() => { state = rollDay(state, todayKey()); applyScene(); render(); }, 60000);

stageEl.classList.add('booting');
startIntro(applyScene()).then(() => { if (shouldShowTutorial()) tutorial.open(); });
render();
requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('booting')));
if (prefs.useGps) setGps(true);
scheduleGust();
