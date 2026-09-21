import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Sparkles, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

type PlanetData = readonly [
  distance: number,
  speed: number,
  size: number,
  color: string,
  label: string,
  offset: number,
];

const SCENE_PRIMARY = '#00d9ff';
const SCENE_SECONDARY = '#ff00ff';

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

function Planet({ data }: { data: PlanetData }) {
  const [distance, speed, size, color, label, offset] = data;
  const planet = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed + offset;
    if (!planet.current) return;
    planet.current.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
    planet.current.rotation.y += 0.01;
    if (labelRef.current) labelRef.current.position.set(planet.current.position.x, size + 0.8, planet.current.position.z);
  });
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[distance - 0.03, distance + 0.03, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
    <mesh ref={planet}>
      <sphereGeometry args={[size, 64, 64]} />
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

function Spaceship({ radiusX, radiusZ, speed, offset, yOffset, positionTarget }: SpaceshipProps) {
  const ship = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed + offset;
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

interface ImpactState {
  active: boolean;
  position: THREE.Vector3;
  age: number;
  duration: number;
  magnitude: number;
}

interface BlasterState {
  active: boolean;
  age: number;
  duration: number;
}

interface BurstState {
  active: boolean;
  age: number;
  duration: number;
  velocities: THREE.Vector3[];
  scales: number[];
}

const METEOR_COUNT = 5;
const IMPACT_COUNT = 6;
const BLASTER_COUNT = 4;
const BURST_COUNT = 6;
const BURST_FRAGMENT_COUNT = 18;
const BLASTER_RANGE_SQ = 6 ** 2;
const METEOR_UP = new THREE.Vector3(0, 1, 0);
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

const planetPositionAt = (planet: PlanetData, elapsed: number, target: THREE.Vector3): THREE.Vector3 => {
  const [distance, speed, , , , offset] = planet;
  const angle = elapsed * speed + offset;
  return target.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
};

function MeteorField({ planets, ships }: { planets: readonly PlanetData[]; ships: readonly THREE.Vector3[] }) {
  const meteorGroups = useRef<Array<THREE.Group | null>>([]);
  const meteorCores = useRef<Array<THREE.Mesh | null>>([]);
  const meteorCoreMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const meteorGlowMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorHeadMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorInnerTailMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorOuterTailMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const meteorLights = useRef<Array<THREE.PointLight | null>>([]);
  const meteorFireGroups = useRef<Array<THREE.Group | null>>([]);
  const impactGroups = useRef<Array<THREE.Group | null>>([]);
  const impactMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const impactLights = useRef<Array<THREE.PointLight | null>>([]);
  const blasterGroups = useRef<Array<THREE.Group | null>>([]);
  const blasterMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const burstGroups = useRef<Array<THREE.Group | null>>([]);
  const burstFragments = useRef<Array<Array<THREE.Mesh | null>>>([]);
  const burstCoreMeshes = useRef<Array<THREE.Mesh | null>>([]);
  const burstCoreMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const burstWaveMeshes = useRef<Array<Array<THREE.Mesh | null>>>([]);
  const burstWaveMaterials = useRef<Array<Array<THREE.MeshBasicMaterial | null>>>([]);
  const burstLights = useRef<Array<THREE.PointLight | null>>([]);
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
  const impacts = useRef<ImpactState[]>(Array.from({ length: IMPACT_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(),
    age: 0,
    duration: 0.45,
    magnitude: 1,
  })));
  const blasters = useRef<BlasterState[]>(Array.from({ length: BLASTER_COUNT }, () => ({
    active: false,
    age: 0,
    duration: 0.5,
  })));
  const bursts = useRef<BurstState[]>(Array.from({ length: BURST_COUNT }, () => ({
    active: false,
    age: 0,
    duration: 1.8,
    velocities: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
    scales: Array.from({ length: BURST_FRAGMENT_COUNT }, () => 1),
  })));
  const target = useMemo(() => new THREE.Vector3(), []);
  const collisionPosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const beamDirection = useMemo(() => new THREE.Vector3(), []);
  const beamMidpoint = useMemo(() => new THREE.Vector3(), []);

  const createImpact = (position: THREE.Vector3, color: string, magnitude = 1) => {
    const index = impacts.current.findIndex((impact) => !impact.active);
    if (index < 0) return;
    const impact = impacts.current[index];
    impact.active = true;
    impact.position.copy(position);
    impact.age = 0;
    impact.magnitude = magnitude;
    const group = impactGroups.current[index];
    const material = impactMaterials.current[index];
    const light = impactLights.current[index];
    if (group) {
      group.visible = true;
      group.position.copy(position);
      group.scale.setScalar(0.15 * magnitude);
    }
    if (material) {
      material.color.set(color);
      material.opacity = 0.9;
    }
    if (light) {
      light.color.set(color);
      light.intensity = 3 * magnitude;
    }
  };

  const createBurst = (position: THREE.Vector3) => {
    const index = bursts.current.findIndex((burst) => !burst.active);
    if (index < 0) return;
    const burst = bursts.current[index];
    burst.active = true;
    burst.age = 0;
    const group = burstGroups.current[index];
    if (group) {
      group.visible = true;
      group.position.copy(position);
    }
    const core = burstCoreMeshes.current[index];
    const coreMaterial = burstCoreMaterials.current[index];
    const waves = burstWaveMeshes.current[index];
    const waveMaterials = burstWaveMaterials.current[index];
    const light = burstLights.current[index];
    if (core) core.scale.setScalar(0.25);
    if (coreMaterial) coreMaterial.opacity = 0.95;
    waves?.forEach((wave, waveIndex) => {
      if (wave) wave.scale.setScalar(waveIndex === 0 ? 0.25 : 0.18);
      const waveMaterial = waveMaterials?.[waveIndex];
      if (waveMaterial) waveMaterial.opacity = waveIndex === 0 ? 0.85 : 0.65;
    });
    if (light) light.intensity = 8.5;
    burst.velocities.forEach((velocity, fragmentIndex) => {
      velocity.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize().multiplyScalar(2.5 + Math.random() * 3);
      burst.scales[fragmentIndex] = 0.9 + Math.random() * 0.9;
      const fragment = burstFragments.current[index]?.[fragmentIndex];
      if (fragment) {
        fragment.position.set(0, 0, 0);
        fragment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        fragment.scale.setScalar(burst.scales[fragmentIndex]);
      }
    });
  };

  const fireBlaster = (source: THREE.Vector3, destination: THREE.Vector3): boolean => {
    const index = blasters.current.findIndex((blaster) => !blaster.active);
    if (index < 0) return false;
    const blaster = blasters.current[index];
    blaster.active = true;
    blaster.age = 0;
    const group = blasterGroups.current[index];
    const material = blasterMaterials.current[index];
    if (group) {
      beamDirection.copy(destination).sub(source);
      const length = beamDirection.length();
      beamMidpoint.copy(source).add(destination).multiplyScalar(0.5);
      group.visible = true;
      group.position.copy(beamMidpoint);
      group.quaternion.setFromUnitVectors(METEOR_UP, beamDirection.normalize());
      group.scale.set(1, length, 1);
    }
    if (material) material.opacity = 0.95;
    createImpact(destination, '#ff6a18', 2);
    createBurst(destination);
    return true;
  };

  const spawnMeteor = (elapsed: number) => {
    const index = meteors.current.findIndex((meteor) => !meteor.active);
    if (index < 0) return;
    const meteor = meteors.current[index];
    const sequence = spawnSequence.current;
    spawnSequence.current += 1;
    const threatenedShip = sequence % 3 === 0
      ? ships[(Math.floor(sequence / 3) + 4) % ships.length]
      : null;
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
      target.copy(threatenedShip);
      target.x += (Math.random() - 0.5) * 1.2;
      target.y += (Math.random() - 0.5) * 0.8;
      target.z += (Math.random() - 0.5) * 1.2;
    } else if (aim < 0.18) {
      target.set(0, 0, 0);
    } else if (aim < 0.48) {
      const planet = planets[Math.floor(Math.random() * planets.length)];
      planetPositionAt(planet, elapsed, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAt(planet, elapsed + travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAt(planet, elapsed + travelEstimate, target);
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
      group.quaternion.setFromUnitVectors(METEOR_UP, direction);
    }
  };

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    if (elapsed >= nextSpawnAt.current) {
      spawnMeteor(elapsed);
      nextSpawnAt.current = elapsed + 1.8 + Math.random() * 3.2;
    }

    meteors.current.forEach((meteor, index) => {
      if (!meteor.active) return;
      meteor.age += delta;
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

      let impactColor: string | null = null;
      if (meteor.position.lengthSq() <= 2.35 ** 2) {
        impactColor = '#ffaa00';
      } else {
        for (const planet of planets) {
          planetPositionAt(planet, elapsed, collisionPosition);
          if (meteor.position.distanceToSquared(collisionPosition) <= (planet[2] + 0.28) ** 2) {
            impactColor = planet[3];
            break;
          }
        }
      }

      if (impactColor) {
        createImpact(meteor.position, impactColor);
        meteor.active = false;
        if (group) group.visible = false;
        return;
      }

      let defendingShip = -1;
      let closestShipDistanceSq = BLASTER_RANGE_SQ;
      ships.forEach((shipPosition, shipIndex) => {
        if (elapsed < shipCooldowns.current[shipIndex]) return;
        const distanceSq = meteor.position.distanceToSquared(shipPosition);
        if (distanceSq < closestShipDistanceSq) {
          closestShipDistanceSq = distanceSq;
          defendingShip = shipIndex;
        }
      });
      if (defendingShip >= 0 && fireBlaster(ships[defendingShip], meteor.position)) {
        shipCooldowns.current[defendingShip] = elapsed + 1.2 + Math.random() * 0.8;
        meteor.active = false;
        if (group) group.visible = false;
        return;
      }

      if (meteor.age >= meteor.maxAge || (meteor.age > 0.5 && meteor.position.lengthSq() > 32 ** 2)) {
        meteor.active = false;
        if (group) group.visible = false;
      }
    });

    impacts.current.forEach((impact, index) => {
      if (!impact.active) return;
      impact.age += delta;
      const progress = Math.min(impact.age / impact.duration, 1);
      const group = impactGroups.current[index];
      const material = impactMaterials.current[index];
      const light = impactLights.current[index];
      if (group) group.scale.setScalar((0.15 + progress * 1.5) * impact.magnitude);
      if (material) material.opacity = (1 - progress) * 0.9;
      if (light) light.intensity = (1 - progress) * 3 * impact.magnitude;
      if (progress >= 1) {
        impact.active = false;
        if (group) group.visible = false;
      }
    });

    blasters.current.forEach((blaster, index) => {
      if (!blaster.active) return;
      blaster.age += delta;
      const progress = Math.min(blaster.age / blaster.duration, 1);
      const group = blasterGroups.current[index];
      const material = blasterMaterials.current[index];
      if (group) {
        const width = 1 - progress * 0.65;
        group.scale.x = width;
        group.scale.z = width;
      }
      if (material) material.opacity = (1 - progress) * 0.95;
      if (progress >= 1) {
        blaster.active = false;
        if (group) group.visible = false;
      }
    });

    bursts.current.forEach((burst, burstIndex) => {
      if (!burst.active) return;
      burst.age += delta;
      const progress = Math.min(burst.age / burst.duration, 1);
      const expansion = 1 - (1 - progress) ** 3;
      const fade = (1 - progress) ** 1.7;
      const core = burstCoreMeshes.current[burstIndex];
      const coreMaterial = burstCoreMaterials.current[burstIndex];
      const waves = burstWaveMeshes.current[burstIndex];
      const waveMaterials = burstWaveMaterials.current[burstIndex];
      const light = burstLights.current[burstIndex];
      if (core) core.scale.setScalar(0.25 + expansion * 3.4);
      if (coreMaterial) coreMaterial.opacity = fade * 0.95;
      waves?.forEach((wave, waveIndex) => {
        if (!wave) return;
        const delay = waveIndex * 0.12;
        const waveProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
        const waveExpansion = 1 - (1 - waveProgress) ** 3;
        wave.scale.setScalar((waveIndex === 0 ? 0.25 : 0.18) + waveExpansion * (waveIndex === 0 ? 4.2 : 3.6));
        const waveMaterial = waveMaterials?.[waveIndex];
        if (waveMaterial) waveMaterial.opacity = (1 - waveProgress) ** 1.4 * (waveIndex === 0 ? 0.85 : 0.65);
      });
      if (light) light.intensity = fade * 8.5;
      burst.velocities.forEach((velocity, fragmentIndex) => {
        const fragment = burstFragments.current[burstIndex]?.[fragmentIndex];
        if (!fragment) return;
        fragment.position.addScaledVector(velocity, delta);
        velocity.multiplyScalar(Math.exp(-1.15 * delta));
        fragment.rotation.x += delta * (3 + fragmentIndex * 0.25);
        fragment.rotation.z += delta * (2 + fragmentIndex * 0.18);
        fragment.scale.setScalar(Math.max(0.05, burst.scales[fragmentIndex] * (1 - progress) ** 1.2));
      });
      if (progress >= 1) {
        burst.active = false;
        const group = burstGroups.current[burstIndex];
        if (group) group.visible = false;
      }
    });
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
    {Array.from({ length: IMPACT_COUNT }, (_, index) => (
      <group
        key={`impact-${index}`}
        ref={(node) => { impactGroups.current[index] = node; }}
        visible={false}
      >
        <mesh>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshBasicMaterial
            ref={(node) => { impactMaterials.current[index] = node; }}
            color="#ffaa00"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <pointLight
          ref={(node) => { impactLights.current[index] = node; }}
          color="#ffaa00"
          intensity={0}
          distance={7}
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
    {Array.from({ length: BURST_COUNT }, (_, burstIndex) => (
      <group
        key={`burst-${burstIndex}`}
        ref={(node) => { burstGroups.current[burstIndex] = node; }}
        visible={false}
      >
        <mesh ref={(node) => { burstCoreMeshes.current[burstIndex] = node; }}>
          <icosahedronGeometry args={[0.62, 2]} />
          <meshBasicMaterial
            ref={(node) => { burstCoreMaterials.current[burstIndex] = node; }}
            color="#ffb13b"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {[0, 1].map((waveIndex) => (
          <mesh
            key={`wave-${waveIndex}`}
            ref={(node) => {
              if (!burstWaveMeshes.current[burstIndex]) burstWaveMeshes.current[burstIndex] = [];
              burstWaveMeshes.current[burstIndex][waveIndex] = node;
            }}
            rotation={waveIndex === 0 ? [Math.PI / 2, 0, 0] : [0.55, 0.75, 0.2]}
          >
            <torusGeometry args={[0.62, waveIndex === 0 ? 0.075 : 0.045, 8, 36]} />
            <meshBasicMaterial
              ref={(node) => {
                if (!burstWaveMaterials.current[burstIndex]) burstWaveMaterials.current[burstIndex] = [];
                burstWaveMaterials.current[burstIndex][waveIndex] = node;
              }}
              color={waveIndex === 0 ? '#ff7a18' : '#ffd27a'}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
        {Array.from({ length: BURST_FRAGMENT_COUNT }, (_, fragmentIndex) => (
          <mesh
            key={fragmentIndex}
            ref={(node) => {
              if (!burstFragments.current[burstIndex]) burstFragments.current[burstIndex] = [];
              burstFragments.current[burstIndex][fragmentIndex] = node;
            }}
          >
            <tetrahedronGeometry args={[0.13 + (fragmentIndex % 4) * 0.025, 0]} />
            <meshStandardMaterial
              color={fragmentIndex % 3 === 0 ? '#3a1b0e' : '#21130f'}
              emissive={fragmentIndex % 3 === 0 ? '#ffc15c' : fragmentIndex % 2 === 0 ? '#ff6a18' : '#b83212'}
              emissiveIntensity={fragmentIndex % 3 === 0 ? 2.1 : 1.45}
              roughness={1}
              flatShading
            />
          </mesh>
        ))}
        <Sparkles count={48} scale={2.3} size={5.2} speed={1.3} color="#ff6a18" opacity={0.95} />
        <Sparkles count={28} scale={1.55} size={3.2} speed={0.75} color="#ffe0a3" opacity={0.9} />
        <Sparkles count={20} scale={2.7} size={6} speed={0.35} color="#6f4639" opacity={0.2} />
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

export default function HeroScene({ labels }: { labels: readonly [string, string, string, string, string] }) {
  const planetOffsets = useMemo(() => Array.from({ length: 5 }, () => Math.random() * Math.PI * 2), []);
  const shipPositions = useMemo(() => SHIP_ORBITS.map(() => new THREE.Vector3()), []);
  const planets: readonly PlanetData[] = [
    [6, 0.30, 0.5, SCENE_PRIMARY, labels[0], planetOffsets[0]],
    [9, 0.25, 0.7, SCENE_SECONDARY, labels[1], planetOffsets[1]],
    [12, 0.20, 0.65, '#10b981', labels[2], planetOffsets[2]],
    [15, 0.15, 0.8, '#3b82f6', labels[3], planetOffsets[3]],
    [19, 0.10, 0.9, '#f97316', labels[4], planetOffsets[4]],
  ];
  return <div className="absolute top-0 right-0 w-full h-[55vh] md:h-full md:w-[75vw]">
    <Canvas className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 20, 42]} fov={40} />
      <ambientLight intensity={0.2} />
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group rotation={[0.2, 0, 0]} position={[0, 0, 0]}>
          <Sun />
          {planets.map((planet) => <Planet key={planet[4]} data={planet} />)}
          {SHIP_ORBITS.map((orbit, index) => (
            <Spaceship key={index} {...orbit} positionTarget={shipPositions[index]} />
          ))}
          <MeteorField planets={planets} ships={shipPositions} />
        </group>
      </Float>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
    <div className="absolute inset-y-0 left-0 w-24 md:w-[36%] bg-gradient-to-r from-background/75 via-background/45 to-transparent pointer-events-none" />
    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent md:hidden pointer-events-none" />
  </div>;
}
