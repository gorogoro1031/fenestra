import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withJosa } from '../js/text.js';

test('받침에 따라 을/를, 이/가를 붙인다', () => {
  assert.equal(withJosa('선인장', '을', '를'), '선인장을');
  assert.equal(withJosa('나비', '을', '를'), '나비를');
  assert.equal(withJosa('반딧불', '이', '가'), '반딧불이');
  assert.equal(withJosa('몬스테라', '이', '가'), '몬스테라가');
  assert.equal(withJosa('Dive', '을', '를'), 'Dive를');
});
