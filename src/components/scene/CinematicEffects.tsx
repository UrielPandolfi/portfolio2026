"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DepthTexture,
  HalfFloatType,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { objectConfig, sceneConfig, type Section } from "@/data/sceneConfig";

const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragmentShader = `
varying vec2 vUv;
uniform sampler2D colorTexture; uniform sampler2D depthTexture;
uniform vec2 resolution; uniform float focus; uniform float focusBand;
uniform float aperture; uniform float maxBlur; uniform float cameraNear; uniform float cameraFar;
float viewDepth(vec2 uv){float d=texture2D(depthTexture,uv).x;return cameraNear*cameraFar/(cameraFar-d*(cameraFar-cameraNear));}
void main(){
  float centerDepth=viewDepth(vUv);
  float radius=min(maxBlur,max(0.,abs(centerDepth-focus)-focusBand)*aperture);
  vec4 center=texture2D(colorTexture,vUv);
  vec4 color=center; float weight=1.;
  for(int i=0;i<12;i++){
    float angle=float(i)*2.39996323;
    vec2 offset=vec2(cos(angle),sin(angle))*sqrt((float(i)+.5)/12.)*radius;
    offset.x*=resolution.y/resolution.x;
    vec2 uv=clamp(vUv+offset,vec2(.001),vec2(.999));
    // Reject foreground samples while blurring the background, preserving silhouettes.
    float sampleWeight=smoothstep(-.7,.0,viewDepth(uv)-centerDepth);
    color+=texture2D(colorTexture,uv)*sampleWeight; weight+=sampleWeight;
  }
  gl_FragColor=color/weight;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

type Pipeline = {
  target: WebGLRenderTarget;
  material: ShaderMaterial;
  quad: FullScreenQuad;
};

/** Uses the color pass's depth texture: no second render of the high-poly assets. */
export function CinematicEffects({
  mobile,
  selected,
}: {
  mobile: boolean;
  selected: Section | null;
}) {
  const { gl, size, invalidate } = useThree();
  const pipeline = useRef<Pipeline | null>(null);
  const vectors = useRef({ direction: new Vector3(), focus: new Vector3() });
  const enabled =
    sceneConfig.effects.enabled && (!mobile || sceneConfig.effects.mobile);
  useEffect(() => {
    if (!enabled) return;
    const target = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      depthBuffer: true,
    });
    target.depthTexture = new DepthTexture(1, 1);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        colorTexture: { value: target.texture },
        depthTexture: { value: target.depthTexture },
        resolution: { value: new Vector2() },
        focus: { value: 7 },
        focusBand: { value: sceneConfig.effects.focusBand },
        aperture: { value: sceneConfig.effects.aperture },
        maxBlur: { value: sceneConfig.effects.maxBlur },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 45 },
      },
    });
    const quad = new FullScreenQuad(material);
    pipeline.current = { target, material, quad };
    invalidate();
    return () => {
      pipeline.current = null;
      target.dispose();
      material.dispose();
      quad.dispose();
    };
  }, [enabled, invalidate]);
  useEffect(() => {
    const current = pipeline.current;
    if (!current) return;
    const scale = gl.getPixelRatio() * sceneConfig.effects.resolution;
    const width = Math.round(size.width * scale),
      height = Math.round(size.height * scale);
    current.target.setSize(width, height);
    current.material.uniforms.resolution.value.set(width, height);
    invalidate();
  }, [size.width, size.height, gl, enabled, invalidate]);
  useFrame(({ scene, camera }) => {
    const current = pipeline.current;
    if (!current || !enabled) {
      gl.render(scene, camera);
      return;
    }
    const { direction, focus } = vectors.current;
    focus.set(
      ...(selected
        ? objectConfig[selected].position
        : sceneConfig.effects.focus),
    );
    if (selected === "about") focus.y += 0.55;
    camera.getWorldDirection(direction);
    current.material.uniforms.focus.value = focus
      .sub(camera.position)
      .dot(direction);
    // Keep the seated subject inside the existing focus range when its placement changes.
    // The far backdrop still falls outside this range; navigation uses its original focus band.
    const subjectDepth = vectors.current.focus
      .set(
        sceneConfig.philosopher.position[0],
        sceneConfig.philosopher.position[1] + 4.35,
        sceneConfig.philosopher.position[2],
      )
      .sub(camera.position)
      .dot(direction);
    current.material.uniforms.focusBand.value = selected
      ? sceneConfig.effects.focusBand
      : Math.max(
          sceneConfig.effects.focusBand,
          Math.abs(subjectDepth - current.material.uniforms.focus.value) + 0.15,
        );
    const previousTarget = gl.getRenderTarget();
    gl.setRenderTarget(current.target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(previousTarget);
    current.quad.render(gl);
  }, 1);
  return null;
}
