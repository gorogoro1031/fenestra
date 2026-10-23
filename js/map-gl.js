// 슈퍼차저 지도의 실제 길 지도: OpenStreetMap 데이터(OpenFreeMap 무료 타일)를 MapLibre로 그리고 앱 색으로 다시 칠한다
// 라이브러리와 타일은 지도를 처음 열 때 인터넷에서 불러온다. 대한민국 밖은 어둡게 덮는다
import { PROVINCE_PATHS } from './korea-map.js';

const LIB = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
// 처음과 '전국' 버튼에서 보여 줄 범위 (제주 포함 남한), 움직일 수 있는 범위
export const KOREA_VIEW = Object.freeze([[125.6, 33.15], [129.45, 38.62]]);
const MAX_BOUNDS = [[122.5, 31.5], [132.5, 40]];

// 채도 없이 밝기 단계로만: 어두운 초록 땅, 더 깊은 물, 큰 길일수록 밝게 (운전 중 눈에 덜 띄게)
const C = {
  land: '#111513', water: '#06090a', park: '#141b16', res: '#131815', building: '#1a211d',
  minor: '#222b26', major: '#323e37', majorCase: '#1a211d', motor: '#56685d', motorCase: '#1d2621',
  rail: '#262f2a', label: 'rgba(235, 235, 245, .62)', labelDim: 'rgba(235, 235, 245, .42)', halo: '#0b0d0c', boundary: '#3a4640',
};
const HIDE = new Set(['road_oneway', 'road_oneway_opposite', 'highway_name_motorway', 'place_country_other', 'place_country_minor', 'place_country_major', 'water_name', 'aeroway-taxiway', 'boundary_country_z0-4']);
const KO_NAME = ['coalesce', ['get', 'name:ko'], ['get', 'name']];
const BIG_PLACES = new Set(['place_city_large', 'place_city', 'place_state']);
const FILL = {
  background: ['background-color', C.land], water: ['fill-color', C.water], waterway: ['line-color', C.water],
  landuse_park: ['fill-color', C.park], landcover_wood: ['fill-color', C.park], landuse_residential: ['fill-color', C.res],
  highway_path: ['line-color', C.minor], highway_minor: ['line-color', C.minor], highway_major_casing: ['line-color', C.majorCase],
  highway_major_inner: ['line-color', C.major], highway_major_subtle: ['line-color', C.major],
  highway_motorway_casing: ['line-color', C.motorCase], highway_motorway_inner: ['line-color', C.motor], highway_motorway_subtle: ['line-color', C.motor],
};

/** 받은 다크 스타일을 앱 색·한글 이름·차 화면 글자 크기로. k: 화면 배율 */
function restyle(style, k) {
  const layers = style.layers.filter((l) => !HIDE.has(l.id) && l.type !== 'raster').map((l) => {
    const paint = { ...(l.paint || {}) };
    const layout = { ...(l.layout || {}) };
    const fill = FILL[l.id];
    if (fill) paint[fill[0]] = fill[1];
    if (l.id === 'landuse_park' || l.id === 'landcover_wood' || l.id === 'landuse_residential') paint['fill-opacity'] = 1;
    if (l.id === 'building') Object.assign(paint, { 'fill-color': C.building, 'fill-outline-color': C.building });
    if (l.id.startsWith('railway')) paint['line-color'] = l.id.includes('dash') ? C.land : C.rail;
    if (l.id.startsWith('boundary')) paint['line-color'] = C.boundary;
    if (l.type === 'symbol' && layout['text-field']) {
      const big = BIG_PLACES.has(l.id);
      Object.assign(layout, { 'text-field': KO_NAME, 'text-font': ['Noto Sans Bold'], 'text-size': (big ? 24 : l.id === 'place_town' ? 21 : 19) * k });
      delete layout['icon-image'];
      Object.assign(paint, { 'text-color': big ? C.label : C.labelDim, 'text-halo-color': C.halo, 'text-halo-width': 1.6 * k, 'text-halo-blur': 0.5 });
    }
    return { ...l, paint, layout };
  });
  return { ...style, layers };
}

// 대한민국 밖을 덮는 판: 시·도 윤곽(지도 좌표)을 경도·위도로 되돌려 구멍으로 뚫는다
const PROJ = { K: 178, COS: Math.cos((36.3 * Math.PI) / 180), LON0: 124.5, LAT0: 38.7 };
const unproject = ([x, y]) => [x / (PROJ.K * PROJ.COS) + PROJ.LON0, PROJ.LAT0 - y / PROJ.K];
function outsideKorea() {
  const holes = PROVINCE_PATHS.flatMap((d) => d.split('Z').filter(Boolean).map((ring) => {
    const pts = ring.replace('M', '').split('L').map((p) => unproject(p.split(',').map(Number)));
    return [...pts, pts[0]];
  }));
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[100, 20], [150, 20], [150, 50], [100, 50], [100, 20]], ...holes] } };
}

function diamond(size, color, line) {
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const g = cv.getContext('2d');
  g.translate(size / 2, size / 2);
  g.rotate(Math.PI / 4);
  g.strokeStyle = color;
  g.lineWidth = line;
  const s = size * 0.46;
  g.strokeRect(-s / 2, -s / 2, s, s);
  return g.getImageData(0, 0, size, size);
}

let libPromise = null;
/** MapLibre를 한 번만 불러온다 */
function loadLib() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `${LIB}/maplibre-gl.css`;
      document.head.append(css);
      const js = document.createElement('script');
      js.src = `${LIB}/maplibre-gl.js`;
      js.onload = () => resolve(window.maplibregl);
      js.onerror = () => { libPromise = null; reject(new Error('maplibre')); };
      document.head.append(js);
    });
  }
  return libPromise;
}

const EMPTY = { type: 'FeatureCollection', features: [] };
const point = (lon, lat, properties = {}) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties });

/**
 * @param {HTMLElement} container 화면 배율을 되돌린 지도 자리 (실제 화면 픽셀)
 * @param {{scale:()=>number, padding:()=>object, onSelect:(id:number)=>void, onFail:()=>void}} opts
 *  scale: 무대 배율(글자·점 크기에 곱함), padding: 전국 화면 여백(실제 픽셀)
 */
export function createGlMap(container, { scale, padding, onSelect, onFail }) {
  let map = null;
  let ready = false;
  let pending = null;

  async function start() {
    try {
      const gl = await loadLib();
      const style = await (await fetch(STYLE_URL)).json();
      const k = scale();
      map = new gl.Map({
        container,
        style: restyle(style, k),
        bounds: KOREA_VIEW,
        fitBoundsOptions: { padding: padding() },
        maxBounds: MAX_BOUNDS,
        minZoom: 5.5,
        maxZoom: 17,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
        // 지도 글꼴엔 한글이 없어서 한글은 기기 글꼴로 그린다
        localIdeographFontFamily: "'Pretendard Variable', 'Apple SD Gothic Neo', sans-serif",
      });
      map.touchZoomRotate.disableRotation();
      map.on('error', (e) => { if (!ready) onFail(e); });
      map.on('load', () => {
        addLayers(k);
        ready = true;
        if (pending) update(pending);
      });
    } catch (e) {
      onFail(e);
    }
  }

  // 슈퍼차저 표시는 확대와 상관없이 늘 같은 크기: 흰 점(아직), 노란 마름모(먼 곳), 초록 고리(가 본 곳), 흰 고리(선택), 파란 점(지금 위치)
  function addLayers(k) {
    map.addSource('mask', { type: 'geojson', data: outsideKorea() });
    map.addLayer({ id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#08090a', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.88, 10.5, 0] } });
    map.addImage('far', diamond(Math.round(60 * k), '#ecf03c', 4.5 * k), { pixelRatio: 1 });
    map.addSource('sc', { type: 'geojson', data: EMPTY });
    map.addLayer({ id: 'sc-d', type: 'circle', source: 'sc', filter: ['==', ['get', 'kind'], 'd'], paint: { 'circle-radius': 10 * k, 'circle-color': 'rgba(255,255,255,.62)', 'circle-stroke-color': '#0b0d0c', 'circle-stroke-width': 2.5 * k } });
    map.addLayer({ id: 'sc-far', type: 'symbol', source: 'sc', filter: ['==', ['get', 'kind'], 'far'], layout: { 'icon-image': 'far', 'icon-allow-overlap': true } });
    map.addLayer({ id: 'sc-v', type: 'circle', source: 'sc', filter: ['==', ['get', 'kind'], 'v'], paint: { 'circle-radius': 19 * k, 'circle-color': 'rgba(52, 199, 89, .25)', 'circle-stroke-color': '#34c759', 'circle-stroke-width': 5 * k } });
    map.addLayer({ id: 'sc-vin', type: 'circle', source: 'sc', filter: ['==', ['get', 'kind'], 'v'], paint: { 'circle-radius': 8 * k, 'circle-color': '#34c759' } });
    map.addSource('me', { type: 'geojson', data: EMPTY });
    map.addLayer({ id: 'me-halo', type: 'circle', source: 'me', paint: { 'circle-radius': 30 * k, 'circle-color': 'rgba(10, 132, 255, .22)' } });
    map.addLayer({ id: 'me', type: 'circle', source: 'me', paint: { 'circle-radius': 11 * k, 'circle-color': '#0a84ff', 'circle-stroke-color': '#fff', 'circle-stroke-width': 4 * k } });
    map.addSource('sel', { type: 'geojson', data: EMPTY });
    map.addLayer({ id: 'sel', type: 'circle', source: 'sel', paint: { 'circle-radius': 30 * k, 'circle-color': 'transparent', 'circle-stroke-color': '#fff', 'circle-stroke-width': 5 * k } });
    ['sc-d', 'sc-far', 'sc-v'].forEach((id) => {
      map.on('click', id, (e) => onSelect(e.features[0].properties.id));
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    });
  }

  // 처음엔 null: 도장이 하나도 없을 때(빈 글자)도 첫 번째엔 점을 그린다
  let lastKey = null;
  /** @param {{all:object[], stamps:object, selected:object, me:{lat:number, lon:number}|null}} data */
  function update(data) {
    if (!ready) { pending = data; return; }
    const key = Object.keys(data.stamps).join(',');
    if (key !== lastKey) {
      lastKey = key;
      map.getSource('sc').setData({ type: 'FeatureCollection', features: data.all.map((c) => point(c.lon, c.lat, { id: c.id, kind: data.stamps[c.id] ? 'v' : c.far ? 'far' : 'd' })) });
    }
    map.getSource('sel').setData(data.selected ? point(data.selected.lon, data.selected.lat) : EMPTY);
    map.getSource('me').setData(data.me ? point(data.me.lon, data.me.lat) : EMPTY);
  }

  start();
  return {
    update,
    resize: () => map?.resize(),
    zoomIn: () => map?.zoomIn({ duration: 400 }),
    zoomOut: () => map?.zoomOut({ duration: 400 }),
    showAll: () => map?.fitBounds(KOREA_VIEW, { padding: padding(), duration: 600 }),
  };
}
