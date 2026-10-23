// 슈퍼차저 지도(실험판): 실제 길 지도 위 185곳, 고른 충전소 카드, 지역 도장 모으기, 가까운 슈퍼차저
import { CHARGE_RULES, REGIONS, regionById, chargers, regionCount, stampCoins, distanceKm } from './charge.js';
import { createGlMap } from './map-gl.js';
import { chargerPlace } from './charge-ui.js';
import { t, pick, locale } from './i18n.js';

const $ = (id) => document.getElementById(id);
const ALL = chargers();
const NEAR_COUNT = 3;
const regionName = (id) => { const r = regionById(id); return pick(r.ko, r.en); };
const plantOf = (id) => { const r = regionById(id); return pick(r.plantKo, r.plantEn); };
const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { month: 'long', day: 'numeric' });

/** 처음 열 때 고를 충전소: 가까운 곳, 위치를 모르면 가장 최근 도장, 그것도 없으면 첫 곳 */
export function defaultCharger(state, me) {
  if (me) return nearest(me, 1)[0].id;
  const last = Object.entries(state.stamps).sort((a, b) => b[1].localeCompare(a[1]))[0];
  return last ? Number(last[0]) : ALL[0].id;
}

const nearest = (me, n) => [...ALL].sort((a, b) => distanceKm(me, a) - distanceKm(me, b)).slice(0, n);

// 실제 길 지도는 무대 배율 밖(실제 화면 픽셀)에 그려야 손가락 위치가 맞는다. --fit은 main.js가 무대에 단다
const stageScale = () => Number(getComputedStyle($('stage')).getPropertyValue('--fit')) || 1;
// 전국 화면 여백: 왼쪽 위 + − 버튼과 오른쪽 그라데이션을 조금 피한다
const viewPadding = () => { const k = stageScale(); return { top: 16 * k, bottom: 16 * k, left: 16 * k, right: 40 * k }; };
let glMap = null;
let selectHandler = () => {};

function ensureMap() {
  if (glMap) return;
  glMap = createGlMap($('map-gl'), {
    scale: stageScale,
    padding: viewPadding,
    onSelect: (id) => selectHandler(id),
    onFail: () => { $('map-fail').hidden = false; },
  });
  $('map-zin').addEventListener('click', () => glMap.zoomIn());
  $('map-zout').addEventListener('click', () => glMap.zoomOut());
  $('map-zall').addEventListener('click', () => glMap.showAll());
  addEventListener('resize', () => glMap.resize());
}

/**
 * @param {{selectedId:number, me:{lat:number, lon:number}|null, onSelect:(id:number)=>void}} ctx
 */
export function renderMap(state, { selectedId, me, onSelect }) {
  selectHandler = onSelect;
  ensureMap();
  $('map-cnt').textContent = String(Object.keys(state.stamps).length);
  $('map-total').textContent = t('map.total', { n: ALL.length });
  const sel = ALL.find((c) => c.id === selectedId) || ALL[0];
  glMap.update({ all: ALL, stamps: state.stamps, selected: sel, me });
  renderCard(state, sel, me);
  renderRegions(state, sel.region);
  renderNear(state, me, onSelect);
}

function renderCard(state, c, me) {
  const visited = state.stamps[c.id];
  const region = regionName(c.region);
  const before = regionCount(state.stamps, c.region) - (visited ? 1 : 0);
  const nth = before + 1;
  const goal = CHARGE_RULES.REGION_GOAL;
  $('mc').classList.toggle('far', c.far && !visited);
  $('mc-k').textContent = visited ? t('map.visitedOn', { date: dayLabel(visited) }) : c.far ? t('map.far') : t('map.notYet');
  $('mc-name').textContent = t('charge.name', { name: chargerPlace(c).name });
  $('mc-city').textContent = me ? t('map.cityFrom', { region, city: chargerPlace(c).city, km: Math.round(distanceKm(me, c)) }) : `${region} ${chargerPlace(c).city}`;
  $('mc-head').textContent = t(visited ? 'map.got' : 'map.ifVisit');
  $('mc-pips').textContent = t('map.pipsN', { n: stampCoins(c) });
  $('mc-pips').classList.toggle('y', c.far);
  $('mc-stamp-k').textContent = t(nth === 1 ? 'map.firstStamp' : nth === 2 ? 'map.secondStamp' : 'map.regionStamp');
  $('mc-stamp').textContent = nth === 1 ? t('map.seed', { plant: plantOf(c.region) }) : nth === 2 ? t('map.badge', { region }) : t('map.allDone');
  // 이 지역 도장이 목표에 닿으면 만날 수 있고, 이미 한 곳 가 봤으면 한 곳 더, 아니면 두 곳 규칙
  $('mc-resident').textContent = t(nth >= goal ? 'map.residentMeet' : visited ? 'map.residentOne' : 'map.residentTwo');
}

function renderRegions(state, active) {
  const goal = CHARGE_RULES.REGION_GOAL;
  $('map-regions').replaceChildren(...REGIONS.map((r) => {
    const n = regionCount(state.stamps, r.id);
    const total = ALL.filter((c) => c.region === r.id).length;
    const div = document.createElement('div');
    div.className = `mr${r.id === active ? ' on' : ''}`;
    const top = document.createElement('div');
    top.className = 'mr-top';
    const name = document.createElement('b');
    name.textContent = regionName(r.id);
    const count = document.createElement('span');
    count.textContent = t('map.of', { n: Math.min(n, goal), goal, total });
    top.append(name, count);
    const bar = document.createElement('div');
    bar.className = 'mr-bar';
    const fill = document.createElement('i');
    fill.style.setProperty('--p', String(Math.min(1, n / goal)));
    bar.append(fill);
    const lines = document.createElement('p');
    const one = document.createElement('span');
    one.className = n >= 1 ? 'ok' : '';
    one.textContent = t('map.regionLine1', { plant: plantOf(r.id) });
    const two = document.createElement('span');
    two.className = n >= goal ? 'ok' : '';
    two.textContent = t('map.regionLine2');
    lines.append(one, document.createElement('br'), two);
    div.append(top, bar, lines);
    return div;
  }));
}

function renderNear(state, me, onSelect) {
  const list = $('map-near');
  if (!me) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = t('map.noLocation');
    list.replaceChildren(li);
    return;
  }
  list.replaceChildren(...nearest(me, NEAR_COUNT).map((c) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    const name = document.createElement('b');
    name.textContent = t('charge.name', { name: chargerPlace(c).name });
    const where = document.createElement('span');
    where.textContent = t('map.near', { city: chargerPlace(c).city, km: distanceKm(me, c).toFixed(1) });
    btn.append(name, where);
    if (state.stamps[c.id]) {
      const em = document.createElement('em');
      em.textContent = t('map.hasStamp');
      btn.append(em);
    }
    btn.addEventListener('click', () => onSelect(c.id));
    li.append(btn);
    return li;
  }));
}
