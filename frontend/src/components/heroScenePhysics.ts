import * as THREE from 'three';

export const BLASTER_ATTACK_RANGE = 2;
export const BLASTER_BEAM_DURATION = 0.32;
export const BLASTER_MUZZLE_OFFSET = 0.16;
export const METEOR_SURFACE_OFFSET = 0.22;
export const SCENE_UP = new THREE.Vector3(0, 1, 0);
const BLASTER_DIRECTION = new THREE.Vector3();

export const PLANET_IMPACT_MAX_RATIO = 0.975;
export const STARFIELD_DRIFT_SPEED = 0.012;
export const STARFIELD_IMPACT_SPEED = 0.06;
export const STARFIELD_RECOVERY_RATE = 0.45;

export interface PlanetDefinition {
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
  label: string;
}

export interface PlanetMotionState {
  angle: number;
  speedOffset: number;
}

export interface StarfieldMotionState {
  yawVelocity: number;
  pitchVelocity: number;
  rollVelocity: number;
}

export interface ShipOrbit {
  radiusX: number;
  radiusZ: number;
  speed: number;
  offset: number;
  yOffset: number;
}

export const SHIP_ORBITS: readonly ShipOrbit[] = [
  { radiusX: 6, radiusZ: 6, speed: 0.6, offset: 0, yOffset: 0.5 },
  { radiusX: 7, radiusZ: 5, speed: 0.5, offset: 2, yOffset: -0.5 },
  { radiusX: 10, radiusZ: 11, speed: 0.3, offset: 1, yOffset: -1.5 },
  { radiusX: 12, radiusZ: 9, speed: 0.25, offset: 4, yOffset: 1 },
  { radiusX: 16, radiusZ: 16, speed: 0.15, offset: 5, yOffset: 0 },
  { radiusX: 18, radiusZ: 14, speed: 0.12, offset: 3, yOffset: 2 },
];

export interface StarfieldImpulse {
  yaw: number;
  pitch: number;
  roll: number;
}

export const getCollisionMotionScale = (impactVelocity: THREE.Vector3): number =>
  THREE.MathUtils.clamp(impactVelocity.length(), 2.5, 7);

export const calculatePlanetOrbitImpulse = (
  planetPosition: THREE.Vector3,
  impactVelocity: THREE.Vector3,
  baseOrbitSpeed: number,
): number => {
  const radius = Math.hypot(planetPosition.x, planetPosition.z);
  const planarImpactSpeed = Math.hypot(impactVelocity.x, impactVelocity.z);
  if (radius <= 1e-6 || planarImpactSpeed <= 1e-6) return 0;

  // Positive alignment pushes along the orbit, negative alignment pushes against it.
  const tangentX = -planetPosition.z / radius;
  const tangentZ = planetPosition.x / radius;
  const alignment = (
    impactVelocity.x * tangentX + impactVelocity.z * tangentZ
  ) / planarImpactSpeed;
  return baseOrbitSpeed * PLANET_IMPACT_MAX_RATIO * THREE.MathUtils.clamp(alignment, -1, 1);
};

export const applyPlanetOrbitImpact = (
  motion: PlanetMotionState,
  planetPosition: THREE.Vector3,
  impactVelocity: THREE.Vector3,
  baseOrbitSpeed: number,
): void => {
  const impulse = calculatePlanetOrbitImpulse(planetPosition, impactVelocity, baseOrbitSpeed);
  const maxOffset = baseOrbitSpeed * PLANET_IMPACT_MAX_RATIO;
  motion.speedOffset = THREE.MathUtils.clamp(motion.speedOffset + impulse, -maxOffset, maxOffset);
};

export const advancePlanetMotion = (
  motion: PlanetMotionState,
  baseOrbitSpeed: number,
  delta: number,
): number => {
  const effectiveSpeed = baseOrbitSpeed + motion.speedOffset;
  motion.angle = (motion.angle + effectiveSpeed * delta) % (Math.PI * 2);
  motion.speedOffset = THREE.MathUtils.damp(motion.speedOffset, 0, 0.7, delta);
  return effectiveSpeed;
};

export const calculateStarfieldImpulse = (impactVelocity: THREE.Vector3): StarfieldImpulse => {
  const length = impactVelocity.length();
  if (length <= 1e-6) return { yaw: 0, pitch: 0, roll: 0 };
  const driftScale = STARFIELD_IMPACT_SPEED / length;
  return {
    yaw: impactVelocity.x * driftScale,
    pitch: -impactVelocity.y * driftScale,
    roll: -impactVelocity.z * driftScale,
  };
};

export const applyStarfieldImpulse = (
  motion: StarfieldMotionState,
  impactVelocity: THREE.Vector3,
): void => {
  const impulse = calculateStarfieldImpulse(impactVelocity);
  if (Math.hypot(impulse.yaw, impulse.pitch, impulse.roll) <= 1e-6) return;
  motion.yawVelocity = impulse.yaw;
  motion.pitchVelocity = impulse.pitch;
  motion.rollVelocity = impulse.roll;
};

export const createInitialStarfieldMotion = (): StarfieldMotionState => {
  const yaw = 0.8;
  const pitch = -0.3;
  const roll = 0.52;
  const scale = STARFIELD_DRIFT_SPEED / Math.hypot(yaw, pitch, roll);
  return {
    yawVelocity: yaw * scale,
    pitchVelocity: pitch * scale,
    rollVelocity: roll * scale,
  };
};

export const recoverStarfieldSpeed = (motion: StarfieldMotionState, delta: number): void => {
  const currentSpeed = Math.hypot(motion.yawVelocity, motion.pitchVelocity, motion.rollVelocity);
  if (currentSpeed <= 1e-6 || Math.abs(currentSpeed - STARFIELD_DRIFT_SPEED) <= 1e-6) return;
  const nextSpeed = THREE.MathUtils.damp(
    currentSpeed,
    STARFIELD_DRIFT_SPEED,
    STARFIELD_RECOVERY_RATE,
    delta,
  );
  const speedScale = nextSpeed / currentSpeed;
  motion.yawVelocity *= speedScale;
  motion.pitchVelocity *= speedScale;
  motion.rollVelocity *= speedScale;
};

export const placePlanetAtAngle = (
  planet: Pick<PlanetDefinition, 'orbitRadius'>,
  angle: number,
  target: THREE.Vector3,
): THREE.Vector3 => target.set(
  Math.cos(angle) * planet.orbitRadius,
  0,
  Math.sin(angle) * planet.orbitRadius,
);

export const placeShipAtTime = (
  orbit: ShipOrbit,
  elapsed: number,
  target: THREE.Vector3,
): THREE.Vector3 => {
  const angle = elapsed * orbit.speed + orbit.offset;
  return target.set(
    Math.cos(angle) * orbit.radiusX,
    Math.sin(angle * 2) * orbit.yOffset,
    Math.sin(angle) * orbit.radiusZ,
  );
};

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
