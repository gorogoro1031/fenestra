// 실제 날씨: 대략의 위치로 Open-Meteo(무료, 키 없음)에서 지금 날씨 코드를 받아 온다.
// 두 배 조건(맑은 낮), 컨디션, 하늘·비·손님·소리가 이 날씨를 따른다
import { getLang } from './i18n.js';

const API = 'https://api.open-meteo.com/v1/forecast';
// 15분마다 새로 받고, 마지막으로 받은 날씨는 1시간까지만 믿는다
export const WEATHER_RULES = Object.freeze({ REFRESH_MS: 15 * 60 * 1000, STALE_MS: 60 * 60 * 1000, TIMEOUT_MS: 10000 });
// 좌표는 소수 둘째 자리(약 1km)까지만 보낸다
const COORD_DIGITS = 2;

/** @typedef {'clear'|'partly'|'cloudy'|'fog'|'rain'|'snow'} SkyKind */

// en: 영어 이름, short: 카드처럼 좁은 칸에 쓰는 짧은 영어 이름
const KINDS = Object.freeze({
  clear: { label: '맑음', en: 'Clear', wet: false },
  partly: { label: '구름 조금', en: 'Partly cloudy', short: 'Part sun', wet: false },
  cloudy: { label: '흐림', en: 'Cloudy', wet: false },
  fog: { label: '안개', en: 'Fog', wet: false },
  rain: { label: '비', en: 'Rain', wet: true },
  snow: { label: '눈', en: 'Snow', wet: true },
});
export const SKY_KINDS = Object.freeze(Object.keys(KINDS));

/** 하늘 종류의 (지금 언어) 이름과, 비·눈처럼 젖는 날씨인지 */
export function skyInfo(kind, { short = false } = {}) {
  const k = KINDS[kind];
  if (!k) return null;
  const label = getLang() === 'en' ? (short && k.short) || k.en : k.label;
  return { label, wet: k.wet };
}

/** WMO 날씨 코드 → 하늘 종류. 모르는 코드는 null */
export function kindFromCode(code) {
  if (!Number.isInteger(code)) return null;
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
  return null;
}

const round = (n) => Number(n.toFixed(COORD_DIGITS));
const PLACE_API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export function weatherUrl(lat, lon) {
  return `${API}?latitude=${round(lat)}&longitude=${round(lon)}&current=weather_code,temperature_2m&timezone=auto`;
}

/** 좌표 → 지역 이름 (BigDataCloud 무료 브라우저용, 키 없음) */
export function placeUrl(lat, lon, lang) {
  return `${PLACE_API}?latitude=${round(lat)}&longitude=${round(lon)}&localityLanguage=${lang === 'en' ? 'en' : 'ko'}`;
}

/** 시간 제한을 두고 JSON을 받는다. 실패하면 던진다 */
async function getJson(url, fetchImpl) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), WEATHER_RULES.TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: abort.signal });
    if (!res.ok) throw new Error(`http-${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 지금 날씨와 기온을 받아 온다. 응답이 이상하면 던진다
 * @returns {Promise<{kind:SkyKind, temp:number|null}>}
 */
export async function fetchWeather(lat, lon, fetchImpl = fetch) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('bad-coords');
  const current = (await getJson(weatherUrl(lat, lon), fetchImpl))?.current;
  const kind = kindFromCode(current?.weather_code);
  if (!kind) throw new Error('bad-response');
  const temp = Number.isFinite(current.temperature_2m) ? current.temperature_2m : null;
  return { kind, temp };
}

// 한국 광역 단위 꼬리는 떼서 짧게 (서울특별시 → 서울)
const KO_SUFFIX = /(특별자치시|특별자치도|특별시|광역시)$/;

/** 지역 이름 응답 → '서울, 대한민국' / 'Seoul, Korea'. 못 읽으면 null */
export function placeName(json) {
  const city = String(json?.city || json?.locality || json?.principalSubdivision || '').replace(KO_SUFFIX, '').trim();
  const country = String(json?.countryName || '').trim();
  if (!city && !country) return null;
  return [city, country].filter(Boolean).join(', ');
}

export async function fetchPlace(lat, lon, lang, fetchImpl = fetch) {
  return placeName(await getJson(placeUrl(lat, lon, lang), fetchImpl));
}

/** 대략의 위치 한 번 (정확도 낮게, 30분 안의 값이면 다시 묻지 않는다) */
function coarsePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('no-geo')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(err.code === 1 ? 'denied' : 'no-position')),
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 20000 },
    );
  });
}

// 오류는 i18n 키로 내보내고 글자는 화면에서 고른다
const ERROR_KEY = { denied: 'loc.denied', 'no-geo': 'loc.noGeo', 'no-position': 'loc.noPosition' };

/**
 * @typedef {{status:'loading'|'ok'|'error', kind:SkyKind|null, temp:number|null, place:string|null, at:number, error:string}} LiveWeather
 *  error는 i18n 키, place는 지역 이름(못 받으면 null)
 */

/**
 * 실제 날씨를 주기적으로 받아 알려 준다
 * @param {(live: LiveWeather) => void} onChange
 * @param {() => 'ko'|'en'} getLang 지역 이름을 받을 언어
 * @returns {{refresh: () => void, stop: () => void, current: () => LiveWeather}}
 */
export function watchWeather(onChange, getLang = () => 'ko') {
  let live = { status: 'loading', kind: null, temp: null, place: null, at: 0, error: '' };
  let timer = 0;
  const emit = (next) => { live = next; onChange(live); };

  async function refresh() {
    clearTimeout(timer);
    timer = setTimeout(refresh, WEATHER_RULES.REFRESH_MS);
    try {
      const { latitude, longitude } = await coarsePosition();
      const { kind, temp } = await fetchWeather(latitude, longitude);
      // 지역 이름은 없어도 날씨는 쓴다
      const place = await fetchPlace(latitude, longitude, getLang()).catch(() => live.place);
      emit({ status: 'ok', kind, temp, place, at: Date.now(), error: '' });
    } catch (err) {
      // 실패해도 1시간 안에 받은 날씨가 있으면 그대로 쓴다
      const fresh = live.kind && Date.now() - live.at < WEATHER_RULES.STALE_MS;
      emit(fresh ? live : { status: 'error', kind: null, temp: null, place: live.place, at: live.at, error: ERROR_KEY[err.message] || 'weather.fetch' });
    }
  }

  refresh();
  return {
    refresh,
    stop: () => clearTimeout(timer),
    // 마지막 날씨가 1시간이 넘었으면 모르는 것으로 본다
    current: () => (live.kind && Date.now() - live.at >= WEATHER_RULES.STALE_MS ? { ...live, status: 'error', kind: null, temp: null, error: 'weather.stale' } : live),
  };
}
