// 차 스피커로 나가는 소리. 전부 코드로 만들고 아주 작게 낸다
// 앰비언트 = 낮게 깔리는 화음(패드) + 가끔 울리는 맑은 음 + 바람·빗소리 + 숲 소리(새·풀벌레), 모두 잔향을 거친다
const MASTER_GAIN = 0.5;
const FADE_S = 2.5;
const PAD_VOICE_GAIN = 0.035;
const BED_GAIN = { clear: 0.018, rain: 0.05 };
const BELL_GAIN = 0.03;
const BELL_EVERY_MS = [5000, 11000];
// 숲 소리: 낮엔 새, 밤엔 풀벌레. 아주 작게, 드문드문
const BIRD_EVERY_MS = [3500, 9000];
const CRICKET_EVERY_MS = [700, 2000];
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

/** 화음 한 음: 살짝 어긋난 두 오실레이터를 아주 느린 떨림으로 숨 쉬게 한다 */
function padVoice(ac, out, freq, i) {
  const gain = ac.createGain();
  gain.gain.value = PAD_VOICE_GAIN;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.03 + i * 0.013;
  const depth = ac.createGain();
  depth.gain.value = PAD_VOICE_GAIN * 0.7;
  lfo.connect(depth).connect(gain.gain);
  const oscs = [-4, 4].map((cents, k) => {
    const osc = ac.createOscillator();
    osc.type = k === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(gain);
    return osc;
  });
  gain.connect(out);
  [lfo, ...oscs].forEach((n) => n.start());
  return [lfo, ...oscs];
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
export function setAmbient(mood) {
  const ac = audio();
  if (!ac) return;
  if (ambient) {
    const old = ambient;
    old.timers.forEach(clearTimeout);
    old.gain.gain.setTargetAtTime(0, ac.currentTime, FADE_S / 3);
    setTimeout(() => old.nodes.forEach((n) => n.stop()), FADE_S * 1500);
    ambient = null;
  }
  if (!mood) return;
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(1, ac.currentTime, FADE_S / 3);
  gain.connect(getBus(ac).input);
  const nodes = [
    ...CHORDS[mood.scene].flatMap((f, i) => padVoice(ac, gain, f, i)),
    ...noiseBed(ac, gain, mood.weather),
  ];
  const current = { gain, nodes, timers: [] };
  // 일정 간격으로 무언가를 계속 울린다. 타이머는 끌 때 한꺼번에 정리
  const repeat = (slot, range, play) => {
    current.timers[slot] = setTimeout(() => { play(); repeat(slot, range, play); }, between(range));
  };
  const notes = BELL_NOTES[mood.scene];
  repeat(0, BELL_EVERY_MS, () => bell(ac, gain, notes[Math.floor(Math.random() * notes.length)]));
  if (mood.weather !== 'rain') {
    if (mood.scene === 'day') repeat(1, BIRD_EVERY_MS, () => birdCall(ac, gain));
    else repeat(1, CRICKET_EVERY_MS, () => cricket(ac, gain));
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

/** 사용자가 처음 화면을 누를 때 불러 소리를 쓸 수 있게 한다 (브라우저 자동 재생 제한) */
export function unlock() {
  audio();
}
