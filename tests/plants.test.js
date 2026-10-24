import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, PLANT_IDS, stageName, adultOf, guideOf, conditionFor } from '../js/plants.js';
import { setLang } from '../js/i18n.js';
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

test('도감: 식물마다 알맞은 온도·한 줄 소개·소개·다섯 단계 설명이 두 언어로 있다', () => {
  ['ko', 'en'].forEach((lang) => {
    setLang(lang);
    PLANT_IDS.forEach((id) => {
      const g = guideOf(id);
      assert.equal(g.stages.length, LAST_STAGE + 1, `${lang} ${id}`);
      assert.ok(g.tag && g.about && g.origin, `${lang} ${id}`);
      assert.ok(g.temp[0] < g.temp[1]);
    });
  });
  setLang('ko');
});

test('기온 컨디션: 알맞은 범위, 5° 안쪽은 조금, 그 밖은 너무, 모르면 unknown', () => {
  assert.equal(conditionFor('monstera', 22), 'good');
  assert.equal(conditionFor('monstera', 18), 'good');
  assert.equal(conditionFor('monstera', 14), 'cool');
  assert.equal(conditionFor('monstera', 8), 'cold');
  assert.equal(conditionFor('monstera', 31), 'warm');
  assert.equal(conditionFor('monstera', 34), 'hot');
  assert.equal(conditionFor('rubber', 26), 'warm');
  assert.equal(conditionFor('monstera', null), 'unknown');
});

test('지역마다 키울 수 있는 지역 식물이 하나씩 있고, 꽃씨로는 살 수 없다', async () => {
  const { REGIONS } = await import('../js/charge.js');
  const { SHOP_PLANT_IDS } = await import('../js/plants.js');
  REGIONS.forEach((r) => {
    assert.ok(PLANTS[r.plant], r.plant);
    assert.equal(PLANTS[r.plant].region, r.id);
    assert.equal(PLANTS[r.plant].price, null);
    assert.ok(!SHOP_PLANT_IDS.includes(r.plant));
  });
  assert.deepEqual(SHOP_PLANT_IDS, ['monstera', 'cactus', 'sansevieria', 'rubber']);
});

test('새 식물 4종은 실험판 온실에만 보이고 꽃씨로 들일 수 있다', async () => {
  const { SHOP_PLANT_IDS, shopPlantIds } = await import('../js/plants.js');
  const fresh = ['hydrangea', 'lavender', 'olive', 'pilea'];
  fresh.forEach((id) => {
    assert.ok(!SHOP_PLANT_IDS.includes(id));
    assert.ok(shopPlantIds(true).includes(id));
    assert.ok(PLANTS[id].price > 0);
    assert.ok(guideOf(id).about);
  });
  assert.deepEqual(shopPlantIds(false), SHOP_PLANT_IDS);
  assert.ok(shopPlantIds(true).every((id) => !PLANTS[id].region));
});
