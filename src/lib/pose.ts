import { Bone, Object3D, Quaternion, Vector3 } from "three";

export function findBone(root: Object3D, suffix: string): Bone | undefined {
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
export function aimBone(bone: Bone, child: Bone, target: Vector3) {
  bone.updateWorldMatrix(true, true);
  const origin = bone.getWorldPosition(new Vector3());
  const current = child.getWorldPosition(new Vector3()).sub(origin).normalize();
  const desired = target.clone().sub(origin).normalize();
  const delta = new Quaternion().setFromUnitVectors(current, desired);
  const world = bone.getWorldQuaternion(new Quaternion());
  const parent =
    bone.parent?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();
  bone.quaternion.copy(parent.invert().multiply(delta).multiply(world));
  bone.updateWorldMatrix(false, true);
}
export function applySeatedPose(root: Object3D) {
  root.updateMatrixWorld(true);
  const aim = (
    name: string,
    child: string,
    target: [number, number, number],
  ) => {
    const bone = findBone(root, name),
      end = findBone(root, child);
    if (bone && end) aimBone(bone, end, new Vector3(...target));
  };
  aim("LeftUpLeg", "LeftLeg", [0.09, 0.49, 0.25]);
  aim("RightUpLeg", "RightLeg", [-0.09, 0.49, 0.25]);
  const leftKnee = findBone(root, "LeftLeg")?.getWorldPosition(new Vector3());
  const rightKnee = findBone(root, "RightLeg")?.getWorldPosition(new Vector3());
  if (leftKnee)
    aim("LeftLeg", "LeftFoot", [leftKnee.x, leftKnee.y - 0.26, leftKnee.z]);
  if (rightKnee)
    aim("RightLeg", "RightFoot", [
      rightKnee.x,
      rightKnee.y - 0.26,
      rightKnee.z,
    ]);
  aim("LeftArm", "LeftForeArm", [0.16, 0.65, 0.12]);
  aim("RightArm", "RightForeArm", [-0.16, 0.65, 0.12]);
  aim("LeftForeArm", "LeftHand", [0.1, 0.68, 0.27]);
  aim("RightForeArm", "RightHand", [-0.1, 0.68, 0.27]);
  root.updateMatrixWorld(true);

  const rotatePalm = (handName: string, forearmName: string, angle: number) => {
    const hand = findBone(root, handName);
    const forearm = findBone(root, forearmName);
  
    if (!hand || !forearm || !hand.parent) return;
  
    root.updateMatrixWorld(true);
  
    const wristPos = hand.getWorldPosition(new Vector3());
    const elbowPos = forearm.getWorldPosition(new Vector3());
  
    // Eje natural del antebrazo
    const axis = wristPos.clone().sub(elbowPos).normalize();
  
    // Rotación en coordenadas globales
    const twist = new Quaternion().setFromAxisAngle(axis, angle);
  
    const worldRotation = hand.getWorldQuaternion(new Quaternion());
    const parentRotation = hand.parent.getWorldQuaternion(new Quaternion());
  
    hand.quaternion.copy(
      parentRotation.invert()
        .multiply(twist)
        .multiply(worldRotation)
    );
  };
  
  // Girar ambas palmas hacia la mesa
  rotatePalm("LeftHand", "LeftForeArm", 0.55);
  rotatePalm("RightHand", "RightForeArm", -0.55);
  
  const tiltHandUp = (handName: string, angle: number) => {
    const hand = findBone(root, handName);
    if (!hand || !hand.parent) return;
  
    root.updateMatrixWorld(true);
  
    // Inclinar la muñeca sobre el eje horizontal
    const axis = new Vector3(1, 0, 0);
    const tilt = new Quaternion().setFromAxisAngle(axis, angle);
  
    const worldRotation = hand.getWorldQuaternion(new Quaternion());
    const parentRotation = hand.parent.getWorldQuaternion(new Quaternion());
  
    hand.quaternion.copy(
      parentRotation.invert().multiply(tilt).multiply(worldRotation)
    );
  
    root.updateMatrixWorld(true);
  };
  
  // Levantar ligeramente los dedos
  tiltHandUp("LeftHand", -0.2);
  tiltHandUp("RightHand", -0.2);
}
