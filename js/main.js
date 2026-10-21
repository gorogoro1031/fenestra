import { RULES, createState, sanitize, rollDay, addDistance, addChargeMinutes, water, stageFor, STAGE_NAMES } from './state.js';
import { loadState, saveState, loadPrefs, savePrefs, clearAll } from './storage.js';
import { placePlant, createPlantSwap, createArcs, createFx } from './scene.js';
import { renderStatus, renderTimeline, renderChip, toast } from './ui.js';
import { setAmbient, drip, chime, unlock } from './sound.js';
import { watchDriving } from './drive.js';

const OPENING_MS = 2200;
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

const swapPlant = createPlantSwap($('plant-a'), $('plant-b'));
const arcs = createArcs($('arcs'));
const fx = createFx($('fx'));
let anchor = { x: 960, y: 300, potTop: 1000, cx: 960 };

/* ---------- 화면 맞춤 ---------- */
function fit() {
  stageEl.style.setProperty('--fit', String(Math.min(innerWidth / 1920, innerHeight / 1200)));
}
addEventListener('resize', fit);
fit();

/* ---------- 장면 ---------- */
function currentScene() {
  if (SCENE_OVERRIDE) return SCENE_OVERRIDE;
  if (prefs.scene !== 'auto') return prefs.scene;
  const h = new Date().getHours();
  return h >= 18 || h < 6 ? 'night' : 'day';
}

function applyScene() {
  const scene = currentScene();
  const stage = stageFor(state.growth);
  stageEl.dataset.scene = scene;
  stageEl.dataset.weather = prefs.weather;
  anchor = placePlant($('plant'), stage);
  swapPlant(stage);
  arcs.set({ x: anchor.x, y: anchor.y, scene });
  fx.setRain(prefs.weather === 'rain');
  renderChip(prefs.weather);
  if (prefs.sound) setAmbient(prefs.weather === 'rain' ? 'rain' : 'wind');
}

const isDriving = () => Date.now() < drivingUntil;

function render() {
  renderStatus(state, { charging, driving: isDriving() });
}

function commit(next) {
  state = next;
  if (PREVIEW_STAGE === null) saveState(state);
  render();
}

/* ---------- 돌보기 ---------- */
$('water-btn').addEventListener('click', () => {
  if (isDriving()) return;
  const before = stageFor(state.growth);
  const result = water(state);
  if (!result.grew) return;
  fx.water(anchor);
  if (prefs.sound) drip();
  $('plant').classList.add('glow');
  setTimeout(() => $('plant').classList.remove('glow'), 700);
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
  [['pref-scene', prefs.scene], ['pref-weather', prefs.weather]].forEach(([id, value]) => {
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
  setAmbient(prefs.sound ? (prefs.weather === 'rain' ? 'rain' : 'wind') : null);
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

/* ---------- 오프닝: 글자 로고만 ---------- */
function startLoading() {
  if (query.has('noloading')) { $('loading').remove(); return; }
  const finish = () => $('loading').classList.add('done');
  setTimeout(finish, OPENING_MS);
  $('loading').addEventListener('click', finish, { once: true });
}

/* ---------- 시작 ---------- */
addEventListener('pointerdown', () => {
  unlock();
  if (prefs.sound) setAmbient(prefs.weather === 'rain' ? 'rain' : 'wind');
}, { once: true });

setInterval(() => { state = rollDay(state, todayKey()); applyScene(); render(); }, 60000);

stageEl.classList.add('booting');
startLoading();
applyScene();
render();
requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('booting')));
if (prefs.useGps) setGps(true);
