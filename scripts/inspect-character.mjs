import fs from "node:fs/promises";
import { LoadingManager, TextureLoader, Texture, Vector3, Euler } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

class DeferredTextures extends TextureLoader {
  load() {
    return new Texture();
  }
}
const manifest = JSON.parse(await fs.readFile("src/data/assets.json", "utf8"));
const manager = new LoadingManager().addHandler(
  /\.(jpeg|jpg|png)$/i,
  new DeferredTextures(),
);
const bytes = await fs.readFile(manifest.philosopher.source);
const model = new FBXLoader(manager).parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
model.updateMatrixWorld(true);
const bones = [];
model.traverse((node) => {
  if (node.isBone)
    bones.push({
      name: node.name,
      parent: node.parent?.name,
      position: node
        .getWorldPosition(new Vector3())
        .toArray()
        .map((n) => +n.toFixed(4)),
      localEuler: new Euler()
        .setFromQuaternion(node.quaternion)
        .toArray()
        .slice(0, 3)
        .map((n) => +n.toFixed(4)),
    });
});
console.log(
  JSON.stringify(
    {
      source: manifest.philosopher.source,
      clips: model.animations.map((a) => a.name),
      bones,
    },
    null,
    2,
  ),
);
