// 오늘의 앨범 카드와 펼친 시트를 채운다. 시트에선 고른 음악 앱으로 여는 QR을 보여 준다
import { albumFor, listenLink, MUSIC_APPS } from './albums.js';
import { albumEn } from './albums-en.js';
import { qrPath } from './qr.js';
import { getLang, t } from './i18n.js';

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
  svg.setAttribute('aria-label', t('album.qrLabel', { app: chosen.name }));
  $('listen-sub').textContent = `${chosen.name} · ${t(chosen.opens)}`;
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
  // 영어 화면이면 소개·나라·장르(한국 앨범은 영문 표기)를 영어로. QR 링크는 원래 앨범 값으로 연다
  const source = albumFor(dateKey);
  const album = getLang() === 'en' ? albumEn(source) : source;
  // 위젯은 표지를 바탕으로 꽉 채운다. 못 불러오면 회색 바탕 그대로
  $('album-card').style.backgroundImage = `url("${album.art.replace('600x600', '400x400')}")`;
  $('album-title').textContent = album.title;
  $('album-artist').textContent = album.artist;
  $('album-card').setAttribute('aria-label', t('album.cardLabel', { title: album.title, artist: album.artist }));

  setCover($('album-cover'), album.art);
  const [, m, d] = dateKey.split('-').map(Number);
  $('album-date').textContent = t('album.date', { m, d });
  $('album-sheet-title').textContent = album.title;
  $('album-meta').textContent = `${album.artist} · ${album.country} · ${album.year}`;
  $('album-genre').textContent = album.genre;
  $('album-track').hidden = !album.track;
  $('album-track').textContent = album.track ? t('album.track', { track: album.track }) : '';
  $('album-note').textContent = album.about;
  // 차 안 Apple Music 검색은 원래 제목으로
  $('album-search').textContent = `‘${source.title}’`;
  renderListen(source, app, onPickApp);
}
