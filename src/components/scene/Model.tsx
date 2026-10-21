"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";
import assets from "@/data/assets.json";
import type { Vec3 } from "@/data/sceneConfig";
import { materialProfiles, prepareImportedModel } from "@/lib/sceneMaterials";

export type ModelName =
  | "desk"
  | "chair"
  | "book"
  | "envelope"
  | "bust"
  | "hourglass"
  | "candle"
  | "ink";
export function Model({
  name,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  name: ModelName;
  scale?: number;
  rotation?: Vec3;
}) {
  const { scene } = useGLTF(assets[name].url);
  const [rx, ry, rz] = rotation;
  const prepared = useMemo(() => {
    // Geometry/maps stay shared. Controlled variants never mutate loaded materials.
    const model = scene.clone(true);
    prepareImportedModel(model, materialProfiles[name]);
    model.rotation.set(rx, ry, rz);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const center = box.getCenter(new Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    const group = new Group();
    group.add(model);
    return group;
  }, [scene, name, scale, rx, ry, rz]);
  return <primitive object={prepared} dispose={null} />;
}
