import type { AudioListener, Camera, Group, PositionalAudio, Scene } from "three";
import {
  audioConfig,
  type AmbienceEvent,
  type AudioChannel,
} from "@/data/audioConfig";
import { levelBuffer } from "@/lib/levelBuffer";
import { characterBehavior } from "@/data/characterConfig";
import { objectConfig, type Section } from "@/data/sceneConfig";

type Voice = {
  sound: PositionalAudio;
  file: string;
};

const FILES = [
  audioConfig.piano.file,
  audioConfig.hover.file,
  ...Object.values(audioConfig.objects).map((item) => item.file),
  ...Object.values(audioConfig.events).map((item) => item.file),
];

function between(range: readonly [number, number]) {
  return range[0] + Math.random() * (range[1] - range[0]);
}

function roomTone(context: AudioContext) {
  const length = Math.floor(context.sampleRate * 1.15);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const fade = (1 - index / length) ** 3.4;
      data[index] = (Math.random() * 2 - 1) * fade * 0.35;
    }
  }
  return impulse;
}

export class StudyAudio {
  bed = false;
  private context: AudioContext | null = null;
  private camera: Camera | null = null;
  private scene: Scene | null = null;
  private listener: AudioListener | null = null;
  private anchors: Group | null = null;
  private binding: Promise<void> | null = null;
  private spatialGeneration = 0;
  private master: GainNode | null = null;
  private buses: Partial<Record<AudioChannel, GainNode>> = {};
  private pianoInput: GainNode | null = null;
  private pianoFade: GainNode | null = null;
  private pianoSources: AudioBufferSourceNode[] = [];
  private pianoTimer = 0;
  private pianoRunning = false;
  private suspendTimer = 0;
  private scheduler = 0;
  private cache = new Map<string, Promise<AudioBuffer | null>>();
  private voices = new Map<string, Voice>();
  private oneshots: AudioBufferSourceNode[] = [];
  private lastHover = 0;
  private lastBreath = 0;
  private pendingBreath = false;
  private breathDeadline = 0;
  private breathTime = 0;
  private breathCalm = false;
  private busyUntil = 0;
  private nextAt = new Map<AmbienceEvent, number>();
  private readonly fast =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("ambience") === "fast";

  attach(camera: Camera, scene: Scene) {
    this.camera = camera;
    this.scene = scene;
    if (this.context) void this.bindThree();
    return () => this.unmountSpatial();
  }

  /** Shared context. Rain and the room both play through it. */
  ensureContext() {
    if (this.context) return this.context;
    const Context =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const context = new Context();
    this.context = context;
    this.buildBuses(context);
    void this.bindThree();
    return context;
  }

  bus(channel: AudioChannel) {
    const node = this.buses[channel];
    if (!node) throw new Error(`Audio bus ${channel} is not ready`);
    return node;
  }

  setBed(on: boolean) {
    if (!this.context || !this.pianoFade) {
      this.bed = on;
      return;
    }
    if (this.bed === on) {
      if (on) void this.context.resume();
      else this.scheduleSuspend();
      return;
    }
    this.bed = on;
    window.clearTimeout(this.suspendTimer);
    const fade = this.pianoFade.gain;
    const now = this.context.currentTime;
    fade.cancelScheduledValues(now);
    fade.setValueAtTime(fade.value, now);
    if (on) {
      void this.context.resume();
      fade.linearRampToValueAtTime(1, now + audioConfig.piano.fadeIn);
      this.startPiano();
      this.startScheduler();
      for (const file of FILES) void this.load(file);
      return;
    }
    fade.linearRampToValueAtTime(0, now + audioConfig.piano.fadeOut);
    this.stopScheduler();
    this.scheduleSuspend();
  }

  playHover() {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastHover < audioConfig.hover.cooldown * 1000) return;
    this.lastHover = now;
    void this.oneshot(audioConfig.hover.file, audioConfig.hover.volume, "interaction");
  }

  playObject(section: Section) {
    if (!this.canPlay()) return;
    const spec = audioConfig.objects[section];
    const placed = objectConfig[section].position;
    void this.playAt(
      section,
      spec.file,
      spec.volume,
      [placed[0], placed[1] + 0.2, placed[2]],
      "interaction",
      6.2,
      1,
    );
  }

  /** Called from the seated breath so a due exhalation can carry the sound. */
  noteBreath(time: number, calm: boolean) {
    this.breathTime = time;
    this.breathCalm = calm;
    if (!this.pendingBreath || !this.canPlay()) return;
    const phase = (time * characterBehavior.breathingSpeed) % (Math.PI * 2);
    const intoExhale = phase - Math.PI / 2;
    const atExhale = intoExhale > 0 && intoExhale < 0.28;
    if (calm || atExhale || performance.now() > this.breathDeadline) {
      this.pendingBreath = false;
      void this.playEvent("breathing");
    }
  }

  /**
   * Play one layer without waiting for its random interval.
   * Click the page once first, then `studyAudio.preview("breathing")`.
   */
  preview(name: string) {
    void this.runPreview(name);
  }

  status() {
    return {
      bed: this.bed,
      fast: this.fast,
      state: this.context?.state ?? "none",
      loaded: [...this.cache.keys()],
      pendingBreath: this.pendingBreath,
      next: (Object.keys(audioConfig.events) as AmbienceEvent[]).map((id) => ({
        id,
        seconds: Math.round(((this.nextAt.get(id) ?? 0) - performance.now()) / 100) / 10,
      })),
    };
  }

  private async runPreview(name: string) {
    const context = this.ensureContext();
    await context.resume();
    if (name === "piano" || name === "piano-song") {
      this.pianoFade?.gain.setValueAtTime(1, context.currentTime);
      this.startPiano();
      window.setTimeout(() => {
        if (!this.bed) this.stopPiano();
      }, 20000);
      return;
    }
    if (name === "take") {
      await this.oneshot(audioConfig.hover.file, audioConfig.hover.volume, "interaction", true);
      return;
    }
    const object = (Object.keys(audioConfig.objects) as Section[]).find(
      (section) =>
        section === name || audioConfig.objects[section].file.startsWith(name),
    );
    if (object) {
      const spec = audioConfig.objects[object];
      const placed = objectConfig[object].position;
      await this.playAt(
        object,
        spec.file,
        spec.volume,
        [placed[0], placed[1] + 0.2, placed[2]],
        "interaction",
        6.2,
        1,
        true,
      );
      return;
    }
    if (name in audioConfig.events) await this.playEvent(name as AmbienceEvent, true);
  }

  private scheduleSuspend() {
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      if (!this.bed) {
        this.stopPiano();
        void this.context?.suspend();
      }
    }, audioConfig.piano.fadeOut * 1000 + 80);
  }

  private canPlay() {
    return this.bed && !!this.context && this.context.state !== "closed";
  }

  private buildBuses(context: AudioContext) {
    const master = context.createGain();
    master.gain.value = audioConfig.buses.master;
    master.connect(context.destination);
    this.master = master;
    const channels: AudioChannel[] = [
      "ambient",
      "music",
      "environment",
      "interaction",
      "character",
    ];
    for (const channel of channels) {
      const gain = context.createGain();
      gain.gain.value = audioConfig.buses[channel];
      gain.connect(master);
      this.buses[channel] = gain;
    }
    const room = context.createConvolver();
    room.buffer = roomTone(context);
    const roomWet = context.createGain();
    roomWet.gain.value = 0.18;
    this.buses.environment?.connect(room);
    room.connect(roomWet);
    roomWet.connect(master);

    const pianoInput = context.createGain();
    const volume = context.createGain();
    volume.gain.value = audioConfig.piano.volume;
    const fade = context.createGain();
    fade.gain.value = 0;
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = audioConfig.piano.lowpass;
    lowpass.Q.value = 0.7;
    const pianoRoom = context.createConvolver();
    pianoRoom.buffer = room.buffer;
    const pianoWet = context.createGain();
    pianoWet.gain.value = audioConfig.piano.wet;
    pianoInput.connect(volume);
    volume.connect(fade);
    fade.connect(lowpass);
    lowpass.connect(this.bus("music"));
    lowpass.connect(pianoRoom);
    pianoRoom.connect(pianoWet);
    pianoWet.connect(this.bus("music"));
    this.pianoInput = pianoInput;
    this.pianoFade = fade;
  }

  private bindThree() {
    if (!this.context || this.listener) return Promise.resolve();
    if (this.binding) return this.binding;
    const generation = this.spatialGeneration;
    this.binding = import("three").then((three) => {
      if (
        generation !== this.spatialGeneration ||
        !this.context ||
        !this.camera ||
        !this.scene ||
        this.listener
      )
        return;
      three.AudioContext.setContext(this.context);
      this.mountSpatial(three.AudioListener, three.Group, three.PositionalAudio);
    });
    return this.binding;
  }

  private mountSpatial(
    Listener: typeof AudioListener,
    Anchor: typeof import("three").Group,
    Sound: typeof PositionalAudio,
  ) {
    if (!this.context || !this.camera || !this.scene || this.listener) return;
    const listener = new Listener();
    listener.gain.disconnect();
    this.camera.add(listener);
    this.listener = listener;
    const anchors = new Anchor();
    this.scene.add(anchors);
    this.anchors = anchors;
    const add = (
      id: string,
      file: string,
      channel: "environment" | "interaction" | "character",
      position: readonly [number, number, number],
      refDistance: number,
      lowpass: number,
    ) => {
      const sound = new Sound(listener);
      sound.position.set(position[0], position[1], position[2]);
      sound.setRefDistance(refDistance);
      sound.setRolloffFactor(1);
      sound.setDistanceModel("inverse");
      sound.panner.panningModel = "HRTF";
      sound.gain.disconnect();
      sound.gain.connect(this.bus(channel));
      if (lowpass > 0) {
        const filter = this.context!.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = lowpass;
        filter.Q.value = 0.4;
        sound.setFilter(filter);
      }
      anchors.add(sound);
      this.voices.set(id, { sound, file });
    };
    for (const id of Object.keys(audioConfig.events) as AmbienceEvent[]) {
      const event = audioConfig.events[id];
      add(id, event.file, event.channel, event.position, event.refDistance, event.lowpass);
    }
    for (const section of Object.keys(audioConfig.objects) as Section[]) {
      const spec = audioConfig.objects[section];
      const placed = objectConfig[section].position;
      add(section, spec.file, "interaction", placed, 6.2, 0);
    }
  }

  private unmountSpatial() {
    this.spatialGeneration += 1;
    this.binding = null;
    for (const { sound } of this.voices.values()) {
      if (sound.isPlaying) sound.stop();
    }
    if (this.listener) this.camera?.remove(this.listener);
    if (this.anchors) this.scene?.remove(this.anchors);
    this.listener = null;
    this.anchors = null;
    this.voices.clear();
  }

  private startScheduler() {
    const now = performance.now();
    for (const id of Object.keys(audioConfig.events) as AmbienceEvent[]) {
      this.nextAt.set(id, now + this.wait(audioConfig.events[id].every));
    }
    this.arm(this.fast ? 500 : 1000);
  }

  private stopScheduler() {
    window.clearTimeout(this.scheduler);
    this.pendingBreath = false;
  }

  private arm(delay: number) {
    window.clearTimeout(this.scheduler);
    this.scheduler = window.setTimeout(() => this.tick(), Math.max(200, delay));
  }

  private wait(range: readonly [number, number]) {
    return between(range) * (this.fast ? audioConfig.fast : 1) * 1000;
  }

  private tick() {
    if (!this.canPlay()) {
      if (this.bed) this.arm(500);
      return;
    }
    const now = performance.now();
    if (this.pendingBreath) {
      if (now > this.breathDeadline) {
        this.pendingBreath = false;
        void this.playEvent("breathing");
      }
      this.arm(250);
      return;
    }
    if (now < this.busyUntil) {
      this.arm(this.busyUntil - now);
      return;
    }
    const due = (Object.keys(audioConfig.events) as AmbienceEvent[])
      .filter((id) => (this.nextAt.get(id) ?? Infinity) <= now)
      .sort((a, b) => (this.nextAt.get(a) ?? 0) - (this.nextAt.get(b) ?? 0));
    const id = due[0];
    if (!id) {
      const soonest = Math.min(...this.nextAt.values());
      this.arm(soonest - now);
      return;
    }
    const event = audioConfig.events[id];
    this.nextAt.set(id, now + this.wait(event.every));
    if (event.skip > 0 && Math.random() < event.skip) {
      this.arm(this.fast ? 400 : 1000);
      return;
    }
    if (id === "breathing" && !this.breathCalm) {
      this.pendingBreath = true;
      this.breathDeadline = now + (this.fast ? 2000 : 9000);
      this.arm(200);
      return;
    }
    void this.playEvent(id);
    this.arm(this.fast ? 400 : 1000);
  }

  private async playEvent(id: AmbienceEvent, forced = false) {
    if (id === "breathing") {
      const now = performance.now();
      if (now - this.lastBreath < 800) return;
      this.lastBreath = now;
    }
    const event = audioConfig.events[id];
    this.busyUntil = performance.now() + 1500;
    const duration = await this.playAt(
      id,
      event.file,
      between(event.volume),
      event.position,
      event.channel,
      event.refDistance,
      between(event.rate),
      forced,
    );
    if (duration > 0) {
      this.busyUntil =
        performance.now() +
        duration * 1000 +
        audioConfig.gapAfterEvent * (this.fast ? audioConfig.fast : 1) * 1000;
    } else this.busyUntil = performance.now();
  }

  private async playAt(
    id: string,
    file: string,
    volume: number,
    position: readonly [number, number, number],
    _channel: AudioChannel,
    _refDistance: number,
    rate: number,
    forced = false,
  ) {
    await this.bindThree();
    const buffer = await this.load(file);
    const voice = this.voices.get(id);
    if (!buffer || !voice || (!forced && !this.canPlay())) return 0;
    const { sound } = voice;
    if (sound.isPlaying) sound.stop();
    sound.position.set(position[0], position[1], position[2]);
    sound.setBuffer(buffer);
    sound.gain.gain.setValueAtTime(volume, this.context!.currentTime);
    sound.playbackRate = rate;
    sound.play();
    sound.updateMatrixWorld(true);
    return buffer.duration / rate;
  }

  private async oneshot(
    file: string,
    volume: number,
    channel: AudioChannel,
    forced = false,
  ) {
    const buffer = await this.load(file);
    if (!buffer || !this.context || (!forced && !this.canPlay())) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.bus(channel));
    source.start();
    this.oneshots.push(source);
    source.onended = () => {
      gain.disconnect();
      this.oneshots = this.oneshots.filter((item) => item !== source);
    };
  }

  private startPiano() {
    if (this.pianoRunning) return;
    this.pianoRunning = true;
    void this.loopPiano();
  }

  private stopPiano() {
    this.pianoRunning = false;
    window.clearTimeout(this.pianoTimer);
    for (const source of this.pianoSources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.pianoSources = [];
    if (this.pianoFade && this.context) {
      this.pianoFade.gain.setValueAtTime(0, this.context.currentTime);
    }
  }

  private async loopPiano() {
    const buffer = await this.load(audioConfig.piano.file);
    if (!buffer || !this.pianoRunning || !this.context || !this.pianoInput) return;
    const fade = Math.min(audioConfig.piano.crossfade, buffer.duration / 3);
    const spawn = (when: number) => {
      if (!this.pianoRunning || !this.context || !this.pianoInput) return;
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
      envelope.connect(this.pianoInput);
      source.start(start);
      source.stop(end + 0.05);
      this.pianoSources.push(source);
      source.onended = () => {
        envelope.disconnect();
        this.pianoSources = this.pianoSources.filter((item) => item !== source);
      };
      const nextAt = end - fade;
      window.clearTimeout(this.pianoTimer);
      this.pianoTimer = window.setTimeout(
        () => spawn(nextAt),
        Math.max(0, (nextAt - this.context.currentTime) * 1000),
      );
    };
    spawn(this.context.currentTime);
  }

  private load(file: string) {
    const cached = this.cache.get(file);
    if (cached) return cached;
    const pending = this.fetchBuffer(file);
    this.cache.set(file, pending);
    return pending;
  }

  private async fetchBuffer(file: string) {
    if (!FILES.includes(file)) return null;
    const context = this.ensureContext();
    try {
      const response = await fetch(`/assets/audio/${file}`);
      if (!response.ok) throw new Error(response.statusText);
      const encoded = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(encoded.slice(0));
      if (file !== audioConfig.piano.file) levelBuffer(buffer);
      return buffer;
    } catch (error) {
      console.error(`The study could not load ${file}`, error);
      this.cache.delete(file);
      return null;
    }
  }
}

let study: StudyAudio | null = null;

export function getStudy() {
  study ??= new StudyAudio();
  if (typeof window !== "undefined") {
    (window as Window & { studyAudio?: StudyAudio }).studyAudio ??= study;
  }
  return study;
}
