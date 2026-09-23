import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  advancePlanetMotion,
  applyStarfieldImpulse,
  applySunAngularImpulse,
  createInitialStarfieldMotion,
  createInitialSunRotation,
  placePlanetAtAngle,
  placeShipAtTime,
  type PlanetDefinition,
  type PlanetMotionState,
  recoverStarfieldSpeed,
  recoverSunRotation,
  SHIP_ORBITS,
  type ShipOrbit,
  type StarfieldMotionState,
  type SunRotationState,
} from './heroScenePhysics';
import HeroSceneMeteorField from './HeroSceneMeteorField';
import { createRadialGlowTexture } from './heroSceneVisuals';

const SCENE_PRIMARY = '#00d9ff';
const SCENE_SECONDARY = '#ff00ff';
const MAX_SCENE_FPS = 60;

interface PlanetSatelliteDefinition {
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
  label: string;
  initialAngle: number;
}

interface PlanetVisualDefinition extends PlanetDefinition {
  satellite?: PlanetSatelliteDefinition;
}

const PLANET_HEAT_TEXTURE_SIZE = 64;

const createPlanetHeatTexture = (): THREE.DataTexture => {
  const pixels = new Uint8Array(PLANET_HEAT_TEXTURE_SIZE * PLANET_HEAT_TEXTURE_SIZE * 4);
  for (let y = 0; y < PLANET_HEAT_TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < PLANET_HEAT_TEXTURE_SIZE; x += 1) {
      const normalizedX = (x + 0.5) / PLANET_HEAT_TEXTURE_SIZE * 2 - 1;
      const normalizedY = (y + 0.5) / PLANET_HEAT_TEXTURE_SIZE * 2 - 1;
      const radius = Math.hypot(normalizedX, normalizedY);
      const falloff = Math.max(0, 1 - radius);
      const intensity = falloff * falloff * (3 - 2 * falloff);
      const offset = (y * PLANET_HEAT_TEXTURE_SIZE + x) * 4;
      pixels[offset] = 255;
      pixels[offset + 1] = Math.round(72 + intensity * 110);
      pixels[offset + 2] = 10;
      pixels[offset + 3] = Math.round(intensity * 255);
    }
  }
  const texture = new THREE.DataTexture(
    pixels,
    PLANET_HEAT_TEXTURE_SIZE,
    PLANET_HEAT_TEXTURE_SIZE,
    THREE.RGBAFormat,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

const PLANET_HEAT_TEXTURE = createPlanetHeatTexture();

// Master multiplier for the sun surface, corona and emitted light.
export const SUN_BRIGHTNESS = 1.3;

function SceneFrameLoop({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const clock = useThree((state) => state.clock);

  useEffect(() => {
    if (!active) return;
    // Demand rendering leaves the Three clock untouched while the hero is offscreen.
    // Reset its frame origin so the first resumed frame does not receive the whole pause as delta.
    clock.oldTime = performance.now();
    const frameDuration = 1000 / MAX_SCENE_FPS;
    let lastFrameAt = performance.now();
    let animationFrame = 0;
    const renderFrame = (now: number) => {
      animationFrame = window.requestAnimationFrame(renderFrame);
      if (now - lastFrameAt < frameDuration - 1) return;
      lastFrameAt = now - ((now - lastFrameAt) % frameDuration);
      invalidate();
    };
    invalidate();
    animationFrame = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(animationFrame);
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

    recoverStarfieldSpeed(motion, frameDelta);
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

function Sun({ motion }: { motion: SunRotationState }) {
  const sun = useRef<THREE.Group>(null);
  const rotationAxis = useMemo(() => new THREE.Vector3(), []);
  const rotationStep = useMemo(() => new THREE.Quaternion(), []);
  const glowTexture = useMemo(createRadialGlowTexture, []);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  useFrame((_, delta) => {
    if (!sun.current) return;
    const frameDelta = Math.min(delta, 0.05);
    rotationAxis.set(motion.xVelocity, motion.yVelocity, motion.zVelocity);
    const angularSpeed = rotationAxis.length();
    if (angularSpeed > 1e-6) {
      rotationAxis.multiplyScalar(1 / angularSpeed);
      rotationStep.setFromAxisAngle(rotationAxis, angularSpeed * frameDelta);
      sun.current.quaternion.multiply(rotationStep);
    }
    recoverSunRotation(motion, frameDelta);
  });

  return <group ref={sun}>
    <sprite scale={[11, 11, 1]} renderOrder={-2}>
      <spriteMaterial
        map={glowTexture}
        color="#ff5a16"
        transparent
        opacity={Math.min(1, 0.16 * SUN_BRIGHTNESS)}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
    <sprite scale={[7.2, 7.2, 1]} renderOrder={-1}>
      <spriteMaterial
        map={glowTexture}
        color="#ffb02e"
        transparent
        opacity={Math.min(1, 0.42 * SUN_BRIGHTNESS)}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#ffaa00"
        emissive="#ff5500"
        emissiveIntensity={3 * SUN_BRIGHTNESS}
        roughness={0.4}
      />
    </mesh>
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial color="#ffaa00" wireframe transparent opacity={0.15} />
    </mesh>
    <pointLight distance={100} intensity={2 * SUN_BRIGHTNESS} color="#ffaa00" />
  </group>;
}

function Planet({ data, motion }: { data: PlanetVisualDefinition; motion: PlanetMotionState }) {
  const planet = useRef<THREE.Mesh>(null);
  const heatSpot = useRef<THREE.Sprite>(null);
  const heatSpotMaterial = useRef<THREE.SpriteMaterial>(null);
  const heatWave = useRef<THREE.Mesh>(null);
  const heatWaveMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const labelRef = useRef<THREE.Group>(null);
  const satelliteOrbitRef = useRef<THREE.Group>(null);
  const satelliteRef = useRef<THREE.Mesh>(null);
  const satelliteLabelRef = useRef<THREE.Group>(null);
  const satelliteAngle = useRef(data.satellite?.initialAngle ?? 0);
  const satelliteOrbitTilt = useMemo(() => new THREE.Euler(0.45, 0, 0.18), []);
  const satellitePosition = useMemo(() => new THREE.Vector3(), []);
  const localImpactDirection = useMemo(() => new THREE.Vector3(), []);
  const inversePlanetRotation = useMemo(() => new THREE.Quaternion(), []);
  const heatWaveNormal = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const lastImpactRevision = useRef(-1);
  const lastRenderedHeat = useRef(0);
  useFrame((_, delta) => {
    if (!planet.current) return;
    const effectiveSpeed = advancePlanetMotion(motion, data.orbitSpeed, delta);
    placePlanetAtAngle(data, motion.angle, planet.current.position);
    planet.current.rotation.y += delta * 0.6 * (effectiveSpeed / data.orbitSpeed);
    if (heatSpot.current && motion.impactRevision !== lastImpactRevision.current) {
      inversePlanetRotation.copy(planet.current.quaternion).invert();
      localImpactDirection.copy(motion.impactDirection).applyQuaternion(inversePlanetRotation);
      heatSpot.current.position.copy(localImpactDirection).multiplyScalar(data.size * 1.03);
      if (heatWave.current) {
        heatWave.current.position.copy(localImpactDirection).multiplyScalar(data.size * 1.04);
        heatWave.current.quaternion.setFromUnitVectors(heatWaveNormal, localImpactDirection);
      }
      lastImpactRevision.current = motion.impactRevision;
    }
    if (motion.impactHeat > 0.001 || lastRenderedHeat.current > 0.001) {
      const renderedHeat = motion.impactHeat > 0.001 ? motion.impactHeat : 0;
      if (heatSpot.current && heatSpotMaterial.current) {
        heatSpot.current.visible = renderedHeat > 0;
        heatSpot.current.scale.setScalar(data.size * (0.48 + (1 - renderedHeat) * 0.32));
        heatSpotMaterial.current.opacity = renderedHeat * 0.62;
      }
      if (heatWave.current && heatWaveMaterial.current) {
        const waveProgress = 1 - renderedHeat;
        heatWave.current.visible = renderedHeat > 0;
        heatWave.current.scale.setScalar(data.size * (0.18 + waveProgress * 1.9));
        heatWaveMaterial.current.opacity = (
          Math.sin(Math.PI * waveProgress) * 0.62 + renderedHeat * 0.18
        );
      }
      lastRenderedHeat.current = renderedHeat;
    }
    if (labelRef.current) {
      labelRef.current.position.set(planet.current.position.x, data.size + 0.8, planet.current.position.z);
    }
    if (data.satellite && satelliteOrbitRef.current && satelliteRef.current) {
      satelliteAngle.current = (satelliteAngle.current + delta * data.satellite.orbitSpeed) % (Math.PI * 2);
      satelliteOrbitRef.current.position.copy(planet.current.position);
      satellitePosition.set(
        Math.cos(satelliteAngle.current) * data.satellite.orbitRadius,
        0,
        Math.sin(satelliteAngle.current) * data.satellite.orbitRadius,
      ).applyEuler(satelliteOrbitTilt);
      satelliteRef.current.position.copy(satellitePosition);
      satelliteRef.current.rotation.y += delta * 0.9;
      satelliteLabelRef.current?.position.set(
        satellitePosition.x,
        satellitePosition.y - 0.62,
        satellitePosition.z,
      );
    }
  }, -1);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[data.orbitRadius - 0.03, data.orbitRadius + 0.03, 128]} />
      <meshBasicMaterial color={data.color} transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
    <mesh ref={planet}>
      <sphereGeometry args={[data.size, 32, 32]} />
      <meshStandardMaterial
        color={data.color}
        roughness={0.7}
        metalness={0.6}
        emissive={data.color}
        emissiveIntensity={0.1}
      />
      <sprite ref={heatSpot} visible={false}>
        <spriteMaterial
          ref={heatSpotMaterial}
          map={PLANET_HEAT_TEXTURE}
          color="#ff681c"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={heatWave} visible={false}>
        <ringGeometry args={[0.72, 1, 48]} />
        <meshBasicMaterial
          ref={heatWaveMaterial}
          color="#ff5a16"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </mesh>
    <group ref={labelRef}><Billboard><Text fontSize={data.size < 0.45 ? 0.46 : 0.6} color="white" outlineWidth={0.04} outlineColor="#000">{data.label}</Text></Billboard></group>
    {data.satellite && (
      <group ref={satelliteOrbitRef}>
        <group rotation={[0.45, 0, 0.18]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.satellite.orbitRadius - 0.012, data.satellite.orbitRadius + 0.012, 64]} />
            <meshBasicMaterial color={data.satellite.color} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh ref={satelliteRef}>
          <sphereGeometry args={[data.satellite.size, 20, 20]} />
          <meshStandardMaterial
            color={data.satellite.color}
            roughness={0.45}
            metalness={0.7}
            emissive={data.satellite.color}
            emissiveIntensity={0.18}
          />
        </mesh>
        <group ref={satelliteLabelRef}>
          <Billboard>
            <Text fontSize={0.26} color="#a5f3fc" outlineWidth={0.025} outlineColor="#000">
              {data.satellite.label}
            </Text>
          </Billboard>
        </group>
      </group>
    )}
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
  orbit: ShipOrbit;
  positionTarget: THREE.Vector3;
}

function Spaceship({ orbit, positionTarget }: SpaceshipProps) {
  const ship = useRef<THREE.Group>(null);
  const nextPosition = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    if (!ship.current) return;
    placeShipAtTime(orbit, clock.elapsedTime, positionTarget);
    ship.current.position.copy(positionTarget);
    placeShipAtTime(orbit, clock.elapsedTime + 0.1 / orbit.speed, nextPosition);
    ship.current.lookAt(nextPosition);
  });
  return <group ref={ship}><SciFiShipModel /></group>;
}

export default function HeroScene({
  labels,
  active,
}: {
  labels: readonly [string, string, string, string, string, string, string];
  active: boolean;
}) {
  const planetOffsets = useMemo(() => Array.from({ length: 6 }, () => Math.random() * Math.PI * 2), []);
  const shipPositions = useMemo(() => SHIP_ORBITS.map(() => new THREE.Vector3()), []);
  const planetMotions = useMemo<PlanetMotionState[]>(() => (
    planetOffsets.map((angle) => ({
      angle,
      speedOffset: 0,
      impactHeat: 0,
      impactDirection: new THREE.Vector3(),
      impactRevision: 0,
    }))
  ), [planetOffsets]);
  const starfieldMotion = useRef<StarfieldMotionState>(createInitialStarfieldMotion());
  const sunRotation = useRef<SunRotationState>(createInitialSunRotation());
  const systemRef = useRef<THREE.Group>(null);
  const worldImpactDirection = useMemo(() => new THREE.Vector3(), []);
  const systemWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const handleSunImpact = useCallback((impactPosition: THREE.Vector3, impactVelocity: THREE.Vector3) => {
    applySunAngularImpulse(sunRotation.current, impactPosition, impactVelocity);
    worldImpactDirection.copy(impactVelocity);
    if (systemRef.current) {
      systemRef.current.getWorldQuaternion(systemWorldQuaternion);
      worldImpactDirection.applyQuaternion(systemWorldQuaternion);
    }
    applyStarfieldImpulse(starfieldMotion.current, worldImpactDirection);
  }, [systemWorldQuaternion, worldImpactDirection]);
  const planets = useMemo<readonly PlanetVisualDefinition[]>(() => [
    {
      orbitRadius: 4.1,
      orbitSpeed: 0.38,
      size: 0.34,
      color: '#a58b72',
      label: labels[0],
      satellite: {
        orbitRadius: 1.25,
        orbitSpeed: 1.35,
        size: 0.13,
        color: '#22d3ee',
        label: labels[1],
        initialAngle: 2.2,
      },
    },
    { orbitRadius: 6, orbitSpeed: 0.30, size: 0.5, color: SCENE_PRIMARY, label: labels[2] },
    { orbitRadius: 9, orbitSpeed: 0.25, size: 0.7, color: SCENE_SECONDARY, label: labels[3] },
    { orbitRadius: 12, orbitSpeed: 0.20, size: 0.65, color: '#10b981', label: labels[4] },
    { orbitRadius: 15, orbitSpeed: 0.15, size: 0.8, color: '#3b82f6', label: labels[5] },
    { orbitRadius: 19, orbitSpeed: 0.10, size: 0.9, color: '#f97316', label: labels[6] },
  ], [labels]);
  return <div className="absolute inset-0 w-full h-[55vh] md:h-full">
    <Canvas className="w-full h-full" frameloop="demand" dpr={[1, 1.5]}>
      <SceneFrameLoop active={active} />
      <SceneCamera />
      <ambientLight intensity={0.2} />
      <ReactiveStarfield motion={starfieldMotion.current} />
      <RotatingSystem systemRef={systemRef}>
          <Sun motion={sunRotation.current} />
          {planets.map((planet, index) => (
            <Planet key={planet.label} data={planet} motion={planetMotions[index]} />
          ))}
          {SHIP_ORBITS.map((orbit, index) => (
            <Spaceship key={index} orbit={orbit} positionTarget={shipPositions[index]} />
          ))}
          <HeroSceneMeteorField
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
