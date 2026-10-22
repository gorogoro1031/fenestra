// 주행 한 번: 달리기 시작해서 멈출 때까지 거리와 늘어난 이슬·꽃씨를 모은다. 화면·브라우저에 의존하지 않는다
// 2분 동안 움직임이 없으면 주행이 끝난 것으로 보고, 1km 넘게 달렸을 때만 요약을 보여 준다
export const TRIP_RULES = Object.freeze({ END_IDLE_MS: 2 * 60 * 1000, MIN_KM: 1 });

export const startTrip = (now) => ({ startedAt: now, lastMoveAt: now, km: 0, drops: 0, coins: 0 });

const gain = (before, after, key) => Math.max(0, after[key] - before[key]);

/**
 * 상태가 before → after로 바뀐 만큼 주행에 더한다. 거리가 늘었으면 움직인 시각도 새로
 * @param {{km?:number, now:number}} at
 */
export function addToTrip(trip, before, after, { km = 0, now }) {
  return {
    ...trip,
    km: trip.km + km,
    drops: trip.drops + gain(before, after, 'drops'),
    coins: trip.coins + gain(before, after, 'coins'),
    lastMoveAt: km > 0 ? now : trip.lastMoveAt,
  };
}

/** 속도가 나는 동안은 움직이는 중 */
export const markMoving = (trip, now) => ({ ...trip, lastMoveAt: now });

export const tripEnded = (trip, now) => now - trip.lastMoveAt >= TRIP_RULES.END_IDLE_MS;
export const worthShowing = (trip) => trip.km >= TRIP_RULES.MIN_KM;
