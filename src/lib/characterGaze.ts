import { Bone, MathUtils, Object3D, Quaternion, Vector3 } from "three";
import type { CharacterBehavior } from "../data/characterConfig";

export function inspectGazeRig(root: Object3D) {
  const bones: Bone[] = [];
  root.traverse((node) => {
    if (node instanceof Bone) bones.push(node);
  });
  const find = (...names: string[]) => {
    for (const name of names) {
      const bone = bones.find((b) =>
        b.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .endsWith(name),
      );
      if (bone) return bone;
    }
  };
  return {
    bones,
    head: find("head"),
    neck: find("neck"),
    chest: find("upperchest", "spine2", "chest", "spine1", "spine"),
  };
}
const smooth = (t: number) => {
  const x = MathUtils.clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export function lookupEnvelope(time: number, c: CharacterBehavior) {
  if (time < 0) return 0;
  if (time >= c.lookupRise + c.lookupHold + c.lookupReturn) return 0;
  if (time < c.lookupRise) return smooth(time / c.lookupRise);
  if (time < c.lookupRise + c.lookupHold) return 1;
  return 1 - smooth((time - c.lookupRise - c.lookupHold) / c.lookupReturn);
}

/** Local clock: no timers, React state or per-frame allocations. */
export class GazeMotion {
  yaw = 0;
  pitch: number;
  time = 0;
  nextLookup: number;
  private lookupStart = -Infinity;
  constructor(
    readonly config: CharacterBehavior,
    private random = Math.random,
  ) {
    this.pitch = config.idleDownAngle;
    this.nextLookup = this.interval();
  }
  private interval() {
    return MathUtils.lerp(
      this.config.lookupIntervalMin,
      this.config.lookupIntervalMax,
      this.random(),
    );
  }
  step(
    delta: number,
    pointerX: number,
    pointerY: number,
    active: boolean,
    calm: boolean,
  ) {
    const c = this.config;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (calm) {
      this.yaw = 0;
      this.pitch = c.idleDownAngle;
      this.lookupStart = -Infinity;
      this.nextLookup = this.time + this.interval();
      return;
    }
    if (active) this.time += dt;
    if (active && this.time >= this.nextLookup) {
      this.lookupStart = this.time;
      this.nextLookup =
        this.time +
        c.lookupRise +
        c.lookupHold +
        c.lookupReturn +
        this.interval();
    }
    if (!active) {
      this.lookupStart = -Infinity;
      this.nextLookup = Math.max(this.nextLookup, this.time + 1);
    }
    const lift = active ? lookupEnvelope(this.time - this.lookupStart, c) : 0;
    // Ease into the limits instead of stopping abruptly at screen edges.
    const yaw = active
      ? MathUtils.clamp(
          Math.tanh(pointerX * 1.25) * c.yawLimit * c.followStrength,
          -c.yawLimit,
          c.yawLimit,
        )
      : 0;
    const followPitch = active
      ? -Math.tanh(pointerY * 1.25) * c.pitchFollowLimit * c.followStrength
      : 0;
    const pitch = MathUtils.clamp(
      c.idleDownAngle + followPitch - lift * c.lookupAmount,
      c.pitchMin,
      c.pitchMax,
    );
    this.yaw = MathUtils.damp(this.yaw, yaw, c.damping, dt);
    this.pitch = MathUtils.damp(this.pitch, pitch, c.damping, dt);
  }
}

type Joint = {
  bone: Bone;
  share: number;
  inverseOffset: Quaternion;
  applied: boolean;
};
/** Additive world-axis rotations converted to each bone's parent space. */
export class GazeRig {
  readonly rig: ReturnType<typeof inspectGazeRig>;
  private joints: Joint[];
  private parent = new Quaternion();
  private local = new Quaternion();
  private world = new Quaternion();
  private pitchRotation = new Quaternion();
  private xAxis = new Vector3(1, 0, 0);
  private yAxis = new Vector3(0, 1, 0);
  constructor(root: Object3D, neckShare: number) {
    this.rig = inspectGazeRig(root);
    const { head, neck, chest } = this.rig;
    const make = (bone: Bone, share: number): Joint => ({
      bone,
      share,
      inverseOffset: new Quaternion(),
      applied: false,
    });
    this.joints = head
      ? neck
        ? [make(neck, neckShare), make(head, 1 - neckShare)]
        : [make(head, 1)]
      : neck
        ? [make(neck, 0.65)]
        : chest
          ? [make(chest, 0.25)]
          : [];
  }
  // Run before the mixer. Remove only our previous additive offset.
  restore() {
    for (const joint of this.joints) {
      if (joint.applied)
        joint.bone.quaternion.premultiply(joint.inverseOffset).normalize();
      joint.applied = false;
    }
  }
  // Run after the mixer. Keep its animated pose instead of restoring a fixed bind pose.
  apply(yaw: number, pitch: number) {
    for (const joint of this.joints) {
      const { bone, share } = joint;
      this.parent.identity();
      bone.parent?.getWorldQuaternion(this.parent);
      this.world.setFromAxisAngle(this.yAxis, yaw * share);
      this.pitchRotation.setFromAxisAngle(this.xAxis, pitch * share);
      this.world.multiply(this.pitchRotation);
      this.local
        .copy(this.parent)
        .invert()
        .multiply(this.world)
        .multiply(this.parent);
      bone.quaternion.premultiply(this.local).normalize();
      joint.inverseOffset.copy(this.local).invert();
      joint.applied = true;
      bone.updateWorldMatrix(false, true);
    }
  }
}
