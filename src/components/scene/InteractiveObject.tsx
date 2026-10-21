"use client";
import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { objectConfig, type Section } from "@/data/sceneConfig";
import { Model } from "./Model";

export function InteractiveObject({
  section,
  enabled,
  hidden,
  onOpen,
  reducedMotion,
}: {
  section: Section;
  enabled: boolean;
  hidden: boolean;
  onOpen: (section: Section) => void;
  reducedMotion: boolean;
}) {
  const config = objectConfig[section];
  const [hovered, setHovered] = useState(false);
  const group = useRef<Group>(null);
  useEffect(() => {
    if (hovered && enabled) document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, enabled]);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.y = MathUtils.damp(
      group.current.position.y,
      hovered && enabled && !reducedMotion ? 0.035 : 0,
      8,
      delta,
    );
  });
  return (
    <group position={config.position} visible={!hidden}>
      <group
        ref={group}
        onPointerOver={(event) => {
          if (enabled) {
            event.stopPropagation();
            setHovered(true);
          }
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          if (enabled) {
            event.stopPropagation();
            setHovered(false);
            onOpen(section);
          }
        }}
      >
        <Model
          name={config.asset}
          scale={config.scale}
          rotation={config.rotation}
        />
        {hovered && enabled && (
          <pointLight
            position={[0, 0.65, 0.6]}
            intensity={0.5}
            color="#ffda92"
            distance={2}
          />
        )}
      </group>
      <Html
        position={config.labelOffset}
        center
        zIndexRange={[5, 1]}
        style={{ display: enabled ? "block" : "none" }}
      >
        <button
          className={`object-label ${hovered ? "is-hovered" : ""}`}
          tabIndex={-1}
          onClick={() => {
            if (enabled) onOpen(section);
          }}
          aria-label={`Open ${config.label}`}
        >
          <span>{config.label}</span>
          <small>{config.numeral}</small>
        </button>
      </Html>
    </group>
  );
}
