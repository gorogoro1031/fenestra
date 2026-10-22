// 실제 날씨: 대략의 위치로 Open-Meteo(무료, 키 없음)에서 지금 날씨 코드를 받아 온다.
// 광합성(햇빛 모으기)과 하늘·비·손님·소리가 이 날씨를 따른다
const API = 'https://api.open-meteo.com/v1/forecast';
// 15분마다 새로 받고, 마지막으로 받은 날씨는 1시간까지만 믿는다
export const WEATHER_RULES = Object.freeze({ REFRESH_MS: 15 * 60 * 1000, STALE_MS: 60 * 60 * 1000, TIMEOUT_MS: 10000 });
// 좌표는 소수 둘째 자리(약 1km)까지만 보낸다
const COORD_DIGITS = 2;

/** @typedef {'clear'|'partly'|'cloudy'|'fog'|'rain'|'snow'} SkyKind */

const KINDS = Object.freeze({
  clear: { label: '맑음', wet: false },
  partly: { label: '구름 조금', wet: false },
  cloudy: { label: '흐림', wet: false },
  fog: { label: '안개', wet: false },
  rain: { label: '비', wet: true },
  snow: { label: '눈', wet: true },
});
export const SKY_KINDS = Object.freeze(Object.keys(KINDS));

/** 하늘 종류의 이름과, 비·눈처럼 젖는 날씨인지 */
export const skyInfo = (kind) => KINDS[kind] || null;

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

export function weatherUrl(lat, lon) {
  return `${API}?latitude=${round(lat)}&longitude=${round(lon)}&current=weather_code&timezone=auto`;
}

/**
 * 지금 날씨를 받아 온다. 응답이 이상하면 던진다
 * @returns {Promise<SkyKind>}
 */
export async function fetchSky(lat, lon, fetchImpl = fetch) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('bad-coords');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), WEATHER_RULES.TIMEOUT_MS);
  try {
    const res = await fetchImpl(weatherUrl(lat, lon), { signal: abort.signal });
    if (!res.ok) throw new Error(`http-${res.status}`);
    const kind = kindFromCode((await res.json())?.current?.weather_code);
    if (!kind) throw new Error('bad-response');
    return kind;
  } finally {
    clearTimeout(timer);
  }
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

const ERROR_TEXT = { denied: '위치 권한이 꺼져 있어요', 'no-geo': '이 브라우저는 위치를 쓸 수 없어요', 'no-position': '위치를 찾지 못했어요' };

/**
 * 실제 날씨를 주기적으로 받아 알려 준다
 * @param {(live: {status:'loading'|'ok'|'error', kind:SkyKind|null, at:number, error:string}) => void} onChange
 * @returns {{refresh: () => void, stop: () => void, current: () => object}}
 */
export function watchWeather(onChange) {
  let live = { status: 'loading', kind: null, at: 0, error: '' };
  let timer = 0;
  const emit = (next) => { live = next; onChange(live); };

  async function refresh() {
    clearTimeout(timer);
    timer = setTimeout(refresh, WEATHER_RULES.REFRESH_MS);
    try {
      const { latitude, longitude } = await coarsePosition();
      emit({ status: 'ok', kind: await fetchSky(latitude, longitude), at: Date.now(), error: '' });
    } catch (err) {
      // 실패해도 1시간 안에 받은 날씨가 있으면 그대로 쓴다
      const fresh = live.kind && Date.now() - live.at < WEATHER_RULES.STALE_MS;
      emit(fresh ? live : { status: 'error', kind: null, at: live.at, error: ERROR_TEXT[err.message] || '날씨를 받아 오지 못했어요' });
    }
  }

  refresh();
  return {
    refresh,
    stop: () => clearTimeout(timer),
    // 마지막 날씨가 1시간이 넘었으면 모르는 것으로 본다
    current: () => (live.kind && Date.now() - live.at >= WEATHER_RULES.STALE_MS ? { ...live, status: 'error', kind: null, error: '날씨가 오래됐어요' } : live),
  };
}
