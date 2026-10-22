import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DICT_KEYS, setLang, t } from '../js/i18n.js';
import { stageName, adultOf, plantName } from '../js/plants.js';
import { guestName } from '../js/guests.js';
import { skyInfo } from '../js/weather.js';
import { ALBUMS } from '../js/albums.js';
import { ALBUM_EN_IDS } from '../js/albums-en.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const jsFiles = readdirSync(new URL('../js/', import.meta.url)).filter((f) => f.endsWith('.js'));
const js = jsFiles.map((f) => readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8')).join('\n');

test('한국어와 영어 문구 키가 똑같다', () => {
  assert.deepEqual([...DICT_KEYS.en].sort(), [...DICT_KEYS.ko].sort());
});

test('index.html의 고정 글자 키마다 영어가 있다', () => {
  const keys = [...html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 50);
  keys.forEach((key) => assert.ok(DICT_KEYS.staticEn.includes(key), key));
});

test('코드에서 부르는 t(키)는 모두 있다', () => {
  const keys = [...js.matchAll(/\bt\('([^']+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 30);
  keys.forEach((key) => assert.ok(DICT_KEYS.ko.includes(key), key));
});

test('앨범마다 영어 소개가 있다', () => {
  assert.deepEqual([...ALBUM_EN_IDS].sort(), ALBUMS.map((a) => a.id).sort());
});

test('영어로 바꾸면 식물·손님·날씨·문구가 영어, 한국어 조사는 한국어에서만', () => {
  setLang('en');
  try {
    assert.equal(plantName('rubber'), 'Rubber Plant');
    assert.equal(stageName('monstera', 3), 'Holey Leaf');
    assert.deepEqual(adultOf('cactus'), { name: 'Solaris', meaning: 'of the sun' });
    assert.equal(guestName('bee'), 'Bee');
    assert.equal(skyInfo('partly').label, 'Partly cloudy');
    assert.equal(skyInfo('partly', { short: true }).label, 'Part sun');
    assert.equal(t('toast.bought', { plant: 'Cactus' }), 'Cactus joined your greenhouse');
    assert.equal(t('gb.met', { n: 1 }), 'Met 1 time');
  } finally {
    setLang('ko');
  }
  assert.equal(t('toast.bought', { plant: '선인장' }), '선인장을 들였어요');
  assert.equal(stageName('monstera', 3), '구멍 잎');
  assert.equal(skyInfo('partly', { short: true }).label, '구름 조금');
});

test('모르는 언어는 한국어, 모르는 키는 키 그대로', () => {
  setLang('fr');
  assert.equal(t('save.on'), '켜짐');
  assert.equal(t('nope.key'), 'nope.key');
  setLang('ko');
});
