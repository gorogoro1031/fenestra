// 시간에 따라 화분 뒤 호를 따라 뜨고 지는 해·달 고리, 그리고 그 빛이 번지는 하늘
// 해·달은 채우지 않은 고리 선이고, 선에서 안팎으로 빛이 번진다. 달리는 속도에 따라 빛이 천천히 커진다
const DEFAULT_SUN = Object.freeze({ rise: 6, set: 18 });
// 해가 지평선 가까이 있을 때(호 높이의 이 비율 아래) 노을빛이 섞인다
const LOW_SUN = 0.45;
const ARC_WIDTH = 0.78;

const LEMON = [236, 240, 60];
const DUSK = [255, 150, 60];
const MOON = [205, 222, 255];
// 빨리 달릴수록 낮은 주황빛, 밤은 보랏빛으로 물든다
const FAST_DAY = [255, 190, 100];
const FAST_NIGHT = [190, 165, 255];

// 고리 선 굵기, 운전 중 눈에 덜 띄게 모든 움직임은 느리게 (깜빡임 없음)
const LINE = 9;
const FRAME_MS = 33;
// 속도 단계(km/h): 30 넘으면 빛이 넓게, 50 넘으면 메아리, 100 넘으면 더 자주 + 선을 도는 빛
// 해·달 크기: 식물을 감싸는 원에 대한 비율. 보통이 기본
export const ORB_SIZES = Object.freeze({ small: 0.5, medium: 0.7, large: 1 });

export const SPEED_TIERS = Object.freeze([30, 50, 100]);
const ECHO_EVERY_MS = { 2: 8000, 3: 5000 };
const ECHO_LIFE_MS = 7000;
// GPS 속도가 이만큼 끊기면 멈춘 것으로 본다
const SPEED_STALE_MS = 6000;
// 지평선 위로 이만큼(px)에 걸쳐 고리가 서서히 사라진다
const HORIZON_FADE = 90;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const lerp = (a, b, k) => a + (b - a) * k;

/** 속도 → 단계 0(30 아래)~3(100 이상) */
export const speedTier = (kmh) => SPEED_TIERS.filter((min) => kmh >= min).length;

/**
 * 오늘 해 뜨고 지는 시각(지역 시각, 0~24시). NOAA 근사식이라 몇 분 오차가 있다. 백야·극야면 6·18시
 * @param {number} tzMinutes 그 지역의 UTC 차이(분). 기본은 이 기기의 시간대
 */
export function sunTimes(date, lat, lon, tzMinutes = -date.getTimezoneOffset()) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ...DEFAULT_SUN };
  const rad = Math.PI / 180;
  const day = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 864e5);
  const g = ((2 * Math.PI) / 365) * (day - 1);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return { ...DEFAULT_SUN };
  const ha = Math.acos(cosHa) / rad;
  const toLocal = (utcMin) => ((((utcMin + tzMinutes) / 60) % 24) + 24) % 24;
  return { rise: toLocal(720 - 4 * (lon + ha) - eqtime), set: toLocal(720 - 4 * (lon - ha) - eqtime) };
}

/**
 * 시각(0~24시)으로 해·달이 호의 어디쯤 있는지
 * @param {{rise:number, set:number}} sun 해 뜨고 지는 시각
 * @returns {{isDay:boolean, p:number, lift:number, low:number}} p 0=뜰 때 1=질 때, lift 0=지평선 1=가장 높이, low 노을 정도
 */
export function orbPosition(hours, sun = DEFAULT_SUN) {
  const h = ((Number(hours) % 24) + 24) % 24;
  const { rise, set } = sun;
  const isDay = h >= rise && h < set;
  const span = set - rise;
  const p = isDay ? (h - rise) / span : ((h - set + 24) % 24) / (24 - span);
  const lift = Math.sin(Math.PI * p);
  return { isDay, p, lift, low: clamp01(1 - lift / LOW_SUN) };
}

/**
 * @param {HTMLElement} skyEl 빛 번짐
 * @param {HTMLCanvasElement} canvas 해·달 고리를 그리는 캔버스
 * @param {{reduced?:boolean}} opts reduced: 동작 줄이기면 숨 쉬기·메아리 없이 고리만
 */
export function createSky(skyEl, canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d');
  let ring = { x: 960, y: 400, r: 240 };
  let size = { W: 1920, H: 1200, horizon: 964 };
  // mode: 'motion' 속도에 따라 움직임까지, 'ring' 고리만(움직임 없음), 'off' 감춤
  let mode = 'motion';
  let scale = ORB_SIZES.medium;
  const radius = () => ring.r * scale;
  let target = { x: 960, y: 400, color: LEMON, isDay: true, dim: 1 };
  let pos = null;
  let kmh = 0;
  let speedAt = -Infinity;
  let energy = 0;
  let echoes = [];
  let lastEcho = 0;
  let lastFrame = 0;

  /** @param {{hours:number, raining:boolean, sun?:{rise:number, set:number}}} at */
  function draw({ hours, raining, sun = DEFAULT_SUN }) {
    const { isDay, p, lift, low } = orbPosition(hours, sun);
    const { W, H, horizon } = size;
    const x = ring.x + (p - 0.5) * W * ARC_WIDTH;
    // 지평선(하단 바 위) 아래 반지름만큼 숨어 있다가 정오·자정에 원래 자리까지 오른다
    const y = horizon + radius() - (horizon + radius() - ring.y) * lift;
    const color = isDay ? mix(LEMON, DUSK, low) : MOON;
    const dim = raining ? 0.35 : 1;
    target = { x, y, color, isDay, dim: (isDay ? 1 : 0.85) * dim };
    if (!pos) pos = { x, y };
    const at = `${((x / W) * 100).toFixed(1)}% ${((y / H) * 100).toFixed(1)}%`;
    skyEl.style.background = isDay
      ? `radial-gradient(70% 60% at ${at}, rgba(${color}, ${((0.1 + 0.14 * lift) * dim).toFixed(3)}) 0%, transparent 70%),
         linear-gradient(0deg, rgba(255, 140, 60, ${(0.16 * low * dim).toFixed(3)}) 0%, transparent 40%)`
      : `radial-gradient(60% 55% at ${at}, rgba(170, 195, 255, ${((0.06 + 0.1 * lift) * dim).toFixed(3)}) 0%, transparent 70%)`;
    return { isDay, x, y };
  }

  function paint(now) {
    const { W, H } = { W: canvas.width, H: canvas.height };
    ctx.clearRect(0, 0, W, H);
    if (mode === 'off' || !pos) return;
    const moving = mode === 'motion' && !reduced;
    // 위치는 2초쯤에 걸쳐 따라간다
    pos = { x: lerp(pos.x, target.x, 0.06), y: lerp(pos.y, target.y, 0.06) };
    const speed = now - speedAt > SPEED_STALE_MS ? 0 : kmh;
    energy = lerp(energy, moving ? speedTier(speed) : 0, 0.02);
    const fast = clamp01(energy - 1);
    const tint = mix(target.color, target.isDay ? FAST_DAY : FAST_NIGHT, fast);
    const { x, y } = pos;
    const r = radius();
    const t = now / 1000;

    // 선에서 안팎으로 번지는 빛: 정지 9초 → 100 넘으면 6초 주기로 숨 쉰다
    const breathe = moving ? Math.sin((t * Math.PI * 2) / (9 - energy)) : 0;
    const spread = (70 + energy * 28 + breathe * (8 + energy * 4)) * scale;
    const glowA = (0.3 + energy * 0.05 + breathe * 0.04) * target.dim;
    const inner = Math.max(0, r - spread * 0.7);
    const glow = ctx.createRadialGradient(x, y, inner, x, y, r + spread);
    glow.addColorStop(0, `rgba(${tint}, 0)`);
    glow.addColorStop((r - inner) / (r + spread - inner), `rgba(${tint}, ${glowA.toFixed(3)})`);
    glow.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - r - spread, y - r - spread, (r + spread) * 2, (r + spread) * 2);

    // 메아리: 50 넘으면 8초, 100 넘으면 5초마다 고리의 흐린 빛이 한 겹 천천히 바깥으로
    const tier = moving ? speedTier(speed) : 0;
    if (tier >= 2 && now - lastEcho > ECHO_EVERY_MS[tier]) {
      lastEcho = now;
      echoes = [...echoes, now];
    }
    echoes = echoes.filter((born) => now - born < ECHO_LIFE_MS);
    echoes.forEach((born) => {
      const p = (now - born) / ECHO_LIFE_MS;
      const er = r + (1 - (1 - p) ** 2) * 520 * scale;
      const w = (26 + p * 50) * scale;
      const a = 0.16 * Math.sin(Math.PI * p) * target.dim;
      const eg = ctx.createRadialGradient(x, y, Math.max(0, er - w), x, y, er + w);
      eg.addColorStop(0, `rgba(${tint}, 0)`);
      eg.addColorStop(0.5, `rgba(${tint}, ${a.toFixed(3)})`);
      eg.addColorStop(1, `rgba(${tint}, 0)`);
      ctx.fillStyle = eg;
      ctx.fillRect(x - er - w, y - er - w, (er + w) * 2, (er + w) * 2);
    });

    // 고리 선
    ctx.globalAlpha = target.dim;
    ctx.lineWidth = LINE;
    ctx.strokeStyle = `rgb(${tint})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    // 100 넘으면 선을 따라 밝은 빛 한 조각이 12초에 한 바퀴 천천히 돈다
    if (energy > 2.2) {
      const k = Math.min(1, energy - 2.2);
      const head = (t * Math.PI * 2) / 12;
      for (let j = 0; j < 24; j += 1) {
        const a0 = head - j * 0.035;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.55 * k * (1 - j / 24)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, a0 - 0.04, a0);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    hideBelowHorizon(W, H);
  }

  // 지평선(화분 밑선) 아래는 부드럽게 지운다: 해·달이 뜨고 질 때 화면 아래에 고리가 걸려 보이지 않게
  function hideBelowHorizon(W, H) {
    const top = size.horizon - HORIZON_FADE;
    const fade = ctx.createLinearGradient(0, top, 0, size.horizon);
    fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fade.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fade;
    ctx.fillRect(0, top, W, HORIZON_FADE);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, size.horizon, W, H - size.horizon);
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    if (now - lastFrame >= FRAME_MS) {
      lastFrame = now;
      paint(now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    /** 정오 자리(식물을 감싸는 원)와 무대 크기 */
    setLayout(nextRing, nextSize) {
      ring = nextRing;
      size = nextSize;
      pos = null;
    },
    draw,
    /** 지금 속도(km/h). 몇 초 동안 안 오면 멈춘 것으로 본다 */
    setSpeed(next, now = performance.now()) {
      kmh = next;
      speedAt = now;
    },
    /** @param {'motion'|'ring'|'off'} next */
    setMode(next) {
      mode = next;
    },
    /** @param {'small'|'medium'|'large'} next */
    setSize(next) {
      scale = ORB_SIZES[next] ?? ORB_SIZES.medium;
      pos = null;
    },
    /** 지금 그리는 고리 반지름 (일출·일몰 글자 자리) */
    radius,
  };
}
