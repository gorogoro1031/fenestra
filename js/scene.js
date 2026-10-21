// 장면 모션: 금색 동심원, 비, 물 주기 물방울, 식물 배치·단계 바꾸기
const W = 1920;
const H = 1200;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 화분 자리: 가운데 x, 화분 바닥 y, 식물 그림 높이 (그림 비율 1400×1600). 낮·밤 같은 자리
const LAYOUT = { cx: 960, base: 960, h: 800 };
const PLANT_RATIO = 1400 / 1600;
// 단계별 잎 꼭대기가 그림 높이의 어디쯤인지 (0=위, 1=아래)
const PLANT_TOP = [0.74, 0.52, 0.35, 0.29, 0.28];
const POT_HEIGHT = 0.2;

// 화분 위로 퍼지는 파장. 평소엔 옅고 느리게, 충전 중이면 노랗고 빠르게
const WAVE = {
  idle: { every: 1900, life: 11000, alpha: 0.32, width: 2.6 },
  charging: { every: 1100, life: 7000, alpha: 0.55, width: 3.2 },
};
const WAVE_COLOR = { day: '255, 236, 200', night: '190, 210, 255', charging: '255, 214, 10' };
const WAVE_MAX_R = 1250;

/** 식물 자리를 잡고, 동심원이 퍼질 중심점을 돌려준다 */
export function placePlant(el, stage) {
  const { cx, base, h } = LAYOUT;
  const w = h * PLANT_RATIO;
  Object.assign(el.style, { left: `${cx - w / 2}px`, top: `${base - h}px`, width: `${w}px`, height: `${h}px` });
  return { x: cx, y: base - h + h * PLANT_TOP[stage] - 30, potTop: base - h * POT_HEIGHT, cx };
}

/** 두 장을 번갈아 써서 단계 그림을 부드럽게 바꾼다 */
export function createPlantSwap(imgA, imgB) {
  let front = imgA;
  let back = imgB;
  let current = -1;
  back.classList.add('hidden');
  return (stage) => {
    if (stage === current) return;
    const src = `assets/plant-${stage}.webp`;
    if (current === -1) { front.src = src; current = stage; return; }
    current = stage;
    const incoming = back;
    const outgoing = front;
    [front, back] = [back, front];
    // decode()는 화면이 숨겨진 동안 끝나지 않을 수 있어 load 이벤트와 시간 제한으로 기다린다
    const ready = new Promise((resolve) => {
      incoming.onload = resolve;
      incoming.onerror = resolve;
      setTimeout(resolve, 1500);
    });
    incoming.src = src;
    ready.then(() => {
      incoming.classList.remove('hidden');
      outgoing.classList.add('hidden');
    });
  };
}

/** 파장: 중심에서 원이 계속 퍼지고 사라진다. 원마다 생길 때의 색·속도를 기억한다 */
export function createArcs(canvas) {
  const ctx = canvas.getContext('2d');
  let origin = { x: W / 2, y: H / 3 };
  let rings = [];
  let charging = false;
  let scene = 'night';
  let lastSpawn = -Infinity;

  const style = () => (charging ? { ...WAVE.charging, color: WAVE_COLOR.charging } : { ...WAVE.idle, color: WAVE_COLOR[scene] });

  function drawRing(r, color, alpha, width) {
    ctx.strokeStyle = `rgba(${color}, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    const s = style();
    if (now - lastSpawn > s.every) { rings = [...rings, { born: now, ...s }]; lastSpawn = now; }
    rings = rings.filter((ring) => now - ring.born < ring.life);
    rings.forEach((ring) => {
      const p = (now - ring.born) / ring.life;
      // 바깥으로 갈수록 느려지는 퍼짐
      const eased = 1 - (1 - p) ** 2;
      drawRing(50 + eased * WAVE_MAX_R, ring.color, Math.sin(Math.PI * p) * ring.alpha, ring.width);
    });
    requestAnimationFrame(frame);
  }

  function drawStill() {
    ctx.clearRect(0, 0, W, H);
    const s = style();
    [160, 330, 520, 740].forEach((r, i) => drawRing(r, s.color, s.alpha * (1 - i * 0.2), s.width));
  }

  if (REDUCED) drawStill(); else requestAnimationFrame(frame);

  return {
    set({ x, y, active, scene: nextScene }) {
      if (x !== undefined) origin = { x, y };
      if (nextScene) scene = nextScene;
      if (active !== undefined) charging = active;
      if (REDUCED) drawStill();
    },
  };
}

/** 앞 유리 빗줄기와 물 주기 물방울을 한 캔버스에 그린다 */
export function createFx(canvas) {
  const ctx = canvas.getContext('2d');
  let raining = false;
  let streaks = [];
  let falling = [];

  const newStreak = () => ({ x: Math.random() * (W + 300), y: -Math.random() * H, len: 40 + Math.random() * 60, v: 900 + Math.random() * 500 });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    if (raining) {
      ctx.strokeStyle = 'rgba(205, 220, 245, .32)';
      ctx.lineWidth = 1.6;
      streaks = streaks.map((s) => {
        const y = s.y + s.v * dt;
        return y > H ? newStreak() : { ...s, x: s.x - s.v * dt * 0.18, y };
      });
      streaks.forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len * 0.18, s.y - s.len);
        ctx.stroke();
      });
    }
    falling = falling
      .map((d) => ({ ...d, y: d.y + d.v * dt, v: d.v + 1400 * dt }))
      .filter((d) => d.y < d.until);
    falling.forEach((d) => {
      ctx.fillStyle = 'rgba(120, 170, 215, .95)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  if (!REDUCED) requestAnimationFrame(frame);

  return {
    setRain(on) {
      raining = on && !REDUCED;
      streaks = raining ? Array.from({ length: 140 }, newStreak) : [];
    },
    /** 잎 위에서 화분 흙까지 물방울 몇 개를 떨어뜨린다 */
    water({ cx, y, potTop }) {
      if (REDUCED) return;
      falling = [...falling, ...[-60, 0, 55].map((dx, i) => ({ x: cx + dx, y: y - 80 - i * 70, v: 120, until: potTop }))];
    },
  };
}
