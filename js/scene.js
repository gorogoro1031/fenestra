// 장면 모션: 충전 파장, 비, 물 주기 물방울, 화분 자리 계산 (식물은 plant.js, 해·달은 sky.js)
// 캔버스 크기는 화면 비율에 따라 바뀌므로 그릴 때마다 canvas.width/height를 쓴다
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 충전하는 동안만 식물 뒤에서 노란 파장이 퍼진다 (평소엔 해·달 고리가 그 자리를 맡는다)
const WAVE = { every: 1100, life: 7000, alpha: 0.5, width: 3.2, color: '255, 214, 10' };
// 식물 그림 배율: 1920×1200 기준, 무대가 세로로 길어지면 조금 크게
const PLANT_SCALE = 0.674;
// 잎을 건드리면 튀는 동그라미: 개수와 색(초록·레몬·흰색)
const BURST = { count: 9, colors: ['#30d158', '#ecf03c', '#ffffff', '#7ee8a8'] };
const DOCK_SPACE = 236;

/**
 * 무대 크기에 맞춘 화분 자리. 무대는 항상 1920×1200 이상이고 남는 쪽으로 넓어진다
 * @returns {{cx:number, base:number, scale:number}} 가운데 x, 화분 바닥 y, 그림 배율
 */
export function plantLayout(W, H) {
  return { cx: W / 2, base: H - DOCK_SPACE, scale: PLANT_SCALE * Math.min(1.25, 1 + Math.max(0, H - 1200) / 2000) };
}

/** 파장: 충전 중에 중심에서 원이 계속 퍼지고 사라진다 */
export function createArcs(canvas) {
  const ctx = canvas.getContext('2d');
  let origin = { x: canvas.width / 2, y: canvas.height / 3 };
  let rings = [];
  let charging = false;
  let lastSpawn = -Infinity;

  function drawRing(r, color, alpha, width) {
    ctx.strokeStyle = `rgba(${color}, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (charging && now - lastSpawn > WAVE.every) { rings = [...rings, { born: now }]; lastSpawn = now; }
    rings = rings.filter((ring) => now - ring.born < WAVE.life);
    rings.forEach((ring) => {
      const p = (now - ring.born) / WAVE.life;
      // 바깥으로 갈수록 느려지는 퍼짐
      const eased = 1 - (1 - p) ** 2;
      drawRing(50 + eased * Math.hypot(canvas.width, canvas.height) * 0.6, WAVE.color, Math.sin(Math.PI * p) * WAVE.alpha, WAVE.width);
    });
    requestAnimationFrame(frame);
  }

  function drawStill() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (charging) [160, 330, 520, 740].forEach((r, i) => drawRing(r, WAVE.color, WAVE.alpha * (1 - i * 0.2), WAVE.width));
  }

  if (REDUCED) drawStill(); else requestAnimationFrame(frame);

  return {
    set({ x, y, active }) {
      if (x !== undefined) origin = { x, y };
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
  let bursts = [];

  const newStreak = () => ({ x: Math.random() * (canvas.width + 300), y: -Math.random() * canvas.height, len: 40 + Math.random() * 60, v: 900 + Math.random() * 500 });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, H);
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
    // 잎을 건드린 자리에서 작은 동그라미들이 톡 튀어 오른다
    bursts = bursts
      .map((b) => ({ ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt, vy: b.vy + 900 * dt, life: b.life - dt }))
      .filter((b) => b.life > 0);
    bursts.forEach((b) => {
      ctx.globalAlpha = Math.min(1, b.life / 0.3);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
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
    /** 누른 자리에서 동그라미 몇 개를 튀긴다 */
    burst(x, y) {
      if (REDUCED) return;
      const made = Array.from({ length: BURST.count }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const speed = 260 + Math.random() * 260;
        return {
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: 5 + Math.random() * 8, life: 0.7 + Math.random() * 0.4, color: BURST.colors[i % BURST.colors.length],
        };
      });
      bursts = [...bursts, ...made];
    },
    /** 잎 위에서 화분 흙까지 물방울 몇 개를 떨어뜨린다 */
    water({ cx, y, potTop }) {
      if (REDUCED) return;
      falling = [...falling, ...[-60, 0, 55].map((dx, i) => ({ x: cx + dx, y: y - 80 - i * 70, v: 120, until: potTop }))];
    },
  };
}
