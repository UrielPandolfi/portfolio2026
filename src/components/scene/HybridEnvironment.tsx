"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, useVideoTexture } from "@react-three/drei";
import { CatmullRomCurve3, DoubleSide, ShaderMaterial, Vector3 } from "three";
import { sceneConfig, type Vec3 } from "@/data/sceneConfig";
import assets from "@/data/assets.json";

const room = sceneConfig.environment;
function Timber({
  position,
  size,
  stone = false,
}: {
  position: Vec3;
  size: Vec3;
  stone?: boolean;
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={stone ? "#282e2b" : "#30231b"}
        roughness={0.98}
      />
    </mesh>
  );
}

const rainVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const rainFragment = `varying vec2 vUv; uniform float time;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
void main(){
  vec2 p=vUv; float lane=floor(p.x*145.); float speed=mix(.16,.32,hash(lane));
  float x=fract(p.x*145.+sin(p.y*8.+lane)*.12);
  float y=fract(p.y*6.+time*speed+hash(lane)*17.);
  float streak=(1.-smoothstep(.02,.16,abs(x-.5)))*smoothstep(.72,.98,y);
  float arch=1.-abs(p.x-.5)*.46;
  float mask=(1.-smoothstep(arch-.025,arch,p.y))*smoothstep(0.,.02,p.y);
  mask*=smoothstep(.02,.035,abs(p.x-.5));
  gl_FragColor=vec4(.56,.66,.75,streak*mask*.18);
}`;

function WindowRain({ calm }: { calm: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (material.current && !calm)
      material.current.uniforms.time.value = clock.elapsedTime;
  });
  const w = room.window;
  return (
    <mesh
      position={[(w.left + w.right) / 2, (w.bottom + w.top) / 2, w.z + 0.05]}
    >
      <planeGeometry args={[w.right - w.left, w.top - w.bottom]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={rainVertex}
        fragmentShader={rainFragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function WindowVideo({ url, calm }: { url: string; calm: boolean }) {
  const texture = useVideoTexture(url, {
    muted: true,
    loop: true,
    start: false,
  });
  useEffect(() => {
    const video = texture.image as HTMLVideoElement;
    if (calm) video.pause();
    else void video.play().catch(() => {});
    return () => video.pause();
  }, [calm, texture]);
  const w = room.window;
  return (
    <mesh
      position={[(w.left + w.right) / 2, (w.bottom + w.top) / 2, w.z - 0.05]}
    >
      <planeGeometry args={[w.right - w.left, w.top - w.bottom]} />
      <meshBasicMaterial map={texture} color="#687178" />
    </mesh>
  );
}

export function HybridEnvironment({ calm }: { calm: boolean }) {
  const backdrop = useTexture(assets.background.url);
  const w = room.window;
  const arch = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(w.left, 7.4, w.z),
        new Vector3(w.left + 0.35, 9.4, w.z),
        new Vector3((w.left + w.right) / 2, w.top, w.z),
        new Vector3(w.right - 0.35, 9.4, w.z),
        new Vector3(w.right, 7.4, w.z),
      ]),
    [w],
  );
  return (
    <group position={room.origin}>
      {/* The original image is now a distant plane, so it shares perspective with the room. */}
      <mesh position={room.backdrop.position}>
        <planeGeometry args={[room.backdrop.width, room.backdrop.height]} />
        <meshBasicMaterial
          map={backdrop}
          color={[
            room.backdrop.brightness,
            room.backdrop.brightness,
            room.backdrop.brightness,
          ]}
          fog={false}
        />
      </mesh>
      <mesh
        position={[0, room.floorY, -3]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#24211c" roughness={0.98} />
      </mesh>
      <mesh position={[0, 6, -8.65]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#161b18" roughness={1} side={DoubleSide} />
      </mesh>
      {[w.left, w.right].map((x) => (
        <Timber
          key={x}
          stone
          position={[x, 5.05, w.z]}
          size={[0.24, 4.7, 0.42]}
        />
      ))}
      <Timber
        stone
        position={[(w.left + w.right) / 2, w.bottom, w.z]}
        size={[w.right - w.left + 0.5, 0.26, 0.65]}
      />
      <Timber
        stone
        position={[(w.left + w.right) / 2, 6.45, w.z]}
        size={[0.19, 7.5, 0.38]}
      />
      <mesh>
        <tubeGeometry args={[arch, 40, 0.13, 6, false]} />
        <meshStandardMaterial color="#272d2a" roughness={0.98} />
      </mesh>
      {[3.5, 5.9, 8.3].map((y) => (
        <Timber key={y} position={[-4.2, y, -8.15]} size={[7.2, 0.15, 0.55]} />
      ))}
      {[-7.8, -0.6].map((x) => (
        <Timber key={x} position={[x, 5.6, -8.12]} size={[0.2, 8, 0.55]} />
      ))}
      {sceneConfig.window.video ? (
        <WindowVideo url={sceneConfig.window.video} calm={calm} />
      ) : (
        <WindowRain calm={calm} />
      )}
    </group>
  );
}
