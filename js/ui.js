// 상태를 화면 글자·게이지로 옮기는 함수들
import { RULES, LAST_STAGE, stageOf, growthOf, thresholdsOf, waterCheck, bonusNow, bonusInfo, stageFor, kmToNextDrop } from './state.js';
import { PLANTS, PLANT_IDS, SHOP_PLANT_IDS, plantImage, stageName, adultOf, plantName, guideOf, conditionFor } from './plants.js';
import { GUESTS, guestImage, guestName, guestInfo, friendIds, isResident } from './guests.js';
import { CHARGE_RULES, REGIONS, regionCount } from './charge.js';
import { t, locale, pick } from './i18n.js';

const $ = (id) => document.getElementById(id);

// 다음 단계까지 칸은 남은 점수만큼 나누되 너무 잘게 쪼개지 않게 (이슬 점은 최대치 12개와 같게, 점 하나 = 한 개)
const MAX_STEPS = 10;
// 컨디션 기온 막대의 양 끝(°C)
const BAR_MIN = 0;
const BAR_MAX = 40;

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

const roundTemp = (temp) => Math.round(temp);
export const barPercent = (temp) => ((Math.min(BAR_MAX, Math.max(BAR_MIN, temp)) - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100;

/**
 * @typedef {{driving:boolean, isNight:boolean, sunny:boolean, temp:number|null}} StatusContext
 *  sunny: 실제 날씨가 맑거나 구름 조금인 낮, temp: 지금 기온(모르면 null)
 */

/**
 * @param {object} state
 * @param {StatusContext} ctx
 */
export function renderStatus(state, ctx) {
  const { driving } = ctx;
  const stage = stageOf(state);
  $('plant-name').textContent = plantName(state.active);
  $('stage-name').textContent = stageName(state.active, stage);
  $('stage-sub').textContent = stage === LAST_STAGE ? t('stage.grownSub') : t('stage.toNext', { n: pointsToNext(state) });
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
  const grown = stage === LAST_STAGE;
  $('grow-steps').hidden = grown;
  $('grow-meaning').hidden = !grown;
  $('grow-meaning').textContent = grown ? t('latin', { meaning: adultOf(state.active).meaning }) : '';
  $('drops-num').textContent = String(state.drops);
  renderDots($('drops-dots'), state.drops, RULES.MAX_DROPS);
  $('today-km').textContent = state.todayKm.toFixed(1);
  $('coin-num').textContent = String(state.coins);
  $('gift-badge').hidden = !(state.waterCount === 0 && state.totalKm === 0 && state.drops > 0);
  const hasNewGuest = state.newGuests.length > 0;
  $('guest-dot').hidden = !hasNewGuest;
  $('open-greenhouse').setAttribute('aria-label', t(hasNewGuest ? 'greenhouse.labelNew' : 'greenhouse.label'));
  // 상단 식물 버튼: 지금 키우는 식물 사진·이름·단계
  const pickSrc = plantImage(state.active, Math.max(1, stage));
  if ($('pick-img').getAttribute('src') !== pickSrc) $('pick-img').setAttribute('src', pickSrc);
  $('pick-name').textContent = plantName(state.active);
  $('pick-sub').textContent = t('pick.sub', { stage: stageName(state.active, stage) });
  renderCondition(state, ctx);

  const check = waterCheck(state);
  const waterBtn = $('water-btn');
  waterBtn.disabled = driving || !check.ok;
  // 이슬이 없으면 '기다리는 중'(고리가 다음 이슬까지 차오름), 운전 중·다 자람이면 '쉬는 중'
  const waiting = !driving && check.reason === 'no-drops';
  waterBtn.classList.toggle('wait', waiting);
  waterBtn.classList.toggle('rest', waterBtn.disabled && !waiting);
  waterBtn.style.setProperty('--p', String(1 - kmToNextDrop(state) / RULES.KM_PER_DROP));
  $('water-sub').textContent = waterSubtitle(state, check, ctx);
  $('water-x2').hidden = waterBtn.disabled || !bonusNow(state, ctx);
  $('driving-banner').hidden = !driving;
}

/** 컨디션 위젯: 지금 기온이 식물에게 맞는지(막대), 지금 물 주면 두 배인지(알약) */
function renderCondition(state, { temp, isNight, sunny }) {
  const condition = conditionFor(state.active, temp);
  const [low, high] = guideOf(state.active).temp;
  $('cond').dataset.state = condition;
  $('cond-state').textContent = t(`cond.${condition}`);
  const range = $('cond-range');
  range.style.left = `${barPercent(low)}%`;
  range.style.width = `${barPercent(high) - barPercent(low)}%`;
  const known = condition !== 'unknown';
  $('cond-now').hidden = !known;
  if (known) $('cond-now').style.left = `${barPercent(temp)}%`;
  $('cond-temp').textContent = known ? t('cond.now', { temp: roundTemp(temp) }) : '';
  $('cond-best').textContent = t('cond.best', { low, high });
  const bonus = bonusInfo(state, { isNight, sunny });
  const pill = $('cond-bonus');
  const grown = stageOf(state) === LAST_STAGE;
  pill.classList.toggle('on', bonus.active && !grown);
  pill.textContent = grown ? t('water.grown') : bonusText(bonus);
}

/** 두 배 알약 글자: 지금이면 '지금 물 주면 ×2', 아니면 언제 되는지 */
export function bonusText({ rule, active, left }) {
  if (rule === 'dry') return active ? t('bonus.dry.on', { n: left }) : t('bonus.dry.off');
  if (active) return t('bonus.on');
  return rule === 'road' ? t('bonus.road.off', { km: left }) : t(`bonus.${rule}.off`);
}

/** 로고 아래 지금 날씨: 큰 기온, 날씨 이름, 지역 */
export function renderWeatherNow({ temp, label, place }) {
  $('wn-temp').textContent = Number.isFinite(temp) ? `${roundTemp(temp)}°` : '–°';
  $('wn-sky').textContent = label;
  $('wn-place').textContent = place || '';
  $('wn-place').hidden = !place;
}

function waterSubtitle(state, check, ctx) {
  if (ctx.driving) return t('water.driving');
  if (check.reason === 'grown') return t('water.grown');
  // 소수점은 한 자리, .0이면 떼서 짧게 (7.3km · 10km)
  if (check.reason === 'no-drops') return t('water.noDrops', { km: Number(kmToNextDrop(state).toFixed(1)) });
  if (check.reason === 'dry-limit') return t('water.dryLimit');
  if (stageOf(state) === 0 && state.waterCount === 0) return t('water.firstSprout', { n: pointsToNext(state) });
  if (!bonusNow(state, ctx)) return t('water.one');
  return t(`water.bonus.${PLANTS[state.active].rule}`);
}

/** 식물 도감 시트: 소개, 원산지·알맞은 온도·두 배 조건·성장 점수, 다섯 단계 카드 */
/**
 * 전체 화면 식물 도감. 가진 식물은 위 탭으로 바꿔 볼 수 있다
 * @param {string} id 볼 식물 (가진 식물)
 * @param {(id:string) => void} onPick 탭을 누르면
 */
export function renderGuide(state, id, onPick) {
  // 아직 안 들인 식물도 도감에서 볼 수 있다: 다 자란 모습은 실루엣, 단계는 모두 잠김
  const owned = Boolean(state.plants[id]);
  const plant = state.plants[id] || { growth: 0, grown: false };
  const thresholds = PLANTS[id].thresholds;
  const stage = owned ? stageFor(plant.growth, thresholds) : -1;
  const guide = guideOf(id);
  $('ps-tabs').replaceChildren(...PLANT_IDS.filter((p) => state.plants[p]).map((p) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.textContent = plantName(p);
    tab.setAttribute('aria-pressed', String(p === id));
    tab.addEventListener('click', () => onPick(p));
    return tab;
  }));
  $('ps-tabs').hidden = Object.keys(state.plants).length < 2;
  $('ps-img').src = plantImage(id, owned ? Math.max(1, stage) : LAST_STAGE);
  $('ps-img').parentElement.classList.toggle('locked', !owned);
  $('ps-now').textContent = owned ? `${t('guide.badge.now')} · ${stageName(id, stage)}` : t('guide.notOwned', { n: PLANTS[id].price });
  $('ps-name').textContent = plantName(id);
  $('ps-tag').textContent = guide.tag;
  $('ps-about').textContent = guide.about;
  $('ps-origin').textContent = guide.origin;
  $('ps-temp').textContent = `${guide.temp[0]}–${guide.temp[1]}°`;
  $('ps-when').textContent = t(`guide.when.${PLANTS[id].rule}`);
  $('ps-record').textContent = owned ? t('guide.record', { n: plant.growth, need: thresholds[LAST_STAGE] }) : '–';
  const cards = guide.stages.map((desc, i) => {
    const li = document.createElement('li');
    li.className = `g-stage${i === stage ? ' now' : ''}${i > stage ? ' locked' : ''}`;
    const art = document.createElement('div');
    art.className = 'art';
    const img = document.createElement('img');
    img.src = plantImage(id, i);
    img.alt = '';
    art.append(img);
    const text = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = stageName(id, i);
    const p = document.createElement('p');
    p.textContent = desc;
    text.append(name, p);
    li.append(art, text);
    return li;
  });
  $('ps-stages').replaceChildren(...cards);
}

/**
 * 주행 요약 카드
 * @param {{km:number, drops:number, coins:number}} trip
 */
export function renderTrip(trip, state, now = new Date()) {
  const time = now.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
  $('trip-when').textContent = t('trip.when', { time });
  $('trip-km').firstChild.textContent = trip.km.toFixed(1);
  $('trip-drops').textContent = `+${trip.drops}`;
  $('trip-coins').textContent = `+${trip.coins}`;
  const stage = stageOf(state);
  const plant = plantName(state.active);
  const next = stage === LAST_STAGE ? t('trip.grown', { plant }) : t('trip.next', { plant, stage: stageName(state.active, stage + 1), n: pointsToNext(state) });
  const drop = state.drops >= RULES.MAX_DROPS ? t('trip.dropFull') : t('trip.nextDrop', { km: Number(kmToNextDrop(state).toFixed(1)) });
  $('trip-line').textContent = `${next} · ${drop}`;
  // 줄 수 있는 물이 있을 때만 '물 주러 가기'
  $('trip-water').hidden = !waterCheck(state).ok;
}

/**
 * 도감 식물 탭: 식물 카드마다 그림·이름·한 줄 소개(누르면 설명)와 버튼(키우는 중 · 키우기 · 들이기)
 * @param {(action:'select'|'buy', id:string) => void} onPick
 * @param {(id:string) => void} onOpen 카드를 누르면 그 식물 설명
 */
export function renderGreenhouse(state, onPick, onOpen, { regional = false } = {}) {
  const cards = SHOP_PLANT_IDS.map((id) => plantCard(state, id, onPick, onOpen));
  $('gh-grid').replaceChildren(...cards);
  const seeds = regional ? renderRegionalPlants(state, onPick, onOpen) : 0;
  const shopOwned = SHOP_PLANT_IDS.filter((id) => state.plants[id]).length;
  $('tab-plants-n').textContent = `${shopOwned + seeds}/${SHOP_PLANT_IDS.length + (regional ? REGIONS.length : 0)}`;
  $('gh-coin-num').textContent = String(state.coins);
  $('stat-km').textContent = state.totalKm.toFixed(1);
  $('stat-water').textContent = String(state.waterCount);
  $('stat-grown').textContent = String(Object.values(state.plants).filter((p) => p.grown).length);
}

/** 도감 식물 카드 하나: 그림, 이름, 한 줄 소개, 키우기·들이기 버튼 */
function plantCard(state, id, onPick, onOpen) {
  const info = PLANTS[id];
  const owned = state.plants[id];
  const li = document.createElement('li');
  li.className = `gh-card${state.active === id ? ' active' : ''}${owned ? '' : ' locked'}`;
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'gh-open';
  open.addEventListener('click', () => onOpen(id));
  const img = document.createElement('img');
  img.src = plantImage(id, owned ? Math.max(1, stageFor(owned.growth, info.thresholds)) : LAST_STAGE);
  img.alt = '';
  // 다 키운 식물은 라틴어 이름으로
  const name = document.createElement('p');
  name.className = 'gh-name';
  name.textContent = owned?.grown ? adultOf(id).name : plantName(id);
  const hint = document.createElement('p');
  hint.className = 'gh-hint';
  hint.textContent = guideOf(id).tag;
  open.append(img, name, hint);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gh-btn';
  if (state.active === id) {
    btn.classList.add('current');
    btn.textContent = owned.grown ? t('gh.grownDone') : `${stageName(id, stageFor(owned.growth, info.thresholds))} · ${t('gh.more')}`;
    btn.addEventListener('click', () => onOpen(id));
    const tag = document.createElement('span');
    tag.className = 'gh-tagx';
    tag.textContent = t('gh.growing');
    li.append(tag);
  } else if (owned) {
    btn.textContent = t(owned.grown ? 'gh.grownView' : 'gh.grow');
    btn.addEventListener('click', () => onPick('select', id));
  } else {
    btn.classList.add('buy');
    btn.textContent = t('gh.buy', { n: info.price });
    btn.disabled = state.coins < info.price;
    btn.addEventListener('click', () => onPick('buy', id));
  }
  li.append(open, btn);
  return li;
}

/**
 * 도감 식물 탭의 지역 식물(실험판): 그 지역 슈퍼차저에 처음 들러 씨앗을 받았으면 그림과 이름, 아니면 실루엣과 ???.
 * 받은 씨앗 중 자라는 그림이 있는 식물(PLANTS에 있음)은 다른 식물처럼 키울 수 있고, 없으면 '곧'
 * @returns {number} 받은 씨앗 수
 */
function renderRegionalPlants(state, onPick, onOpen) {
  const cards = REGIONS.map((r) => {
    const seed = regionCount(state.stamps, r.id) >= 1;
    if (seed && state.plants[r.plant]) return plantCard(state, r.plant, onPick, onOpen);
    const li = document.createElement('li');
    li.className = `gh-card${seed ? '' : ' locked'}`;
    const body = document.createElement('div');
    body.className = 'gh-open';
    const img = document.createElement('img');
    img.src = `assets/regional/${r.plant}.webp`;
    img.alt = '';
    const name = document.createElement('p');
    name.className = 'gh-name';
    name.textContent = seed ? pick(r.plantKo, r.plantEn) : '???';
    const hint = document.createElement('p');
    hint.className = 'gh-hint';
    hint.textContent = t(seed ? 'gh.regionalSeed' : 'gh.regionalLocked');
    body.append(img, name, hint);
    li.append(body);
    return li;
  });
  $('gh-regional').replaceChildren(...cards);
  return REGIONS.filter((r) => regionCount(state.stamps, r.id) >= 1).length;
}

/**
 * 도감 프렌즈 탭: 만난 프렌즈는 그림과 이름, 아직이면 실루엣과 ???. 누르면 프렌즈 설명
 * @param {(id:string) => void} onOpen
 * @param {{residents?:boolean}} opts residents: 실험판이면 지역 주민도 아직 못 만난 프렌즈로 보인다
 */
export function renderGuestbook(state, onOpen, { residents = false } = {}) {
  const ids = friendIds(residents);
  const cells = ids.map((id) => {
    const times = state.guestbook[id] || 0;
    const li = document.createElement('li');
    li.className = times ? 'gb-cell' : 'gb-cell unmet';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'gb-open';
    open.addEventListener('click', () => onOpen(id));
    const img = document.createElement('img');
    img.src = guestImage(id);
    img.alt = '';
    const text = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'gb-name';
    name.textContent = times ? guestName(id) : '???';
    const count = document.createElement('p');
    count.className = 'gb-times';
    count.textContent = times ? t('gb.met', { n: times }) : guestInfo(id).when;
    text.append(name, count);
    open.append(img, text);
    li.append(open);
    if (state.newGuests.includes(id)) {
      const badge = document.createElement('span');
      badge.className = 'gb-new';
      badge.textContent = 'NEW';
      li.append(badge);
    }
    return li;
  });
  $('guestbook').replaceChildren(...cells);
  $('gb-count').textContent = `${ids.filter((id) => state.guestbook[id]).length}/${ids.length}`;
}

/** 손님 설명 화면. 아직 못 만난 손님은 실루엣과 ???, 언제 오는지만 알려 준다 */
export function renderGuest(state, id) {
  const times = state.guestbook[id] || 0;
  const info = guestInfo(id);
  $('gs-img').src = guestImage(id);
  $('gs-img').parentElement.classList.toggle('unmet', !times);
  $('gs-name').textContent = times ? guestName(id) : '???';
  const resident = isResident(id);
  $('gs-tag').textContent = times ? info.tag : t(resident ? 'gs.unmetResident' : 'gs.unmet');
  $('gs-about').textContent = times ? info.about : t(resident ? 'gs.unmetResidentAbout' : 'gs.unmetAbout');
  $('gs-met').textContent = times ? t('gs.times', { n: times }) : t('gs.notYet');
  $('gs-when').textContent = info.when;
  // 지역 주민은 따로 꽃씨가 없어서 지역 도장 두 곳을 채울 때 받는 꽃씨를 보여 준다
  $('gs-coins').textContent = t('gs.coins', { n: resident ? CHARGE_RULES.REGION_COINS : GUESTS[id].coins });
}

/** 손님 도감: 만난 손님은 몇 번 만났는지, 아직이면 실루엣과 물음표. 처음 만나고 아직 안 본 손님엔 NEW */

/** 인사 한 줄: 'Good evening, ' + 이름(강조). 이름이 없으면 인사만 */
export function renderGreeting(el, { period, name }) {
  const parts = [t(`greet.${period}`)];
  if (name) {
    const b = document.createElement('b');
    b.textContent = name;
    parts.push(', ', b);
  }
  el.replaceChildren(...parts);
}

/** 상단 로고 옆 시각 */
export function renderChip(now = new Date()) {
  $('chip').textContent = now.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
}

let toastTimer = 0;
export function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
