import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindFromCode, weatherUrl, placeUrl, placeName, fetchWeather, skyInfo, SKY_KINDS } from '../js/weather.js';

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
  assert.match(url, /latitude=37\.57&longitude=126\.98&current=weather_code,temperature_2m/);
  assert.match(url, /^https:\/\/api\.open-meteo\.com\//);
});

test('응답에서 지금 날씨와 기온을 읽는다. 기온이 없으면 null', async () => {
  assert.deepEqual(await fetchWeather(37.5, 127, fakeFetch({ current: { weather_code: 2, temperature_2m: 13.6 } })), { kind: 'partly', temp: 13.6 });
  assert.deepEqual(await fetchWeather(37.5, 127, fakeFetch({ current: { weather_code: 0 } })), { kind: 'clear', temp: null });
});

test('지역 이름: 광역 단위 꼬리를 떼고 도시, 나라로', () => {
  assert.equal(placeName({ city: '서울특별시', countryName: '대한민국' }), '서울, 대한민국');
  assert.equal(placeName({ city: 'Seoul', countryName: 'Korea' }), 'Seoul, Korea');
  assert.equal(placeName({ city: '', locality: '성남시', countryName: '대한민국' }), '성남시, 대한민국');
  assert.equal(placeName({}), null);
  assert.equal(placeName(null), null);
  assert.match(placeUrl(37.566535, 126.977969, 'en'), /latitude=37\.57&longitude=126\.98&localityLanguage=en$/);
});

test('이상한 응답·실패·잘못된 좌표는 던진다', async () => {
  await assert.rejects(fetchWeather(37.5, 127, fakeFetch({ current: {} })), /bad-response/);
  await assert.rejects(fetchWeather(37.5, 127, fakeFetch(null)), /bad-response/);
  await assert.rejects(fetchWeather(37.5, 127, fakeFetch({}, false, 500)), /http-500/);
  await assert.rejects(fetchWeather(Number.NaN, 127, fakeFetch({ current: { weather_code: 0 } })), /bad-coords/);
});
