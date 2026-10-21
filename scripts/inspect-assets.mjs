import fs from "node:fs/promises";
import path from "node:path";

const files = await fs.readdir("Assets");
for (const file of files.filter((entry) => entry.endsWith(".glb"))) {
  const bytes = await fs.readFile(path.join("Assets", file));
  const json = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
  );
  console.log(
    JSON.stringify(
      {
        file,
        bytes: bytes.length,
        meshes: json.meshes?.length,
        skins: json.skins?.length ?? 0,
        animations: json.animations?.length ?? 0,
        images: json.images?.map(({ mimeType, uri, name }) => ({
          mimeType,
          uri,
          name,
        })),
        bounds: json.accessors
          .filter((a) => a.type === "VEC3" && a.min)
          .map(({ min, max }) => ({ min, max })),
      },
      null,
      2,
    ),
  );
}
const fbx = await fs.readFile(
  path.join(
    "Assets",
    files.find((file) => /ancient.man.*\.fbx/i.test(file)),
  ),
);
for (const marker of [
  "LimbNode",
  "Skin",
  "Cluster",
  "AnimationStack",
  "Armature",
]) {
  console.log(`${marker}: ${fbx.toString("latin1").split(marker).length - 1}`);
}
