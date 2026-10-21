"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import gsap from "gsap";
import {
  objectConfig,
  sceneConfig,
  type SceneState,
  type Section,
} from "@/data/sceneConfig";

export function CameraController({
  state,
  selected,
  reducedMotion,
  mobile,
}: {
  state: SceneState;
  selected: Section | null;
  reducedMotion: boolean;
  mobile: boolean;
}) {
  const { camera, invalidate } = useThree();
  const look = useRef(new Vector3(...sceneConfig.camera.target));
  const base = useRef(new Vector3(...sceneConfig.camera.position));
  useEffect(() => {
    const focused = selected && state !== "idle" && state !== "returning";
    const position = focused
      ? [...objectConfig[selected].focus]
      : [...sceneConfig.camera.position];
    if (mobile) {
      position[2] += focused ? 3 : 3.5;
      position[1] += 0.25;
    }
    const target = focused
      ? [...objectConfig[selected].position]
      : [...sceneConfig.camera.target];
    if (mobile && !focused) target[1] += 0.2;
    const duration = reducedMotion ? 0 : 0.95;
    const move = gsap.to(base.current, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    const aim = gsap.to(look.current, {
      x: target[0],
      y: target[1],
      z: target[2],
      duration,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    return () => {
      move.kill();
      aim.kill();
    };
  }, [state, selected, reducedMotion, mobile, invalidate]);
  useFrame(({ pointer }) => {
    const parallax = !reducedMotion && !mobile && state === "idle";
    camera.position.set(
      base.current.x + (parallax ? pointer.x * 0.055 : 0),
      base.current.y + (parallax ? pointer.y * 0.025 : 0),
      base.current.z,
    );
    camera.lookAt(look.current);
  });
  return null;
}
