// 상태를 화면 글자·게이지로 옮기는 함수들
import { RULES, STAGE_NAMES, LAST_STAGE, stageOf, growthOf, thresholdsOf, waterCheck, bonusNow, stageFor } from './state.js';
import { PLANTS, PLANT_IDS, plantImage } from './plants.js';

const $ = (id) => document.getElementById(id);

// 햇빛 게이지 점 개수 (물방울은 최대치 12개와 같게 해 점 하나 = 한 개)
const LIGHT_DOTS = 10;

/** 점 total개 중 앞에서부터 filled개(내림)를 켠다. 새로 켜진 점은 톡 튄다 */
function renderDots(el, filled, total) {
  if (el.children.length !== total) el.replaceChildren(...Array.from({ length: total }, () => document.createElement('i')));
  const on = Math.floor(filled + 1e-9);
  [...el.children].forEach((dot, i) => {
    const lit = i < on;
    if (lit && !dot.classList.contains('on') && el.dataset.ready) {
      dot.classList.remove('pop');
      void dot.offsetWidth;
      dot.classList.add('pop');
    }
    dot.classList.toggle('on', lit);
  });
  el.dataset.ready = '1';
}

/** 다음 단계까지 남은 성장 점수 */
function pointsToNext(state) {
  const stage = stageOf(state);
  if (stage === LAST_STAGE) return 0;
  return thresholdsOf(state)[stage + 1] - growthOf(state);
}

/**
 * @param {object} state
 * @param {{charging:boolean, driving:boolean, isNight:boolean}} ctx
 */
export function renderStatus(state, { charging, driving, isNight }) {
  const stage = stageOf(state);
  $('plant-name').textContent = PLANTS[state.active].name;
  $('stage-name').textContent = STAGE_NAMES[stage];
  $('stage-sub').textContent = stage === LAST_STAGE ? '온실에서 새 식물을 들여요' : `다음 단계까지 ${pointsToNext(state)}점`;
  renderDots($('progress-dots'), stage, LAST_STAGE);
  $('drops-num').textContent = String(state.drops);
  renderDots($('drops-dots'), state.drops, RULES.MAX_DROPS);
  $('light-num').textContent = String(Math.round(state.light));
  renderDots($('light-dots'), (state.light / RULES.MAX_LIGHT) * LIGHT_DOTS, LIGHT_DOTS);
  $('today-km').textContent = state.todayKm.toFixed(1);
  $('coin-num').textContent = String(state.coins);

  const check = waterCheck(state);
  $('water-btn').disabled = driving || !check.ok;
  $('water-sub').textContent = waterSubtitle(state, check, { driving, isNight });
  const chargeBtn = $('charge-btn');
  chargeBtn.setAttribute('aria-pressed', String(charging));
  chargeBtn.disabled = driving;
  $('charge-sub').textContent = charging ? '햇빛이 차오르는 중' : '햇빛 모으기';
  $('driving-banner').hidden = !driving;
}

function waterSubtitle(state, check, { driving, isNight }) {
  if (driving) return '차를 세우면 줄 수 있어요';
  if (check.reason === 'grown') return '다 자랐어요';
  if (check.reason === 'no-drops') return `${RULES.KM_PER_DROP}km = 물방울 1개`;
  if (check.reason === 'dry-limit') return '오늘은 충분해요';
  if (!bonusNow(state, { isNight })) return '물방울 1개';
  return { sun: '햇빛과 함께 ×2', dry: '한 번에 ×2', night: '밤이라 ×2', road: '많이 달린 날 ×2' }[PLANTS[state.active].rule];
}

/**
 * 온실: 식물 카드마다 상태와 버튼(키우는 중 · 키우기 · 들이기)
 * @param {(action:'select'|'buy', id:string) => void} onPick
 */
export function renderGreenhouse(state, onPick) {
  const cards = PLANT_IDS.map((id) => {
    const info = PLANTS[id];
    const owned = state.plants[id];
    const li = document.createElement('li');
    li.className = `gh-card${state.active === id ? ' active' : ''}${owned ? '' : ' locked'}`;
    const img = document.createElement('img');
    img.src = plantImage(id, owned ? Math.max(1, stageFor(owned.growth, info.thresholds)) : LAST_STAGE);
    img.alt = '';
    const name = document.createElement('p');
    name.className = 'gh-name';
    name.textContent = info.name;
    const hint = document.createElement('p');
    hint.className = 'gh-hint';
    hint.textContent = info.hint;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gh-btn';
    if (state.active === id) {
      btn.classList.add('current');
      btn.textContent = owned.grown ? '다 키웠어요' : '키우는 중';
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = owned.grown ? '다 키움 · 보기' : '이 식물 키우기';
      btn.addEventListener('click', () => onPick('select', id));
    } else {
      btn.classList.add('buy');
      btn.textContent = `꽃씨 ${info.price}개로 들이기`;
      btn.disabled = state.coins < info.price;
      btn.addEventListener('click', () => onPick('buy', id));
    }
    li.append(img, name, hint, btn);
    return li;
  });
  $('gh-grid').replaceChildren(...cards);
  $('gh-coin-num').textContent = String(state.coins);
  $('stat-km').textContent = state.totalKm.toFixed(1);
  $('stat-water').textContent = String(state.waterCount);
  $('stat-grown').textContent = String(Object.values(state.plants).filter((p) => p.grown).length);
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
