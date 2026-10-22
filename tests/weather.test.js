import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindFromCode, weatherUrl, fetchSky, skyInfo, SKY_KINDS } from '../js/weather.js';

const fakeFetch = (body, ok = true, status = 200) => async () => ({ ok, status, json: async () => body });

test('WMO 날씨 코드를 하늘 종류로 나눈다', () => {
  assert.equal(kindFromCode(0), 'clear');
  assert.equal(kindFromCode(1), 'clear');
  assert.equal(kindFromCode(2), 'partly');
  assert.equal(kindFromCode(3), 'cloudy');
  assert.equal(kindFromCode(45), 'fog');
  assert.equal(kindFromCode(61), 'rain');
  assert.equal(kindFromCode(81), 'rain');
  assert.equal(kindFromCode(95), 'rain');
  assert.equal(kindFromCode(73), 'snow');
  assert.equal(kindFromCode(86), 'snow');
});

test('모르는 코드나 숫자가 아니면 null', () => {
  assert.equal(kindFromCode(4), null);
  assert.equal(kindFromCode('0'), null);
  assert.equal(kindFromCode(undefined), null);
  assert.equal(kindFromCode(1.5), null);
});

test('비·눈만 젖는 날씨, 모든 종류에 이름이 있다', () => {
  assert.deepEqual(SKY_KINDS.filter((k) => skyInfo(k).wet), ['rain', 'snow']);
  SKY_KINDS.forEach((k) => assert.ok(skyInfo(k).label));
  assert.equal(skyInfo('nope'), null);
});

test('좌표는 소수 둘째 자리까지만 보낸다', () => {
  const url = weatherUrl(37.566535, 126.977969);
  assert.match(url, /latitude=37\.57&longitude=126\.98&/);
  assert.match(url, /^https:\/\/api\.open-meteo\.com\//);
});

test('응답에서 지금 날씨를 읽는다', async () => {
  assert.equal(await fetchSky(37.5, 127, fakeFetch({ current: { weather_code: 2 } })), 'partly');
});

test('이상한 응답·실패·잘못된 좌표는 던진다', async () => {
  await assert.rejects(fetchSky(37.5, 127, fakeFetch({ current: {} })), /bad-response/);
  await assert.rejects(fetchSky(37.5, 127, fakeFetch(null)), /bad-response/);
  await assert.rejects(fetchSky(37.5, 127, fakeFetch({}, false, 500)), /http-500/);
  await assert.rejects(fetchSky(Number.NaN, 127, fakeFetch({ current: { weather_code: 0 } })), /bad-coords/);
});
