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
import { beginCameraGesture, noteCameraGesture } from "@/lib/cameraDrag";

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
  const { camera, gl, invalidate } = useThree();
  const look = useRef(new Vector3(...sceneConfig.camera.target));
  const base = useRef(new Vector3(...sceneConfig.camera.position));
  const offset = useRef(new Vector2());
  const pan = useRef(0);
  const dragging = useRef(false);
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
  useEffect(() => {
    if (!mobile) return;
    const element = gl.domElement;
    const limit = sceneConfig.camera.mobile.pan;
    let active: {
      id: number;
      x: number;
      origin: number;
      moved: boolean;
    } | null = null;
    const end = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.id) return;
      dragging.current = false;
      active = null;
      try {
        if (element.hasPointerCapture(event.pointerId)) {
          element.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Capture was never taken.
      }
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || state !== "idle" || active) return;
      beginCameraGesture();
      active = {
        id: event.pointerId,
        x: event.clientX,
        origin: pan.current,
        moved: false,
      };
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // The pointer can already be gone. The drag still follows pointermove.
      }
    };
    const move = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.id || state !== "idle") return;
      const dx = event.clientX - active.x;
      if (!active.moved && Math.abs(dx) < 10) return;
      if (!active.moved) {
        active.moved = true;
        dragging.current = true;
        noteCameraGesture();
      }
      const width = element.clientWidth || 1;
      pan.current = MathUtils.clamp(
        active.origin - (dx / width) * limit * 2,
        -limit,
        limit,
      );
      invalidate();
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
    };
  }, [mobile, state, gl, invalidate]);
  useFrame(({ pointer }, delta) => {
    const parallax = !reducedMotion && !mobile && state === "idle";
    const [side, lift] = sceneConfig.camera.parallax;
    const panGoal = mobile && state === "idle" ? pan.current : 0;
    const goalX = parallax ? pointer.x * side : panGoal;
    offset.current.x =
      mobile && (dragging.current || reducedMotion)
        ? goalX
        : MathUtils.damp(offset.current.x, goalX, mobile ? 9 : 4.5, delta);
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
