"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D } from "three";
import { sceneConfig } from "@/data/sceneConfig";

export function SceneLighting({ calm }: { calm: boolean }) {
  const { gl, invalidate } = useThree();
  const lastShadow = useRef(-Infinity);
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(...sceneConfig.lighting.window.target);
    return object;
  }, []);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, invalidate]);
  // One shadow map, refreshed at a bounded rate; flicker needs no shadow redraw.
  useFrame(({ clock }) => {
    if (
      calm ||
      clock.elapsedTime - lastShadow.current >
        sceneConfig.lighting.shadow.refreshInterval
    ) {
      gl.shadowMap.needsUpdate = true;
      lastShadow.current = clock.elapsedTime;
    }
  }, -2);
  return (
    <>
      <ambientLight intensity={sceneConfig.lighting.ambient} color="#a5a6a0" />
      <primitive object={target} />
      <directionalLight
        position={sceneConfig.lighting.window.position}
        target={target}
        color={sceneConfig.lighting.window.color}
        intensity={sceneConfig.lighting.window.intensity}
      />
    </>
  );
}
