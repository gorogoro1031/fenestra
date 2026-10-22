import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withJosa, greetingPeriod, cleanName } from '../js/text.js';

test('받침에 따라 을/를, 이/가를 붙인다', () => {
  assert.equal(withJosa('선인장', '을', '를'), '선인장을');
  assert.equal(withJosa('나비', '을', '를'), '나비를');
  assert.equal(withJosa('반딧불', '이', '가'), '반딧불이');
  assert.equal(withJosa('몬스테라', '이', '가'), '몬스테라가');
  assert.equal(withJosa('Dive', '을', '를'), 'Dive를');
});

test('인사 시간대: 5–12시 아침, 12–18시 오후, 그 밖은 저녁', () => {
  assert.equal(greetingPeriod(5), 'morning');
  assert.equal(greetingPeriod(11.99), 'morning');
  assert.equal(greetingPeriod(12), 'afternoon');
  assert.equal(greetingPeriod(17.5), 'afternoon');
  assert.equal(greetingPeriod(18), 'evening');
  assert.equal(greetingPeriod(2), 'evening');
  assert.equal(greetingPeriod(24), 'evening');
});

test('이름: 앞뒤 공백·줄바꿈을 정리하고 20자까지, 글자가 아니면 빈 이름', () => {
  assert.equal(cleanName('  하진 '), '하진');
  assert.equal(cleanName('Ha\njin'), 'Ha jin');
  assert.equal(cleanName('가'.repeat(30)).length, 20);
  assert.equal(cleanName(undefined), '');
  assert.equal(cleanName(42), '');
});
