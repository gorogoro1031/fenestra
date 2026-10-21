// 차 스피커로 나가는 소리. 전부 코드로 만들고 아주 작게 낸다
// 앰비언트 = 낮게 깔리는 화음(패드) + 가끔 울리는 맑은 음 + 바람·빗소리, 모두 잔향을 거친다
const MASTER_GAIN = 0.5;
const FADE_S = 2.5;
const PAD_VOICE_GAIN = 0.035;
const BED_GAIN = { clear: 0.018, rain: 0.05 };
const BELL_GAIN = 0.03;
const BELL_EVERY_MS = [5000, 11000];

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
  tone.frequency.value = 2400;
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
  bus = { input };
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

/** @param {{scene:'day'|'night', weather:'clear'|'rain'}|null} mood null이면 끈다 */
export function setAmbient(mood) {
  const ac = audio();
  if (!ac) return;
  if (ambient) {
    const old = ambient;
    clearTimeout(old.bellTimer);
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
  const current = { gain, nodes, bellTimer: 0 };
  const scheduleBell = () => {
    const [min, max] = BELL_EVERY_MS;
    current.bellTimer = setTimeout(() => {
      const notes = BELL_NOTES[mood.scene];
      bell(ac, gain, notes[Math.floor(Math.random() * notes.length)]);
      scheduleBell();
    }, min + Math.random() * (max - min));
  };
  scheduleBell();
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
