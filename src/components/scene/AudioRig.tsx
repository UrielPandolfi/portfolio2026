"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { getStudy } from "@/lib/studyAudio";

/** One listener, parented to the camera. The room does not create another. */
export function AudioRig() {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  useEffect(() => getStudy().attach(camera, scene), [camera, scene]);
  return null;
}
