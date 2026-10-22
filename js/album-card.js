// 오늘의 앨범 카드와 펼친 시트를 채운다
import { albumFor } from './albums.js';

const $ = (id) => document.getElementById(id);
// 표지를 못 불러오면 빈 회색 칸으로 둔다
const setCover = (img, src) => {
  img.onerror = () => img.removeAttribute('src');
  img.src = src;
};

/** @param {string} dateKey YYYY-MM-DD */
export function renderAlbum(dateKey) {
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
  $('album-meta').textContent = album.track ? `${album.artist} · ${album.year} · 추천 곡 ${album.track}` : `${album.artist} · ${album.year}`;
  $('album-note').textContent = album.note;
  $('album-search').textContent = `‘${album.title}’`;
}
