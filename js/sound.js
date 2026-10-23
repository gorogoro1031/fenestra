// 차 스피커로 나가는 소리. 전부 코드로 만들고 아주 작게 낸다
// 앰비언트 = 14초마다 넘어가는 화음 + 길이가 다른 멜로디 고리 넷(이노 'Music for Airports' 방식) + 바람·빗소리 + 숲 소리, 모두 잔향을 거친다
// 원본 들어 보기·설계: brand/sound/fenestra-ambient-v1.html
const MASTER_GAIN = 0.5;
const FADE_S = 2.5;
const BED_GAIN = { clear: 0.018, rain: 0.05 };
const BELL_GAIN = 0.03;
// 숲 소리: 낮엔 새, 밤엔 풀벌레. 아주 작게, 드문드문
const BIRD_EVERY_MS = [5000, 12000];
const CRICKET_EVERY_MS = [900, 2400];
const FOREST_GAIN = { bird: 0.016, cricket: 0.006 };
const RUSTLE_GAIN = 0.05;
const BUS_TONE_HZ = 2400;

// 낮은 밝은 화음(F major 9), 밤은 차분한 화음(D minor 9)
const CHORDS = {
  day: [87.31, 130.81, 220.0, 329.63, 392.0],
  night: [73.42, 110.0, 174.61, 261.63, 329.63],
};
const BELL_NOTES = {
  day: [523.25, 587.33, 659.25, 783.99, 880.0],
  night: [440.0, 523.25, 587.33, 659.25, 783.99],
};

let ctx = null;
let bus = null;
let ambient = null;

function audio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** 잔향(리버브)과 전체 볼륨을 한 번만 만든다 */
function getBus(ac) {
  if (bus) return bus;
  const master = ac.createGain();
  master.gain.value = MASTER_GAIN;
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = BUS_TONE_HZ;
  const reverb = ac.createConvolver();
  reverb.buffer = impulse(ac, 4.5);
  const wet = ac.createGain();
  wet.gain.value = 0.65;
  const dry = ac.createGain();
  dry.gain.value = 0.45;
  const input = ac.createGain();
  input.connect(dry).connect(tone);
  input.connect(reverb).connect(wet).connect(tone);
  tone.connect(master).connect(ac.destination);
  bus = { input, tone };
  return bus;
}

function impulse(ac, seconds) {
  const length = ac.sampleRate * seconds;
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  return buffer;
}

function noiseBuffer(ac, seconds = 4) {
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  // 갈색 잡음: 낮게 깔리는 바람·빗소리 바탕
  for (let i = 0; i < data.length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function noiseBed(ac, out, weather) {
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer(ac);
  source.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = weather === 'rain' ? 'highpass' : 'lowpass';
  filter.frequency.value = weather === 'rain' ? 900 : 380;
  const gain = ac.createGain();
  gain.gain.value = BED_GAIN[weather];
  source.connect(filter).connect(gain).connect(out);
  source.start();
  return [source];
}

function bell(ac, out, freq, volume = BELL_GAIN) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + 3.4);
}

const between = ([min, max]) => min + Math.random() * (max - min);

function panned(ac, out) {
  const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
  if (!pan) return out;
  pan.pan.value = Math.random() * 1.6 - 0.8;
  pan.connect(out);
  return pan;
}

/** 새 한 마리: 짧게 올라가는 소리를 2~5번 */
function birdCall(ac, out) {
  const dest = panned(ac, out);
  const base = 2600 + Math.random() * 1400;
  const count = 2 + Math.floor(Math.random() * 4);
  for (let k = 0; k < count; k += 1) {
    const t = ac.currentTime + k * (0.11 + Math.random() * 0.06);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(FOREST_GAIN.bird, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

/** 풀벌레: 높은 음을 아주 짧게 서너 번 떨기 */
function cricket(ac, out) {
  const dest = panned(ac, out);
  const freq = 4300 + Math.random() * 600;
  for (let k = 0; k < 3 + Math.floor(Math.random() * 3); k += 1) {
    const t = ac.currentTime + k * 0.045;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(FOREST_GAIN.cricket, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

/** 잎이 바람에 스치는 소리: 높은 대역 잡음을 잠깐 부풀렸다 잦아들게 */
export function rustle(strength = 0.6) {
  const ac = audio();
  if (!ac || !ambient) return;
  const t = ac.currentTime;
  const dur = 1.2 + strength * 1.6;
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer(ac, Math.ceil(dur) + 1);
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3200 + Math.random() * 1500;
  band.Q.value = 0.7;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(RUSTLE_GAIN * strength, t + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  source.connect(band).connect(gain).connect(panned(ac, getBus(ac).input));
  source.start(t);
  source.stop(t + dur + 0.1);
}

// 잎 악기: 낮은 F장조, 밤은 D단조 5음 음계 (배경 화음과 어울려 아무렇게나 눌러도 멜로디가 된다)
export const LEAF_SCALES = Object.freeze({
  day: Object.freeze([349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0, 1046.5]),
  night: Object.freeze([293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0]),
});
const KALIMBA_GAIN = 0.07;

/** 잎 높이(0=화분 가까이, 1=맨 위)에 맞는 음 */
export function leafNote(height, scene = 'night') {
  const scale = LEAF_SCALES[scene] || LEAF_SCALES.night;
  const h = Number.isFinite(height) ? Math.min(1, Math.max(0, height)) : 0;
  return scale[Math.round(h * (scale.length - 1))];
}

/** 칼림바처럼 톡 튀는 음: 맑은 바탕음 + 살짝 어긋난 높은 배음이 빨리 사라진다 */
function kalimba(ac, out, freq) {
  const t = ac.currentTime;
  [[1, KALIMBA_GAIN, 1.6], [3.01, KALIMBA_GAIN * 0.25, 0.35]].forEach(([mult, peak, decay]) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq * mult;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  });
}

/**
 * 잎을 건드렸을 때: 누른 높이에 맞는 음 하나, 잎 스치는 소리, 전체 소리가 잠깐 환하게 열렸다 닫힌다
 * @param {number} height 누른 자리 높이 0~1
 */
export function leafTouch(scene = 'night', height = 0.5) {
  const ac = audio();
  if (!ac || !ambient) return;
  const out = getBus(ac);
  kalimba(ac, panned(ac, out.input), leafNote(height, scene));
  rustle(0.35);
  const t = ac.currentTime;
  out.tone.frequency.cancelScheduledValues(t);
  out.tone.frequency.setTargetAtTime(5200, t, 0.08);
  out.tone.frequency.setTargetAtTime(BUS_TONE_HZ, t + 0.6, 0.9);
}

/** @param {{scene:'day'|'night', weather:'clear'|'rain'}|null} mood null이면 끈다 */
/* ---------- 앰비언트 (v1, 2026-10-23 승인) ---------- */
// 지금 앰비언트는 효과음보다 조금 크게 (전체 0.5 → 0.72와 같은 크기)
const AMBIENT_LEVEL = 1.44;
export const AMBIENT = Object.freeze({
  chordMs: 14000,
  fadeS: 5,
  padLevel: 0.03,
  bassLevel: 0.045,
  epLevel: 0.055,
  // 화음 진행 (MIDI). 낮: Fmaj9 → Dm9 → B♭maj9 → Csus4, 밤: Dm9 → B♭maj7 → Gm9 → Asus4
  chords: Object.freeze({
    day: [[41, 48, 57, 64, 67], [38, 45, 53, 60, 64], [46, 53, 57, 60, 62], [48, 55, 60, 62, 65]],
    night: [[38, 45, 53, 60, 64], [46, 53, 57, 62, 65], [43, 50, 57, 58, 65], [45, 52, 57, 62, 64]],
  }),
  // 펜타토닉: 어느 화음 위에서도 부딪히지 않는 음
  scale: Object.freeze({ day: [65, 67, 69, 72, 74, 77, 79, 81], night: [62, 65, 67, 69, 72, 74, 77, 79] }),
  // 길이가 서로 다른 고리(초). 고리마다 음 두세 개가 정해진 자리에서 계속 울린다
  loops: Object.freeze([19, 23, 29, 37]),
});
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

/**
 * 멜로디 고리 넷: 고리마다 음 2~3개와 고리 안에서 울리는 때(초)
 * @returns {{len:number, hits:{at:number, note:number}[]}[]}
 */
export function ambientLoops(scale, random = Math.random) {
  return AMBIENT.loops.map((len, i) => {
    const count = 2 + (i % 2);
    return { len, hits: Array.from({ length: count }, (_, k) => ({ at: (k / count) * len * 0.55 + random() * 1.5, note: scale[Math.floor(random() * scale.length)] })) };
  });
}

/** 부드러운 전자 피아노: 사인 위에 짧게 사라지는 FM 배음 */
function epiano(ac, out, freq, at, level) {
  const car = ac.createOscillator();
  car.frequency.value = freq;
  const mod = ac.createOscillator();
  mod.frequency.value = freq * 2;
  const index = ac.createGain();
  index.gain.setValueAtTime(freq * 1.4, at);
  index.gain.exponentialRampToValueAtTime(freq * 0.05, at + 1.2);
  mod.connect(index).connect(car.frequency);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 4.5);
  car.connect(gain).connect(panned(ac, out));
  [car, mod].forEach((n) => { n.start(at); n.stop(at + 4.7); });
}

/** 왼쪽·오른쪽으로 번갈아 되울리는 지연 */
function pingPong(ac, out) {
  const input = ac.createGain();
  const left = ac.createDelay(2);
  const right = ac.createDelay(2);
  left.delayTime.value = 0.42;
  right.delayTime.value = 0.63;
  const feedback = ac.createGain();
  feedback.gain.value = 0.32;
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  const merger = ac.createChannelMerger(2);
  input.connect(left);
  left.connect(tone).connect(right);
  right.connect(feedback).connect(left);
  left.connect(merger, 0, 0);
  right.connect(merger, 0, 1);
  const wet = ac.createGain();
  wet.gain.value = 0.5;
  merger.connect(wet).connect(out);
  input.connect(out);
  return input;
}

/** 화음 하나: 천천히 들어왔다 나가는 패드와 뿌리음 베이스, 필터가 아주 느리게 열고 닫힌다 */
function chordPad(ac, out, notes, at, holdS) {
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(1, at + AMBIENT.fadeS);
  env.gain.setValueAtTime(1, at + holdS);
  env.gain.linearRampToValueAtTime(0.0001, at + holdS + AMBIENT.fadeS);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1100;
  filter.Q.value = 0.3;
  const sweep = ac.createOscillator();
  sweep.frequency.value = 0.05;
  const sweepDepth = ac.createGain();
  sweepDepth.gain.value = 450;
  sweep.connect(sweepDepth).connect(filter.frequency);
  env.connect(filter).connect(out);
  const end = at + holdS + AMBIENT.fadeS + 0.2;
  notes.slice(1).forEach((n, i) => {
    [-5, 5].forEach((cents, k) => {
      const osc = ac.createOscillator();
      osc.type = k ? 'triangle' : 'sine';
      osc.frequency.value = midi(n);
      osc.detune.value = cents;
      const voice = ac.createGain();
      voice.gain.value = AMBIENT.padLevel * (i === 0 ? 1.2 : 1);
      osc.connect(voice).connect(env);
      osc.start(at);
      osc.stop(end);
    });
  });
  const bass = ac.createOscillator();
  bass.frequency.value = midi(notes[0]);
  const bassGain = ac.createGain();
  bassGain.gain.value = AMBIENT.bassLevel;
  bass.connect(bassGain).connect(env);
  [sweep, bass].forEach((n) => { n.start(at); n.stop(end); });
}

/**
 * 장면·날씨에 맞는 앰비언트를 튼다. null이면 끈다. 바뀔 때는 천천히 겹쳐 넘어간다
 * @param {{scene:'day'|'night', weather:'clear'|'rain'}|null} mood
 */
export function setAmbient(mood) {
  const ac = audio();
  if (!ac) return;
  if (ambient) {
    const old = ambient;
    old.timers.forEach(clearTimeout);
    old.gain.gain.setTargetAtTime(0, ac.currentTime, FADE_S / 3);
    setTimeout(() => { old.nodes.forEach((n) => n.stop()); old.gain.disconnect(); }, FADE_S * 1500);
    ambient = null;
  }
  if (!mood) return;
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(AMBIENT_LEVEL, ac.currentTime, FADE_S / 3);
  gain.connect(getBus(ac).input);
  const current = { gain, nodes: noiseBed(ac, gain, mood.weather), timers: [] };
  const keys = pingPong(ac, gain);

  // 화음: 14초마다 다음 화음으로, 5초 동안 겹쳐 넘어간다
  const chords = AMBIENT.chords[mood.scene];
  let next = 0;
  const playChord = () => {
    chordPad(ac, gain, chords[next % chords.length], ac.currentTime + 0.05, AMBIENT.chordMs / 1000 - AMBIENT.fadeS + 1);
    next += 1;
    current.timers[0] = setTimeout(playChord, AMBIENT.chordMs);
  };
  playChord();

  // 멜로디 고리: 앞으로 4초치를 미리 예약해 두고 계속 이어 붙인다
  const loops = ambientLoops(AMBIENT.scale[mood.scene]);
  const start = ac.currentTime + 2;
  let until = start;
  const schedule = () => {
    const horizon = ac.currentTime + 4;
    loops.forEach((loop, i) => {
      for (let cycle = Math.floor((until - start) / loop.len); start + cycle * loop.len < horizon; cycle += 1) {
        loop.hits.forEach((hit) => {
          const at = start + cycle * loop.len + hit.at;
          if (at >= until && at < horizon) epiano(ac, keys, midi(hit.note), at, AMBIENT.epLevel * (i === 3 ? 0.8 : 1));
        });
      }
    });
    until = horizon;
    current.timers[1] = setTimeout(schedule, 1500);
  };
  schedule();

  // 숲 소리: 낮엔 새, 밤엔 풀벌레 (비 오는 날은 쉰다)
  const repeat = (slot, range, play) => {
    current.timers[slot] = setTimeout(() => { play(); repeat(slot, range, play); }, between(range));
  };
  if (mood.weather !== 'rain') {
    if (mood.scene === 'day') repeat(2, BIRD_EVERY_MS, () => birdCall(ac, gain));
    else repeat(2, CRICKET_EVERY_MS, () => cricket(ac, gain));
  }
  ambient = current;
}

export function drip() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(gain).connect(getBus(ac).input);
  osc.start(t);
  osc.stop(t + 0.2);
}

export function chime() {
  const ac = audio();
  if (!ac) return;
  const out = getBus(ac).input;
  [659.25, 880, 1174.66].forEach((f, i) => setTimeout(() => bell(ac, out, f, 0.07), i * 140));
}

// 오프닝 인사: 낮·밤 화음이 천천히 부풀었다 잦아들고, 맑은 음 두 개가 얹힌다
const SWELL = { gain: 0.05, attack: 1.6, hold: 1.2, release: 2.8 };
const SWELL_BELLS = [{ at: 0.35, note: 2 }, { at: 1.1, note: 4 }];

/** 인사 때 한 번 울리는 은은한 앰비언트 (약 5.5초) */
export function greetSwell(scene = 'day') {
  const ac = audio();
  if (!ac) return;
  const out = getBus(ac).input;
  const t = ac.currentTime;
  const end = t + SWELL.attack + SWELL.hold + SWELL.release;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(SWELL.gain, t + SWELL.attack);
  env.gain.setValueAtTime(SWELL.gain, t + SWELL.attack + SWELL.hold);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  env.connect(out);
  (CHORDS[scene] || CHORDS.day).forEach((freq, i) => {
    [-5, 5].forEach((cents, k) => {
      const osc = ac.createOscillator();
      osc.type = k === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = cents + i;
      osc.connect(env);
      osc.start(t);
      osc.stop(end + 0.1);
    });
  });
  const notes = BELL_NOTES[scene] || BELL_NOTES.day;
  SWELL_BELLS.forEach(({ at, note }) => setTimeout(() => bell(ac, out, notes[note], BELL_GAIN), at * 1000));
}

/** 사용자가 처음 화면을 누를 때 불러 소리를 쓸 수 있게 한다 (브라우저 자동 재생 제한) */
export function unlock() {
  audio();
}
