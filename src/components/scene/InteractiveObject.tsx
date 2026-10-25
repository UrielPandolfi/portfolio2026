"use client";
import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { objectConfig, type Section } from "@/data/sceneConfig";
import { takeCameraClick } from "@/lib/cameraDrag";
import { getStudy } from "@/lib/studyAudio";
import { Model } from "./Model";

export function InteractiveObject({
  section,
  enabled,
  onOpen,
  reducedMotion,
}: {
  section: Section;
  enabled: boolean;
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
      hovered && enabled && !reducedMotion ? 0.012 : 0,
      8,
      delta,
    );
  });
  return (
    <group position={config.position}>
      <group
        ref={group}
        onPointerOver={(event) => {
          if (!enabled) return;
          event.stopPropagation();
          if (!hovered) getStudy().playHover();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          if (!enabled || takeCameraClick()) return;
          event.stopPropagation();
          setHovered(false);
          getStudy().playObject(section);
          onOpen(section);
        }}
      >
        <Model
          name={config.asset}
          scale={config.scale}
          rotation={config.rotation}
        />
      </group>
      <Html
        position={config.labelOffset}
        center
        zIndexRange={[5, 1]}
        style={{ display: enabled ? "block" : "none", pointerEvents: "none" }}
      >
        <button
          className={`object-label ${hovered ? "is-hovered" : ""}`}
          tabIndex={-1}
          onClick={() => {
            if (!enabled) return;
            getStudy().playObject(section);
            onOpen(section);
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
