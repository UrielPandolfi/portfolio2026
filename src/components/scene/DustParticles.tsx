"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ShaderMaterial, Vector3 } from "three";
import { sceneConfig } from "@/data/sceneConfig";

const vertexShader = `
attribute float seed;
attribute vec3 velocity;
uniform float time;
uniform vec3 candleA;
uniform vec3 candleB;
uniform vec3 boxMin;
uniform vec3 boxSize;
varying float vAlpha;
vec3 wrapped(vec3 p){
  vec3 t=(p-boxMin)/boxSize;
  return boxMin+(t-floor(t))*boxSize;
}
void main(){
  vec3 pos=wrapped(position+velocity*time);
  vec3 local=(pos-boxMin)/boxSize;
  float edge=min(min(local.x,1.-local.x),min(local.y,1.-local.y));
  edge=min(edge,min(local.z,1.-local.z));
  float edgeFade=smoothstep(0.,.12,edge);
  vec4 world=modelMatrix*vec4(pos,1.);
  float a=length(world.xyz-candleA);
  float b=length(world.xyz-candleB);
  float light=exp(-a*a*1.35)+exp(-b*b*.95);
  float lit=smoothstep(.06,.38,light);
  vAlpha=lit*edgeFade*mix(.22,.55,seed);
  vec4 view=viewMatrix*world;
  gl_PointSize=clamp(mix(11.,20.,seed)/max(-view.z,.001),1.6,3.6);
  gl_Position=projectionMatrix*view;
}`;

const fragmentShader = `
varying float vAlpha;
void main(){
  float d=length(gl_PointCoord-.5);
  float grain=1.-smoothstep(.2,.5,d);
  float alpha=grain*vAlpha;
  if(alpha<.012) discard;
  gl_FragColor=vec4(.8,.6,.34,alpha);
}`;

function flameOf(index: number) {
  const candle = sceneConfig.candles[index];
  return new Vector3(
    candle.position[0],
    candle.position[1] + candle.scale + 0.16,
    candle.position[2],
  );
}

function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function gaussian(random: () => number) {
  const u = Math.max(1e-6, random());
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

export function DustParticles({
  calm,
  mobile,
}: {
  calm: boolean;
  mobile: boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const elapsed = useRef(0);
  const count = mobile
    ? sceneConfig.dust.mobileCount
    : sceneConfig.dust.count;
  const geometry = useMemo(() => {
    const random = makeRandom(147);
    const flames = [flameOf(0), flameOf(1)];
    const positions = new Float32Array(count * 3);
    const velocity = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const speed = sceneConfig.dust.speed;
    let min = new Vector3(Infinity, Infinity, Infinity);
    let max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let index = 0; index < count; index++) {
      const flame = flames[index % flames.length];
      const point = new Vector3(
        flame.x + Math.max(-1.45, Math.min(1.45, gaussian(random) * 0.82)),
        Math.max(
          3.32,
          flame.y + Math.max(-0.85, Math.min(0.85, gaussian(random) * 0.48)),
        ),
        flame.z + Math.max(-1.15, Math.min(1.15, gaussian(random) * 0.68)),
      );
      positions.set([point.x, point.y, point.z], index * 3);
      min.min(point);
      max.max(point);
      const direction = new Vector3(
        random() * 2 - 1,
        random() * 0.35,
        random() * 2 - 1,
      );
      if (direction.lengthSq() < 1e-4) direction.set(0, 1, 0);
      direction.normalize().multiplyScalar(speed * (0.45 + random() * 0.7));
      velocity.set([direction.x, direction.y, direction.z], index * 3);
      seed[index] = random();
    }
    min.addScalar(-0.9);
    max.addScalar(0.9);
    return {
      positions,
      velocity,
      seed,
      boxMin: min,
      boxSize: max.sub(min),
    };
  }, [count]);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      candleA: { value: flameOf(0) },
      candleB: { value: flameOf(1) },
      boxMin: { value: geometry.boxMin },
      boxSize: { value: geometry.boxSize },
    }),
    [geometry],
  );
  useFrame((_, delta) => {
    if (!material.current) return;
    if (!calm) elapsed.current += Math.min(delta, 0.05);
    material.current.uniforms.time.value = elapsed.current;
  });
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[geometry.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-velocity"
          args={[geometry.velocity, 3]}
        />
        <bufferAttribute attach="attributes-seed" args={[geometry.seed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
