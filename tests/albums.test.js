import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALBUMS, albumFor } from '../js/albums.js';

test('같은 날에는 같은 앨범, 첫날은 브랜드와 맞는 Plantasia', () => {
  assert.equal(albumFor('2026-10-21'), albumFor('2026-10-21'));
  assert.equal(albumFor('2026-10-22').title, "Mother Earth's Plantasia");
  assert.equal(albumFor('2026-10-22').track, 'Plantasia');
});

test('이어지는 날들에는 목록 길이만큼 겹치지 않고 모두 한 번씩 나온다', () => {
  const start = Date.UTC(2026, 9, 22);
  const ids = new Set(ALBUMS.map((_, i) => albumFor(new Date(start + i * 86400000).toISOString().slice(0, 10)).id));
  assert.equal(ids.size, ALBUMS.length);
});

test('첫날 이전 날짜나 이상한 값에도 목록 안의 앨범을 돌려준다', () => {
  assert.ok(ALBUMS.includes(albumFor('2020-01-01')));
  assert.ok(ALBUMS.includes(albumFor('not-a-date')));
});
