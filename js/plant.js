// 몬스테라를 원형 도트로 그린다. 단계별 그림(webp)을 격자로 읽어 점을 만들고,
// 점마다 높이에 따라 바람에 흔들리게 한다. 잎을 건드리면 그 자리 점들이 물결처럼 밀려난다
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

const SRC_RATIO = 1400 / 1600;
// 점 간격. 굵은 점이 또렷하게 보이도록 넉넉히
const SPACING = 11;
const MIN_ALPHA = 0.5;
// 단계별 잎 꼭대기 위치(그림 높이 비율, 0=위)와 화분 높이
const PLANT_TOP = [0.77, 0.61, 0.39, 0.3, 0.35];
const POT_HEIGHT = 0.2;

// 민트 한 가지 색. 점 크기만으로 명암을 낸다
const DOT_COLOR = '#d6efcd';
// 명암을 몇 단계로만 나눠 판화처럼 정돈된 하프톤으로
const TONE_STEPS = 4;
// 가장자리가 부드럽게 풀리는 정도: 알파를 몇 칸 흐리게 할지, 바깥 흩어짐 확률
const EDGE_BLUR_CELLS = 2;
const SCATTER_CHANCE = 0.55;

const REVEAL_MS = 1500;
const ASSEMBLE_MS = 2400;
const RIPPLE_MS = 1600;
const RIPPLE_RADIUS = 170;
const HIT_RADIUS = 34;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (p) => 1 - (1 - p) ** 3;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 격자 위 값들을 가로·세로로 몇 번 평균 내 부드럽게 만든다 (가장자리 거리 대신) */
function blurGrid(values, cols, rows, radius) {
  let src = values;
  for (let pass = 0; pass < 2; pass += 1) {
    const h = new Float32Array(src.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        let n = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const xx = x + k;
          if (xx >= 0 && xx < cols) { sum += src[y * cols + xx]; n += 1; }
        }
        h[y * cols + x] = sum / n;
      }
    }
    const v = new Float32Array(src.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let sum = 0;
        let n = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const yy = y + k;
          if (yy >= 0 && yy < rows) { sum += h[yy * cols + x]; n += 1; }
        }
        v[y * cols + x] = sum / n;
      }
    }
    src = v;
  }
  return src;
}

/**
 * 그림을 격자로 줄여 읽고 칸마다 점을 만든다 (홀수 줄은 반 칸 밀어 육각 배열).
 * 잎 안쪽은 밝기만큼 크게, 가장자리·틈 쪽으로 갈수록 작게, 바깥은 작은 점이 드문드문 흩어진다
 */
function sampleDots(img, { cx, base, h }, seed) {
  const w = h * SRC_RATIO;
  const cols = Math.round(w / SPACING);
  const rows = Math.round(h / (SPACING * 0.866));
  const grid = document.createElement('canvas');
  grid.width = cols;
  grid.height = rows;
  const g = grid.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, cols, rows);
  const data = g.getImageData(0, 0, cols, rows).data;
  const alpha = new Float32Array(cols * rows);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * 4 + 3] / 255;
  const soft = blurGrid(alpha, cols, rows, EDGE_BLUR_CELLS);
  const rand = mulberry32(seed);
  const left = cx - w / 2;
  const top = base - h;
  const dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col;
      const i = idx * 4;
      const a = alpha[idx];
      const edge = soft[idx];
      const x = left + ((col + 0.5 + (row % 2 ? 0.5 : 0)) * w) / cols;
      const y = top + ((row + 0.5) * h) / rows;
      const hn = (base - y) / h;
      // 잎 위쪽·오른쪽 바깥일수록 더 잘 흩어진다
      const drift = 0.75 + 0.5 * clamp01((x - left) / w) * 0.5 + 0.25 * hn;
      let r = 0;
      if (a >= MIN_ALPHA) {
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const tone = Math.round(clamp01((lum - 0.12) / 0.8) * TONE_STEPS) / TONE_STEPS;
        r = SPACING * 0.5 * (0.18 + 0.82 * tone) * (0.3 + 0.7 * clamp01(edge * 1.3) ** 1.2);
        // 화분은 명암 없이 작은 점을 고르게 찍어 잎보다 한 발 물러나 보이게
        if (hn < POT_HEIGHT) r = SPACING * 0.2 * (0.4 + 0.6 * clamp01(edge * 1.3));
      } else if (edge > 0.04 && rand() < edge * SCATTER_CHANCE * drift) {
        r = SPACING * (0.06 + rand() * 0.14);
      }
      if (r < 0.35) continue;
      dots.push({
        x, y, r, hn,
        pot: hn < POT_HEIGHT,
        // 가까운 점끼리 비슷한 위상이라 잎 단위로 함께 흔들린다
        phase: Math.sin(x * 0.013) * 2 + Math.cos(y * 0.011) * 2,
      });
    }
  }
  return dots;
}

export function createDotPlant(canvas) {
  const ctx = canvas.getContext('2d');
  let layout = { cx: 960, base: 960, h: 800 };
  let stage = -1;
  let dots = [];
  let outgoing = [];
  let revealStart = -Infinity;
  let assembleStart = -Infinity;
  let gust = 0;
  let glow = 0;
  let ripples = [];
  let last = performance.now();
  const images = new Map();

  const imageFor = (n) => {
    if (!images.has(n)) images.set(n, loadImage(`assets/plant-${n}.webp`));
    return images.get(n);
  };

  function offset(d, t, now) {
    // 화분과 밑동은 거의 그대로, 위로 갈수록 크게 흔들린다
    const k = d.pot ? 0 : clamp01((d.hn - 0.15) / 0.85) ** 1.5;
    const sway = Math.sin(t * 0.8 + d.phase) * 3 + Math.sin(t * 0.33 + d.phase * 0.5) * 5;
    let dx = (sway * (1 + gust * 2.5) + gust * 16) * k;
    let dy = Math.cos(t * 1.3 + d.phase) * 1.5 * k * (1 + gust);
    ripples.forEach((rp) => {
      const age = (now - rp.born) / 1000;
      const ddx = d.x - rp.x;
      const ddy = d.y - rp.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > RIPPLE_RADIUS || dist === 0 || d.pot) return;
      const f = (1 - dist / RIPPLE_RADIUS) * 18 * Math.sin(age * 9) * Math.exp(-age * 2.6);
      dx += (ddx / dist) * f;
      dy += (ddy / dist) * f;
    });
    return [dx, dy];
  }

  function draw(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    gust *= 0.45 ** dt;
    glow *= 0.2 ** dt;
    ripples = ripples.filter((rp) => now - rp.born < RIPPLE_MS);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const path = new Path2D();
    const revealP = clamp01((now - revealStart) / REVEAL_MS);
    const assembling = now - assembleStart < ASSEMBLE_MS + 800;

    const plot = (d, scale) => {
      if (scale <= 0.02) return;
      let [dx, dy] = REDUCED ? [0, 0] : offset(d, t, now);
      let { x, y } = d;
      if (assembling && d.sx !== undefined) {
        const e = easeOut(clamp01((now - assembleStart - d.delay) / ASSEMBLE_MS));
        x = d.sx + (x - d.sx) * e;
        y = d.sy + (y - d.sy) * e;
        dx *= e;
        dy *= e;
        scale *= 0.25 + 0.75 * e;
      }
      const r = d.r * scale;
      path.moveTo(x + dx + r, y + dy);
      path.arc(x + dx, y + dy, r, 0, TAU);
    };

    // 새 단계는 아래(화분)에서 위로 차오르고, 이전 단계 점은 위에서부터 작아지며 사라진다
    outgoing.forEach((d) => plot(d, 1 - clamp01((revealP - (1 - d.hn) * 0.6) / 0.4)));
    dots.forEach((d) => plot(d, clamp01((revealP * 1.25 - d.hn) / 0.25)));
    if (revealP >= 1) outgoing = [];

    if (glow > 0.02) ctx.filter = `brightness(${1 + glow * 0.45})`;
    ctx.fillStyle = DOT_COLOR;
    ctx.fill(path);
    ctx.filter = 'none';
  }

  const loop = (now) => { draw(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  async function build(n, { animate }) {
    const img = await imageFor(n);
    const next = sampleDots(img, layout, 7 + n * 13);
    outgoing = animate ? dots : [];
    dots = next;
    revealStart = animate ? performance.now() : -Infinity;
  }

  return {
    /** 단계 그림을 바꾼다. 처음이면 바로, 이후엔 차오르는 애니메이션 */
    async setStage(n) {
      if (n === stage) return;
      const animate = stage !== -1 && !REDUCED;
      stage = n;
      await build(n, { animate });
    },
    /** 무대 크기가 바뀌면 같은 단계를 새 자리에 다시 찍는다 */
    async setLayout(next) {
      layout = next;
      if (stage !== -1) await build(stage, { animate: false });
    },
    /** 파장 중심과 물방울 떨어질 자리 */
    anchor() {
      const { cx, base, h } = layout;
      return { x: cx, y: base - h + h * PLANT_TOP[Math.max(0, stage)] - 30, potTop: base - h * POT_HEIGHT, cx };
    },
    gust(strength) { gust = Math.max(gust, strength); },
    glow() { glow = 1; },
    /** 잎을 건드렸는지 확인하고, 맞으면 물결을 일으킨다 */
    poke(x, y) {
      const hit = dots.some((d) => !d.pot && Math.hypot(d.x - x, d.y - y) < HIT_RADIUS);
      if (hit && !REDUCED) ripples = [...ripples, { x, y, born: performance.now() }];
      return hit;
    },
    /** 인트로: 흩어진 점들이 모여 식물이 된다. 다 모이는 데 걸리는 시간(ms)을 돌려준다 */
    assemble() {
      if (REDUCED) return 0;
      const { width, height } = canvas;
      dots = dots.map((d) => ({
        ...d,
        sx: Math.random() * width,
        sy: Math.random() * height * 0.9,
        // 화분부터 모이고 잎 끝이 마지막
        delay: Math.random() * 500 + d.hn * 600,
      }));
      assembleStart = performance.now();
      return ASSEMBLE_MS + 1100;
    },
  };
}
