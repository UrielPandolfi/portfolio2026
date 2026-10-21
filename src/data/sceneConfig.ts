import { CHARACTER_Z_OFFSET } from "./characterConfig";

export type Section = "projects" | "about" | "contact" | "philosophy";
export type SceneState = "idle" | "focusing" | Section | "returning";
export type Vec3 = [number, number, number];
export type ObjectConfig = {
  asset: "book" | "envelope" | "bust" | "hourglass";
  label: string;
  subtitle: string;
  numeral: string;
  position: Vec3;
  rotation: Vec3;
  scale: number;
  labelOffset: Vec3;
  focus: Vec3;
};

export const sceneConfig = {
  camera: {
    position: [1.05, 4.28, 6.3] as Vec3,
    target: [0, 3.72, -0.45] as Vec3,
    fov: 44,
    mobile: {
      position: [0.15, 4.7, 9.5] as Vec3,
      target: [0, 3.95, -0.35] as Vec3,
    },
    parallax: [0.9, 0.14],
  },
  desk: {
    position: [0, -0.75, 0] as Vec3,
    rotation: [0, Math.PI / 2, 0] as Vec3,
    scale: 5.9,
  },
  chair: {
    position: [0, 0.35, -1.25 + CHARACTER_Z_OFFSET] as Vec3,
    rotation: [0, 0, 0] as Vec3,
    scale: 3.7,
  },
  philosopher: {
    position: [0, -0.13, -0.82 + CHARACTER_Z_OFFSET] as Vec3,
    scale: 5,
    // Set a URL after exporting a replacement from Blender. Expected Y-up, seated, front +Z.
    replacementGlb: null as string | null,
  },
  candles: [
    {
      position: [-2.12, 3.16, 0.98] as Vec3,
      scale: 0.84,
      intensity: 2.5,
      keyIntensity: 30,
      seed: 0,
    },
    {
      position: [1.38, 3.16, -0.75] as Vec3,
      scale: 0.6,
      intensity: 6.5,
      keyIntensity: 0,
      seed: 7,
    },
  ],
  ink: {
    position: [0.62, 3.16, 0.48] as Vec3,
    rotation: [0, -0.6, 0] as Vec3,
    scale: 0.59,
  },
  lighting: {
    ambient: 0.055,
    exposure: 0.96,
    candleColor: "#ffb568",
    keyTarget: [0.1, 3.65, -0.55] as Vec3,
    window: {
      position: [5.2, 6.4, -5] as Vec3,
      target: [0, 3.4, -0.4] as Vec3,
      color: "#8b9eae",
      intensity: 0.48,
    },
    shadow: {
      mapSize: 1024,
      refreshInterval: 0.18,
      bias: -0.00015,
      normalBias: 0.025,
    },
  },
  environment: {
    origin: [-1.25, 0, 0] as Vec3,
    backdrop: {
      position: [0, 4.55, -8.5] as Vec3,
      width: 24,
      height: (24 * 941) / 1672,
      brightness: 0.36,
    },
    floorY: -0.76,
    window: { left: 5.04, right: 10.97, bottom: 2.7, top: 11.3, z: -8.3 },
    fog: { color: "#111410", near: 9, far: 28 },
  },
  effects: {
    enabled: true,
    mobile: false,
    focus: [0, 3.85, -0.5] as Vec3,
    focusBand: 1.15,
    aperture: 0.0045,
    maxBlur: 0.006,
    resolution: 0.9,
    // Dreamy look. The original pass stays available for comparison.
    dreamy: {
      flameGain: 2.7,
      bloom: {
        intensity: 0.38,
        mobileIntensity: 0.26,
        luminanceThreshold: 1.85,
        luminanceSmoothing: 0.08,
        radius: 0.62,
        levels: 6,
        mobileLevels: 4,
      },
      depthOfField: {
        // Blur starts at the focal plane, so the range has to cover the desk and the sitter.
        focusRange: 8.5,
        focusRangeSelected: 2.6,
        bokehScale: 2.35,
        resolutionScale: 0.5,
      },
      grade: {
        exposure: 0.8,
        amber: 0.08,
        cool: 0.18,
        contrast: 0.03,
      },
      grain: 0.11,
      vignette: {
        offset: 0.46,
        darkness: 0.28,
      },
      haze: {
        color: "#ffb56a",
        opacity: 0.05,
        scale: 0.82,
      },
    },
  },
  window: { video: null as string | null },
};

export const objectConfig: Record<Section, ObjectConfig> = {
  projects: {
    asset: "book",
    label: "Projects",
    subtitle: "A collection of work",
    numeral: "I",
    position: [-1.38, 3.17, 0.48],
    rotation: [-Math.PI / 2, 0, -0.47],
    scale: 1.02,
    labelOffset: [0, 0.7, 0],
    focus: [-1.05, 4.02, 4.2],
  },
  contact: {
    asset: "envelope",
    label: "Contact",
    subtitle: "Begin a conversation",
    numeral: "II",
    position: [-0.02, 3.0, 1.05],
    // Pitched toward the camera so the face reads, with the near edge still on the desk.
    rotation: [-Math.PI / 2 + 0.24, 0, -0.34],
    scale: 0.82,
    labelOffset: [0, 0.48, 0],
    focus: [0.22, 3.95, 3.8],
  },
  about: {
    asset: "bust",
    label: "About me",
    subtitle: "The person behind the work",
    numeral: "III",
    position: [1.86, 3.16, 0.64],
    rotation: [0, -0.68, 0],
    scale: 1.25,
    labelOffset: [0, 1.48, 0],
    focus: [1.1, 4.25, 4.25],
  },
  philosophy: {
    asset: "hourglass",
    label: "Philosophy",
    subtitle: "Thoughts on making",
    numeral: "IV",
    position: [2.59, 3.16, -0.32],
    rotation: [0, 0.4, 0],
    scale: 0.73,
    labelOffset: [0.1, 0.95, 0],
    focus: [1.65, 4.12, 4.45],
  },
};

export const sections: Section[] = [
  "projects",
  "contact",
  "about",
  "philosophy",
];
