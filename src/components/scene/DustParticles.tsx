"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points } from "three";
import { sceneConfig } from "@/data/sceneConfig";
const vertexShader = `
uniform vec3 candleA; uniform vec3 candleB;
varying float illumination;
void main(){
  vec4 world=modelMatrix*vec4(position,1.);
  vec4 view=modelViewMatrix*vec4(position,1.);
  float a=length(world.xyz-candleA), b=length(world.xyz-candleB);
  illumination=.045+.3*exp(-a*a*.28)+.2*exp(-b*b*.4);
  gl_PointSize=clamp(13./-view.z,1.,3.);
  gl_Position=projectionMatrix*view;
}`;
const fragmentShader = `
varying float illumination;
void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.08,.5,d))*illumination;
gl_FragColor=vec4(.83,.64,.37,alpha);
}`;
export function DustParticles({
  calm,
  mobile,
}: {
  calm: boolean;
  mobile: boolean;
}) {
  const points = useRef<Points>(null);
  const count = mobile ? 28 : 85;
  const uniforms = useMemo(
    () => ({
      candleA: {
        value: sceneConfig.candles[0].position.map(
          (v, i) => v + (i === 1 ? 0.9 : 0),
        ),
      },
      candleB: {
        value: sceneConfig.candles[1].position.map(
          (v, i) => v + (i === 1 ? 0.7 : 0),
        ),
      },
    }),
    [],
  );
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    let seed = 147;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < count; index++) {
      array[index * 3] = (random() - 0.5) * 8;
      array[index * 3 + 1] = 3.3 + random() * 3;
      array[index * 3 + 2] = -3 + random() * 5;
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
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
