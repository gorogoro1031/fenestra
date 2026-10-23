// 충전 리워드 시트(실험판): 지금 머문 슈퍼차저, 비료, 충전소 도장책
import { CHARGE_RULES, chargers, chargerById, isCharging, fertDue, msToNextFert } from './charge.js';
import { LAST_STAGE, stageOf, activePlant } from './state.js';
import { plantName } from './plants.js';
import { t, pick } from './i18n.js';

const $ = (id) => document.getElementById(id);
const TOTAL = chargers().length;
const MIN = 60 * 1000;
// 도장 색과 기울기는 슈퍼차저 id로 정해서 열 때마다 바뀌지 않게
const STAMP_COLORS = ['#7ee8a8', '#ecf03c', '#ff8fb1', '#a8d8ff', '#ffb36b', '#d4b4ff'];
const STAMP_TILT = [-8, 6, -4, 9, -6, 3];
// 빈 칸까지 채워 적어도 두 줄은 보이게
const MIN_CELLS = 8;

/** 이 슈퍼차저를 지금 언어로: 부르는 이름(자리 이름, 없으면 도시), 도시, 자리 이름 */
export function chargerPlace(c) {
  const city = pick(c.ko, c.en);
  const label = pick(c.labelKo, c.labelEn);
  return { name: label || city, city, label };
}

/**
 * @param {{state:object, session:import('./charge.js').ChargeSession|null, now:number, gpsOn:boolean, today:string}} ctx
 */
export function renderCharge({ state, session, now, gpsOn, today }) {
  renderNow(session, now, gpsOn);
  renderFert(state);
  renderStamps(state, today);
}

function renderNow(session, now, gpsOn) {
  const charger = session && chargerById(session.id);
  const mode = !charger ? 'idle' : isCharging(session, now) ? 'on' : 'near';
  $('cn').className = `cn ${mode}`;
  $('cn-k').textContent = t(`charge.${mode}`);
  $('cn-min').hidden = mode === 'idle';
  $('cn-bar-wrap').hidden = mode === 'idle';
  $('cn-place').hidden = mode === 'idle';
  if (mode === 'idle') {
    $('cn-name').textContent = t('charge.idleTitle');
    $('cn-sub').textContent = t(gpsOn ? 'charge.idleSub' : 'charge.needGps');
    return;
  }
  const { name, city, label } = chargerPlace(charger);
  const elapsed = Math.max(0, now - session.since);
  $('cn-name').textContent = t('charge.name', { name });
  // 자리 이름이 있으면 아래에 도시, 없으면 제목이 이미 도시
  $('cn-place').textContent = label ? city : t('charge.country');
  const unit = document.createElement('small');
  unit.textContent = t('charge.minUnit');
  $('cn-min').replaceChildren(String(Math.floor(elapsed / MIN)), unit);
  const left = msToNextFert(session, now);
  $('cn-bar').style.setProperty('--p', String(1 - left / CHARGE_RULES.FERT_EVERY_MS));
  const n = Math.ceil(left / MIN);
  $('cn-sub').textContent = mode === 'on' ? t('charge.onSub', { n, got: fertDue(session, now) }) : t('charge.nearSub', { n });
}

function renderFert(state) {
  const grown = activePlant(state).grown || stageOf(state) === LAST_STAGE;
  $('fert-count').textContent = t('charge.fertCount', { n: state.fert });
  $('fert-sub').textContent = state.fert === 0 ? t('charge.fertNone') : grown ? t('charge.fertGrown') : t('charge.fertSub', { plant: plantName(state.active), n: CHARGE_RULES.FERT_GROWTH });
  $('fert-use').disabled = state.fert === 0 || grown;
}

function renderStamps(state, today) {
  const visited = Object.entries(state.stamps)
    .map(([id, date]) => ({ c: chargerById(Number(id)), date }))
    .filter((v) => v.c)
    .sort((a, b) => b.date.localeCompare(a.date));
  $('stamp-count').textContent = t('charge.stampCount', { n: visited.length, total: TOTAL });
  const cells = visited.map(({ c, date }) => {
    const li = document.createElement('li');
    li.className = `stamp${date === today ? ' new' : ''}`;
    li.style.setProperty('--c', STAMP_COLORS[c.id % STAMP_COLORS.length]);
    li.style.setProperty('--r', `${STAMP_TILT[c.id % STAMP_TILT.length]}deg`);
    const b = document.createElement('b');
    const { city, label } = chargerPlace(c);
    b.textContent = city;
    const span = document.createElement('span');
    span.textContent = `${date.slice(5).replace('-', '.')}${label ? ` · ${label}` : ''}`;
    li.append(b, span);
    return li;
  });
  const empty = Math.max(MIN_CELLS - cells.length, (4 - (cells.length % 4)) % 4);
  for (let i = 0; i < empty; i += 1) {
    const li = document.createElement('li');
    li.className = 'stamp empty';
    li.innerHTML = '<b>?</b>';
    cells.push(li);
  }
  $('stamps').replaceChildren(...cells);
}
