// 동행(실험판) 프렌즈 설명 부분: 같이 다니기 버튼, 함께 달린 거리와 하트, 함께 간 곳
import { COMPANION, bondOf } from './state.js';
import { chargerById } from './charge.js';
import { chargerPlace } from './charge-ui.js';
import { t, locale } from './i18n.js';

const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const HEART_PATH = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.2 1.8-2 3.2-3.2 5.4-3.2 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z';

function heart(on) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.toggle('on', on);
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', HEART_PATH);
  svg.append(path);
  return svg;
}

const km = (n) => Math.floor(n).toLocaleString(locale());
/** 'YYYY-MM-DD' → '10/24' */
const shortDay = (day) => `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;

/**
 * 만난 프렌즈만 보인다. 아직 못 만났거나 실험판이 아니면 숨긴다
 * @param {string} id 보고 있는 프렌즈
 */
export function renderCompanionPanel(state, id, { lab = false } = {}) {
  const panel = $('gs-cmp');
  panel.hidden = !lab || !state.guestbook[id];
  if (panel.hidden) return;
  const riding = state.companion === id;
  const bond = bondOf(state, id);
  $('gs-hearts').replaceChildren(...COMPANION.HEART_KM.map((_, i) => heart(i < bond.hearts)));
  $('gs-bond').innerHTML = '';
  const total = document.createElement('b');
  total.textContent = `${km(bond.km)}km`;
  $('gs-bond').append(t('cmp.with'), ' ', total, ' · ', bond.left ? t('cmp.nextHeart', { km: km(Math.ceil(bond.left)) }) : t('cmp.fullHearts'));
  const trips = state.trips[id] || [];
  $('gs-trips-wrap').hidden = trips.length === 0;
  $('gs-trips').replaceChildren(...trips.map((trip) => {
    const li = document.createElement('li');
    const charger = chargerById(trip.id);
    const place = charger ? chargerPlace(charger) : null;
    li.textContent = place ? [place.city, place.label].filter(Boolean).join(' ') : '';
    const day = document.createElement('span');
    day.textContent = shortDay(trip.day);
    li.append(day);
    return li;
  }));
  $('gs-cmp-btn').classList.toggle('on', riding);
  $('gs-cmp-label').textContent = t(riding ? 'cmp.riding' : 'cmp.ride');
}
