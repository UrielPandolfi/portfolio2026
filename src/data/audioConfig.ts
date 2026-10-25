import type { Section } from "@/data/sceneConfig";

/** Linear gains and seconds. Edit this file to retune the room. */
export const audioConfig = {
  /** Trims after each sound's own gain. Master stays under 1 so layers do not clip. */
  buses: {
    master: 0.9,
    ambient: 1,
    music: 1,
    environment: 1,
    interaction: 1,
    character: 1,
  },
  /**
   * Recorded rain on the window. The file is leveled in memory after decode;
   * `volume` is the linear gain on the ambient bus.
   */
  rain: {
    file: "gentle-rain-on-window.mp3",
    volume: 0.125,
    fadeIn: 1.6,
    fadeOut: 0.5,
    crossfade: 2.5,
  },
  piano: {
    file: "piano-song.mp3",
    volume: 0.085,
    fadeIn: 4,
    fadeOut: 3,
    lowpass: 2000,
    wet: 0.15,
    crossfade: 1.8,
  },
  hover: {
    file: "take.mp3",
    volume: 0.15,
    cooldown: 0.32,
  },
  objects: {
    projects: { file: "book-opening.mp3", volume: 0.48 },
    contact: { file: "envelope-opening.mp3", volume: 0.48 },
    about: { file: "bust.mp3", volume: 0.25 },
    philosophy: { file: "sand.mp3", volume: 0.48 },
  } satisfies Record<Section, { file: string; volume: number }>,
  events: {
    breathing: {
      file: "breathing.mp3",
      channel: "character" as const,
      volume: [0.52, 0.7] as [number, number],
      every: [35, 90] as [number, number],
      position: [0, 4.2, -2.3] as [number, number, number],
      refDistance: 8.7,
      lowpass: 0,
      rate: [1, 1] as [number, number],
      skip: 0,
    },
    "wood-floor": {
      file: "wood-floor.wav",
      channel: "environment" as const,
      volume: [0.32, 0.46] as [number, number],
      every: [70, 160] as [number, number],
      position: [0, 0.35, -3.05] as [number, number, number],
      refDistance: 10.2,
      lowpass: 0,
      rate: [0.95, 1.05] as [number, number],
      skip: 0,
    },
    "door-knock": {
      file: "door-knock.mp3",
      channel: "environment" as const,
      volume: [0.24, 0.34] as [number, number],
      every: [150, 330] as [number, number],
      position: [8, 7, -8.3] as [number, number, number],
      refDistance: 16.3,
      lowpass: 1100,
      rate: [0.97, 1.03] as [number, number],
      skip: 0.45,
    },
  },
  /** Silence after an occasional sound before another one may start. */
  gapAfterEvent: 6,
  /** `?ambience=fast` multiplies the waits so the scheduler can be heard. */
  fast: 0.045,
};

export type AmbienceEvent = keyof typeof audioConfig.events;
export type AudioChannel = keyof typeof audioConfig.buses;
