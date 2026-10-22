// 브라우저 위치로 달린 거리와 속도를 잰다. 화면을 열어 둔 동안만 동작
const MIN_STEP_M = 8;
const MAX_ACCURACY_M = 60;
const MAX_JUMP_KMH = 250;

function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * @param {{onDistance:(km:number)=>void, onSpeed:(kmh:number)=>void, onError:(key:string)=>void}} handlers onError는 i18n 키
 * @returns {() => void} 멈추는 함수
 */
export function watchDriving({ onDistance, onSpeed, onError }) {
  if (!navigator.geolocation) {
    onError('loc.noGeo');
    return () => {};
  }
  let last = null;
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const { coords, timestamp } = pos;
      if (coords.accuracy > MAX_ACCURACY_M) return;
      if (coords.speed !== null && Number.isFinite(coords.speed)) onSpeed(coords.speed * 3.6);
      if (!last) { last = pos; return; }
      const km = haversineKm(last.coords, coords);
      const hours = (timestamp - last.timestamp) / 3600000;
      if (km * 1000 < MIN_STEP_M) return;
      // 위치가 튀어서 생긴 말도 안 되는 거리는 버린다
      if (hours > 0 && km / hours > MAX_JUMP_KMH) { last = pos; return; }
      if (coords.speed === null && hours > 0) onSpeed(km / hours);
      last = pos;
      onDistance(km);
    },
    (err) => onError(err.code === 1 ? 'loc.denied' : 'loc.noPosition'),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}
