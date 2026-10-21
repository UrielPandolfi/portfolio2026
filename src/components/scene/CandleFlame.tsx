"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  PointLight,
  ShaderMaterial,
} from "three";
import type { Vec3 } from "@/data/sceneConfig";

const vertexShader = `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `varying vec2 vUv; uniform float time;
void main(){vec2 p=vUv; p.x+=(sin(p.y*8.-time*3.)*.045+sin(time*5.)*.02)*p.y;
float width=.28*(1.-p.y)*pow(max(p.y,.001),.28); float body=1.-smoothstep(width*.45,width,abs(p.x-.5));
float tip=smoothstep(0.,.09,p.y)*(1.-smoothstep(.8,1.,p.y));float alpha=body*tip;
vec3 c=mix(vec3(1.,.25,.025),vec3(1.,.88,.45),body*pow(1.-p.y,.5));gl_FragColor=vec4(c,alpha);}`;
export function CandleFlame({
  position,
  calm,
  seed = 0,
}: {
  position: Vec3;
  calm: boolean;
  seed?: number;
}) {
  const shader = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { time: { value: seed } },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [seed],
  );
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    if (calm) return;
    const time = clock.elapsedTime + seed;
    shader.uniforms.time.value = time;
    if (light.current)
      light.current.intensity =
        2.8 + Math.sin(time * 4.7) * 0.15 + Math.sin(time * 7.3) * 0.1;
  });
  return (
    <group position={position}>
      <mesh material={shader} position={[0, 0.15, 0]}>
        <planeGeometry args={[0.22, 0.38]} />
      </mesh>
      <pointLight
        ref={light}
        intensity={2.8}
        color="#ffaa45"
        distance={3.5}
        decay={2}
      />
      <mesh position={[0, 0.11, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshBasicMaterial
          color="#f69b38"
          transparent
          opacity={0.045}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
