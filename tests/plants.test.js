import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, PLANT_IDS, stageName, adultOf } from '../js/plants.js';
import { LAST_STAGE } from '../js/state.js';

test('식물마다 단계 이름이 다섯 개, 첫 단계는 모두 씨앗', () => {
  PLANT_IDS.forEach((id) => {
    assert.equal(PLANTS[id].stages.length, LAST_STAGE + 1, id);
    assert.equal(stageName(id, 0), '씨앗');
  });
  assert.equal(stageName('cactus', 3), '첫 팔');
  assert.notEqual(stageName('monstera', 2), stageName('rubber', 2));
});

test('위젯 큰 글씨에 들어가게 단계 이름은 다섯 글자 이내', () => {
  PLANT_IDS.forEach((id) => PLANTS[id].stages.forEach((name) => assert.ok(name.length <= 5, `${id} ${name}`)));
});

test('다 자라면 라틴어 이름을 얻고, 마지막 단계 이름이 곧 그 이름', () => {
  assert.deepEqual(adultOf('monstera'), { name: '페네스트라', meaning: '창' });
  assert.deepEqual(adultOf('cactus'), { name: '솔라리스', meaning: '해의' });
  assert.deepEqual(adultOf('sansevieria'), { name: '녹투르나', meaning: '밤의' });
  assert.deepEqual(adultOf('rubber'), { name: '비아토르', meaning: '길 떠나는 사람' });
  PLANT_IDS.forEach((id) => assert.equal(stageName(id, LAST_STAGE), adultOf(id).name));
});

test('모르는 식물·단계는 몬스테라 이름으로', () => {
  assert.equal(stageName('nope', 1), stageName('monstera', 1));
  assert.equal(stageName('monstera', 99), stageName('monstera', LAST_STAGE));
});
