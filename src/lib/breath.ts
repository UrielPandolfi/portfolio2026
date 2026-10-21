import { Bone, MathUtils, Object3D, Quaternion, Vector3 } from "three";

function findBone(root: Object3D, suffix: string) {
  let result: Bone | undefined;
  root.traverse((object) => {
    if (
      object instanceof Bone &&
      object.name.replace(/[^a-z0-9]/gi, "").endsWith(suffix)
    )
      result = object;
  });
  return result;
}

type Arm = {
  upper: Bone;
  forearm: Bone;
  hand: Bone;
  upperLength: number;
  foreLength: number;
  target: Vector3;
  pole: Vector3;
  handOrientation: Quaternion;
};

/** Lifts the ribcage from the waist. Hands are solved back onto the desktop. */
export class BreathRig {
  private spine?: Bone;
  private restSpine = new Vector3();
  private arms: Arm[] = [];
  private ready = false;
  private parent = new Quaternion();
  private world = new Quaternion();
  private delta = new Quaternion();
  private up = new Vector3();
  private origin = new Vector3();
  private current = new Vector3();
  private desired = new Vector3();
  private bendAxis = new Vector3();
  private elbow = new Vector3();
  private alternate = new Vector3();
  private scratch = new Vector3();

  constructor(private root: Object3D) {
    this.spine = findBone(root, "Spine");
  }

  apply(offset: number) {
    if (!this.spine) return;
    if (!this.ready) this.capture();
    this.parent.identity();
    this.spine.parent?.getWorldQuaternion(this.parent);
    this.up.set(0, 1, 0).applyQuaternion(this.parent.invert());
    this.spine.position.copy(this.restSpine).addScaledVector(this.up, offset);
    this.spine.updateWorldMatrix(false, true);
    for (const arm of this.arms) this.plant(arm);
  }

  private capture() {
    if (!this.spine) return;
    this.root.updateMatrixWorld(true);
    this.restSpine.copy(this.spine.position);
    for (const side of ["Left", "Right"] as const) {
      const upper = findBone(this.root, `${side}Arm`);
      const forearm = findBone(this.root, `${side}ForeArm`);
      const hand = findBone(this.root, `${side}Hand`);
      if (!upper || !forearm || !hand) continue;
      const shoulder = upper.getWorldPosition(new Vector3());
      const elbow = forearm.getWorldPosition(new Vector3());
      const wrist = hand.getWorldPosition(new Vector3());
      this.arms.push({
        upper,
        forearm,
        hand,
        upperLength: shoulder.distanceTo(elbow),
        foreLength: elbow.distanceTo(wrist),
        target: wrist.clone(),
        pole: elbow.clone(),
        handOrientation: hand.getWorldQuaternion(new Quaternion()),
      });
    }
    this.ready = true;
  }

  private plant(arm: Arm) {
    arm.upper.updateWorldMatrix(true, false);
    arm.upper.getWorldPosition(this.origin);
    this.desired.copy(arm.target).sub(this.origin);
    const reach = MathUtils.clamp(
      this.desired.length(),
      Math.abs(arm.upperLength - arm.foreLength) + 1e-4,
      arm.upperLength + arm.foreLength - 1e-4,
    );
    this.desired.normalize();
    const cos =
      (arm.upperLength ** 2 + reach ** 2 - arm.foreLength ** 2) /
      (2 * arm.upperLength * reach);
    const bend = Math.acos(MathUtils.clamp(cos, -1, 1));
    this.current.copy(arm.pole).sub(this.origin);
    this.bendAxis.crossVectors(this.desired, this.current);
    if (this.bendAxis.lengthSq() < 1e-8) this.bendAxis.set(1, 0, 0);
    this.bendAxis.normalize();
    this.point(this.desired, bend, arm.upperLength, this.elbow);
    this.point(this.desired, -bend, arm.upperLength, this.alternate);
    const elbow =
      this.elbow.distanceToSquared(arm.pole) <=
      this.alternate.distanceToSquared(arm.pole)
        ? this.elbow
        : this.alternate;
    this.aim(arm.upper, arm.forearm, elbow);
    this.aim(arm.forearm, arm.hand, arm.target);
    arm.hand.parent?.getWorldQuaternion(this.parent) ?? this.parent.identity();
    arm.hand.quaternion
      .copy(this.parent.invert())
      .multiply(arm.handOrientation);
    arm.hand.updateWorldMatrix(false, true);
  }

  private point(direction: Vector3, angle: number, length: number, out: Vector3) {
    this.scratch.copy(direction).applyAxisAngle(this.bendAxis, angle);
    out.copy(this.origin).addScaledVector(this.scratch, length);
  }

  private aim(bone: Bone, child: Bone, target: Vector3) {
    bone.updateWorldMatrix(true, true);
    bone.getWorldPosition(this.origin);
    child.getWorldPosition(this.current).sub(this.origin);
    if (this.current.lengthSq() < 1e-8) return;
    this.current.normalize();
    this.desired.copy(target).sub(this.origin);
    if (this.desired.lengthSq() < 1e-8) return;
    this.desired.normalize();
    this.delta.setFromUnitVectors(this.current, this.desired);
    bone.getWorldQuaternion(this.world);
    this.parent.identity();
    bone.parent?.getWorldQuaternion(this.parent);
    bone.quaternion
      .copy(this.parent.invert())
      .multiply(this.delta)
      .multiply(this.world);
    bone.updateWorldMatrix(false, true);
  }
}
