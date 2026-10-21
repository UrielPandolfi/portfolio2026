"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { HalfFloatType, Vector3 } from "three";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  DepthOfFieldEffect,
  ToneMappingMode,
  VignetteTechnique,
} from "postprocessing";
import { objectConfig, sceneConfig, type Section } from "@/data/sceneConfig";
import { GradeEffect } from "@/lib/colorGrade";

const ColorGrade = wrapEffect(GradeEffect);

function DreamyDepth({
  mobile,
  selected,
}: {
  mobile: boolean;
  selected: Section | null;
}) {
  const dof = useRef<DepthOfFieldEffect>(null);
  const target = useMemo(() => new Vector3(), []);
  const subject = useMemo(() => new Vector3(), []);
  const settings = sceneConfig.effects.dreamy.depthOfField;
  useFrame(({ camera }) => {
    const effect = dof.current;
    if (mobile || !effect) return;
    const focus = selected
      ? objectConfig[selected].position
      : sceneConfig.effects.focus;
    target.set(
      focus[0],
      focus[1] + (selected === "about" ? 0.55 : 0),
      focus[2],
    );
    effect.target = target;
    if (selected) {
      effect.cocMaterial.focusRange = settings.focusRangeSelected;
      return;
    }
    subject.set(
      sceneConfig.philosopher.position[0],
      sceneConfig.philosopher.position[1] + 4.35,
      sceneConfig.philosopher.position[2],
    );
    effect.cocMaterial.focusRange = Math.max(
      settings.focusRange,
      Math.abs(
        camera.position.distanceTo(subject) - camera.position.distanceTo(target),
      ) + 0.35,
    );
  });
  if (mobile) return null;
  return (
    <DepthOfField
      ref={dof}
      target={target}
      focusRange={settings.focusRange}
      bokehScale={settings.bokehScale}
      resolutionScale={settings.resolutionScale}
    />
  );
}

/** One composer. Bloom reads the HDR buffer, then the image is tone mapped once. */
export function DreamyEffects({
  mobile,
  selected,
}: {
  mobile: boolean;
  selected: Section | null;
}) {
  const dream = sceneConfig.effects.dreamy;
  return (
    <EffectComposer
      multisampling={0}
      enableNormalPass={false}
      depthBuffer
      frameBufferType={HalfFloatType}
      renderPriority={1}
    >
      <Bloom
        mipmapBlur
        intensity={mobile ? dream.bloom.mobileIntensity : dream.bloom.intensity}
        luminanceThreshold={dream.bloom.luminanceThreshold}
        luminanceSmoothing={dream.bloom.luminanceSmoothing}
        radius={dream.bloom.radius}
        levels={mobile ? dream.bloom.mobileLevels : dream.bloom.levels}
      />
      <DreamyDepth mobile={mobile} selected={selected} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <ColorGrade
        exposure={dream.grade.exposure}
        amber={dream.grade.amber}
        cool={dream.grade.cool}
        contrast={dream.grade.contrast}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={mobile ? dream.grain * 0.6 : dream.grain}
      />
      <Vignette
        technique={VignetteTechnique.DEFAULT}
        offset={dream.vignette.offset}
        darkness={dream.vignette.darkness}
      />
    </EffectComposer>
  );
}
