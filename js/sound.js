// 차 스피커로 나가는 소리. 전부 코드로 만들고 아주 작게 낸다
const AMBIENT_GAIN = 0.05;
const FADE_S = 1.5;

let ctx = null;
let ambient = null;

function audio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
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

/** @param {'wind'|'rain'|null} kind */
export function setAmbient(kind) {
  const ac = audio();
  if (!ac) return;
  if (ambient) {
    const old = ambient;
    old.gain.gain.setTargetAtTime(0, ac.currentTime, FADE_S / 3);
    setTimeout(() => old.source.stop(), FADE_S * 1000 + 200);
    ambient = null;
  }
  if (!kind) return;
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer(ac);
  source.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = kind === 'rain' ? 'highpass' : 'lowpass';
  filter.frequency.value = kind === 'rain' ? 900 : 420;
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(kind === 'rain' ? AMBIENT_GAIN * 0.8 : AMBIENT_GAIN, ac.currentTime, FADE_S / 3);
  source.connect(filter).connect(gain).connect(ac.destination);
  source.start();
  ambient = { source, gain };
}

function tone(freq, start, duration, volume = 0.12, type = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function drip() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

export function chime() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [659, 880, 1175].forEach((f, i) => tone(f, t + i * 0.14, 1.4, 0.08));
}

/** 사용자가 처음 화면을 누를 때 한 번 불러 소리를 쓸 수 있게 한다 */
export function unlock() {
  audio();
}
