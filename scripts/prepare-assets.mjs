import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, simplify } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const root = process.cwd();
const input = path.join(root, "Assets");
const output = path.join(root, "public", "assets");
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(root, "src", "data"), { recursive: true });
const entries = await fs.readdir(input);
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const find = (stem, extension) => {
  const file = entries.find(
    (name) =>
      normalize(name).includes(normalize(stem)) &&
      name.toLowerCase().endsWith(extension),
  );
  if (!file)
    throw new Error(`Missing source asset: ${stem} (${extension}) in ${input}`);
  return file;
};
const stems = {
  desk: "antique wooden desk",
  chair: "antique wooden chair",
  book: "antique leather book",
  envelope: "antique parchment envelope",
  bust: "classical bust",
  candle: "antique candle",
  hourglass: "antique hourglass",
  ink: "antique ink bottle",
};
// Target fraction of triangles to keep, and the maximum geometric error as a
// fraction of each mesh. The simplifier stops when either limit is reached, so
// dense props can fall further than the desk, the book, or the bust.
const simplifyProfiles = {
  desk: { ratio: 0.25, error: 0.0008 },
  chair: { ratio: 0.2, error: 0.0008 },
  book: { ratio: 0.3, error: 0.00065 },
  envelope: { ratio: 0.25, error: 0.0006 },
  bust: { ratio: 0.25, error: 0.0005 },
  candle: { ratio: 0.12, error: 0.0008 },
  hourglass: { ratio: 0.25, error: 0.0006 },
  ink: { ratio: 0.15, error: 0.0005 },
};
const geometryStampPath = path.join(output, "geometry-stamp.json");
const geometryStamp = JSON.stringify(simplifyProfiles);
const previousStamp = await fs.readFile(geometryStampPath, "utf8").catch(() => "");
const geometryChanged = previousStamp !== geometryStamp;
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const triangleCount = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .reduce(
      (sum, mesh) =>
        sum +
        mesh.listPrimitives().reduce((inner, primitive) => {
          const indices = primitive.getIndices();
          return inner + (indices ? indices.getCount() / 3 : 0);
        }, 0),
      0,
    );
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const manifest = {};
for (const [key, stem] of Object.entries(stems)) {
  const source = find(stem, ".glb");
  const target = path.join(output, `${key}.glb`);
  const sourceStat = await fs.stat(path.join(input, source));
  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || targetStat.mtimeMs < sourceStat.mtimeMs || geometryChanged) {
    const doc = await io.read(path.join(input, source));
    const beforeTriangles = triangleCount(doc);
    const profile = simplifyProfiles[key];
    await doc.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: profile.ratio,
        error: profile.error,
        lockBorder: true,
      }),
    );
    const afterTriangles = triangleCount(doc);
    for (const texture of doc.getRoot().listTextures()) {
      const image = await sharp(texture.getImage())
        .toColourspace("srgb")
        .resize({
          width: 1536,
          height: 1536,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 88 })
        .toBuffer();
      texture.setImage(image).setMimeType("image/webp");
    }
    await doc.transform(
      dedup(),
      meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    );
    await io.write(target, doc);
    console.log(
      `${key}: ${beforeTriangles} → ${afterTriangles} triangles (${Math.round((1 - afterTriangles / beforeTriangles) * 100)}% less)`,
    );
  }
  const bytes = (await fs.stat(target)).size;
  manifest[key] = {
    url: `/assets/${key}.glb`,
    source: `Assets/${source}`,
    bytes,
    originalBytes: sourceStat.size,
    animations: 0,
  };
  console.log(
    `${key}: ${(sourceStat.size / 1e6).toFixed(1)} MB -> ${(bytes / 1e6).toFixed(2)} MB`,
  );
}
await fs.writeFile(geometryStampPath, geometryStamp);
const character = find("ancient-man", ".fbx");
await fs.copyFile(
  path.join(input, character),
  path.join(output, "philosopher.fbx"),
);
const textureDir = entries.find(
  (name) => normalize(name) === "ancientman" && !name.includes("."),
);
if (!textureDir) throw new Error("Character texture directory not found.");
const textures = await fs.readdir(path.join(input, textureDir));
const textureManifest = {};
for (const slot of ["basecolor", "normal", "roughness", "metallic"]) {
  const source = textures.find((name) => name.toLowerCase().includes(slot));
  if (!source) throw new Error(`Missing character texture ${slot}`);
  await sharp(path.join(input, textureDir, source))
    .resize({
      width: 1536,
      height: 1536,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toFile(path.join(output, `philosopher-${slot}.webp`));
  textureManifest[slot] = `/assets/philosopher-${slot}.webp`;
}
manifest.philosopher = {
  url: "/assets/philosopher.fbx",
  source: `Assets/${character}`,
  textures: textureManifest,
  rig: "Mixamo",
  bones: 65,
  animations: 0,
};
const background = find("Stormlit Scholar", ".png");
await sharp(path.join(input, background))
  .webp({ quality: 93 })
  .toFile(path.join(output, "observatory.webp"));
manifest.background = {
  url: "/assets/observatory.webp",
  source: `Assets/${background}`,
  width: 1672,
  height: 941,
};
// Atmospheric plates derived from the supplied image, explicitly labeled as demos in the UI.
for (const [name, left, top, width, height] of [
  ["book", 230, 95, 550, 700],
  ["hourglass", 1120, 0, 550, 700],
  ["ink", 650, 80, 550, 700],
]) {
  await sharp(path.join(input, background))
    .extract({ left, top, width, height })
    .resize(660, 840)
    .webp({ quality: 88 })
    .toFile(path.join(output, `project-${name}.webp`));
}
await fs.writeFile(
  path.join(root, "src", "data", "assets.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
const audioDir = path.join(input, "audio");
const audioOut = path.join(output, "audio");
await fs.mkdir(audioOut, { recursive: true });
const audioFiles = (await fs.readdir(audioDir)).filter((name) =>
  /\.(mp3|wav|ogg)$/i.test(name),
);
if (audioFiles.length === 0) throw new Error(`No audio files in ${audioDir}`);
for (const name of audioFiles) {
  await fs.copyFile(path.join(audioDir, name), path.join(audioOut, name));
}
console.log(`Audio: ${audioFiles.length} files copied without recompression.`);
console.log("Asset manifest written; originals preserved.");
