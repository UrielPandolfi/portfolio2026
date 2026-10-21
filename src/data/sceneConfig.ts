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
    position: [0, 5.35, 9.2] as Vec3,
    target: [0, 3.9, 0] as Vec3,
    fov: 37,
  },
  desk: {
    position: [0, -0.75, 0] as Vec3,
    rotation: [0, Math.PI / 2, 0] as Vec3,
    scale: 5.9,
  },
  chair: {
    position: [0, 0.35, -1.25] as Vec3,
    rotation: [0, 0, 0] as Vec3,
    scale: 3.7,
  },
  philosopher: {
    position: [0, -0.13, -0.82] as Vec3,
    scale: 5,
    // Set a URL after exporting a replacement from Blender. Expected Y-up, seated, front +Z.
    replacementGlb: null as string | null,
  },
  candles: [
    [-2.48, 3.16, 0.15],
    [2.54, 3.16, 0.84],
  ] as Vec3[],
  ink: { position: [1.02, 3.16, 0.13] as Vec3, scale: 0.66 },
  window: {
    // Percentages of the original 1672 × 941 image; follows the same cover transform.
    left: 70.8,
    top: 0,
    width: 24.7,
    height: 63.5,
    video: null as string | null,
  },
};

export const objectConfig: Record<Section, ObjectConfig> = {
  projects: {
    asset: "book",
    label: "Projects",
    subtitle: "A collection of work",
    numeral: "I",
    position: [-1.65, 3.18, 0.64],
    rotation: [-Math.PI / 2, 0, -0.18],
    scale: 1.4,
    labelOffset: [0, 0.1, 0.68],
    focus: [-1.15, 4.3, 6.6],
  },
  contact: {
    asset: "envelope",
    label: "Contact",
    subtitle: "Begin a conversation",
    numeral: "II",
    position: [0.15, 3.17, 1.03],
    rotation: [-Math.PI / 2, 0, 0.08],
    scale: 1.2,
    labelOffset: [0, 0.1, 0.4],
    focus: [0.2, 4.15, 6.4],
  },
  about: {
    asset: "bust",
    label: "About me",
    subtitle: "The person behind the work",
    numeral: "III",
    position: [1.62, 3.16, -0.18],
    rotation: [0, -0.17, 0],
    scale: 0.95,
    labelOffset: [0, 1.18, 0],
    focus: [1.35, 3.9, 6.5],
  },
  philosophy: {
    asset: "hourglass",
    label: "Philosophy",
    subtitle: "Thoughts on making",
    numeral: "IV",
    position: [2.35, 3.16, -0.55],
    rotation: [0, 0.12, 0],
    scale: 0.84,
    labelOffset: [0, 1.08, 0],
    focus: [1.9, 4.0, 6.5],
  },
};

export const sections: Section[] = [
  "projects",
  "contact",
  "about",
  "philosophy",
];
