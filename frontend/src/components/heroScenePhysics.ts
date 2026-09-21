import * as THREE from 'three';

export const BLASTER_ATTACK_RANGE = 0.75;
export const SCENE_UP = new THREE.Vector3(0, 1, 0);
const BLASTER_DIRECTION = new THREE.Vector3();

export const getCollisionMotionScale = (impactVelocity: THREE.Vector3): number =>
  THREE.MathUtils.clamp(impactVelocity.length(), 2.5, 7);

export const getBlasterShotLength = (
  source: THREE.Vector3,
  destination: THREE.Vector3,
): number => Math.min(source.distanceTo(destination), BLASTER_ATTACK_RANGE);

export const placeBlasterBeam = (
  group: THREE.Group,
  source: THREE.Vector3,
  destination: THREE.Vector3,
  maxLength: number,
  width: number,
): boolean => {
  const direction = BLASTER_DIRECTION.copy(destination).sub(source);
  const distanceSq = direction.lengthSq();
  if (distanceSq <= 1e-6 || maxLength <= 1e-3) return false;
  const distanceToDestination = Math.sqrt(distanceSq);
  const renderedLength = Math.min(distanceToDestination, maxLength);
  direction.multiplyScalar(1 / distanceToDestination);
  group.position.copy(source).addScaledVector(direction, renderedLength * 0.5);
  group.quaternion.setFromUnitVectors(SCENE_UP, direction);
  group.scale.set(width, renderedLength, width);
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
