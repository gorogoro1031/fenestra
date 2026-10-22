import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEAF_SCALES, leafNote } from '../js/sound.js';

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
