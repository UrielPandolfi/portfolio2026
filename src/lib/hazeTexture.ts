import { CanvasTexture, LinearFilter, SRGBColorSpace, Texture } from "three";

let cached: Texture | null = null;

/** Soft radial falloff shared by the candle haze sprites. */
export function getHazeTexture() {
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.58, "rgba(255,255,255,0.06)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}
