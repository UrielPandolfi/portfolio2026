/** Soft, looping rain. Generated in the browser so the study needs no audio file. */

const LEVEL = 0.2;
const FADE_IN = 1.6;
const FADE_OUT = 0.5;

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makePink(random: () => number) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  return () => {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    return pink * 0.11;
  };
}

export function renderRain(sampleRate: number, seconds = 8) {
  const random = mulberry32(0x51a1);
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.floor(sampleRate * 0.15);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const pinkL = makePink(random);
  const pinkR = makePink(random);
  const lowpass = Math.exp((-2 * Math.PI * 1400) / sampleRate);
  let bedL = 0;
  let bedR = 0;
  let dullL = 0;
  let dullR = 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const swell = 0.86 + 0.14 * Math.sin(time * 0.23 * Math.PI * 2);
    bedL = lowpass * bedL + (1 - lowpass) * pinkL();
    bedR = lowpass * bedR + (1 - lowpass) * pinkR();
    dullL = 0.995 * dullL + 0.005 * bedL;
    dullR = 0.995 * dullR + 0.005 * bedR;
    left[index] = (bedL - dullL) * swell;
    right[index] = (bedR - dullR) * swell;
  }
  const drops = Math.floor(seconds * 22);
  for (let drop = 0; drop < drops; drop += 1) {
    const start = Math.floor(random() * length);
    const duration = Math.floor(sampleRate * (0.03 + random() * 0.07));
    const amplitude = 0.18 + random() * 0.55;
    const pan = random();
    let color = 0;
    for (let step = 0; step < duration; step += 1) {
      const envelope = Math.sin((step / duration) * Math.PI) ** 1.6;
      const white = random() * 2 - 1;
      color = color * 0.82 + white * 0.18;
      const sample = (white - color) * envelope * amplitude * 0.22;
      const at = (start + step) % length;
      left[at] += sample * (1 - pan);
      right[at] += sample * pan;
    }
  }
  const kept = length - fade;
  const loopL = new Float32Array(kept);
  const loopR = new Float32Array(kept);
  for (let index = 0; index < kept; index += 1) {
    loopL[index] = left[index];
    loopR[index] = right[index];
  }
  for (let index = 0; index < fade; index += 1) {
    const weight = index / fade;
    loopL[index] = left[index] * weight + left[kept + index] * (1 - weight);
    loopR[index] = right[index] * weight + right[kept + index] * (1 - weight);
  }
  let peak = 0.0001;
  for (let index = 0; index < kept; index += 1) {
    peak = Math.max(peak, Math.abs(loopL[index]), Math.abs(loopR[index]));
  }
  const gain = 0.82 / peak;
  for (let index = 0; index < kept; index += 1) {
    loopL[index] *= gain;
    loopR[index] *= gain;
  }
  return { left: loopL, right: loopR };
}

export class RainEngine {
  desired = false;
  unlocked = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private quietTimer = 0;
  private listeners = new Set<(playing: boolean) => void>();

  setDesired(on: boolean) {
    this.desired = on;
    if (this.unlocked) this.apply();
    else this.emit();
  }

  unlock() {
    if (this.context) {
      void this.context.resume().then(() => this.emit());
      this.apply();
      return;
    }
    const context = new AudioContext();
    const rain = renderRain(context.sampleRate);
    const buffer = context.createBuffer(
      2,
      rain.left.length,
      context.sampleRate,
    );
    buffer.copyToChannel(rain.left, 0);
    buffer.copyToChannel(rain.right, 1);
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(master);
    source.start();
    this.context = context;
    this.master = master;
    this.unlocked = true;
    void context.resume().then(() => this.emit());
    this.apply();
  }

  subscribe(listener: (playing: boolean) => void) {
    this.listeners.add(listener);
    listener(this.playing);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private get playing() {
    return this.desired && this.context?.state === "running";
  }

  private emit() {
    const playing = this.playing;
    this.listeners.forEach((listener) => listener(playing));
  }

  private apply() {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    window.clearTimeout(this.quietTimer);
    const now = context.currentTime;
    const target = this.desired ? LEVEL : 0;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(
      target,
      now + (this.desired ? FADE_IN : FADE_OUT),
    );
    if (this.desired) void context.resume().then(() => this.emit());
    else {
      this.quietTimer = window.setTimeout(() => {
        if (!this.desired) void context.suspend().then(() => this.emit());
      }, FADE_OUT * 1000 + 80);
    }
    this.emit();
  }
}

let engine: RainEngine | null = null;

export function getRain() {
  engine ??= new RainEngine();
  return engine;
}
