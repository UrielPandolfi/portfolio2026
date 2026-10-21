"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";
import {
  sceneConfig,
  sections,
  type SceneState,
  type Section,
} from "@/data/sceneConfig";
import { CameraController } from "./CameraController";
import { Desk } from "./Desk";
import { Philosopher } from "./Philosopher";
import { SceneLighting } from "./SceneLighting";
import { InteractiveObject } from "./InteractiveObject";
import { CandleFlame } from "./CandleFlame";
import { DustParticles } from "./DustParticles";
import { AudioRig } from "./AudioRig";
import { Model } from "./Model";
import { HybridEnvironment } from "./HybridEnvironment";
import { CinematicEffects } from "./CinematicEffects";
import { DreamyEffects } from "./DreamyEffects";

function FramePolicy({ visible, calm }: { visible: boolean; calm: boolean }) {
  const { setFrameloop, invalidate } = useThree();
  useEffect(() => {
    setFrameloop(!visible ? "never" : calm ? "demand" : "always");
    if (visible) invalidate();
  }, [visible, calm, setFrameloop, invalidate]);
  return null;
}
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}
export function LoadingStatus() {
  const { active, progress } = useProgress();
  return active ? (
    <div className="loading-note" role="status">
      <p>Opening the study…</p>
      <div className="loading-rule">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span>GATHERING THE DETAILS · {Math.round(progress)}%</span>
    </div>
  ) : null;
}
export default function Experience({
  state,
  selected,
  onOpen,
  reducedMotion,
  mobile,
  visible,
  dreamy,
  onReady,
}: {
  state: SceneState;
  selected: Section | null;
  onOpen: (section: Section) => void;
  reducedMotion: boolean;
  mobile: boolean;
  visible: boolean;
  dreamy: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      dpr={mobile ? [1, 1.1] : [1, 1.35]}
      camera={{
        position: sceneConfig.camera.position,
        fov: sceneConfig.camera.fov,
        near: 0.1,
        far: 45,
      }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: sceneConfig.lighting.exposure,
      }}
      fallback={
        <span>
          Interactive 3D study. The navigation below provides access to every
          section.
        </span>
      }
    >
      <FramePolicy visible={visible} calm={reducedMotion} />
      <AudioRig />
      <CameraController
        state={state}
        selected={selected}
        reducedMotion={reducedMotion}
        mobile={mobile}
      />
      <fog
        attach="fog"
        args={[
          sceneConfig.environment.fog.color,
          sceneConfig.environment.fog.near,
          sceneConfig.environment.fog.far,
        ]}
      />
      <SceneLighting calm={reducedMotion} />
      <Suspense fallback={null}>
        <HybridEnvironment calm={reducedMotion || !visible} />
      </Suspense>
      <Suspense fallback={null}>
        <Desk />
      </Suspense>
      <Suspense fallback={null}>
        <Philosopher calm={reducedMotion} selected={selected} />
      </Suspense>
      <Suspense fallback={null}>
        {sections.map((section) => (
          <InteractiveObject
            key={section}
            section={section}
            enabled={state === "idle"}
            onOpen={onOpen}
            reducedMotion={reducedMotion}
          />
        ))}
        <group position={sceneConfig.ink.position}>
          <Model
            name="ink"
            scale={sceneConfig.ink.scale}
            rotation={sceneConfig.ink.rotation}
          />
        </group>
        {sceneConfig.candles.map((candle, index) => (
          <group key={index} position={candle.position}>
            <Model name="candle" scale={candle.scale} />
            <CandleFlame
              position={[0, candle.scale, 0]}
              calm={reducedMotion}
              seed={candle.seed}
              intensity={candle.intensity}
              keyIntensity={candle.keyIntensity}
              dreamy={dreamy}
            />
          </group>
        ))}
        <Ready onReady={onReady} />
      </Suspense>
      <DustParticles calm={reducedMotion} mobile={mobile} />
      {dreamy ? (
        <DreamyEffects mobile={mobile} selected={selected} />
      ) : (
        <CinematicEffects mobile={mobile} selected={selected} />
      )}
    </Canvas>
  );
}
