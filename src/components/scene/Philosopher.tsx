"use client";
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Group,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { sceneConfig, type Section } from "@/data/sceneConfig";
import assets from "@/data/assets.json";
import { applySeatedPose, findBone } from "@/lib/pose";
import { materialProfiles, prepareImportedModel } from "@/lib/sceneMaterials";

class DeferredTextureLoader extends TextureLoader {
  override load() {
    return new Texture();
  }
}
// FBX points to a missing exporter folder. Suppress those requests, then restore its supplied PBR maps.
const manager = new LoadingManager();
manager.addHandler(/\.(jpeg|jpg|png)$/i, new DeferredTextureLoader());
const fbxLoader = new FBXLoader(manager);

function ExistingPhilosopher({
  calm,
  selected,
}: {
  calm: boolean;
  selected: Section | null;
}) {
  const source = useLoader(fbxLoader, assets.philosopher.url);
  const maps = useTexture(assets.philosopher.textures);
  const group = useRef<Group>(null);
  const character = useMemo(() => {
    const object = clone(source);
    const base = maps.basecolor.clone();
    base.colorSpace = SRGBColorSpace;
    base.needsUpdate = true;
    object.traverse((node) => {
      if (node instanceof Mesh)
        node.material = new MeshStandardMaterial({
          map: base,
          normalMap: maps.normal,
          roughnessMap: maps.roughness,
          metalnessMap: maps.metallic,
          roughness: 1,
          metalness: 0,
        });
    });
    prepareImportedModel(object, materialProfiles.philosopher);
    applySeatedPose(object);
    return object;
  }, [source, maps]);
  const head = useMemo(() => findBone(character, "Head"), [character]);
  const rest = useMemo(
    () => head?.quaternion.clone() ?? new Quaternion(),
    [head],
  );
  const yaw = useMemo(() => new Quaternion(), []);
  const yAxis = useMemo(() => new Vector3(0, 1, 0), []);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    if (calm) {
      group.current.position.y = 0;
      if (head) head.quaternion.copy(rest);
      return;
    }
    const time = clock.elapsedTime;
    group.current.position.y = Math.sin(time * 0.8) * 0.004;
    if (head) {
      const attention =
        selected === "projects"
          ? -0.08
          : selected === "about" || selected === "philosophy"
            ? 0.08
            : pointer.x * 0.035;
      yaw.setFromAxisAngle(yAxis, attention + Math.sin(time * 0.2) * 0.008);
      head.quaternion.copy(rest).multiply(yaw);
    }
  });
  return (
    <group
      position={sceneConfig.philosopher.position}
      scale={sceneConfig.philosopher.scale}
    >
      <group ref={group}>
        <primitive object={character} dispose={null} />
      </group>
    </group>
  );
}
function ReplacementPhilosopher({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const model = clone(scene);
    prepareImportedModel(model, materialProfiles.philosopher);
    return model;
  }, [scene]);
  return (
    <group
      position={sceneConfig.philosopher.position}
      scale={sceneConfig.philosopher.scale}
    >
      <primitive object={object} />
    </group>
  );
}
export function Philosopher(props: {
  calm: boolean;
  selected: Section | null;
}) {
  return sceneConfig.philosopher.replacementGlb ? (
    <ReplacementPhilosopher url={sceneConfig.philosopher.replacementGlb} />
  ) : (
    <ExistingPhilosopher {...props} />
  );
}
