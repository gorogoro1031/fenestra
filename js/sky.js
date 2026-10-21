// 시간에 따라 화분 뒤 호를 따라 뜨고 지는 해·달 고리, 그리고 그 빛이 번지는 하늘
const SUNRISE = 6;
const SUNSET = 18;
// 해가 지평선 가까이 있을 때(호 높이의 이 비율 아래) 노을빛이 섞인다
const LOW_SUN = 0.45;
const ARC_WIDTH = 0.78;

const LEMON = [236, 240, 60];
const DUSK = [255, 150, 60];
const MOON = [205, 222, 255];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

/**
 * 시각(0~24시)으로 해·달이 호의 어디쯤 있는지
 * @returns {{isDay:boolean, p:number, lift:number, low:number}} p 0=뜰 때 1=질 때, lift 0=지평선 1=가장 높이, low 노을 정도
 */
export function orbPosition(hours) {
  const h = ((Number(hours) % 24) + 24) % 24;
  const isDay = h >= SUNRISE && h < SUNSET;
  const span = SUNSET - SUNRISE;
  const p = isDay ? (h - SUNRISE) / span : ((h - SUNSET + 24) % 24) / (24 - span);
  const lift = Math.sin(Math.PI * p);
  return { isDay, p, lift, low: clamp01(1 - lift / LOW_SUN) };
}

/**
 * @param {HTMLElement} skyEl 빛 번짐
 * @param {HTMLElement} orbEl 해·달 고리
 */
export function createSky(skyEl, orbEl) {
  let ring = { x: 960, y: 400, r: 240 };
  let size = { W: 1920, H: 1200, horizon: 964 };

  /** @param {{hours:number, raining:boolean}} at */
  function draw({ hours, raining }) {
    const { isDay, p, lift, low } = orbPosition(hours);
    const { W, H, horizon } = size;
    const x = ring.x + (p - 0.5) * W * ARC_WIDTH;
    // 지평선(하단 바 위) 아래 반지름만큼 숨어 있다가 정오·자정에 원래 자리까지 오른다
    const y = horizon + ring.r - (horizon + ring.r - ring.y) * lift;
    const color = isDay ? mix(LEMON, DUSK, low) : MOON;
    const dim = raining ? 0.35 : 1;
    Object.assign(orbEl.style, {
      width: `${ring.r * 2}px`,
      height: `${ring.r * 2}px`,
      transform: `translate(${(x - ring.r).toFixed(1)}px, ${(y - ring.r).toFixed(1)}px)`,
      borderColor: `rgb(${color})`,
      opacity: String((isDay ? 1 : 0.8) * dim),
    });
    const at = `${((x / W) * 100).toFixed(1)}% ${((y / H) * 100).toFixed(1)}%`;
    skyEl.style.background = isDay
      ? `radial-gradient(70% 60% at ${at}, rgba(${color}, ${((0.1 + 0.14 * lift) * dim).toFixed(3)}) 0%, transparent 70%),
         linear-gradient(0deg, rgba(255, 140, 60, ${(0.16 * low * dim).toFixed(3)}) 0%, transparent 40%)`
      : `radial-gradient(60% 55% at ${at}, rgba(170, 195, 255, ${((0.06 + 0.1 * lift) * dim).toFixed(3)}) 0%, transparent 70%)`;
    return { isDay, x, y };
  }

  return {
    /** 정오 자리(식물을 감싸는 원)와 무대 크기 */
    setLayout(nextRing, nextSize) {
      ring = nextRing;
      size = nextSize;
    },
    draw,
  };
}
