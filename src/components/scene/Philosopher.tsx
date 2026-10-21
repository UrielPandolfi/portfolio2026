"use client";
import { useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  Group,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { sceneConfig, type Section } from "@/data/sceneConfig";
import assets from "@/data/assets.json";
import { applySeatedPose } from "@/lib/pose";
import { materialProfiles, prepareImportedModel } from "@/lib/sceneMaterials";
import { useCharacterGaze } from "@/hooks/useCharacterGaze";

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
  useCharacterGaze(character, group, calm, selected === null);
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
function ReplacementPhilosopher({
  url,
  calm,
  selected,
}: {
  url: string;
  calm: boolean;
  selected: Section | null;
}) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const model = clone(scene);
    prepareImportedModel(model, materialProfiles.philosopher);
    return model;
  }, [scene]);
  const group = useRef<Group>(null);
  useCharacterGaze(object, group, calm, selected === null);
  return (
    <group
      position={sceneConfig.philosopher.position}
      scale={sceneConfig.philosopher.scale}
    >
      <group ref={group}>
        <primitive object={object} dispose={null} />
      </group>
    </group>
  );
}
export function Philosopher(props: {
  calm: boolean;
  selected: Section | null;
}) {
  return sceneConfig.philosopher.replacementGlb ? (
    <ReplacementPhilosopher
      url={sceneConfig.philosopher.replacementGlb}
      {...props}
    />
  ) : (
    <ExistingPhilosopher {...props} />
  );
}
