// 식물 그림(종·단계별 webp, 배경 투명)을 화분 바닥 기준으로 놓고 바람에 흔들리게 한다.
// 흔들림은 화분 바닥을 축으로 한 skew라서 위쪽 잎일수록 크게 움직이고 화분은 거의 그대로다
import { MOTION_MS, pickMotion, combine } from './motions.js';
import { plantImage } from './plants.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 그림 한 장의 기준점(원본 픽셀). 모든 종·단계가 같은 크기·같은 화분 자리로 맞춰져 있다 */
export const PLANT_IMAGE = Object.freeze({
  w: 1150, h: 1163,
  potX: 510.5, potBottom: 1153, potTop: 933,
  // 몬스테라 시안에서 식물을 감싸던 원: 해·달이 정오·자정에 오는 자리
  ringX: 512.4, ringY: 370.4, ringR: 353.5,
  // 다 자란 식물 중 가장 높은 잎 끝 (산세베리아): 해·달 시각 글자가 식물에 가리지 않는 높이
  tallestTop: 11,
});

const SWAP_MS = 900;
const GROW_MS = 1700;
const HIT_ALPHA = 40;
const HIT_SCALE = 0.25;

/**
 * @param {HTMLElement} host 식물 그림을 넣을 빈 상자
 */
export function createPlant(host) {
  // sway(바람 흔들림, JS가 매 프레임 transform) > grow(인트로·전환, CSS) > 그림들
  const sway = document.createElement('div');
  sway.className = 'plant';
  const grow = document.createElement('div');
  grow.className = 'plant-grow';
  sway.append(grow);
  host.append(sway);

  let layout = { cx: 960, base: 964, scale: 0.674 };
  let shown = '';
  let current = null;
  let hitMap = null;
  let gust = 0;
  let motions = [];
  let lastMotion = '';
  const images = new Map();

  // 그림을 불러온다. 한 번 실패하면 캐시를 피해 한 번 더 시도하고, 그래도 안 되면 다음에 다시 시도할 수 있게 비워 둔다
  const fetchImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`그림을 불러오지 못함: ${url}`));
    img.src = url;
  });
  const load = (src) => {
    if (!images.has(src)) {
      const attempt = fetchImage(src).catch(() => fetchImage(`${src}?retry=${Date.now()}`));
      images.set(src, attempt.catch((err) => { images.delete(src); throw err; }));
    }
    return images.get(src);
  };

  // 잎을 건드렸는지 알기 위해 그림을 작게 줄여 투명도만 읽어 둔다
  function buildHitMap(img) {
    const w = Math.round(PLANT_IMAGE.w * HIT_SCALE);
    const h = Math.round(PLANT_IMAGE.h * HIT_SCALE);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    return { w, data: g.getImageData(0, 0, w, h).data };
  }

  function place() {
    const { cx, base, scale } = layout;
    const origin = `${PLANT_IMAGE.potX * scale}px ${PLANT_IMAGE.potBottom * scale}px`;
    Object.assign(sway.style, {
      width: `${PLANT_IMAGE.w * scale}px`,
      height: `${PLANT_IMAGE.h * scale}px`,
      left: `${cx - PLANT_IMAGE.potX * scale}px`,
      top: `${base - PLANT_IMAGE.potBottom * scale}px`,
      transformOrigin: origin,
    });
    grow.style.transformOrigin = origin;
  }

  function frame(now) {
    const t = now / 1000;
    gust *= 0.992;
    motions = motions.filter((m) => now - m.born < MOTION_MS);
    // 잔잔한 바람 두 겹 + 돌풍 + 건드렸을 때 반응 모션 (기울기 단위: 도)
    const pose = combine(motions, now);
    const skew = (Math.sin(t * 0.7) * 0.5 + Math.sin(t * 0.23 + 1.3) * 0.7) * (1 + gust * 2) + gust * 2.2 + pose.skew;
    const breathe = 1 + Math.sin(t * 0.5) * 0.004 + pose.sy;
    sway.style.transform = `translateY(${(-pose.dy).toFixed(1)}px) skewX(${skew.toFixed(3)}deg) scale(${(1 + pose.sx).toFixed(4)}, ${breathe.toFixed(4)})`;
    requestAnimationFrame(frame);
  }
  if (!REDUCED) requestAnimationFrame(frame);

  /** 새 그림을 위에 얹어 화분에서 자라나듯 나타나게, 이전 그림은 흐려지며 사라지게 */
  async function show(src, { animate }) {
    const img = await load(src);
    if (src !== shown) return;
    const layer = img.cloneNode();
    layer.alt = '';
    layer.className = animate ? 'plant-img entering' : 'plant-img';
    grow.append(layer);
    hitMap = buildHitMap(img);
    const old = current;
    current = layer;
    if (!animate) { old?.remove(); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove('entering')));
    if (old) {
      old.classList.add('leaving');
      setTimeout(() => old.remove(), SWAP_MS);
    }
  }

  place();

  return {
    /** 종·단계 그림을 바꾼다. 처음이면 바로, 이후엔 자라나는 전환 */
    async setStage(id, n) {
      const src = plantImage(id, n);
      if (src === shown) return;
      const animate = shown !== '' && !REDUCED;
      shown = src;
      await show(src, { animate });
    },
    /** @param {{cx:number, base:number, scale:number}} next 화분 바닥 가운데 자리와 그림 배율 */
    setLayout(next) {
      layout = next;
      place();
    },
    /** 해·달이 정오·자정에 올 자리 (무대 좌표) */
    ring() {
      const { cx, base, scale } = layout;
      return {
        x: cx + (PLANT_IMAGE.ringX - PLANT_IMAGE.potX) * scale,
        y: base - (PLANT_IMAGE.potBottom - PLANT_IMAGE.ringY) * scale,
        r: PLANT_IMAGE.ringR * scale,
      };
    },
    /** 해·달 시각 글자 자리: 화분 가운데 위, 가장 큰 식물보다 위 (무대 좌표, y는 글자 아래 끝) */
    labelSpot() {
      const { cx, base, scale } = layout;
      return { x: cx, y: base - (PLANT_IMAGE.potBottom - PLANT_IMAGE.tallestTop) * scale };
    },
    /** 동행 친구가 앉을 자리: 화분 테두리 오른쪽 (무대 좌표, y는 앉은 발끝), size: 화분 폭에 맞춘 그림 크기 */
    seatSpot() {
      const { cx, base, scale } = layout;
      return { x: cx + 82 * scale, y: base - (PLANT_IMAGE.potBottom - 948) * scale, size: 170 * scale };
    },
    /** 물방울 떨어질 자리 */
    anchor() {
      const { cx, base, scale } = layout;
      const potTop = base - (PLANT_IMAGE.potBottom - PLANT_IMAGE.potTop) * scale;
      return { cx, y: potTop - 260 * scale, potTop };
    },
    gust(strength) { gust = Math.max(gust, strength); },
    glow() {
      if (!current) return;
      current.classList.remove('glow');
      void current.offsetWidth;
      current.classList.add('glow');
    },
    /**
     * 잎을 건드렸는지 확인하고, 맞으면 여러 반응 중 하나로 움직인다 (화분은 제외)
     * @returns {{height:number}|null} 맞았으면 누른 높이(0=화분 가까이, 1=그림 맨 위)
     */
    poke(x, y) {
      if (!hitMap) return null;
      const { cx, base, scale } = layout;
      const ix = (x - (cx - PLANT_IMAGE.potX * scale)) / scale;
      const iy = (y - (base - PLANT_IMAGE.potBottom * scale)) / scale;
      if (ix < 0 || iy < 0 || ix >= PLANT_IMAGE.w || iy >= PLANT_IMAGE.potTop) return null;
      const i = (Math.floor(iy * HIT_SCALE) * hitMap.w + Math.floor(ix * HIT_SCALE)) * 4 + 3;
      const hit = hitMap.data[i] > HIT_ALPHA;
      if (hit && !REDUCED) {
        lastMotion = pickMotion(lastMotion);
        motions = [...motions, { type: lastMotion, born: performance.now(), dir: x < cx ? -1 : 1 }];
      }
      return hit ? { height: 1 - iy / PLANT_IMAGE.potTop } : null;
    },
    /** 인트로 전엔 감춰 둔다 */
    hide() { grow.classList.add('hidden'); },
    /** 인트로: 화분에서 식물이 자라 오른다. 다 자라는 데 걸리는 시간(ms)을 돌려준다 */
    assemble() {
      grow.classList.remove('hidden');
      if (REDUCED) return 0;
      grow.classList.add('growing');
      setTimeout(() => grow.classList.remove('growing'), GROW_MS);
      return GROW_MS;
    },
  };
}
