import * as THREE from 'three';

export const BLASTER_ATTACK_RANGE = 1.65;
export const BLASTER_BEAM_DURATION = 0.32;
export const BLASTER_MUZZLE_OFFSET = 0.16;
export const METEOR_SURFACE_OFFSET = 0.22;
export const SCENE_UP = new THREE.Vector3(0, 1, 0);
const BLASTER_DIRECTION = new THREE.Vector3();

export const getCollisionMotionScale = (impactVelocity: THREE.Vector3): number =>
  THREE.MathUtils.clamp(impactVelocity.length(), 2.5, 7);

export const calculateBlasterSegment = (
  sourceCenter: THREE.Vector3,
  targetCenter: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
): boolean => {
  const direction = BLASTER_DIRECTION.copy(targetCenter).sub(sourceCenter);
  const centerDistanceSq = direction.lengthSq();
  if (centerDistanceSq <= 1e-6) return false;
  const centerDistance = Math.sqrt(centerDistanceSq);
  const visibleLength = centerDistance - BLASTER_MUZZLE_OFFSET - METEOR_SURFACE_OFFSET;
  if (visibleLength <= 1e-3) return false;
  direction.multiplyScalar(1 / centerDistance);
  start.copy(sourceCenter).addScaledVector(direction, BLASTER_MUZZLE_OFFSET);
  end.copy(targetCenter).addScaledVector(direction, -METEOR_SURFACE_OFFSET);
  return true;
};

export const placeBlasterBeam = (
  group: THREE.Group,
  source: THREE.Vector3,
  destination: THREE.Vector3,
  width: number,
): boolean => {
  const direction = BLASTER_DIRECTION.copy(destination).sub(source);
  const distanceSq = direction.lengthSq();
  if (distanceSq <= 1e-6) return false;
  const distance = Math.sqrt(distanceSq);
  direction.multiplyScalar(1 / distance);
  group.position.lerpVectors(source, destination, 0.5);
  group.quaternion.setFromUnitVectors(SCENE_UP, direction);
  group.scale.set(width, distance, width);
  return true;
};

export const calculateFirstContact = (
  firstStart: THREE.Vector3,
  firstEnd: THREE.Vector3,
  secondStart: THREE.Vector3,
  secondEnd: THREE.Vector3,
  contactRadius: number,
): number | null => {
  // Relative motion reduces two moving trajectories to one segment entering a sphere.
  const relativeStartX = firstStart.x - secondStart.x;
  const relativeStartY = firstStart.y - secondStart.y;
  const relativeStartZ = firstStart.z - secondStart.z;
  const relativeVelocityX = (firstEnd.x - firstStart.x) - (secondEnd.x - secondStart.x);
  const relativeVelocityY = (firstEnd.y - firstStart.y) - (secondEnd.y - secondStart.y);
  const relativeVelocityZ = (firstEnd.z - firstStart.z) - (secondEnd.z - secondStart.z);
  const startDistanceSq = relativeStartX ** 2 + relativeStartY ** 2 + relativeStartZ ** 2;
  const radiusSq = contactRadius ** 2;
  if (startDistanceSq <= radiusSq) return 0;

  const velocityLengthSq = relativeVelocityX ** 2 + relativeVelocityY ** 2 + relativeVelocityZ ** 2;
  if (velocityLengthSq <= 1e-9) return null;
  const projection = relativeStartX * relativeVelocityX
    + relativeStartY * relativeVelocityY
    + relativeStartZ * relativeVelocityZ;
  const discriminant = projection ** 2 - velocityLengthSq * (startDistanceSq - radiusSq);
  if (discriminant < 0) return null;
  const time = (-projection - Math.sqrt(discriminant)) / velocityLengthSq;
  return time >= 0 && time <= 1 ? time : null;
};
