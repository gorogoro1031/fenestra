// 오늘의 앨범 카드와 펼친 시트를 채운다. 시트에선 고른 음악 앱으로 여는 QR을 보여 준다
import { albumFor, listenLink, MUSIC_APPS } from './albums.js';
import { qrPath } from './qr.js';

// QR 둘레 여백(칸 수): 찍을 때 주변과 구분되게
const QR_QUIET = 2;

const $ = (id) => document.getElementById(id);
// 표지를 못 불러오면 빈 회색 칸으로 둔다
const setCover = (img, src) => {
  img.onerror = () => img.removeAttribute('src');
  img.src = src;
};

/** 고른 앱으로 이 앨범을 여는 QR과 앱 고르기 칩을 그린다 */
function renderListen(album, app, onPickApp) {
  const { size, d } = qrPath(listenLink(album, app));
  const svg = $('album-qr');
  svg.setAttribute('viewBox', `${-QR_QUIET} ${-QR_QUIET} ${size + QR_QUIET * 2} ${size + QR_QUIET * 2}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.querySelector('path').setAttribute('d', d);
  const chosen = MUSIC_APPS.find((a) => a.id === app) || MUSIC_APPS[0];
  svg.setAttribute('aria-label', `${chosen.name}에서 여는 QR 코드`);
  $('listen-sub').textContent = `${chosen.name} · ${chosen.opens}`;
  const chips = MUSIC_APPS.map((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a.name;
    b.style.setProperty('--app', a.color);
    b.setAttribute('aria-pressed', String(a.id === chosen.id));
    b.addEventListener('click', () => onPickApp(a.id));
    return b;
  });
  $('music-app').replaceChildren(...chips);
}

/**
 * @param {string} dateKey YYYY-MM-DD
 * @param {{app?: string, onPickApp?: (id:string) => void}} listen 고른 음악 앱과, 바꿀 때 부를 함수
 */
export function renderAlbum(dateKey, { app = 'apple', onPickApp = () => {} } = {}) {
  const album = albumFor(dateKey);
  // 위젯은 표지를 바탕으로 꽉 채운다. 못 불러오면 회색 바탕 그대로
  $('album-card').style.backgroundImage = `url("${album.art.replace('600x600', '400x400')}")`;
  $('album-title').textContent = album.title;
  $('album-artist').textContent = album.artist;
  $('album-card').setAttribute('aria-label', `오늘의 앨범 ${album.title}, ${album.artist}`);

  setCover($('album-cover'), album.art);
  const [, m, d] = dateKey.split('-').map(Number);
  $('album-date').textContent = `${m}월 ${d}일 · 오늘의 앨범`;
  $('album-sheet-title').textContent = album.title;
  $('album-meta').textContent = `${album.artist} · ${album.country} · ${album.year}`;
  $('album-genre').textContent = album.genre;
  $('album-track').hidden = !album.track;
  $('album-track').textContent = album.track ? `추천 곡 ${album.track}` : '';
  $('album-note').textContent = album.about;
  $('album-search').textContent = `‘${album.title}’`;
  renderListen(album, app, onPickApp);
}
