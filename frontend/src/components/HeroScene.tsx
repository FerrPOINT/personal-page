import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

type PlanetData = readonly [distance: number, speed: number, size: number, color: string, label: string];

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
  const [distance, speed, size, color, label] = data;
  const planet = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
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

export default function HeroScene({ labels }: { labels: readonly [string, string, string, string, string] }) {
  const planets: readonly PlanetData[] = [
    [6, 0.30, 0.5, SCENE_PRIMARY, labels[0]],
    [9, 0.25, 0.7, SCENE_SECONDARY, labels[1]],
    [12, 0.20, 0.65, '#10b981', labels[2]],
    [15, 0.15, 0.8, '#3b82f6', labels[3]],
    [19, 0.10, 0.9, '#f97316', labels[4]],
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
