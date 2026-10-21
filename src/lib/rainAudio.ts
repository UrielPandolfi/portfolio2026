import { audioConfig } from "@/data/audioConfig";
import { levelBuffer } from "@/lib/levelBuffer";
import { getStudy } from "@/lib/studyAudio";

const RAIN = audioConfig.rain;

export class RainEngine {
  desired = false;
  unlocked = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private loopTimer = 0;
  private loopPromise: Promise<void> | null = null;
  private listeners = new Set<(playing: boolean) => void>();

  setDesired(on: boolean) {
    this.desired = on;
    if (this.unlocked) {
      this.apply();
      getStudy().setBed(on);
    } else this.emit();
  }

  unlock() {
    const context = getStudy().ensureContext();
    void context.resume().then(() => this.emit());
    if (!this.context) {
      const master = context.createGain();
      master.gain.value = 0;
      master.connect(getStudy().bus("ambient"));
      this.context = context;
      this.master = master;
      this.unlocked = true;
    }
    this.ensureLoop();
    this.apply();
    getStudy().setBed(this.desired);
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
    const now = context.currentTime;
    const target = this.desired ? RAIN.volume : 0;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(
      target,
      now + (this.desired ? RAIN.fadeIn : RAIN.fadeOut),
    );
    if (this.desired) void context.resume().then(() => this.emit());
    this.emit();
  }

  private ensureLoop() {
    this.loopPromise ??= this.startLoop().catch((error) => {
      console.error("The study could not load the rain", error);
      this.loopPromise = null;
    });
  }

  private async startLoop() {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const response = await fetch(`/assets/audio/${RAIN.file}`);
    if (!response.ok) throw new Error(response.statusText);
    const encoded = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(encoded.slice(0));
    levelBuffer(buffer);
    if (context.state === "closed" || this.sources.length > 0) return;
    const fade = Math.min(RAIN.crossfade, buffer.duration / 3);
    const spawn = (when: number) => {
      if (!this.context || !this.master) return;
      const source = this.context.createBufferSource();
      const envelope = this.context.createGain();
      const start = Math.max(when, this.context.currentTime);
      const end = start + buffer.duration;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(1, start + fade);
      envelope.gain.setValueAtTime(1, Math.max(start + fade, end - fade));
      envelope.gain.linearRampToValueAtTime(0, end);
      source.buffer = buffer;
      source.connect(envelope);
      envelope.connect(this.master);
      source.start(start);
      source.stop(end + 0.05);
      this.sources.push(source);
      source.onended = () => {
        envelope.disconnect();
        this.sources = this.sources.filter((item) => item !== source);
      };
      const nextAt = end - fade;
      window.clearTimeout(this.loopTimer);
      this.loopTimer = window.setTimeout(
        () => spawn(nextAt),
        Math.max(0, (nextAt - this.context.currentTime) * 1000),
      );
    };
    spawn(context.currentTime);
  }
}

let engine: RainEngine | null = null;

export function getRain() {
  engine ??= new RainEngine();
  return engine;
}
