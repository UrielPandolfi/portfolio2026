"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  Color,
  Group,
  Mesh,
  ShaderMaterial,
  Vector2,
} from "three";

const OUTLINE = "click-outline";

const vertexShader = `
  uniform float thickness;
  uniform vec2 size;
  void main() {
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 clipNormal = projectionMatrix * modelViewMatrix * vec4(normal, 0.0);
    vec2 direction = clipNormal.xy;
    float span = length(direction);
    if (span > 0.0001) {
      clipPosition.xy += normalize(direction) * thickness / size * clipPosition.w * 2.0;
    }
    gl_Position = clipPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  void main() {
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createOutline(mesh: Mesh, size: Vector2) {
  const material = new ShaderMaterial({
    uniforms: {
      thickness: { value: 2.6 },
      size: { value: size.clone() },
      color: { value: new Color("#f0e2c4") },
      opacity: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: BackSide,
    transparent: true,
    depthWrite: false,
    toneMapped: true,
  });
  const shell = new Mesh(mesh.geometry, material);
  shell.name = OUTLINE;
  shell.userData[OUTLINE] = true;
  shell.raycast = () => undefined;
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.renderOrder = mesh.renderOrder + 1;
  mesh.add(shell);
  return shell;
}

/** A thin camera-facing rim so the four choosable objects read as clickable. */
export function ClickOutline({
  active,
  hovered,
  reducedMotion,
  children,
}: {
  active: boolean;
  hovered: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const shells = useRef<Mesh[]>([]);
  const { gl } = useThree();
  const size = useRef(new Vector2());

  useLayoutEffect(() => {
    const root = group.current;
    if (!root) return;
    const meshes: Mesh[] = [];
    root.traverse((node) => {
      if (node instanceof Mesh && !node.userData[OUTLINE]) meshes.push(node);
    });
    gl.getDrawingBufferSize(size.current);
    const created = meshes.map((mesh) => createOutline(mesh, size.current));
    shells.current = created;
    return () => {
      for (const shell of created) {
        shell.removeFromParent();
        const material = shell.material;
        if (material instanceof ShaderMaterial) material.dispose();
      }
      shells.current = [];
    };
  }, [gl]);

  useFrame(({ clock }) => {
    gl.getDrawingBufferSize(size.current);
    const gleam = reducedMotion
      ? 0.58
      : 0.02 + Math.sin(clock.elapsedTime * 2) * 0.02;
    const opacity = active ? (hovered ? 0.1 : gleam) : 0;
    const thickness = hovered ? 3.6 : 2.6;
    for (const shell of shells.current) {
      shell.visible = active;
      const material = shell.material;
      if (!(material instanceof ShaderMaterial)) continue;
      material.uniforms.opacity.value = opacity;
      material.uniforms.thickness.value = thickness;
      material.uniforms.size.value.copy(size.current);
    }
  });

  return <group ref={group}>{children}</group>;
}
