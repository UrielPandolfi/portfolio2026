"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector2, Vector3 } from "three";
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
  const offset = useRef(new Vector2());
  useEffect(() => {
    const focused = selected && state !== "idle" && state !== "returning";
    const position = focused
      ? [...objectConfig[selected].focus]
      : [
          ...(mobile
            ? sceneConfig.camera.mobile.position
            : sceneConfig.camera.position),
        ];
    if (mobile && focused) {
      position[2] += 3;
      position[1] += 0.25;
    }
    const target = focused
      ? [...objectConfig[selected].position]
      : [
          ...(mobile
            ? sceneConfig.camera.mobile.target
            : sceneConfig.camera.target),
        ];
    if (focused && selected === "about") target[1] += 0.55;
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
  useFrame(({ pointer }, delta) => {
    const parallax = !reducedMotion && !mobile && state === "idle";
    const [side, lift] = sceneConfig.camera.parallax;
    offset.current.x = MathUtils.damp(
      offset.current.x,
      parallax ? pointer.x * side : 0,
      4.5,
      delta,
    );
    offset.current.y = MathUtils.damp(
      offset.current.y,
      parallax ? pointer.y * lift : 0,
      4.5,
      delta,
    );
    camera.position.set(
      base.current.x + offset.current.x,
      base.current.y + offset.current.y,
      base.current.z,
    );
    camera.lookAt(
      look.current.x + offset.current.x,
      look.current.y + offset.current.y * 0.45,
      look.current.z,
    );
  });
  return null;
}
