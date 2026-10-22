// 브라우저 저장소. 막혀 있거나 비어 있어도 앱은 그대로 돌아가야 한다
const KEY_STATE = 'fenestra:v1:state';
// v2: 소리 기본값을 켜짐으로 바꾸면서 예전 설정을 새로 시작
const KEY_PREFS = 'fenestra:v2:prefs';

export const DEFAULT_PREFS = Object.freeze({ sound: true, useGps: false, scene: 'auto', sky: 'auto', theme: 'dark', tutorialSeen: false, hand: 'driver', musicApp: 'apple' });

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadState = () => read(KEY_STATE);
export const saveState = (state) => write(KEY_STATE, state);

export function loadPrefs() {
  const raw = read(KEY_PREFS) || {};
  return {
    sound: raw.sound !== false,
    useGps: raw.useGps === true,
    scene: ['auto', 'day', 'night'].includes(raw.scene) ? raw.scene : DEFAULT_PREFS.scene,
    // 날씨: 실제(auto)가 기본, 나머지는 확인용으로 고정. 예전 'weather'(직접 고르던 값)는 버린다
    sky: ['auto', 'clear', 'cloudy', 'rain'].includes(raw.sky) ? raw.sky : DEFAULT_PREFS.sky,
    // 화면 색: 다크(검은 바탕)가 기본, 비비드는 식물마다 다른 배경색
    theme: raw.theme === 'vivid' ? 'vivid' : 'dark',
    tutorialSeen: raw.tutorialSeen === true,
    hand: raw.hand === 'passenger' ? 'passenger' : 'driver',
    musicApp: ['apple', 'spotify', 'youtube'].includes(raw.musicApp) ? raw.musicApp : 'apple',
  };
}

export const savePrefs = (prefs) => write(KEY_PREFS, prefs);

export function clearAll() {
  try {
    localStorage.removeItem(KEY_STATE);
  } catch {
    // 저장소가 막혀 있으면 지울 것도 없다
  }
}
