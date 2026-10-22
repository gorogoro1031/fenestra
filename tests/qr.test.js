import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albumLink, listenLink, MUSIC_APPS, ALBUMS } from '../js/albums.js';
import { qrPath } from '../js/qr.js';

test('앨범마다 album.link 주소 (Apple Music 앨범 번호로)', () => {
  assert.equal(albumLink({ id: 1773946851 }), 'https://album.link/i/1773946851');
  ALBUMS.forEach((a) => assert.match(albumLink(a), /^https:\/\/album\.link\/i\/\d+$/));
});

test('앱마다 여는 주소: Apple Music은 앨범, Spotify·YouTube Music은 검색, 그 밖은 album.link', () => {
  const album = { id: 1773946851, title: 'Music for Nine Post Cards', artist: 'Hiroshi Yoshimura' };
  assert.equal(listenLink(album, 'apple'), 'https://music.apple.com/kr/album/1773946851');
  assert.equal(listenLink(album, 'spotify'), 'https://open.spotify.com/search/Hiroshi%20Yoshimura%20Music%20for%20Nine%20Post%20Cards');
  assert.equal(listenLink(album, 'youtube'), 'https://music.youtube.com/search?q=Hiroshi%20Yoshimura%20Music%20for%20Nine%20Post%20Cards');
  assert.equal(listenLink(album, 'other'), albumLink(album));
  assert.equal(listenLink(album, 'nope'), listenLink(album, 'apple'));
  assert.deepEqual(MUSIC_APPS.map((a) => a.id), ['apple', 'spotify', 'youtube', 'other']);
});

test('QR 칸을 SVG 경로로: 크기와 검은 칸 수가 맞는다', () => {
  const { size, d } = qrPath('https://album.link/i/1773946851');
  assert.equal(size, 29);
  const cells = (d.match(/M/g) || []).length;
  assert.ok(cells > 200 && cells < size * size, `검은 칸 ${cells}`);
  // 왼쪽 위 찾기 무늬의 첫 칸은 검다
  assert.ok(d.startsWith('M0 0h1v1h-1z'));
});
