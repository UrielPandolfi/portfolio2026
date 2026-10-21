"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Object3D, Vector2 } from "three";
import { characterBehavior } from "@/data/characterConfig";
import { GazeMotion, GazeRig } from "@/lib/characterGaze";

export function useCharacterGaze(
  root: Object3D,
  breathingGroup: RefObject<Group | null>,
  calm: boolean,
  active: boolean,
) {
  const { gl } = useThree();
  const pointer = useRef(new Vector2());
  const controller = useRef<GazeMotion | null>(null);
  const rig = useMemo(
    () => new GazeRig(root, characterBehavior.neckShare),
    [root],
  );
  useEffect(() => {
    controller.current = new GazeMotion(characterBehavior);
    const surface = gl.domElement.closest("main") ?? gl.domElement;
    const clear = () => pointer.current.set(0, 0);
    const move = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType === "touch") {
        clear();
        return;
      }
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((e.clientY - rect.top) / rect.height) * 2,
      );
    };
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    return () => {
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
      rig.restore();
      controller.current = null;
    };
  }, [gl, rig]);
  useFrame(() => rig.restore(), -1);
  // Register this hook after any useAnimations/mixer hook in the character component.
  useFrame((_, delta) => {
    const motion = controller.current;
    if (!motion) return;
    motion.step(delta, pointer.current.x, pointer.current.y, active, calm);
    rig.apply(motion.yaw, motion.pitch);
    if (breathingGroup.current)
      breathingGroup.current.position.y = calm
        ? 0
        : Math.sin(motion.time * characterBehavior.breathingSpeed) *
          characterBehavior.breathingAmplitude;
  });
}
