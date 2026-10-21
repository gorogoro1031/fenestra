// 상태를 화면 글자·게이지로 옮기는 함수들
import { RULES, STAGE_NAMES, LAST_STAGE, stageFor, progressToNext } from './state.js';

const $ = (id) => document.getElementById(id);

// 점 줄 게이지의 점 개수. 물방울은 최대치(12)와 같게 해 하나 = 한 개
const DOTS = { progress: 12, light: 10 };

/** 점 total개 중 앞에서부터 filled개(내림)를 켠다. 점 개수가 바뀔 때만 새로 만든다 */
function renderDots(el, filled, total) {
  if (el.children.length !== total) el.replaceChildren(...Array.from({ length: total }, () => document.createElement('i')));
  const on = Math.floor(filled + 1e-9);
  [...el.children].forEach((dot, i) => dot.classList.toggle('on', i < on));
}

export function renderStatus(state, { charging, driving }) {
  const stage = stageFor(state.growth);
  $('stage-name').textContent = STAGE_NAMES[stage];
  $('stage-num').textContent = String(stage);
  renderDots($('progress-dots'), progressToNext(state.growth) * DOTS.progress, DOTS.progress);
  $('drops-num').textContent = String(state.drops);
  renderDots($('drops-dots'), state.drops, RULES.MAX_DROPS);
  $('light-num').textContent = String(Math.round(state.light));
  renderDots($('light-dots'), (state.light / RULES.MAX_LIGHT) * DOTS.light, DOTS.light);
  $('today-km').textContent = state.todayKm.toFixed(1);

  const waterBtn = $('water-btn');
  waterBtn.disabled = driving || state.drops === 0;
  $('water-sub').textContent = waterSubtitle(state, driving);
  const chargeBtn = $('charge-btn');
  chargeBtn.setAttribute('aria-pressed', String(charging));
  chargeBtn.disabled = driving;
  $('charge-sub').textContent = charging ? '햇빛이 차오르는 중' : '햇빛 모으기';
  $('driving-banner').hidden = !driving;
}

function waterSubtitle(state, driving) {
  if (driving) return '차를 세우면 줄 수 있어요';
  if (state.drops === 0) return '1km = 물방울 1개';
  if (stageFor(state.growth) === LAST_STAGE) return '다 자랐어요';
  return state.light >= RULES.LIGHT_COST ? '햇빛과 함께 ×2' : '물방울 1개';
}

export function renderTimeline(list, state) {
  const stage = stageFor(state.growth);
  const items = STAGE_NAMES.map((name, i) => {
    const li = document.createElement('li');
    li.className = i <= stage ? 'done' : 'locked';
    const img = document.createElement('img');
    img.src = `assets/plant-${i}.webp`;
    img.alt = '';
    const text = document.createElement('div');
    const title = document.createElement('p');
    title.className = 't-name';
    title.textContent = name;
    const need = document.createElement('p');
    need.className = 't-need';
    need.textContent = i <= stage ? '자랐어요' : `성장 ${RULES.STAGE_THRESHOLDS[i]}점이면 자라요`;
    text.append(title, need);
    li.append(img, text);
    return li;
  });
  list.replaceChildren(...items);
  $('stat-km').textContent = state.totalKm.toFixed(1);
  $('stat-water').textContent = String(state.waterCount);
  $('stat-growth').textContent = String(state.growth);
}

export function renderChip(weather, now = new Date()) {
  const time = now.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  $('chip').textContent = `${time} · ${weather === 'rain' ? '비' : '맑음'}`;
}

let toastTimer = 0;
export function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
