// Radians, seconds and scene units. Negative Z moves away from the desk.
export const HEAD_FOLLOW_STRENGTH = 0.65;
export const HEAD_IDLE_DOWN_ANGLE = 0.14;
export const HEAD_LOOKUP_AMOUNT = 0.12;
export const HEAD_LOOKUP_INTERVAL_MIN = 9;
export const HEAD_LOOKUP_INTERVAL_MAX = 17;
export const CHARACTER_Z_OFFSET = -1.8;

export const characterBehavior = {
  followStrength: HEAD_FOLLOW_STRENGTH,
  idleDownAngle: HEAD_IDLE_DOWN_ANGLE,
  lookupAmount: HEAD_LOOKUP_AMOUNT,
  lookupIntervalMin: HEAD_LOOKUP_INTERVAL_MIN,
  lookupIntervalMax: HEAD_LOOKUP_INTERVAL_MAX,
  yawLimit: 0.16,
  pitchFollowLimit: 0.075,
  pitchMin: -0.06,
  pitchMax: 0.22,
  damping: 3.4,
  neckShare: 0.28,
  lookupRise: 0.85,
  lookupHold: 0.65,
  lookupReturn: 1.3,
  breathingAmplitude: 0.004,
  breathingSpeed: 0.8,
};
export type CharacterBehavior = typeof characterBehavior;
