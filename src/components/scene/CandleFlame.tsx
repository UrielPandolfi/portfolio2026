"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  PointLight,
  SpotLight,
  Object3D,
  ShaderMaterial,
} from "three";
import { sceneConfig, type Vec3 } from "@/data/sceneConfig";

const vertexShader = `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `varying vec2 vUv; uniform float time;
void main(){vec2 p=vUv; p.x+=(sin(p.y*8.-time*3.)*.045+sin(time*5.)*.02)*p.y;
float width=.28*(1.-p.y)*pow(max(p.y,.001),.28); float body=1.-smoothstep(width*.45,width,abs(p.x-.5));
float tip=smoothstep(0.,.09,p.y)*(1.-smoothstep(.8,1.,p.y));float alpha=body*tip;
vec3 c=mix(vec3(1.,.25,.025),vec3(1.,.88,.45),body*pow(1.-p.y,.5));gl_FragColor=vec4(c*2.2,alpha);}`;
export function CandleFlame({
  position,
  calm,
  seed = 0,
  intensity,
  keyIntensity,
}: {
  position: Vec3;
  calm: boolean;
  seed?: number;
  intensity: number;
  keyIntensity: number;
}) {
  const { scene, invalidate } = useThree();
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(...sceneConfig.lighting.keyTarget);
    return object;
  }, []);
  useEffect(() => {
    scene.add(target);
    invalidate();
    return () => {
      scene.remove(target);
    };
  }, [scene, target, invalidate]);
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
  const keyLight = useRef<SpotLight>(null);
  useEffect(() => () => shader.dispose(), [shader]);
  useFrame(({ clock }) => {
    const time = (calm ? 0 : clock.elapsedTime) + seed;
    shader.uniforms.time.value = time;
    const flicker = calm
      ? 1
      : 1 + Math.sin(time * 1.9) * 0.024 + Math.sin(time * 5.3) * 0.014;
    if (light.current) light.current.intensity = intensity * flicker;
    if (keyLight.current) keyLight.current.intensity = keyIntensity * flicker;
  });
  return (
    <group position={position}>
      <mesh material={shader} position={[0, 0.1, 0]}>
        <planeGeometry args={[0.16, 0.27]} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.12, 0]}
        intensity={intensity}
        color={sceneConfig.lighting.candleColor}
        distance={5}
        decay={2}
      />
      {keyIntensity > 0 && (
        <spotLight
          ref={keyLight}
          position={[0, 0.12, 0]}
          target={target}
          intensity={keyIntensity}
          color={sceneConfig.lighting.candleColor}
          distance={9}
          decay={2}
          angle={1.18}
          penumbra={0.9}
          castShadow
          shadow-mapSize-width={sceneConfig.lighting.shadow.mapSize}
          shadow-mapSize-height={sceneConfig.lighting.shadow.mapSize}
          shadow-camera-near={0.1}
          shadow-camera-far={9}
          shadow-bias={sceneConfig.lighting.shadow.bias}
          shadow-normalBias={sceneConfig.lighting.shadow.normalBias}
        />
      )}
      <mesh position={[0, 0.11, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial
          color="#f69b38"
          transparent
          opacity={0.025}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
