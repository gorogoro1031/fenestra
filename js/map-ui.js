// 슈퍼차저 지도(실험판): 대한민국 지도 위 185곳, 고른 충전소 카드, 지역 도장 모으기, 가까운 슈퍼차저
import { CHARGE_RULES, REGIONS, regionById, chargers, regionCount, stampCoins, distanceKm } from './charge.js';
import { PROVINCE_PATHS, project } from './korea-map.js';
import { chargerPlace } from './charge-ui.js';
import { t, pick, locale } from './i18n.js';

const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const ALL = chargers().map((c) => {
  const [x, y] = project(c.lon, c.lat);
  return { ...c, x, y };
});
const NEAR_COUNT = 3;
// 지도 끌기·확대: 전국 화면(index.html의 viewBox)에서 4배까지. 손가락이 이만큼 안 움직였으면 누른 것으로 본다
const BASE_VIEW = Object.freeze({ x: 30, y: 8, w: 770, h: 980 });
const MAX_ZOOM = 16;
const TAP_PX = 12;
const BUTTON_ZOOM = 1.6;
let view = { ...BASE_VIEW };
let selectHandler = () => {};

const svg = (tag, attrs) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
};
const regionName = (id) => { const r = regionById(id); return pick(r.ko, r.en); };
const plantOf = (id) => { const r = regionById(id); return pick(r.plantKo, r.plantEn); };
const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { month: 'long', day: 'numeric' });

let landDrawn = false;
function drawLand() {
  if (landDrawn) return;
  landDrawn = true;
  $('kmap-land').replaceChildren(...PROVINCE_PATHS.map((d) => svg('path', { d })));
  setupPanZoom($('kmap'));
  drawDetail();
}

/** 확대하면 보이는 시·군·구 경계·이름과 도로. 파일이 커서 지도를 처음 열 때 따로 불러온다 */
async function drawDetail() {
  try {
    const { DISTRICTS, ROADS } = await import('./korea-detail.js');
    $('kmap-roads').replaceChildren(...ROADS.map(([exp, d]) => svg('path', { d, class: exp ? 'km-exp' : 'km-road' })));
    $('kmap-gu').replaceChildren(...DISTRICTS.map(([, d]) => svg('path', { d })));
    $('kmap-names').replaceChildren(...DISTRICTS.map(([name, , x, y]) => {
      // 구는 좁아서 더 크게 확대했을 때만 이름을 보인다
      const text = svg('text', { x, y, class: name.endsWith('구') ? 'km-nm gu' : 'km-nm' });
      text.textContent = name;
      return text;
    }));
  } catch {
    // 못 불러와도 시·도 지도와 슈퍼차저 점은 그대로 쓸 수 있다
  }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** 확대 배율을 지키고, 지도가 화면 밖으로 다 나가지 않게 가운데를 전국 범위 안에 둔다 */
function clampView({ x, y, w }) {
  const nw = clamp(w, BASE_VIEW.w / MAX_ZOOM, BASE_VIEW.w);
  const nh = nw * (BASE_VIEW.h / BASE_VIEW.w);
  const cx = clamp(x + w / 2, BASE_VIEW.x, BASE_VIEW.x + BASE_VIEW.w);
  const cy = clamp(y + (w * (BASE_VIEW.h / BASE_VIEW.w)) / 2, BASE_VIEW.y, BASE_VIEW.y + BASE_VIEW.h);
  return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
}

function applyView(el) {
  el.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  // 점·고리·이름은 확대해도 화면에서 같은 크기. 확대 배율(--z)에 따라 구 경계·이름·도로가 서서히 나타난다
  el.style.setProperty('--k', String(view.w / BASE_VIEW.w));
  el.style.setProperty('--z', String(BASE_VIEW.w / view.w));
}

/** 화면 1px이 지도 좌표 몇인지, 그리고 화면 점 → 지도 좌표 */
function toMap(el, clientX, clientY) {
  const box = el.getBoundingClientRect();
  const s = Math.max(view.w / box.width, view.h / box.height);
  // preserveAspectRatio xMinYMid: 왼쪽 맞춤, 세로 가운데
  const offY = (box.height - view.h / s) / 2;
  return { s, x: view.x + (clientX - box.left) * s, y: view.y + (clientY - box.top - offY) * s };
}

/** (mx, my) 지도 좌표를 그 자리에 둔 채로 factor배 확대 */
function zoomAt(el, mx, my, factor) {
  const w = clamp(view.w / factor, BASE_VIEW.w / MAX_ZOOM, BASE_VIEW.w);
  const k = w / view.w;
  view = clampView({ x: mx - (mx - view.x) * k, y: my - (my - view.y) * k, w });
  applyView(el);
}

/** 한 손가락 끌기, 두 손가락 벌리기, 휠, + − 전국 버튼. 오른쪽 프레임은 그대로 */
function setupPanZoom(el) {
  const pts = new Map();
  let start = null;
  let pinch = null;
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) start = { x: e.clientX, y: e.clientY, moved: false };
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
      if (start) start.moved = true;
    }
  });
  el.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pts.set(e.pointerId, now);
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toMap(el, (a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt(el, mid.x, mid.y, d / pinch.d);
      pinch = { d };
      return;
    }
    if (start && Math.hypot(now.x - start.x, now.y - start.y) > TAP_PX) start.moved = true;
    if (!start?.moved) return;
    const { s } = toMap(el, now.x, now.y);
    view = clampView({ x: view.x - (now.x - prev.x) * s, y: view.y - (now.y - prev.y) * s, w: view.w });
    applyView(el);
  });
  const end = (e) => {
    if (!pts.delete(e.pointerId)) return;
    if (pts.size < 2) pinch = null;
    if (pts.size > 0) return;
    // 끌지 않고 뗐으면 그 자리의 충전소를 고른다
    if (start && !start.moved && e.type === 'pointerup') {
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.closest?.('.km-s'));
      const id = hit?.closest('.km-s').dataset.id;
      if (id) selectHandler(Number(id));
    }
    start = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const m = toMap(el, e.clientX, e.clientY);
    zoomAt(el, m.x, m.y, Math.exp(-e.deltaY / 400));
  }, { passive: false });

  const zoomCenter = (factor) => zoomAt(el, view.x + view.w / 2, view.y + view.h / 2, factor);
  $('map-zin').addEventListener('click', () => zoomCenter(BUTTON_ZOOM));
  $('map-zout').addEventListener('click', () => zoomCenter(1 / BUTTON_ZOOM));
  $('map-zall').addEventListener('click', () => { view = { ...BASE_VIEW }; applyView(el); });
  applyView(el);
}

/** 처음 열 때 고를 충전소: 가까운 곳, 위치를 모르면 가장 최근 도장, 그것도 없으면 첫 곳 */
export function defaultCharger(state, me) {
  if (me) return nearest(me, 1)[0].id;
  const last = Object.entries(state.stamps).sort((a, b) => b[1].localeCompare(a[1]))[0];
  return last ? Number(last[0]) : ALL[0].id;
}

const nearest = (me, n) => [...ALL].sort((a, b) => distanceKm(me, a) - distanceKm(me, b)).slice(0, n);

/**
 * @param {{selectedId:number, me:{lat:number, lon:number}|null, onSelect:(id:number)=>void}} ctx
 */
export function renderMap(state, { selectedId, me, onSelect }) {
  selectHandler = onSelect;
  drawLand();
  $('map-cnt').textContent = String(Object.keys(state.stamps).length);
  $('map-total').textContent = t('map.total', { n: ALL.length });

  // 점: 가 본 곳은 초록 도장, 먼 곳은 노란 마름모, 나머지는 회색 점. 누르기 쉽게 투명한 큰 원을 깐다
  $('kmap-dots').replaceChildren(...ALL.map((c) => {
    const g = svg('g', { class: 'km-s', 'data-id': c.id });
    g.append(svg('circle', { class: 'km-hit', cx: c.x, cy: c.y, r: 18 }));
    if (state.stamps[c.id]) g.append(svg('circle', { class: 'km-v', cx: c.x, cy: c.y, r: 15 }), svg('circle', { class: 'km-vin', cx: c.x, cy: c.y, r: 6 }));
    else if (c.far) g.append(svg('rect', { class: 'km-far', x: c.x - 8, y: c.y - 8, width: 16, height: 16, transform: `rotate(45 ${c.x} ${c.y})` }));
    else g.append(svg('circle', { class: 'km-d', cx: c.x, cy: c.y, r: 6 }));
    return g;
  }));
  const meDot = $('kmap-me');
  meDot.parentNode.querySelectorAll('.km-me').forEach((el) => el.setAttribute('visibility', me ? 'visible' : 'hidden'));
  if (me) {
    const [mx, my] = project(me.lon, me.lat);
    meDot.parentNode.querySelectorAll('.km-me').forEach((el) => { el.setAttribute('cx', mx); el.setAttribute('cy', my); });
  }

  const sel = ALL.find((c) => c.id === selectedId) || ALL[0];
  $('kmap-sel').setAttribute('cx', sel.x);
  $('kmap-sel').setAttribute('cy', sel.y);
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
