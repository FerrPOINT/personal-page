import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  applyPlanetOrbitImpact,
  BLASTER_ATTACK_RANGE,
  BLASTER_BEAM_DURATION,
  calculateBlasterSegment,
  calculateFirstContact,
  getCollisionMotionScale,
  placeBlasterBeam,
  placePlanetAtAngle,
  placeShipAtTime,
  type PlanetDefinition,
  type PlanetMotionState,
  SCENE_UP,
  SHIP_ORBITS,
} from './heroScenePhysics';
import {
  createMeteorNucleusGeometry,
  createMeteorTailGeometry,
  createRadialGlowTexture,
} from './heroSceneVisuals';

type BurstKind = 'collision' | 'blaster';
type CollisionTarget = 'none' | 'sun' | 'planet';

interface MeteorState {
  active: boolean;
  position: THREE.Vector3;
  collisionPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  heat: number;
  impactHeat: number;
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
  kind: BurstKind;
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
const COLLISION_STEP = 1 / 30;
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
const BURST_VISUAL_SCALE: Record<BurstKind, number> = {
  collision: 1.2,
  blaster: 0.6,
};
const BURST_FRAGMENT_COLORS: Record<BurstKind, readonly THREE.Color[]> = {
  collision: [new THREE.Color('#ffc15c'), new THREE.Color('#ff6a18'), new THREE.Color('#b83212')],
  blaster: [new THREE.Color('#d9fbff'), new THREE.Color('#42ddff'), new THREE.Color('#126eff')],
};
const BURST_SPARKLE_COLORS: Record<BurstKind, readonly THREE.Color[]> = {
  collision: [new THREE.Color('#ff6a18'), new THREE.Color('#ffe0a3'), new THREE.Color('#6f4639')],
  blaster: [new THREE.Color('#43e6ff'), new THREE.Color('#e4fbff'), new THREE.Color('#286ab8')],
};
const SUN_CONTACT_RADIUS = 2.35;
const PLANET_METEOR_CONTACT_RADIUS = 0.28;
const METEOR_HEAT_START_DISTANCE = 19;
const METEOR_HEAT_PEAK_DISTANCE = 3;
const METEOR_IMPACT_GLOW_DISTANCE = 3.5;
const METEOR_CORE_COLD = new THREE.Color('#130d0d');
const METEOR_CORE_HOT = new THREE.Color('#d94a18');
const METEOR_EMISSIVE_COLD = new THREE.Color('#0b0202');
const METEOR_EMISSIVE_HOT = new THREE.Color('#ff6730');
const METEOR_GLOW_COLD = new THREE.Color('#270607');
const METEOR_GLOW_HOT = new THREE.Color('#e34b22');

export default function HeroSceneMeteorField({
  planets,
  planetMotions,
  ships,
  onSunImpact,
}: {
  planets: readonly PlanetDefinition[];
  planetMotions: readonly PlanetMotionState[];
  ships: readonly THREE.Vector3[];
  onSunImpact: (impactPosition: THREE.Vector3, impactVelocity: THREE.Vector3) => void;
}) {
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const meteorGroups = useRef<Array<THREE.Group | null>>([]);
  const meteorCores = useRef<Array<THREE.Group | null>>([]);
  const meteorCoreMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const meteorComaMaterials = useRef<Array<THREE.SpriteMaterial | null>>([]);
  const meteorPlasmaTailMaterials = useRef<Array<THREE.PointsMaterial | null>>([]);
  const meteorDustTailMaterials = useRef<Array<THREE.PointsMaterial | null>>([]);
  const meteorTailGroups = useRef<Array<THREE.Group | null>>([]);
  const blasterGroups = useRef<Array<THREE.Group | null>>([]);
  const blasterMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const burstGroups = useRef<Array<THREE.Group | null>>([]);
  const burstFragmentMeshes = useRef<Array<THREE.InstancedMesh | null>>([]);
  const burstSparkles = useRef<Array<Array<THREE.Points | null>>>([]);
  const shipCooldowns = useRef(Array.from({ length: ships.length }, () => 0));
  const collisionAccumulator = useRef(0);
  const effectsReady = useRef(false);
  const spawnSequence = useRef(0);
  const nextSpawnAt = useRef(1.5 + Math.random() * 1.5);
  const meteors = useRef<MeteorState[]>(Array.from({ length: METEOR_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(),
    collisionPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    age: 0,
    maxAge: 0,
    heat: 0,
    impactHeat: 0,
  })));
  const blasters = useRef<BlasterState[]>(Array.from({ length: BLASTER_COUNT }, () => ({
    active: false,
    age: 0,
    duration: BLASTER_BEAM_DURATION,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
  })));
  const bursts = useRef<BurstState[]>(Array.from({ length: BURST_COUNT }, (_, index) => ({
    active: false,
    kind: index % 2 === 0 ? 'collision' : 'blaster',
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
  const previousMeteorPosition = useMemo(() => new THREE.Vector3(), []);
  const impactPosition = useMemo(() => new THREE.Vector3(), []);
  const impactedPlanetPosition = useMemo(() => new THREE.Vector3(), []);
  const firingSourcePosition = useMemo(() => new THREE.Vector3(), []);
  const sceneOrigin = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const fragmentTransform = useMemo(() => new THREE.Object3D(), []);
  const previousPlanetPositions = useMemo(
    () => planets.map(() => new THREE.Vector3()),
    [planets],
  );
  const currentPlanetPositions = useMemo(
    () => planets.map(() => new THREE.Vector3()),
    [planets],
  );
  const previousShipPositions = useMemo(
    () => ships.map(() => new THREE.Vector3()),
    [ships],
  );
  const currentShipPositions = useMemo(
    () => ships.map(() => new THREE.Vector3()),
    [ships],
  );
  const meteorNucleusGeometry = useMemo(createMeteorNucleusGeometry, []);
  const meteorPlasmaTailGeometry = useMemo(
    () => createMeteorTailGeometry(58, 3.2, 0.34, 0x8f23ab17),
    [],
  );
  const meteorDustTailGeometry = useMemo(
    () => createMeteorTailGeometry(42, 4.8, 0.72, 0x3d91e5c9),
    [],
  );
  const meteorGlowTexture = useMemo(createRadialGlowTexture, []);

  useEffect(() => () => {
    meteorNucleusGeometry.dispose();
    meteorPlasmaTailGeometry.dispose();
    meteorDustTailGeometry.dispose();
    meteorGlowTexture.dispose();
  }, [meteorDustTailGeometry, meteorGlowTexture, meteorNucleusGeometry, meteorPlasmaTailGeometry]);

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
      const burstKind = bursts.current[burstIndex].kind;
      const sparkleColors = BURST_SPARKLE_COLORS[burstKind];
      for (let layerIndex = 0; layerIndex < sparkleColors.length; layerIndex += 1) {
        setSparkleColor(burstSparkles.current[burstIndex]?.[layerIndex] ?? null, sparkleColors[layerIndex]);
      }
      const fragmentColors = BURST_FRAGMENT_COLORS[burstKind];
      for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
        const styleIndex = BURST_FRAGMENT_STYLES[fragmentIndex];
        setBurstFragmentColor(burstIndex, fragmentIndex, fragmentColors[styleIndex]);
        setBurstFragmentMatrix(burstIndex, fragmentIndex, hiddenPosition, hiddenRotation, 0);
      }
    }
    burstFragmentMeshes.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.visible = false;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const prewarmScene = new THREE.Scene();
    prewarmScene.add(new THREE.AmbientLight('#ffffff', 0.2));
    prewarmScene.add(new THREE.PointLight('#ffaa00', 2, 100));

    const addVisibleClone = (object: THREE.Object3D | null | undefined) => {
      if (!object) return;
      const clone = object.clone(true);
      clone.traverse((child) => {
        child.visible = true;
        child.frustumCulled = false;
      });
      prewarmScene.add(clone);
    };

    addVisibleClone(meteorGroups.current[0]);
    addVisibleClone(blasterGroups.current[0]);
    addVisibleClone(burstGroups.current[0]);
    burstFragmentMeshes.current.forEach(addVisibleClone);

    const prewarmEffects = async () => {
      try {
        await renderer.compileAsync(prewarmScene, camera);
      } finally {
        prewarmScene.clear();
        if (!cancelled) effectsReady.current = true;
      }
    };

    void prewarmEffects();
    return () => {
      cancelled = true;
      prewarmScene.clear();
    };
  }, [camera, renderer]);

  const createBurst = (position: THREE.Vector3, impactVelocity: THREE.Vector3, kind: BurstKind) => {
    const index = bursts.current.findIndex((burst) => !burst.active && burst.kind === kind);
    if (index < 0) return;
    const burst = bursts.current[index];
    const visualScale = BURST_VISUAL_SCALE[kind];
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
    for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
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
  };

  const createMeteorExplosion = (position: THREE.Vector3, impactVelocity: THREE.Vector3) =>
    createBurst(position, impactVelocity, 'collision');

  const applyCollisionResponse = (
    collisionTarget: CollisionTarget,
    collisionPlanetIndex: number,
    collisionPoint: THREE.Vector3,
    planetPosition: THREE.Vector3,
    impactVelocity: THREE.Vector3,
  ) => {
    if (collisionTarget === 'sun') {
      onSunImpact(collisionPoint, impactVelocity);
      return;
    }
    if (collisionTarget !== 'planet' || collisionPlanetIndex < 0) return;
    const planet = planets[collisionPlanetIndex];
    const motion = planetMotions[collisionPlanetIndex];
    applyPlanetOrbitImpact(motion, planetPosition, impactVelocity, planet.orbitSpeed);
  };

  const deactivateMeteor = (meteor: MeteorState, group: THREE.Group | null) => {
    meteor.active = false;
    if (group) group.visible = false;
  };

  const resolveMeteorCollision = (
    meteor: MeteorState,
    group: THREE.Group | null,
    collisionTime: number,
    collisionTarget: CollisionTarget,
    collisionPlanetIndex: number,
  ) => {
    impactPosition.lerpVectors(previousMeteorPosition, meteor.position, collisionTime);
    createMeteorExplosion(impactPosition, meteor.velocity);
    applyCollisionResponse(
      collisionTarget,
      collisionPlanetIndex,
      impactPosition,
      impactedPlanetPosition,
      meteor.velocity,
    );
    deactivateMeteor(meteor, group);
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
      placeShipAtTime(orbit, elapsed, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      placeShipAtTime(orbit, elapsed + travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      placeShipAtTime(orbit, elapsed + travelEstimate, target);
      target.x += (Math.random() - 0.5) * 0.3;
      target.y += (Math.random() - 0.5) * 0.2;
      target.z += (Math.random() - 0.5) * 0.3;
    } else if (aim < 0.18) {
      target.set(
        (Math.random() - 0.5) * 2.4,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2.4,
      );
      if (target.lengthSq() > 1.4 ** 2) target.normalize().multiplyScalar(1.4);
    } else if (aim < 0.48) {
      const planetIndex = Math.floor(Math.random() * planets.length);
      const planet = planets[planetIndex];
      const motion = planetMotions[planetIndex];
      const effectiveSpeed = planet.orbitSpeed + motion.speedOffset;
      placePlanetAtAngle(planet, motion.angle, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      placePlanetAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      placePlanetAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
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
    meteor.collisionPosition.copy(meteor.position);
    meteor.age = 0;
    meteor.maxAge = 14;
    meteor.heat = 0;
    meteor.impactHeat = 0;
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
    const frameDelta = delta;
    // Keep visual motion at display cadence while sweeping collisions over a fixed-rate interval.
    collisionAccumulator.current += frameDelta;
    const collisionDelta = collisionAccumulator.current >= COLLISION_STEP
      ? collisionAccumulator.current
      : 0;
    if (collisionDelta > 0) collisionAccumulator.current = 0;
    if (effectsReady.current && elapsed >= nextSpawnAt.current) {
      spawnMeteor(elapsed);
      nextSpawnAt.current = elapsed + 1.8 + Math.random() * 3.2;
    }

    if (collisionDelta > 0) {
      for (let planetIndex = 0; planetIndex < planets.length; planetIndex += 1) {
        const planet = planets[planetIndex];
        const motion = planetMotions[planetIndex];
        const effectiveSpeed = planet.orbitSpeed + motion.speedOffset;
        placePlanetAtAngle(
          planet,
          motion.angle - effectiveSpeed * collisionDelta,
          previousPlanetPositions[planetIndex],
        );
        placePlanetAtAngle(planet, motion.angle, currentPlanetPositions[planetIndex]);
      }
      for (let shipIndex = 0; shipIndex < SHIP_ORBITS.length; shipIndex += 1) {
        const orbit = SHIP_ORBITS[shipIndex];
        placeShipAtTime(orbit, elapsed - collisionDelta, previousShipPositions[shipIndex]);
        placeShipAtTime(orbit, elapsed, currentShipPositions[shipIndex]);
      }
    }

    for (let index = 0; index < METEOR_COUNT; index += 1) {
      const meteor = meteors.current[index];
      if (!meteor.active) continue;
      meteor.age += frameDelta;
      meteor.position.addScaledVector(meteor.velocity, frameDelta);
      const distanceToSun = meteor.position.length();
      const solarHeat = 1 - THREE.MathUtils.smoothstep(
        distanceToSun,
        METEOR_HEAT_PEAK_DISTANCE,
        METEOR_HEAT_START_DISTANCE,
      );
      const group = meteorGroups.current[index];
      if (group) group.position.copy(meteor.position);
      const core = meteorCores.current[index];
      if (core) {
        core.rotation.x += frameDelta * 2.2;
        core.rotation.z += frameDelta * 1.4;
      }
      const targetHeat = Math.max(solarHeat * 0.45, meteor.impactHeat);
      meteor.heat = THREE.MathUtils.damp(meteor.heat, targetHeat, 6.5, frameDelta);
      const coreMaterial = meteorCoreMaterials.current[index];
      if (coreMaterial) {
        coreMaterial.color.lerpColors(METEOR_CORE_COLD, METEOR_CORE_HOT, meteor.heat);
        coreMaterial.emissive.lerpColors(METEOR_EMISSIVE_COLD, METEOR_EMISSIVE_HOT, meteor.heat);
        coreMaterial.emissiveIntensity = 0.02 + meteor.heat * 1.9;
      }
      const comaMaterial = meteorComaMaterials.current[index];
      if (comaMaterial) {
        comaMaterial.color.lerpColors(METEOR_GLOW_COLD, METEOR_GLOW_HOT, meteor.heat);
        comaMaterial.opacity = 0.008 + meteor.heat * 0.25;
      }
      const plasmaTailMaterial = meteorPlasmaTailMaterials.current[index];
      if (plasmaTailMaterial) plasmaTailMaterial.opacity = 0.08 + meteor.heat * 0.62;
      const dustTailMaterial = meteorDustTailMaterials.current[index];
      if (dustTailMaterial) dustTailMaterial.opacity = 0.035 + meteor.heat * 0.22;
      const tail = meteorTailGroups.current[index];
      if (tail) {
        const flicker = 0.9 + Math.sin(elapsed * 19 + index * 1.7) * 0.12;
        const widthScale = 0.62 + meteor.heat * 0.48;
        const lengthScale = 0.72 + meteor.heat * 0.64;
        tail.scale.set(flicker * widthScale, lengthScale, flicker * widthScale);
      }
      if (collisionDelta > 0) {
        previousMeteorPosition.copy(meteor.collisionPosition);
        let collisionTime = calculateFirstContact(
          previousMeteorPosition,
          meteor.position,
          sceneOrigin,
          sceneOrigin,
          SUN_CONTACT_RADIUS,
        );
        let collisionTarget: CollisionTarget = collisionTime === null ? 'none' : 'sun';
        let collisionPlanetIndex = -1;
        let nearestImpactClearance = Math.max(0, distanceToSun - SUN_CONTACT_RADIUS);
        for (let planetIndex = 0; planetIndex < planets.length; planetIndex += 1) {
          const planet = planets[planetIndex];
          const previousPlanetPosition = previousPlanetPositions[planetIndex];
          const currentPlanetPosition = currentPlanetPositions[planetIndex];
          const contactRadius = planet.size + PLANET_METEOR_CONTACT_RADIUS;
          nearestImpactClearance = Math.min(
            nearestImpactClearance,
            Math.max(0, meteor.position.distanceTo(currentPlanetPosition) - contactRadius),
          );
          const planetCollisionTime = calculateFirstContact(
            previousMeteorPosition,
            meteor.position,
            previousPlanetPosition,
            currentPlanetPosition,
            contactRadius,
          );
          if (planetCollisionTime !== null && (collisionTime === null || planetCollisionTime < collisionTime)) {
            collisionTime = planetCollisionTime;
            collisionTarget = 'planet';
            collisionPlanetIndex = planetIndex;
            impactedPlanetPosition.lerpVectors(
              previousPlanetPosition,
              currentPlanetPosition,
              planetCollisionTime,
            );
          }
        }
        meteor.impactHeat = 1 - THREE.MathUtils.smoothstep(
          nearestImpactClearance,
          0,
          METEOR_IMPACT_GLOW_DISTANCE,
        );

        let defendingShip = -1;
        let interceptionTime = Number.POSITIVE_INFINITY;
        for (let shipIndex = 0; shipIndex < SHIP_ORBITS.length; shipIndex += 1) {
          if (elapsed < shipCooldowns.current[shipIndex]) continue;
          const previousShipPosition = previousShipPositions[shipIndex];
          const currentShipPosition = currentShipPositions[shipIndex];
          const contactTime = calculateFirstContact(
            previousMeteorPosition,
            meteor.position,
            previousShipPosition,
            currentShipPosition,
            BLASTER_ATTACK_RANGE,
          );
          if (contactTime !== null && contactTime < interceptionTime) {
            interceptionTime = contactTime;
            firingSourcePosition.lerpVectors(previousShipPosition, currentShipPosition, contactTime);
            defendingShip = shipIndex;
          }
        }

        if (collisionTime !== null && collisionTime <= interceptionTime) {
          resolveMeteorCollision(meteor, group, collisionTime, collisionTarget, collisionPlanetIndex);
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
          deactivateMeteor(meteor, group);
          continue;
        }

        if (collisionTime !== null) {
          resolveMeteorCollision(meteor, group, collisionTime, collisionTarget, collisionPlanetIndex);
          continue;
        }
        meteor.collisionPosition.copy(meteor.position);
      }

      if (meteor.age >= meteor.maxAge || (meteor.age > 0.5 && meteor.position.lengthSq() > 32 ** 2)) {
        deactivateMeteor(meteor, group);
      }
    }

    for (let index = 0; index < BLASTER_COUNT; index += 1) {
      const blaster = blasters.current[index];
      if (!blaster.active) continue;
      blaster.age += frameDelta;
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
        velocityDamping = Math.exp(-0.85 * frameDelta);
        angularDamping = Math.exp(-0.6 * frameDelta);
        dampingReady = true;
      }
      burst.age += frameDelta;
      const progress = Math.min(burst.age / burst.duration, 1);
      hasActiveBurst ||= progress < 1;
      for (let fragmentIndex = 0; fragmentIndex < BURST_FRAGMENT_COUNT; fragmentIndex += 1) {
        const velocity = burst.velocities[fragmentIndex];
        const fragmentPosition = burst.fragmentPositions[fragmentIndex];
        const fragmentRotation = burst.fragmentRotations[fragmentIndex];
        const angularVelocity = burst.angularVelocities[fragmentIndex];
        fragmentPosition.addScaledVector(velocity, frameDelta);
        velocity.multiplyScalar(velocityDamping);
        fragmentRotation.addScaledVector(angularVelocity, frameDelta);
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
        <group
          ref={(node) => { meteorCores.current[index] = node; }}
          rotation={[index * 0.71, index * 1.17, index * 0.43]}
          scale={0.5}
        >
          <mesh>
            <primitive object={meteorNucleusGeometry} attach="geometry" />
            <meshStandardMaterial
              ref={(node) => { meteorCoreMaterials.current[index] = node; }}
              color="#130d0d"
              emissive="#0b0202"
              emissiveIntensity={0.02}
              roughness={1}
              metalness={0.05}
              flatShading
            />
          </mesh>
          <mesh position={[0.25, 0.07, 0.17]} scale={[0.085, 0.045, 0.07]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#0d0908" roughness={1} flatShading />
          </mesh>
          <mesh position={[-0.17, -0.19, 0.2]} scale={[0.06, 0.09, 0.045]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#493027" roughness={1} flatShading />
          </mesh>
        </group>
        <sprite scale={[0.62, 0.62, 1]}>
          <spriteMaterial
            ref={(node) => { meteorComaMaterials.current[index] = node; }}
            map={meteorGlowTexture}
            color="#270607"
            transparent
            opacity={0.008}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <group ref={(node) => { meteorTailGroups.current[index] = node; }}>
          <points geometry={meteorPlasmaTailGeometry} rotation={[0, index * 0.37, 0]}>
            <pointsMaterial
              ref={(node) => { meteorPlasmaTailMaterials.current[index] = node; }}
              color="#ffbd5b"
              size={0.09}
              sizeAttenuation
              transparent
              opacity={0.08}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
          <points geometry={meteorDustTailGeometry} rotation={[0, -0.12 + index * 0.19, 0]}>
            <pointsMaterial
              ref={(node) => { meteorDustTailMaterials.current[index] = node; }}
              color="#a85b32"
              size={0.065}
              sizeAttenuation
              transparent
              opacity={0.035}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
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
      </group>
    ))}
  </>;
}
