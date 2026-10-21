import {
  Color,
  Light,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";

export type MaterialProfile = {
  brightness: number;
  roughness: number;
  metalness: number;
};
export const materialProfiles = {
  desk: { brightness: 0.72, roughness: 0.88, metalness: 0 },
  chair: { brightness: 0.66, roughness: 0.9, metalness: 0 },
  book: { brightness: 0.78, roughness: 0.86, metalness: 0.015 },
  envelope: { brightness: 0.72, roughness: 0.96, metalness: 0 },
  bust: { brightness: 0.67, roughness: 0.9, metalness: 0 },
  candle: { brightness: 0.82, roughness: 0.75, metalness: 0.08 },
  hourglass: { brightness: 0.76, roughness: 0.72, metalness: 0.12 },
  ink: { brightness: 0.75, roughness: 0.62, metalness: 0.16 },
  philosopher: { brightness: 0.84, roughness: 0.85, metalness: 0 },
} satisfies Record<string, MaterialProfile>;

const materialCache = new WeakMap<
  Material,
  Map<MaterialProfile, MeshStandardMaterial>
>();
export function controlledMaterial(source: Material, profile: MaterialProfile) {
  let variants = materialCache.get(source);
  if (!variants) {
    variants = new Map();
    materialCache.set(source, variants);
  }
  const existing = variants.get(profile);
  if (existing) return existing;
  // Imported unlit materials are brought back under the same scene lighting.
  const material =
    source instanceof MeshStandardMaterial
      ? source.clone()
      : new MeshStandardMaterial();
  if (source instanceof MeshBasicMaterial) {
    material.map = source.map;
    material.color.copy(source.color);
    material.side = source.side;
    material.transparent = source.transparent;
    material.opacity = source.opacity;
    material.alphaMap = source.alphaMap;
  }
  material.name = `${source.name}-candlelit`;
  material.color.multiplyScalar(profile.brightness);
  material.emissive = new Color(0);
  material.emissiveMap = null;
  material.emissiveIntensity = 0;
  material.envMap = null;
  material.envMapIntensity = 0;
  material.lightMap = null;
  material.lightMapIntensity = 0;
  material.roughness = 1;
  material.metalness = profile.metalness;
  // Preserve roughness detail above a floor that keeps wood, paper and stone matte.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>\nroughnessFactor = max(roughnessFactor, ${profile.roughness.toFixed(3)});`,
    );
  };
  material.customProgramCacheKey = () => `candlelit-${profile.roughness}`;
  variants.set(profile, material);
  return material;
}

export function prepareImportedModel(root: Object3D, profile: MaterialProfile) {
  const lights: Light[] = [];
  root.traverse((node) => {
    if (node instanceof Light) lights.push(node);
    if (node instanceof Mesh) {
      node.material = Array.isArray(node.material)
        ? node.material.map((material) => controlledMaterial(material, profile))
        : controlledMaterial(node.material, profile);
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  for (const light of lights) light.removeFromParent();
  return { removedLights: lights.length };
}
