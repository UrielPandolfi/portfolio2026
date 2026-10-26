import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  LoadingManager,
  TextureLoader,
  Texture,
  Vector3,
  Group,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PointLight,
  Bone,
  Quaternion,
  AnimationMixer,
  AnimationClip,
  QuaternionKeyframeTrack,
} from "three";

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

test("optimized GLBs reduce triangles while keeping materials and embedded textures", async () => {
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
    assert.ok(
      triangles(prepared) < triangles(original) * 0.5,
      `${asset.url}: expected at least a 50% triangle reduction`,
    );
    assert.ok(
      triangles(prepared) > triangles(original) * 0.08,
      `${asset.url}: geometry was reduced too far`,
    );
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
  const { GazeRig } = await dataModule("src/lib/characterGaze.ts");
  const head = findBone(model, "Head"),
    neck = findBone(model, "Neck");
  const end = findBone(model, "HeadTopEnd");
  const headRest = head.quaternion.clone(),
    neckRest = neck.quaternion.clone();
  const direction = () =>
    end
      .getWorldPosition(new Vector3())
      .sub(head.getWorldPosition(new Vector3()))
      .normalize();
  const before = direction();
  const gaze = new GazeRig(model, 0.28);
  gaze.apply(0, 0.14);
  const after = direction();
  assert.ok(
    after.z > before.z + 0.1,
    "Positive pitch tips the actual FBX head forward/down",
  );
  gaze.restore();
  assert.ok(head.quaternion.angleTo(headRest) < 1e-6);
  assert.ok(neck.quaternion.angleTo(neckRest) < 1e-6);
  const { BreathRig } = await dataModule("src/lib/breath.ts");
  const breath = new BreathRig(model);
  const hands = ["Left", "Right"].map((side) =>
    findBone(model, `${side}Hand`).getWorldPosition(new Vector3()),
  );
  const headHeight = head.getWorldPosition(new Vector3()).y;
  const hipHeight = findBone(model, "Hips").getWorldPosition(new Vector3()).y;
  const shoulderHeight = findBone(model, "LeftShoulder").getWorldPosition(
    new Vector3(),
  ).y;
  breath.apply(0.02);
  hands.forEach((rest, index) => {
    const side = index === 0 ? "Left" : "Right";
    const moved = findBone(model, `${side}Hand`).getWorldPosition(
      new Vector3(),
    );
    assert.ok(
      moved.distanceTo(rest) < 1e-3,
      `${side} hand stays on the desktop while the chest rises`,
    );
  });
  assert.ok(
    head.getWorldPosition(new Vector3()).y > headHeight + 0.015,
    "Head rises with the breath",
  );
  assert.ok(
    findBone(model, "LeftShoulder").getWorldPosition(new Vector3()).y >
      shoulderHeight + 0.015,
    "Shoulders rise with the breath",
  );
  assert.ok(
    Math.abs(
      findBone(model, "Hips").getWorldPosition(new Vector3()).y - hipHeight,
    ) < 1e-4,
    "Hips stay seated",
  );
  breath.apply(0);
  assert.ok(
    Math.abs(head.getWorldPosition(new Vector3()).y - headHeight) < 1e-3,
  );
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

test("imported materials cannot add emission, baked light maps or hidden lights to the scene", async () => {
  const { prepareImportedModel, materialProfiles } = await dataModule(
    "src/lib/sceneMaterials.ts",
  );
  const root = new Group();
  const nested = new Group();
  const map = new Texture();
  const source = new MeshStandardMaterial({
    map,
    emissive: "#ffffff",
    emissiveIntensity: 8,
    roughness: 0.05,
    metalness: 1,
    envMap: map,
    lightMap: map,
  });
  const unlit = new MeshBasicMaterial({ color: "#cccccc", map });
  const mesh = new Mesh(new BoxGeometry(), [source, unlit]);
  nested.add(new PointLight(), mesh);
  root.add(nested);
  assert.equal(
    prepareImportedModel(root, materialProfiles.book).removedLights,
    1,
  );
  root.traverse((object) => assert.ok(!object.isLight));
  for (const material of mesh.material) {
    assert.ok(material instanceof MeshStandardMaterial);
    assert.equal(material.map, map, "Preserve the authored base-color texture");
    assert.equal(material.emissiveIntensity, 0);
    assert.equal(material.emissive.getHex(), 0);
    assert.equal(material.envMap, null);
    assert.equal(material.lightMap, null);
    assert.equal(material.roughness, 1);
    assert.ok(material.metalness < 0.1);
    const shader = { fragmentShader: "#include <roughnessmap_fragment>" };
    material.onBeforeCompile(shader);
    assert.match(shader.fragmentShader, /max\(roughnessFactor, 0\.860\)/);
  }
  assert.ok(mesh.castShadow && mesh.receiveShadow);
  assert.equal(
    source.emissiveIntensity,
    8,
    "Never alter loader-cached source materials",
  );
  assert.equal(source.roughness, 0.05);
  const second = new Group();
  const copy = new Mesh(mesh.geometry, source);
  second.add(copy);
  prepareImportedModel(second, materialProfiles.book);
  assert.equal(
    copy.material,
    mesh.material[0],
    "Instances share the same adjusted material",
  );
});

test("gaze remains bounded, frame-rate independent, and returns to its contemplative pose", async () => {
  const { GazeMotion, lookupEnvelope } = await dataModule(
    "src/lib/characterGaze.ts",
  );
  const { characterBehavior: config } = await dataModule(
    "src/data/characterConfig.ts",
  );
  const run = (fps) => {
    const motion = new GazeMotion(config, () => 0.5);
    for (let i = 0; i < fps * 2; i++)
      motion.step(1 / fps, 100, -100, true, false);
    return motion;
  };
  const a = run(30),
    b = run(60);
  assert.ok(Math.abs(a.yaw - b.yaw) < 1e-8);
  assert.ok(Math.abs(a.pitch - b.pitch) < 1e-8);
  assert.ok(a.yaw <= config.yawLimit * config.followStrength);
  assert.ok(a.pitch <= config.pitchMax);
  assert.equal(lookupEnvelope(0, config), 0);
  assert.equal(lookupEnvelope(config.lookupRise, config), 1);
  assert.equal(
    lookupEnvelope(
      config.lookupRise + config.lookupHold + config.lookupReturn,
      config,
    ),
    0,
  );
  const gesture = new GazeMotion(config, () => 0);
  let lowest = config.idleDownAngle;
  for (let i = 0; i < 60 * 16; i++) {
    gesture.step(1 / 60, 0, 0, true, false);
    lowest = Math.min(lowest, gesture.pitch);
    assert.ok(
      gesture.pitch >= config.pitchMin && gesture.pitch <= config.pitchMax,
    );
  }
  assert.ok(
    lowest < config.idleDownAngle - config.lookupAmount * 0.75,
    "Occasional lift occurs",
  );
  assert.ok(
    Math.abs(gesture.pitch - config.idleDownAngle) < 0.002,
    "Returns smoothly after the gesture",
  );
  const time = gesture.time;
  gesture.step(60, 1, 1, false, false);
  assert.equal(
    gesture.time,
    time,
    "Panel/hidden time cannot trigger a surprise gesture",
  );
  gesture.step(1 / 60, 1, 1, true, true);
  assert.equal(gesture.pitch, config.idleDownAngle);
  assert.equal(gesture.yaw, 0);
  assert.ok(
    new GazeMotion(config, () => 0).nextLookup === config.lookupIntervalMin,
  );
  assert.ok(
    new GazeMotion(config, () => 1).nextLookup === config.lookupIntervalMax,
  );
});

test("gaze rotates head/neck additively without accumulating offsets or replacing mixer animation", async () => {
  const { GazeRig, inspectGazeRig } = await dataModule(
    "src/lib/characterGaze.ts",
  );
  const root = new Group(),
    neck = new Bone(),
    head = new Bone(),
    spine = new Bone();
  spine.name = "mixamorigSpine2";
  neck.name = "mixamorigNeck";
  head.name = "mixamorigHead";
  root.add(spine);
  spine.add(neck);
  neck.add(head);
  head.position.y = 0.2;
  spine.rotation.set(0.05, -0.1, 0.04);
  root.updateMatrixWorld(true);
  const rig = new GazeRig(root, 0.28);
  assert.equal(inspectGazeRig(root).head, head);
  const original = head.quaternion.clone(),
    neckOriginal = neck.quaternion.clone(),
    spineOriginal = spine.quaternion.clone();
  for (let i = 0; i < 1000; i++) {
    rig.restore();
    rig.apply(0.08, 0.14);
  }
  assert.ok(head.quaternion.angleTo(original) > 0.05);
  assert.ok(neck.quaternion.angleTo(neckOriginal) > 0.02);
  assert.ok(spine.quaternion.equals(spineOriginal));
  assert.equal(head.position.y, 0.2);
  rig.restore();
  assert.ok(head.quaternion.angleTo(original) < 1e-6);
  assert.ok(neck.quaternion.angleTo(neckOriginal) < 1e-6);
  const end = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.3);
  const clip = new AnimationClip("idle", 1, [
    new QuaternionKeyframeTrack(
      "mixamorigHead.quaternion",
      [0, 1],
      [...original.toArray(), ...end.toArray()],
    ),
  ]);
  const mixer = new AnimationMixer(root);
  mixer.clipAction(clip).play();
  mixer.update(0.5);
  const animated = head.quaternion.clone();
  rig.apply(0.05, 0.12);
  rig.restore();
  assert.ok(
    head.quaternion.angleTo(animated) < 1e-6,
    "Restore preserves the current animated pose",
  );
  const noHead = new Group(),
    chest = new Bone();
  chest.name = "upperChest";
  noHead.add(chest);
  new GazeRig(noHead, 0.28).apply(0.1, 0.14);
  assert.ok(chest.quaternion.angleTo(new Quaternion()) > 0);
  assert.ok(
    chest.quaternion.angleTo(new Quaternion()) < 0.06,
    "Torso fallback has reduced amplitude",
  );
  assert.doesNotThrow(() => new GazeRig(new Group(), 0.28).apply(0.1, 0.1));
});
