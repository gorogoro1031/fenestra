import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, PLANT_IDS, stageName } from '../js/plants.js';
import { LAST_STAGE } from '../js/state.js';

test('식물마다 단계 이름이 다섯 개, 첫 단계는 모두 씨앗', () => {
  PLANT_IDS.forEach((id) => {
    assert.equal(PLANTS[id].stages.length, LAST_STAGE + 1, id);
    assert.equal(stageName(id, 0), '씨앗');
  });
  assert.equal(stageName('cactus', 4), '꽃 피움');
  assert.notEqual(stageName('monstera', 2), stageName('rubber', 2));
});

test('위젯 큰 글씨에 들어가게 단계 이름은 다섯 글자 이내', () => {
  PLANT_IDS.forEach((id) => PLANTS[id].stages.forEach((name) => assert.ok(name.length <= 5, `${id} ${name}`)));
});

test('모르는 식물·단계는 몬스테라 이름으로', () => {
  assert.equal(stageName('nope', 1), stageName('monstera', 1));
  assert.equal(stageName('monstera', 99), stageName('monstera', LAST_STAGE));
});
