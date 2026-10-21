// 잎을 건드렸을 때의 반응 모션들. 나이(초)와 방향(-1 왼쪽을 눌림, 1 오른쪽을 눌림)으로
// 화분 바닥을 축으로 한 변형 값을 돌려준다. 모두 시간이 지나면 0으로 잦아든다
export const MOTION_MS = 1600;

const decay = (age, k) => Math.exp(-age * k);

/** @typedef {{skew:number, sx:number, sy:number, dy:number}} Pose 기울기(도), 가로·세로 배율 변화, 위로 뜬 정도(px) */

/** @type {Record<string, (age:number, dir:number) => Pose>} */
export const MOTIONS = {
  // 좌우로 몇 번 출렁
  wobble: (age) => ({ skew: Math.sin(age * 10) * 2.4 * decay(age, 3), sx: 0, sy: 0, dy: 0 }),
  // 누른 반대쪽으로 쓱 기울었다 천천히 돌아옴
  lean: (age, dir) => ({ skew: -dir * 4.5 * decay(age, 2.2) * Math.cos(age * 5), sx: 0, sy: 0, dy: 0 }),
  // 위아래로 통통 늘었다 줄었다
  boing: (age) => {
    const s = Math.sin(age * 14) * 0.06 * decay(age, 4);
    return { skew: 0, sx: -s * 0.6, sy: s, dy: 0 };
  },
  // 깡충 한 번 뛰고 착지할 때 살짝 눌림
  hop: (age) => {
    const air = age < 0.36 ? Math.sin((Math.PI * age) / 0.36) : 0;
    const land = age >= 0.36 ? Math.sin((age - 0.36) * 16) * 0.05 * decay(age - 0.36, 6) : 0;
    return { skew: 0, sx: land * 0.5, sy: -land, dy: 26 * air };
  },
  // 간지러운 듯 빠르게 바르르
  shiver: (age) => ({ skew: Math.sin(age * 48) * 1.1 * decay(age, 3.5), sx: 0, sy: 0, dy: 0 }),
};

const NAMES = Object.keys(MOTIONS);

/** 직전과 겹치지 않게 다음 모션을 고른다 */
export function pickMotion(previous, random = Math.random) {
  const options = NAMES.filter((n) => n !== previous);
  return options[Math.floor(random() * options.length) % options.length];
}

/** 진행 중인 모션들을 더한 자세 */
export function combine(active, now) {
  return active.reduce((pose, m) => {
    const p = MOTIONS[m.type]((now - m.born) / 1000, m.dir);
    return { skew: pose.skew + p.skew, sx: pose.sx + p.sx, sy: pose.sy + p.sy, dy: pose.dy + p.dy };
  }, { skew: 0, sx: 0, sy: 0, dy: 0 });
}
