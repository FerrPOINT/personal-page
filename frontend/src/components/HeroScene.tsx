import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Stars, Text } from '@react-three/drei';
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
}

function Spaceship({ radiusX, radiusZ, speed, offset, yOffset }: SpaceshipProps) {
  const ship = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed + offset;
    if (!ship.current) return;
    ship.current.position.set(
      Math.cos(angle) * radiusX,
      Math.sin(angle * 2) * yOffset,
      Math.sin(angle) * radiusZ,
    );
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
}

interface ImpactState {
  active: boolean;
  position: THREE.Vector3;
  age: number;
  duration: number;
}

const METEOR_COUNT = 5;
const IMPACT_COUNT = 6;
const METEOR_UP = new THREE.Vector3(0, 1, 0);
const METEOR_FLAME_LAYERS = [
  [0, -0.36, 0, 0.14, 0.4, 0.14, '#ffe0a0', 0.72],
  [0.035, -0.68, -0.02, 0.19, 0.5, 0.17, '#ff9a2f', 0.54],
  [-0.045, -1.02, 0.035, 0.22, 0.55, 0.19, '#ff531c', 0.38],
  [0.06, -1.36, -0.04, 0.2, 0.48, 0.17, '#d93612', 0.24],
  [-0.055, -1.68, 0.025, 0.17, 0.4, 0.15, '#74281c', 0.14],
] as const;
const METEOR_SMOKE_LAYERS = [
  [0.08, -1.62, -0.02, 0.21, 0.52, 0.18, 0.1],
  [-0.1, -2.0, 0.06, 0.24, 0.58, 0.2, 0.065],
] as const;
const METEOR_SPARKS = [
  [0.1, -0.72, 0.03, 0.055],
  [-0.08, -1.05, 0.06, 0.04],
  [0.13, -1.38, -0.05, 0.032],
  [-0.06, -1.72, -0.03, 0.025],
] as const;

const planetPositionAt = (planet: PlanetData, elapsed: number, target: THREE.Vector3): THREE.Vector3 => {
  const [distance, speed, , , , offset] = planet;
  const angle = elapsed * speed + offset;
  return target.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
};

function MeteorField({ planets }: { planets: readonly PlanetData[] }) {
  const meteorGroups = useRef<Array<THREE.Group | null>>([]);
  const meteorCores = useRef<Array<THREE.Mesh | null>>([]);
  const meteorFireGroups = useRef<Array<THREE.Group | null>>([]);
  const impactGroups = useRef<Array<THREE.Group | null>>([]);
  const impactMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const impactLights = useRef<Array<THREE.PointLight | null>>([]);
  const nextSpawnAt = useRef(1.5 + Math.random() * 1.5);
  const meteors = useRef<MeteorState[]>(Array.from({ length: METEOR_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    age: 0,
    maxAge: 0,
  })));
  const impacts = useRef<ImpactState[]>(Array.from({ length: IMPACT_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(),
    age: 0,
    duration: 0.45,
  })));
  const target = useMemo(() => new THREE.Vector3(), []);
  const collisionPosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);

  const createImpact = (position: THREE.Vector3, color: string) => {
    const index = impacts.current.findIndex((impact) => !impact.active);
    if (index < 0) return;
    const impact = impacts.current[index];
    impact.active = true;
    impact.position.copy(position);
    impact.age = 0;
    const group = impactGroups.current[index];
    const material = impactMaterials.current[index];
    const light = impactLights.current[index];
    if (group) {
      group.visible = true;
      group.position.copy(position);
      group.scale.setScalar(0.15);
    }
    if (material) {
      material.color.set(color);
      material.opacity = 0.9;
    }
    if (light) {
      light.color.set(color);
      light.intensity = 3;
    }
  };

  const spawnMeteor = (elapsed: number) => {
    const index = meteors.current.findIndex((meteor) => !meteor.active);
    if (index < 0) return;
    const meteor = meteors.current[index];
    const angle = Math.random() * Math.PI * 2;
    const radius = 23 + Math.random() * 6;
    const speed = 3.5 + Math.random() * 2;
    meteor.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 7, Math.sin(angle) * radius);

    const aim = Math.random();
    if (aim < 0.18) {
      target.set(0, 0, 0);
    } else if (aim < 0.48) {
      const planet = planets[Math.floor(Math.random() * planets.length)];
      planetPositionAt(planet, elapsed, target);
      let travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAt(planet, elapsed + travelEstimate, target);
      travelEstimate = meteor.position.distanceTo(target) / speed;
      planetPositionAt(planet, elapsed + travelEstimate, target);
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
      const group = meteorGroups.current[index];
      if (group) group.position.copy(meteor.position);
      const core = meteorCores.current[index];
      if (core) {
        core.rotation.x += delta * 2.2;
        core.rotation.z += delta * 1.4;
      }
      const fire = meteorFireGroups.current[index];
      if (fire) {
        const flicker = 0.9 + Math.sin(elapsed * 19 + index * 1.7) * 0.12;
        fire.scale.set(flicker, 0.94 + flicker * 0.08, flicker);
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
      if (group) group.scale.setScalar(0.15 + progress * 1.5);
      if (material) material.opacity = (1 - progress) * 0.9;
      if (light) light.intensity = (1 - progress) * 3;
      if (progress >= 1) {
        impact.active = false;
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
            color="#24130d"
            emissive="#c83f12"
            emissiveIntensity={0.55}
            roughness={1}
            metalness={0.05}
            flatShading
          />
        </mesh>
        <mesh position={[0, 0.16, 0]} scale={[0.88, 1.2, 0.88]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshBasicMaterial
            color="#ff6a18"
            transparent
            opacity={0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshBasicMaterial color="#ffd08a" toneMapped={false} />
        </mesh>
        <group ref={(node) => { meteorFireGroups.current[index] = node; }}>
          {METEOR_FLAME_LAYERS.map(([x, y, z, scaleX, scaleY, scaleZ, color, opacity], flameIndex) => (
            <mesh key={`flame-${flameIndex}`} position={[x, y, z]} scale={[scaleX, scaleY, scaleZ]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
          {METEOR_SMOKE_LAYERS.map(([x, y, z, scaleX, scaleY, scaleZ, opacity], smokeIndex) => (
            <mesh key={`smoke-${smokeIndex}`} position={[x, y, z]} scale={[scaleX, scaleY, scaleZ]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#6a5149" transparent opacity={opacity} depthWrite={false} />
            </mesh>
          ))}
          {METEOR_SPARKS.map(([x, y, z, size], sparkIndex) => (
            <mesh key={sparkIndex} position={[x, y, z]}>
              <sphereGeometry args={[size, 6, 6]} />
              <meshBasicMaterial
                color={sparkIndex < 2 ? '#ffd27a' : '#ff5a1f'}
                transparent
                opacity={0.8 - sparkIndex * 0.13}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
        <pointLight color="#ff6a18" intensity={1.25} distance={5} />
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
  </>;
}

export default function HeroScene({ labels }: { labels: readonly [string, string, string, string, string] }) {
  const planetOffsets = useMemo(() => Array.from({ length: 5 }, () => Math.random() * Math.PI * 2), []);
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
          <Spaceship radiusX={6} radiusZ={6} speed={0.6} offset={0} yOffset={0.5} />
          <Spaceship radiusX={7} radiusZ={5} speed={0.5} offset={2} yOffset={-0.5} />
          <Spaceship radiusX={10} radiusZ={11} speed={0.3} offset={1} yOffset={-1.5} />
          <Spaceship radiusX={12} radiusZ={9} speed={0.25} offset={4} yOffset={1} />
          <Spaceship radiusX={16} radiusZ={16} speed={0.15} offset={5} yOffset={0} />
          <Spaceship radiusX={18} radiusZ={14} speed={0.12} offset={3} yOffset={2} />
          <MeteorField planets={planets} />
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
