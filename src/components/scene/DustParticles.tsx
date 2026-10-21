"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points } from "three";
export function DustParticles({
  calm,
  mobile,
}: {
  calm: boolean;
  mobile: boolean;
}) {
  const points = useRef<Points>(null);
  const count = mobile ? 28 : 85;
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    let seed = 147;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < count; index++) {
      array[index * 3] = (random() - 0.5) * 8;
      array[index * 3 + 1] = 1.8 + random() * 4;
      array[index * 3 + 2] = (random() - 0.5) * 4;
    }
    return array;
  }, [count]);
  useFrame(({ clock }) => {
    if (points.current && !calm) {
      points.current.position.y = Math.sin(clock.elapsedTime * 0.12) * 0.09;
      points.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.08;
    }
  });
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={mobile ? 0.014 : 0.012}
        color="#e3bf83"
        transparent
        opacity={0.32}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
