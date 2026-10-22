// 상태를 화면 글자·게이지로 옮기는 함수들
import { RULES, LAST_STAGE, stageOf, growthOf, thresholdsOf, waterCheck, bonusNow, stageFor, kmToNextDrop } from './state.js';
import { PLANTS, PLANT_IDS, plantImage, stageName } from './plants.js';
import { GUESTS, GUEST_IDS, guestImage } from './guests.js';

const $ = (id) => document.getElementById(id);

// 햇빛 게이지 점 개수 (이슬은 최대치 12개와 같게 해 점 하나 = 한 개)
// 다음 단계까지 칸은 남은 점수만큼 나누되 너무 잘게 쪼개지 않게
const LIGHT_DOTS = 10;
const MAX_STEPS = 10;

/** 같은 모양 칸 n개 중 앞에서 on개를 켠다 */
function renderPips(el, on, n) {
  if (el.children.length !== n) el.replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
  [...el.children].forEach((pip, i) => pip.classList.toggle('on', i < on));
}

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
  $('stage-name').textContent = stageName(state.active, stage);
  $('stage-sub').textContent = stage === LAST_STAGE ? '다 자랐어요. 온실에서 새 식물을 들여요' : `다음 단계까지 ${pointsToNext(state)}점`;
  renderPips($('stage-pips'), stage + 1, LAST_STAGE + 1);
  const thumb = $('grow-thumb');
  const src = plantImage(state.active, stage);
  if (thumb.getAttribute('src') !== src) thumb.setAttribute('src', src);
  thumb.classList.toggle('seed', stage === 0);
  // 다음 단계까지 칸: 지금 단계 구간을 최대 10칸으로 나눠 채운 만큼 켠다
  const th = thresholdsOf(state);
  const span = stage === LAST_STAGE ? 1 : th[stage + 1] - th[stage];
  const steps = Math.min(MAX_STEPS, span);
  const filled = stage === LAST_STAGE ? steps : Math.floor(((growthOf(state) - th[stage]) / span) * steps);
  renderPips($('grow-steps'), filled, steps);
  $('drops-num').textContent = String(state.drops);
  renderDots($('drops-dots'), state.drops, RULES.MAX_DROPS);
  $('light-num').textContent = String(Math.round(state.light));
  renderDots($('light-dots'), (state.light / RULES.MAX_LIGHT) * LIGHT_DOTS, LIGHT_DOTS);
  $('today-km').textContent = state.todayKm.toFixed(1);
  $('coin-num').textContent = String(state.coins);
  $('gift-badge').hidden = !(state.waterCount === 0 && state.totalKm === 0 && state.drops > 0);

  const check = waterCheck(state);
  const waterBtn = $('water-btn');
  waterBtn.disabled = driving || !check.ok;
  // 이슬이 없으면 '기다리는 중'(고리가 다음 이슬까지 차오름), 운전 중·다 자람이면 '쉬는 중'
  const waiting = !driving && check.reason === 'no-drops';
  waterBtn.classList.toggle('wait', waiting);
  waterBtn.classList.toggle('rest', waterBtn.disabled && !waiting);
  waterBtn.style.setProperty('--p', String(1 - kmToNextDrop(state) / RULES.KM_PER_DROP));
  $('water-sub').textContent = waterSubtitle(state, check, { driving, isNight });
  const chargeBtn = $('charge-btn');
  chargeBtn.setAttribute('aria-pressed', String(charging));
  chargeBtn.disabled = driving;
  $('charge-title').textContent = charging ? '충전 중' : '충전 시작';
  $('charge-sub').textContent = charging ? '햇빛이 차는 중' : '햇빛 모으기';
  $('driving-banner').hidden = !driving;
}

function waterSubtitle(state, check, { driving, isNight }) {
  if (driving) return '차를 세우면 줄 수 있어요';
  if (check.reason === 'grown') return '다 자랐어요';
  // 소수점은 한 자리, .0이면 떼서 짧게 (7.3km · 10km)
  if (check.reason === 'no-drops') return `다음 이슬까지 ${Number(kmToNextDrop(state).toFixed(1))}km`;
  if (check.reason === 'dry-limit') return '오늘은 충분해요';
  if (stageOf(state) === 0 && state.waterCount === 0) return `새싹까지 물 ${pointsToNext(state)}번`;
  if (!bonusNow(state, { isNight })) return '이슬 1개';
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
  renderGuestbook(state);
  $('gh-coin-num').textContent = String(state.coins);
  $('stat-km').textContent = state.totalKm.toFixed(1);
  $('stat-water').textContent = String(state.waterCount);
  $('stat-grown').textContent = String(Object.values(state.plants).filter((p) => p.grown).length);
}

/** 손님 도감: 만난 손님은 몇 번 만났는지, 아직이면 실루엣과 물음표 */
function renderGuestbook(state) {
  const cells = GUEST_IDS.map((id) => {
    const times = state.guestbook[id] || 0;
    const li = document.createElement('li');
    li.className = times ? 'gb-cell' : 'gb-cell unmet';
    const img = document.createElement('img');
    img.src = guestImage(id);
    img.alt = '';
    const name = document.createElement('p');
    name.className = 'gb-name';
    name.textContent = times ? GUESTS[id].name : '???';
    const count = document.createElement('p');
    count.className = 'gb-times';
    count.textContent = times ? `${times}번 만남` : `꽃씨 +${GUESTS[id].coins}`;
    li.append(img, name, count);
    return li;
  });
  $('guestbook').replaceChildren(...cells);
  $('gb-count').textContent = `${Object.keys(state.guestbook).length} / ${GUEST_IDS.length}`;
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
