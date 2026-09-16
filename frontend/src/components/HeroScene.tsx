import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Float, OrbitControls, PerspectiveCamera, Stars, Text, Trail } from '@react-three/drei';
import * as THREE from 'three';

type PlanetData = readonly [distance: number, speed: number, size: number, color: string, label: string];

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
      <sphereGeometry args={[size, 48, 48]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.6} emissive={color} emissiveIntensity={0.1} />
    </mesh>
    <group ref={labelRef}><Billboard><Text fontSize={0.6} color="white" outlineWidth={0.04} outlineColor="#000">{label}</Text></Billboard></group>
  </>;
}

function Ship({ radius, speed, offset }: { radius: number; speed: number; offset: number }) {
  const ship = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed + offset;
    ship.current?.position.set(Math.cos(angle) * radius, Math.sin(angle * 2), Math.sin(angle) * radius);
    ship.current?.lookAt(Math.cos(angle + .1) * radius, 0, Math.sin(angle + .1) * radius);
  });
  return <group ref={ship}><Trail width={1.5} length={6} color="#00d9ff" attenuation={(t) => t * t}>
    <mesh><boxGeometry args={[0.7, 0.15, 1.2]} /><meshStandardMaterial color="#ddd" metalness={0.8} /></mesh>
  </Trail></group>;
}

export default function HeroScene({ labels }: { labels: readonly [string, string, string, string, string] }) {
  const planets: readonly PlanetData[] = [
    [6, 0.30, 0.5, '#00d9ff', labels[0]],
    [9, 0.25, 0.7, '#ff00ff', labels[1]],
    [12, 0.20, 0.65, '#10b981', labels[2]],
    [15, 0.15, 0.8, '#3b82f6', labels[3]],
    [19, 0.10, 0.9, '#f97316', labels[4]],
  ];
  return <div className="absolute top-0 right-0 w-full h-[55vh] md:h-full md:w-[75vw]">
    <Canvas className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 8, 28]} fov={40} />
      <ambientLight intensity={0.2} /><pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" />
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <group rotation={[0.2, 0, 0]} position={[2, 0, 0]}>
          <mesh><sphereGeometry args={[2, 32, 32]} /><meshStandardMaterial color="#ffaa00" emissive="#ff5500" emissiveIntensity={3} /></mesh>
          {planets.map((planet) => <Planet key={planet[4]} data={planet} />)}
          <Ship radius={7} speed={0.5} offset={2} /><Ship radius={12} speed={0.25} offset={4} /><Ship radius={18} speed={0.12} offset={3} />
        </group>
      </Float>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
    <div className="absolute inset-y-0 left-0 w-24 md:w-[40%] bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none" />
    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent md:hidden pointer-events-none" />
  </div>;
}
