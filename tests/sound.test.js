import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEAF_SCALES, leafNote, AMBIENT, ambientLoops } from '../js/sound.js';

test('잎이 높을수록 높은 음, 낮·밤은 각자 음계', () => {
  const low = leafNote(0, 'day');
  const high = leafNote(1, 'day');
  assert.equal(low, LEAF_SCALES.day[0]);
  assert.equal(high, LEAF_SCALES.day[LEAF_SCALES.day.length - 1]);
  assert.ok(leafNote(0.5, 'day') > low && leafNote(0.5, 'day') < high);
  assert.equal(leafNote(0, 'night'), LEAF_SCALES.night[0]);
});

test('범위를 벗어난 높이도 음계 안으로', () => {
  assert.equal(leafNote(-3, 'day'), LEAF_SCALES.day[0]);
  assert.equal(leafNote(9, 'night'), LEAF_SCALES.night[LEAF_SCALES.night.length - 1]);
  assert.equal(leafNote(Number.NaN, 'day'), LEAF_SCALES.day[0]);
});

test('앰비언트 멜로디 고리: 길이가 다른 고리 넷, 고리마다 음계 안의 음 두세 개가 고리 안에서 울린다', () => {
  const scale = AMBIENT.scale.day;
  const loops = ambientLoops(scale, () => 0.5);
  assert.deepEqual(loops.map((l) => l.len), [19, 23, 29, 37]);
  loops.forEach((loop) => {
    assert.ok(loop.hits.length >= 2 && loop.hits.length <= 3);
    loop.hits.forEach((h) => {
      assert.ok(scale.includes(h.note));
      assert.ok(h.at >= 0 && h.at < loop.len);
    });
  });
});

test('화음 진행은 낮·밤 모두 네 화음, 화음마다 다섯 음', () => {
  ['day', 'night'].forEach((scene) => {
    assert.equal(AMBIENT.chords[scene].length, 4);
    AMBIENT.chords[scene].forEach((c) => assert.equal(c.length, 5));
  });
});
