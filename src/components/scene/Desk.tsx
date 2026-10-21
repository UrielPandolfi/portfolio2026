import { sceneConfig } from "@/data/sceneConfig";
import { Model } from "./Model";
export function Desk() {
  return (
    <>
      <group position={sceneConfig.desk.position}>
        <Model
          name="desk"
          scale={sceneConfig.desk.scale}
          rotation={sceneConfig.desk.rotation}
        />
      </group>
      <group position={sceneConfig.chair.position}>
        <Model name="chair" scale={sceneConfig.chair.scale} />
      </group>
    </>
  );
}
