import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { LoadingManager, TextureLoader, Texture, Vector3 } from "three";

const manifest = JSON.parse(await fs.readFile("src/data/assets.json", "utf8"));
function glbJSON(bytes) {
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
async function dataModule(filename) {
  const source = await fs.readFile(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  await fs.mkdir(".qa", { recursive: true });
  const dest = path.resolve(".qa", `${path.basename(filename, ".ts")}.mjs`);
  await fs.writeFile(dest, js);
  return import(pathToFileURL(dest).href);
}

test("all manifest URLs and character texture dependencies exist", async () => {
  for (const entry of Object.values(manifest)) {
    assert.ok((await fs.stat(path.join("public", entry.url))).size > 0);
    assert.ok((await fs.stat(entry.source)).size > 0);
    for (const url of Object.values(entry.textures ?? {}))
      assert.ok((await fs.stat(path.join("public", url))).size > 0);
  }
});

test("optimized GLBs preserve triangle counts, materials and embedded textures", async () => {
  for (const asset of Object.values(manifest).filter((asset) =>
    asset.url.endsWith(".glb"),
  )) {
    const original = glbJSON(await fs.readFile(asset.source));
    const prepared = glbJSON(await fs.readFile(path.join("public", asset.url)));
    const triangles = (data) =>
      data.meshes
        .flatMap((mesh) => mesh.primitives)
        .reduce(
          (sum, primitive) => sum + data.accessors[primitive.indices].count / 3,
          0,
        );
    assert.equal(triangles(prepared), triangles(original), asset.url);
    assert.equal(
      prepared.materials.length,
      original.materials.length,
      asset.url,
    );
    assert.equal(prepared.images.length, original.images.length, asset.url);
    assert.ok(
      prepared.images.every((image) => image.bufferView !== undefined),
      `${asset.url}: external texture`,
    );
    assert.ok(
      asset.bytes < asset.originalBytes * 0.4,
      `${asset.url}: compression regression`,
    );
  }
});

test("provided FBX has functional skinning and a seated pose that preserves bone lengths", async () => {
  class NullTextureLoader extends TextureLoader {
    load() {
      return new Texture();
    }
  }
  const manager = new LoadingManager().addHandler(
    /\.(jpeg|jpg|png)$/i,
    new NullTextureLoader(),
  );
  const bytes = await fs.readFile(manifest.philosopher.source);
  const model = new FBXLoader(manager).parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const { applySeatedPose, findBone } = await dataModule("src/lib/pose.ts");
  model.updateMatrixWorld(true);
  const bones = [],
    meshes = [];
  model.traverse((object) => {
    if (object.isBone) bones.push(object);
    if (object.isSkinnedMesh) meshes.push(object);
  });
  assert.equal(bones.length, 65);
  assert.equal(model.animations.length, 0);
  assert.ok(meshes.length > 0);
  const lengths = bones.map((bone) => bone.position.length());
  for (const mesh of meshes) {
    assert.equal(
      mesh.geometry.attributes.skinWeight.count,
      mesh.geometry.attributes.position.count,
    );
    assert.ok(mesh.geometry.attributes.skinWeight.array.every(Number.isFinite));
  }
  applySeatedPose(model);
  bones.forEach((bone, i) => {
    assert.ok(Math.abs(bone.position.length() - lengths[i]) < 1e-8);
    assert.ok(bone.matrixWorld.elements.every(Number.isFinite));
    assert.ok(Math.abs(bone.quaternion.length() - 1) < 1e-6);
  });
  for (const side of ["Left", "Right"]) {
    const hip = findBone(model, `${side}UpLeg`).getWorldPosition(new Vector3());
    const knee = findBone(model, `${side}Leg`).getWorldPosition(new Vector3());
    const foot = findBone(model, `${side}Foot`).getWorldPosition(new Vector3());
    const hand = findBone(model, `${side}Hand`).getWorldPosition(new Vector3());
    assert.ok(knee.z > hip.z + 0.15, `${side} thigh should point forward`);
    assert.ok(foot.y < knee.y - 0.15, `${side} lower leg should point down`);
    assert.ok(hand.z > 0.12, `${side} hand should reach the desktop`);
    assert.ok(
      hand.y * 5 - 0.13 > 3 && hand.y * 5 - 0.13 < 3.6,
      `${side} hand should stay near the desktop`,
    );
  }
});

test("project data supports automatic page pairs and explicitly marks demonstrations", async () => {
  const { projects } = await dataModule("src/data/projects.ts");
  assert.ok(projects.length > 0);
  assert.equal(new Set(projects.map((item) => item.id)).size, projects.length);
  for (const project of projects) {
    assert.ok(
      project.title && project.description && project.category && project.year,
    );
    assert.ok(project.technologies.length > 0);
    assert.ok((await fs.stat(path.join("public", project.image))).size > 0);
    if (project.demo)
      assert.equal(
        project.url,
        null,
        "Demo projects must not link to invented work",
      );
  }
  const { profile } = await dataModule("src/data/profile.ts");
  for (const [key, value] of Object.entries(profile.contact)) {
    assert.ok(
      value === null ||
        (key === "email"
          ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          : /^https:\/\//.test(value)),
      `Invalid ${key} contact value`,
    );
  }
});
