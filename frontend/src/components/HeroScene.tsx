import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Sparkles, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  BLASTER_ATTACK_RANGE,
  BLASTER_BEAM_DURATION,
  calculateBlasterSegment,
  calculateFirstContact,
  calculatePlanetOrbitImpulse,
  calculateStarfieldImpulse,
  getCollisionMotionScale,
  PLANET_IMPACT_SPEED_LIMIT,
  placeBlasterBeam,
  SCENE_UP,
} from './heroScenePhysics';

type PlanetData = readonly [
  distance: number,
  speed: number,
  size: number,
  color: string,
  label: string,
  offset: number,
];

interface PlanetMotionState {
  angle: number;
  speedOffset: number;
}

interface StarfieldMotionState {
  yawVelocity: number;
  pitchVelocity: number;
  rollVelocity: number;
}

type BurstKind = 'collision' | 'blaster';

const SCENE_PRIMARY = '#00d9ff';
const SCENE_SECONDARY = '#ff00ff';
const MAX_SCENE_FPS = 60;

function SceneFrameLoop({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const clock = useThree((state) => state.clock);

  useEffect(() => {
    if (!active) return;
    // Demand rendering leaves the Three clock untouched while the hero is offscreen.
    // Reset its frame origin so the first resumed frame does not receive the whole pause as delta.
    clock.oldTime = performance.now();
    invalidate();
    const interval = window.setInterval(invalidate, 1000 / MAX_SCENE_FPS);
    return () => window.clearInterval(interval);
  }, [active, clock, invalidate]);

  return null;
}

function RotatingSystem({
  children,
  systemRef,
}: React.PropsWithChildren<{ systemRef: React.RefObject<THREE.Group | null> }>) {
  useFrame((_, delta) => {
    if (!systemRef.current) return;
    systemRef.current.rotation.y = (systemRef.current.rotation.y + delta * 0.04) % (Math.PI * 2);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={systemRef} rotation={[0.2, 0, 0]} position={[0, 0, 0]}>
        {children}
      </group>
    </Float>
  );
}

function ReactiveStarfield({ motion }: { motion: StarfieldMotionState }) {
  const starfield = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!starfield.current) return;
    const frameDelta = Math.min(delta, 0.05);
    starfield.current.rotation.y += motion.yawVelocity * frameDelta;
    starfield.current.rotation.x += motion.pitchVelocity * frameDelta;
    starfield.current.rotation.z += motion.rollVelocity * frameDelta;
    motion.yawVelocity = THREE.MathUtils.damp(motion.yawVelocity, 0, 0.55, frameDelta);
    motion.pitchVelocity = THREE.MathUtils.damp(motion.pitchVelocity, 0, 0.55, frameDelta);
    motion.rollVelocity = THREE.MathUtils.damp(motion.rollVelocity, 0, 0.55, frameDelta);
  });

  return <group ref={starfield}>
    <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.3} />
  </group>;
}

function SceneCamera() {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const { size } = useThree();

  useLayoutEffect(() => {
    if (!camera.current) return;
    if (size.width >= 768) {
      camera.current.setViewOffset(
        size.width,
        size.height,
        -size.width * 0.125,
        0,
        size.width,
        size.height,
      );
    } else {
      camera.current.clearViewOffset();
    }
    camera.current.updateProjectionMatrix();
  }, [size.height, size.width]);

  return <PerspectiveCamera ref={camera} makeDefault position={[0, 20, 42]} fov={40} />;
}

function Sun() {
  return <group>
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#ffaa00" emissive="#ff5500" emissiveIntensity={3} roughness={0.4} />
    </mesh>
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial color="#ffaa00" wireframe transparent opacity={0.15} />
    </mesh>
    <pointLight distance={100} intensity={2} color="#ffaa00" />
  </group>;
}

function Planet({ data, motion }: { data: PlanetData; motion: PlanetMotionState }) {
  const [distance, speed, size, color, label] = data;
  const planet = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!planet.current) return;
    const effectiveSpeed = speed + motion.speedOffset;
    motion.angle = (motion.angle + effectiveSpeed * delta) % (Math.PI * 2);
    motion.speedOffset = THREE.MathUtils.damp(motion.speedOffset, 0, 0.7, delta);
    planet.current.position.set(Math.cos(motion.angle) * distance, 0, Math.sin(motion.angle) * distance);
    planet.current.rotation.y += delta * 0.6 * (effectiveSpeed / speed);
    if (labelRef.current) labelRef.current.position.set(planet.current.position.x, size + 0.8, planet.current.position.z);
  }, -1);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[distance - 0.03, distance + 0.03, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
    <mesh ref={planet}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.6} emissive={color} emissiveIntensity={0.1} />
    </mesh>
    <group ref={labelRef}><Billboard><Text fontSize={0.6} color="white" outlineWidth={0.04} outlineColor="#000">{label}</Text></Billboard></group>
  </>;
}

function SciFiShipModel() {
  return <group rotation={[0, Math.PI, 0]} scale={[0.4, 0.4, 0.4]}>
    <mesh position={[0, 0, 0.2]}>
      <boxGeometry args={[0.3, 0.15, 1.2]} />
      <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.8} />
    </mesh>
    <mesh position={[0, 0.1, 0.4]}>
      <boxGeometry args={[0.2, 0.1, 0.4]} />
      <meshStandardMaterial color={SCENE_PRIMARY} emissive={SCENE_PRIMARY} emissiveIntensity={0.5} />
    </mesh>
    <mesh position={[0, -0.05, 0]}>
      <boxGeometry args={[1.4, 0.05, 0.6]} />
      <meshStandardMaterial color="#888888" roughness={0.5} metalness={0.7} />
    </mesh>
    <mesh position={[0.6, 0.2, -0.2]} rotation={[0, 0, Math.PI / 6]}>
      <boxGeometry args={[0.05, 0.4, 0.4]} />
      <meshStandardMaterial color={SCENE_SECONDARY} emissive={SCENE_SECONDARY} emissiveIntensity={0.2} />
    </mesh>
    <mesh position={[-0.6, 0.2, -0.2]} rotation={[0, 0, -Math.PI / 6]}>
      <boxGeometry args={[0.05, 0.4, 0.4]} />
      <meshStandardMaterial color={SCENE_SECONDARY} emissive={SCENE_SECONDARY} emissiveIntensity={0.2} />
    </mesh>
    <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.05, 0.1, 16]} />
      <meshBasicMaterial color={SCENE_PRIMARY} />
    </mesh>
  </group>;
}

interface SpaceshipProps {
  radiusX: number;
  radiusZ: number;
  speed: number;
  offset: number;
  yOffset: number;
  positionTarget: THREE.Vector3;
}

const SHIP_ORBITS = [
  { radiusX: 6, radiusZ: 6, speed: 0.6, offset: 0, yOffset: 0.5 },
  { radiusX: 7, radiusZ: 5, speed: 0.5, offset: 2, yOffset: -0.5 },
  { radiusX: 10, radiusZ: 11, speed: 0.3, offset: 1, yOffset: -1.5 },
  { radiusX: 12, radiusZ: 9, speed: 0.25, offset: 4, yOffset: 1 },
  { radiusX: 16, radiusZ: 16, speed: 0.15, offset: 5, yOffset: 0 },
  { radiusX: 18, radiusZ: 14, speed: 0.12, offset: 3, yOffset: 2 },
] as const;

type ShipOrbit = (typeof SHIP_ORBITS)[number];

const shipPositionAt = (orbit: ShipOrbit, elapsed: number, target: THREE.Vector3): THREE.Vector3 => {
  const angle = elapsed * orbit.speed + orbit.offset;
  return target.set(
    Math.cos(angle) * orbit.radiusX,
    Math.sin(angle * 2) * orbit.yOffset,
    Math.sin(angle) * orbit.radiusZ,
  );
};

function Spaceship({ radiusX, radiusZ, speed, offset, yOffset, positionTarget }: SpaceshipProps) {
  const ship = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const angle = clock.elapsedTime * speed + offset;
    if (!ship.current) return;
    ship.current.position.set(
      Math.cos(angle) * radiusX,
      Math.sin(angle * 2) * yOffset,
      Math.sin(angle) * radiusZ,
    );
    positionTarget.copy(ship.current.position);
    ship.current.lookAt(
      Math.cos(angle + 0.1) * radiusX,
      Math.sin((angle + 0.1) * 2) * yOffset,
      Math.sin(angle + 0.1) * radiusZ,
    );
  });
  return <group ref={ship}><SciFiShipModel /></group>;
}

interface MeteorState {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  heat: number;
}

interface BlasterState {
  active: boolean;
  age: number;
  duration: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface BurstState {
  active: boolean;
  age: number;
  duration: number;
  position: THREE.Vector3;
  fragmentPositions: THREE.Vector3[];
  fragmentRotations: THREE.Vector3[];
  velocities: THREE.Vector3[];
  angularVelocities: THREE.Vector3[];
  scales: number[];
  visualScale: number;
}

const METEOR_COUNT = 5;
const BLASTER_COUNT = 4;
const BURST_COUNT = 6;
const BURST_FRAGMENT_COUNT = 26;
const BURST_STYLE_COUNT = 3;
const BURST_STYLE_COUNTS = [9, 8, 9] as const;
const BURST_FRAGMENT_RADIUS = 0.11;
const BURST_FRAGMENT_STYLES = Array.from({ length: BURST_FRAGMENT_COUNT }, (_, index) => (
  index % 3 === 0 ? 0 : index % 2 === 0 ? 1 : 2
));
const BURST_FRAGMENT_STYLE_OFFSETS = BURST_FRAGMENT_STYLES.map((style, index) => (
  BURST_FRAGMENT_STYLES.slice(0, index).filter((candidate) => candidate === style).length
));
const BURST_FRAGMENT_SIZE_FACTORS = Array.from({ length: BURST_FRAGMENT_COUNT }, (_, index) => (
  (0.09 + (index % 4) * 0.018) / BURST_FRAGMENT_RADIUS
));
const BLASTER_BURST_SCALE = 0.6;
const BURST_FRAGMENT_COLORS: Record<BurstKind, readonly THREE.Color[]> = {
  collision: [new THREE.Color('#ffc15c'), new THREE.Color('#ff6a18'), new THREE.Color('#b83212')],
  blaster: [new THREE.Color('#d9fbff'), new THREE.Color('#42ddff'), new THREE.Color('#126eff')],
};
const BURST_SPARKLE_COLORS: Record<BurstKind, readonly THREE.Color[]> = {
  collision: [new THREE.Color('#ff6a18'), new THREE.Color('#ffe0a3'), new THREE.Color('#6f4639')],
  blaster: [new THREE.Color('#43e6ff'), new THREE.Color('#e4fbff'), new THREE.Color('#286ab8')],
};
const BURST_LIGHT_COLORS: Record<BurstKind, THREE.Color> = {
  collision: new THREE.Color('#ff7a18'),
  blaster: new THREE.Color('#36dfff'),
};
const METEOR_HEAT_START_DISTANCE = 19;
const METEOR_HEAT_PEAK_DISTANCE = 3;
const METEOR_CORE_COLD = new THREE.Color('#292421');
const METEOR_CORE_HOT = new THREE.Color('#ff7a18');
const METEOR_EMISSIVE_COLD = new THREE.Color('#321109');
const METEOR_EMISSIVE_HOT = new THREE.Color('#fff1c7');
const METEOR_GLOW_COLD = new THREE.Color('#7a2511');
const METEOR_GLOW_HOT = new THREE.Color('#fff0b0');
const METEOR_HEAD_COLD = new THREE.Color('#8d2c12');
const METEOR_HEAD_HOT = new THREE.Color('#fff7dc');

const planetPositionAtAngle = (planet: PlanetData, angle: number, target: THREE.Vector3): THREE.Vector3 => {
  const [distance] = planet;
  return target.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
};

function MeteorField({
  planets,
  planetMotions,
  ships,
  onSunImpact,
}: {
  planets: readonly PlanetData[];
  planetMotions: readonly PlanetMotionState[];
  ships: readonly THREE.Vector3[];
  onSunImpact: (impactVelocity: THREE.Vector3) => void;
}) {
  const meteorGroups = useRef<Array<THREE.Group | null>>([]);
  const meteorCores = useRef<Array<THREE.Mesh | null>>([]);
  const meteorCoreMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const meteorGlowMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorHeadMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorInnerTailMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorOuterTailMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorLights = useRef<Array<THREE.PointLight | null>>([]);
  const meteorFireGroups = useRef<Array<THREE.Group | null>>([]);
  const blasterGroups = useRef<Array<THREE.Group | null>>([]);
  const blasterMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const burstGroups = useRef<Array<THREE.Group | null>>([]);
  const burstFragmentMeshes = useRef<Array<THREE.InstancedMesh | null>>([]);
  const burstLights = useRef<Array<THREE.PointLight | null>>([]);
  const burstSparkles = useRef<Array<Array<THREE.Points | null>>>([]);
  const shipCooldowns = useRef(Array.from({ length: ships.length }, () => 0));
  const spawnSequence = useRef(0);
  const nextSpawnAt = useRef(1.5 + Math.random() * 1.5);
  const meteors = useRef<MeteorState[]>(Array.from({ length: METEOR_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    age: 0,
    maxAge: 0,
    heat: 0,
  })));
  const blasters = useRef<BlasterState[]>(Array.from({ length: BLASTER_COUNT }, () => ({
    active: false,
    age: 0,
    duration: BLASTER_BEAM_DURATION,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
  })));
  const bursts = useRef<BurstState[]>(Array.from({ length: BURST_COUNT }, () => ({
    active: false,
    age: 0,
    duration: 2.2,
    position: new THREE.Vector3(),
    fragmentPositions: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
    fragmentRotations: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
    velocities: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
    angularVelocities: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
    scales: Array.from({ length: BURST_FRAGMENT_COUNT }, () => 1),
    visualScale: 1,
  })));
  const target = useMemo(() => new THREE.Vector3(), []);
  const collisionPosition = useMemo(() => new THREE.Vector3(), []);
  const previousMeteorPosition = useMemo(() => new THREE.Vector3(), []);
  const previousTargetPosition = useMemo(() => new THREE.Vector3(), []);
  const impactPosition = useMemo(() => new THREE.Vector3(), []);
  const impactedPlanetPosition = useMemo(() => new THREE.Vector3(), []);
  const firingSourcePosition = useMemo(() => new THREE.Vector3(), []);
  const sceneOrigin = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const fragmentTransform = useMemo(() => new THREE.Object3D(), []);

  const setBurstFragmentMatrix = (
    burstIndex: number,
    fragmentIndex: number,
    position: THREE.Vector3,
    rotation: THREE.Vector3,
    scale: number,
  ) => {
    const styleIndex = BURST_FRAGMENT_STYLES[fragmentIndex];
    const mesh = burstFragmentMeshes.current[styleIndex];
    if (!mesh) return;
    const instanceIndex = burstIndex * BURST_STYLE_COUNTS[styleIndex] + BURST_FRAGMENT_STYLE_OFFSETS[fragmentIndex];
    fragmentTransform.position.copy(position);
    fragmentTransform.rotation.set(rotation.x, rotation.y, rotation.z);
    fragmentTransform.scale.setScalar(scale);
    fragmentTransform.updateMatrix();
    mesh.setMatrixAt(instanceIndex, fragmentTransform.matrix);
  };

  const setBurstFragmentColor = (
    burstIndex: number,
    fragmentIndex: number,
    color: THREE.Color,
  ) => {
    const styleIndex = BURST_FRAGMENT_STYLES[fragmentIndex];
    const mesh = burstFragmentMeshes.current[styleIndex];
    if (!mesh) return;
    const instanceIndex = burstIndex * BURST_STYLE_COUNTS[styleIndex] + BURST_FRAGMENT_STYLE_OFFSETS[fragmentIndex];
    mesh.setColorAt(instanceIndex, color);
  };

  const setSparkleColor = (points: THREE.Points | null, color: THREE.Color) => {
    if (!points) return;
    const colorAttribute = points.geometry.getAttribute('color');
    if (!(colorAttribute instanceof THREE.BufferAttribute)) return;
    for (let index = 0; index < colorAttribute.count; index += 1) {
      colorAttribute.setXYZ(index, color.r, color.g, color.b);
    }
    colorAttribute.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const hiddenPosition = new THREE.Vector3();
    const hiddenRotation = new THREE.Vector3();
    for (let burstIndex = 0; burstIndex < BURST_COUNT; burstIndex += 1) {
      for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
        setBurstFragmentMatrix(burstIndex, fragmentIndex, hiddenPosition, hiddenRotation, 0);
      }
    }
    burstFragmentMeshes.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = false;
    });
  }, []);

  const createBurst = (position: THREE.Vector3, impactVelocity: THREE.Vector3, kind: BurstKind) => {
    const index = bursts.current.findIndex((burst) => !burst.active);
    if (index < 0) return;
    const burst = bursts.current[index];
    const visualScale = kind === 'blaster' ? BLASTER_BURST_SCALE : 1;
    const collisionMotionScale = getCollisionMotionScale(impactVelocity) * visualScale;
    const impactDirection = direction.copy(impactVelocity).normalize();
    burst.active = true;
    burst.age = 0;
    burst.visualScale = visualScale;
    burst.position.copy(position);
    const group = burstGroups.current[index];
    if (group) {
      group.visible = true;
      group.position.copy(position);
      group.scale.setScalar(visualScale);
    }
    const light = burstLights.current[index];
    if (light) {
      light.color.copy(BURST_LIGHT_COLORS[kind]);
      light.intensity = 8.5 * visualScale;
      light.distance = 12 * visualScale;
    }
    const sparkleColors = BURST_SPARKLE_COLORS[kind];
    for (let layerIndex = 0; layerIndex < sparkleColors.length; layerIndex += 1) {
      setSparkleColor(burstSparkles.current[index]?.[layerIndex] ?? null, sparkleColors[layerIndex]);
    }
    const fragmentColors = BURST_FRAGMENT_COLORS[kind];
    for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
      const styleIndex = BURST_FRAGMENT_STYLES[fragmentIndex];
      setBurstFragmentColor(index, fragmentIndex, fragmentColors[styleIndex]);
      const velocity = burst.velocities[fragmentIndex];
      velocity.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize()
        .multiplyScalar(collisionMotionScale * (0.7 + Math.random() * 0.9))
        .addScaledVector(impactDirection, collisionMotionScale * 0.22);
      burst.angularVelocities[fragmentIndex].set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize().multiplyScalar(collisionMotionScale * (0.8 + Math.random() * 1.4));
      burst.scales[fragmentIndex] = 0.65 + Math.random() * 0.85;
      burst.fragmentPositions[fragmentIndex].set(0, 0, 0);
      burst.fragmentRotations[fragmentIndex].set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
    }
    for (let styleIndex = 0; styleIndex < BURST_STYLE_COUNT; styleIndex += 1) {
      const mesh = burstFragmentMeshes.current[styleIndex];
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  };

  const createMeteorExplosion = (position: THREE.Vector3, impactVelocity: THREE.Vector3) =>
    createBurst(position, impactVelocity, 'collision');

  const applyCollisionResponse = (
    collisionTarget: number,
    collisionPlanetIndex: number,
    planetPosition: THREE.Vector3,
    impactVelocity: THREE.Vector3,
  ) => {
    if (collisionTarget === 1) {
      onSunImpact(impactVelocity);
      return;
    }
    if (collisionTarget !== 2 || collisionPlanetIndex < 0) return;
    const planet = planets[collisionPlanetIndex];
    const motion = planetMotions[collisionPlanetIndex];
    const baseSpeed = planet[1];
    const impulse = calculatePlanetOrbitImpulse(planetPosition, impactVelocity, baseSpeed);
    motion.speedOffset = THREE.MathUtils.clamp(
      motion.speedOffset + impulse,
      -baseSpeed * PLANET_IMPACT_SPEED_LIMIT,
      baseSpeed * PLANET_IMPACT_SPEED_LIMIT,
    );
  };

  const fireBlaster = (
    sourceAtContact: THREE.Vector3,
    targetAtContact: THREE.Vector3,
    impactVelocity: THREE.Vector3,
  ): boolean => {
    const index = blasters.current.findIndex((blaster) => !blaster.active);
    if (index < 0) return false;
    const blaster = blasters.current[index];
    if (!calculateBlasterSegment(sourceAtContact, targetAtContact, blaster.start, blaster.end)) return false;
    blaster.active = true;
    blaster.age = 0;
    const group = blasterGroups.current[index];
    const material = blasterMaterials.current[index];
    if (group) {
      group.visible = true;
      placeBlasterBeam(group, blaster.start, blaster.end, 1);
    }
    if (material) material.opacity = 0.95;
    createBurst(targetAtContact, impactVelocity, 'blaster');
    return true;
  };

  const spawnMeteor = (elapsed: number) => {
    const index = meteors.current.findIndex((meteor) => !meteor.active);
    if (index < 0) return;
    const meteor = meteors.current[index];
    const sequence = spawnSequence.current;
    spawnSequence.current += 1;
    const threatenedShipIndex = sequence % 2 === 0
      ? (Math.floor(sequence / 2) + 4) % ships.length
      : -1;
    const threatenedShip = threatenedShipIndex >= 0 ? ships[threatenedShipIndex] : null;
    const angle = threatenedShip
      ? Math.atan2(threatenedShip.z, threatenedShip.x) + (Math.random() - 0.5) * 0.35
      : Math.random() * Math.PI * 2;
    const radius = threatenedShip ? 25 + Math.random() * 3 : 23 + Math.random() * 6;
    const speed = 3.5 + Math.random() * 2;
    meteor.position.set(
      Math.cos(angle) * radius,
      threatenedShip ? threatenedShip.y + (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 7,
      Math.sin(angle) * radius,
    );

    const aim = Math.random();
    if (threatenedShip) {
      const orbit = SHIP_ORBITS[threatenedShipIndex];
      shipPositionAt(orbit, elapsed, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      shipPositionAt(orbit, elapsed + travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      shipPositionAt(orbit, elapsed + travelEstimate, target);
      target.x += (Math.random() - 0.5) * 0.3;
      target.y += (Math.random() - 0.5) * 0.2;
      target.z += (Math.random() - 0.5) * 0.3;
    } else if (aim < 0.18) {
      target.set(0, 0, 0);
    } else if (aim < 0.48) {
      const planetIndex = Math.floor(Math.random() * planets.length);
      const planet = planets[planetIndex];
      const motion = planetMotions[planetIndex];
      const effectiveSpeed = planet[1] + motion.speedOffset;
      planetPositionAtAngle(planet, motion.angle, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
    } else if (aim < 0.78) {
      const ship = ships[Math.floor(Math.random() * ships.length)];
      target.copy(ship);
      target.x += (Math.random() - 0.5) * 2;
      target.y += (Math.random() - 0.5) * 1.2;
      target.z += (Math.random() - 0.5) * 2;
    } else {
      const targetRadius = Math.sqrt(Math.random()) * 15;
      const targetAngle = Math.random() * Math.PI * 2;
      target.set(
        Math.cos(targetAngle) * targetRadius,
        (Math.random() - 0.5) * 5,
        Math.sin(targetAngle) * targetRadius,
      );
    }

    meteor.velocity.copy(target).sub(meteor.position).normalize().multiplyScalar(speed);
    meteor.age = 0;
    meteor.maxAge = 14;
    meteor.heat = 0;
    meteor.active = true;
    const group = meteorGroups.current[index];
    if (group) {
      group.visible = true;
      group.position.copy(meteor.position);
      direction.copy(meteor.velocity).normalize();
      group.quaternion.setFromUnitVectors(SCENE_UP, direction);
    }
  };

  useFrame(({ clock }, delta) => {
    const elapsed = clock.elapsedTime;
    if (elapsed >= nextSpawnAt.current) {
      spawnMeteor(elapsed);
      nextSpawnAt.current = elapsed + 1.8 + Math.random() * 3.2;
    }

    for (let index = 0; index < METEOR_COUNT; index += 1) {
      const meteor = meteors.current[index];
      if (!meteor.active) continue;
      meteor.age += delta;
      previousMeteorPosition.copy(meteor.position);
      meteor.position.addScaledVector(meteor.velocity, delta);
      const distanceToSun = meteor.position.length();
      const targetHeat = 1 - THREE.MathUtils.smoothstep(
        distanceToSun,
        METEOR_HEAT_PEAK_DISTANCE,
        METEOR_HEAT_START_DISTANCE,
      );
      meteor.heat = THREE.MathUtils.damp(meteor.heat, targetHeat, 4.5, delta);
      const group = meteorGroups.current[index];
      if (group) group.position.copy(meteor.position);
      const core = meteorCores.current[index];
      if (core) {
        core.rotation.x += delta * 2.2;
        core.rotation.z += delta * 1.4;
      }
      const coreMaterial = meteorCoreMaterials.current[index];
      if (coreMaterial) {
        coreMaterial.color.lerpColors(METEOR_CORE_COLD, METEOR_CORE_HOT, meteor.heat);
        coreMaterial.emissive.lerpColors(METEOR_EMISSIVE_COLD, METEOR_EMISSIVE_HOT, meteor.heat);
        coreMaterial.emissiveIntensity = 0.12 + meteor.heat * 2.7;
      }
      const glowMaterial = meteorGlowMaterials.current[index];
      if (glowMaterial) {
        glowMaterial.color.lerpColors(METEOR_GLOW_COLD, METEOR_GLOW_HOT, meteor.heat);
        glowMaterial.opacity = 0.08 + meteor.heat * 0.5;
      }
      const headMaterial = meteorHeadMaterials.current[index];
      if (headMaterial) {
        headMaterial.color.lerpColors(METEOR_HEAD_COLD, METEOR_HEAD_HOT, meteor.heat);
        headMaterial.opacity = 0.3 + meteor.heat * 0.7;
      }
      const innerTailMaterial = meteorInnerTailMaterials.current[index];
      if (innerTailMaterial) innerTailMaterial.opacity = 0.16 + meteor.heat * 0.62;
      const outerTailMaterial = meteorOuterTailMaterials.current[index];
      if (outerTailMaterial) outerTailMaterial.opacity = 0.08 + meteor.heat * 0.34;
      const fire = meteorFireGroups.current[index];
      if (fire) {
        const flicker = 0.9 + Math.sin(elapsed * 19 + index * 1.7) * 0.12;
        const heatScale = 0.38 + meteor.heat * 0.9;
        fire.scale.set(flicker * heatScale, heatScale, flicker * heatScale);
      }
      const light = meteorLights.current[index];
      if (light) {
        light.intensity = 0.12 + meteor.heat * 2.2;
        light.distance = 2.5 + meteor.heat * 4.5;
      }

      let collisionTime = calculateFirstContact(
        previousMeteorPosition,
        meteor.position,
        sceneOrigin,
        sceneOrigin,
        2.35,
      );
      let collisionTarget = collisionTime === null ? 0 : 1;
      let collisionPlanetIndex = -1;
      for (let planetIndex = 0; planetIndex < planets.length; planetIndex += 1) {
        const planet = planets[planetIndex];
        const motion = planetMotions[planetIndex];
        const effectiveSpeed = planet[1] + motion.speedOffset;
        planetPositionAtAngle(planet, motion.angle - effectiveSpeed * delta, previousTargetPosition);
        planetPositionAtAngle(planet, motion.angle, collisionPosition);
        const planetCollisionTime = calculateFirstContact(
          previousMeteorPosition,
          meteor.position,
          previousTargetPosition,
          collisionPosition,
          planet[2] + 0.28,
        );
        if (planetCollisionTime !== null && (collisionTime === null || planetCollisionTime < collisionTime)) {
          collisionTime = planetCollisionTime;
          collisionTarget = 2;
          collisionPlanetIndex = planetIndex;
          impactedPlanetPosition.lerpVectors(previousTargetPosition, collisionPosition, planetCollisionTime);
        }
      }

      let defendingShip = -1;
      let interceptionTime = Number.POSITIVE_INFINITY;
      for (let shipIndex = 0; shipIndex < SHIP_ORBITS.length; shipIndex += 1) {
        if (elapsed < shipCooldowns.current[shipIndex]) continue;
        const orbit = SHIP_ORBITS[shipIndex];
        shipPositionAt(orbit, elapsed - delta, previousTargetPosition);
        shipPositionAt(orbit, elapsed, collisionPosition);
        const contactTime = calculateFirstContact(
          previousMeteorPosition,
          meteor.position,
          previousTargetPosition,
          collisionPosition,
          BLASTER_ATTACK_RANGE,
        );
        if (contactTime !== null && contactTime < interceptionTime) {
          interceptionTime = contactTime;
          firingSourcePosition.lerpVectors(previousTargetPosition, collisionPosition, contactTime);
          defendingShip = shipIndex;
        }
      }

      if (collisionTime !== null && collisionTime <= interceptionTime) {
        impactPosition.lerpVectors(previousMeteorPosition, meteor.position, collisionTime);
        createMeteorExplosion(impactPosition, meteor.velocity);
        applyCollisionResponse(collisionTarget, collisionPlanetIndex, impactedPlanetPosition, meteor.velocity);
        meteor.active = false;
        if (group) group.visible = false;
        continue;
      }

      if (defendingShip >= 0) {
        impactPosition.lerpVectors(previousMeteorPosition, meteor.position, interceptionTime);
      }
      if (defendingShip >= 0 && fireBlaster(
        firingSourcePosition,
        impactPosition,
        meteor.velocity,
      )) {
        shipCooldowns.current[defendingShip] = elapsed + 1.2 + Math.random() * 0.8;
        meteor.active = false;
        if (group) group.visible = false;
        continue;
      }

      if (collisionTime !== null) {
        impactPosition.lerpVectors(previousMeteorPosition, meteor.position, collisionTime);
        createMeteorExplosion(impactPosition, meteor.velocity);
        applyCollisionResponse(collisionTarget, collisionPlanetIndex, impactedPlanetPosition, meteor.velocity);
        meteor.active = false;
        if (group) group.visible = false;
        continue;
      }

      if (meteor.age >= meteor.maxAge || (meteor.age > 0.5 && meteor.position.lengthSq() > 32 ** 2)) {
        meteor.active = false;
        if (group) group.visible = false;
      }
    }

    for (let index = 0; index < BLASTER_COUNT; index += 1) {
      const blaster = blasters.current[index];
      if (!blaster.active) continue;
      blaster.age += delta;
      const progress = Math.min(blaster.age / blaster.duration, 1);
      const group = blasterGroups.current[index];
      const material = blasterMaterials.current[index];
      if (group) {
        const width = 1 - progress * 0.65;
        placeBlasterBeam(group, blaster.start, blaster.end, width);
      }
      if (material) material.opacity = (1 - progress) * 0.95;
      if (progress >= 1) {
        blaster.active = false;
        if (group) group.visible = false;
      }
    }

    let burstInstancesChanged = false;
    let hasActiveBurst = false;
    let dampingReady = false;
    let velocityDamping = 1;
    let angularDamping = 1;
    for (let burstIndex = 0; burstIndex < BURST_COUNT; burstIndex += 1) {
      const burst = bursts.current[burstIndex];
      if (!burst.active) continue;
      if (!dampingReady) {
        velocityDamping = Math.exp(-0.85 * delta);
        angularDamping = Math.exp(-0.6 * delta);
        dampingReady = true;
      }
      burst.age += delta;
      const progress = Math.min(burst.age / burst.duration, 1);
      hasActiveBurst ||= progress < 1;
      const fade = (1 - progress) ** 1.7;
      const light = burstLights.current[burstIndex];
      if (light) light.intensity = fade * 8.5 * burst.visualScale;
      for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
        const velocity = burst.velocities[fragmentIndex];
        const fragmentPosition = burst.fragmentPositions[fragmentIndex];
        const fragmentRotation = burst.fragmentRotations[fragmentIndex];
        const angularVelocity = burst.angularVelocities[fragmentIndex];
        fragmentPosition.addScaledVector(velocity, delta);
        velocity.multiplyScalar(velocityDamping);
        fragmentRotation.addScaledVector(angularVelocity, delta);
        angularVelocity.multiplyScalar(angularDamping);
        const fragmentScale = progress >= 1
          ? 0
          : Math.max(
            0.05 * burst.visualScale,
            burst.scales[fragmentIndex]
              * BURST_FRAGMENT_SIZE_FACTORS[fragmentIndex]
              * burst.visualScale
              * (1 - progress) ** 1.2,
          );
        impactPosition.copy(burst.position).add(fragmentPosition);
        setBurstFragmentMatrix(burstIndex, fragmentIndex, impactPosition, fragmentRotation, fragmentScale);
        burstInstancesChanged = true;
      }
      if (progress >= 1) {
        burst.active = false;
        const group = burstGroups.current[burstIndex];
        if (group) group.visible = false;
      }
    }
    for (let index = 0; index < BURST_STYLE_COUNT; index += 1) {
      const mesh = burstFragmentMeshes.current[index];
      if (!mesh) continue;
      mesh.visible = hasActiveBurst;
      if (burstInstancesChanged) mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return <>
    {Array.from({ length: METEOR_COUNT }, (_, index) => (
      <group
        key={`meteor-${index}`}
        ref={(node) => { meteorGroups.current[index] = node; }}
        visible={false}
      >
        <mesh ref={(node) => { meteorCores.current[index] = node; }} scale={[1, 0.82, 0.9]}>
          <icosahedronGeometry args={[0.28, 1]} />
          <meshStandardMaterial
            ref={(node) => { meteorCoreMaterials.current[index] = node; }}
            color="#24130d"
            emissive="#c83f12"
            emissiveIntensity={0.12}
            roughness={1}
            metalness={0.05}
            flatShading
          />
        </mesh>
        <mesh position={[0, 0.16, 0]} scale={[0.88, 1.2, 0.88]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshBasicMaterial
            ref={(node) => { meteorGlowMaterials.current[index] = node; }}
            color="#ff6a18"
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshBasicMaterial
            ref={(node) => { meteorHeadMaterials.current[index] = node; }}
            color="#8d2c12"
            transparent
            opacity={0.3}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <group ref={(node) => { meteorFireGroups.current[index] = node; }}>
          <mesh position={[0, -0.3, 0]} scale={[0.12, 0.38, 0.12]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial
              ref={(node) => { meteorInnerTailMaterials.current[index] = node; }}
              color="#ffe2a3"
              transparent
              opacity={0.16}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0.02, -0.52, -0.01]} scale={[0.2, 0.62, 0.18]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial
              ref={(node) => { meteorOuterTailMaterials.current[index] = node; }}
              color="#ff5a18"
              transparent
              opacity={0.08}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <Sparkles
            count={22}
            position={[0, -1.35, 0]}
            scale={[0.48, 2.45, 0.48]}
            size={2.4}
            speed={0.35}
            noise={[0.35, 0.2, 0.35]}
            color="#ff6a18"
            opacity={0.72}
          />
          <Sparkles
            count={12}
            position={[0, -1.55, 0]}
            scale={[0.62, 2.8, 0.62]}
            size={4}
            speed={0.18}
            noise={[0.42, 0.18, 0.42]}
            color="#6a5149"
            opacity={0.14}
          />
        </group>
        <pointLight
          ref={(node) => { meteorLights.current[index] = node; }}
          color="#ff8a2a"
          intensity={0.12}
          distance={2.5}
        />
      </group>
    ))}
    {Array.from({ length: BLASTER_COUNT }, (_, index) => (
      <group
        key={`blaster-${index}`}
        ref={(node) => { blasterGroups.current[index] = node; }}
        visible={false}
      >
        <mesh>
          <cylinderGeometry args={[0.065, 0.065, 1, 10, 1, true]} />
          <meshBasicMaterial
            ref={(node) => { blasterMaterials.current[index] = node; }}
            color="#63f6ff"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh scale={[2.4, 1, 2.4]}>
          <cylinderGeometry args={[0.065, 0.065, 1, 10, 1, true]} />
          <meshBasicMaterial
            color="#00bde8"
            transparent
            opacity={0.22}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <pointLight color="#52eaff" intensity={1.4} distance={4} />
      </group>
    ))}
    {Array.from({ length: BURST_STYLE_COUNT }, (_, styleIndex) => (
      <instancedMesh
        key={`burst-fragments-${styleIndex}`}
        ref={(node) => { burstFragmentMeshes.current[styleIndex] = node; }}
        args={[undefined, undefined, BURST_STYLE_COUNTS[styleIndex] * BURST_COUNT]}
        frustumCulled={false}
        visible={false}
      >
        <tetrahedronGeometry args={[BURST_FRAGMENT_RADIUS, 0]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    ))}
    {Array.from({ length: BURST_COUNT }, (_, burstIndex) => (
      <group
        key={`burst-${burstIndex}`}
        ref={(node) => { burstGroups.current[burstIndex] = node; }}
        visible={false}
      >
        <Sparkles
          ref={(node) => { (burstSparkles.current[burstIndex] ??= [])[0] = node; }}
          count={64}
          scale={3.3}
          size={4.4}
          speed={1.3}
          color="#ff6a18"
          opacity={0.95}
        />
        <Sparkles
          ref={(node) => { (burstSparkles.current[burstIndex] ??= [])[1] = node; }}
          count={38}
          scale={2.5}
          size={2.8}
          speed={0.75}
          color="#ffe0a3"
          opacity={0.9}
        />
        <Sparkles
          ref={(node) => { (burstSparkles.current[burstIndex] ??= [])[2] = node; }}
          count={26}
          scale={4}
          size={5}
          speed={0.35}
          color="#6f4639"
          opacity={0.2}
        />
        <pointLight
          ref={(node) => { burstLights.current[burstIndex] = node; }}
          color="#ff7a18"
          intensity={0}
          distance={12}
          decay={1.5}
        />
      </group>
    ))}
  </>;
}

export default function HeroScene({
  labels,
  active,
}: {
  labels: readonly [string, string, string, string, string];
  active: boolean;
}) {
  const planetOffsets = useMemo(() => Array.from({ length: 5 }, () => Math.random() * Math.PI * 2), []);
  const shipPositions = useMemo(() => SHIP_ORBITS.map(() => new THREE.Vector3()), []);
  const planetMotions = useMemo<PlanetMotionState[]>(() => (
    planetOffsets.map((angle) => ({ angle, speedOffset: 0 }))
  ), [planetOffsets]);
  const starfieldMotion = useRef<StarfieldMotionState>({ yawVelocity: 0, pitchVelocity: 0, rollVelocity: 0 });
  const systemRef = useRef<THREE.Group>(null);
  const worldImpactDirection = useMemo(() => new THREE.Vector3(), []);
  const systemWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const handleSunImpact = useCallback((impactVelocity: THREE.Vector3) => {
    worldImpactDirection.copy(impactVelocity);
    if (systemRef.current) {
      systemRef.current.getWorldQuaternion(systemWorldQuaternion);
      worldImpactDirection.applyQuaternion(systemWorldQuaternion);
    }
    const impulse = calculateStarfieldImpulse(worldImpactDirection);
    const motion = starfieldMotion.current;
    motion.yawVelocity = THREE.MathUtils.clamp(motion.yawVelocity + impulse.yaw, -0.18, 0.18);
    motion.pitchVelocity = THREE.MathUtils.clamp(motion.pitchVelocity + impulse.pitch, -0.12, 0.12);
    motion.rollVelocity = THREE.MathUtils.clamp(motion.rollVelocity + impulse.roll, -0.08, 0.08);
  }, [systemWorldQuaternion, worldImpactDirection]);
  const planets: readonly PlanetData[] = [
    [6, 0.30, 0.5, SCENE_PRIMARY, labels[0], planetOffsets[0]],
    [9, 0.25, 0.7, SCENE_SECONDARY, labels[1], planetOffsets[1]],
    [12, 0.20, 0.65, '#10b981', labels[2], planetOffsets[2]],
    [15, 0.15, 0.8, '#3b82f6', labels[3], planetOffsets[3]],
    [19, 0.10, 0.9, '#f97316', labels[4], planetOffsets[4]],
  ];
  return <div className="absolute inset-0 w-full h-[55vh] md:h-full">
    <Canvas className="w-full h-full" frameloop="demand" dpr={[1, 1.5]}>
      <SceneFrameLoop active={active} />
      <SceneCamera />
      <ambientLight intensity={0.2} />
      <ReactiveStarfield motion={starfieldMotion.current} />
      <RotatingSystem systemRef={systemRef}>
          <Sun />
          {planets.map((planet, index) => (
            <Planet key={planet[4]} data={planet} motion={planetMotions[index]} />
          ))}
          {SHIP_ORBITS.map((orbit, index) => (
            <Spaceship key={index} {...orbit} positionTarget={shipPositions[index]} />
          ))}
          <MeteorField
            planets={planets}
            planetMotions={planetMotions}
            ships={shipPositions}
            onSunImpact={handleSunImpact}
          />
      </RotatingSystem>
      <OrbitControls
        enabled={active}
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent md:hidden pointer-events-none" />
  </div>;
}
