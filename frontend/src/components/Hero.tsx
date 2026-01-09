import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Trail, Float, Text, OrbitControls, Billboard } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import * as THREE from 'three';
import { useLanguage } from '../i18n/hooks/useLanguage';

// Augmented type definition to fix missing intrinsic elements errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      coneGeometry: any;
      ambientLight: any;
      pointLight: any;
      group: any;
      ringGeometry: any;
      meshBasicMaterial: any;
      boxGeometry: any;
      cylinderGeometry: any;
    }
  }
}

// --- Components for the Solar System ---

const Sun = () => {
  return (
    <group>
      {/* The glowing AI Core */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ff5500" 
          emissiveIntensity={3} 
          roughness={0.4}
        />
      </mesh>
      {/* Wireframe shell representing "Structure" or "Code" */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </mesh>
      <pointLight distance={100} intensity={2} color="#ffaa00" />
    </group>
  );
};

const Planet = ({ distance, speed, size, color, label }: { distance: number, speed: number, size: number, color: string, label?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  
  // Random starting angle so planets aren't aligned
  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + initialAngle;
    
    // Update Planet Position
    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(t) * distance;
      meshRef.current.position.z = Math.sin(t) * distance;
      meshRef.current.rotation.y += 0.01; // Slow self-rotation
    }

    // Update Label Position to strictly follow the planet, but Billboard handles rotation
    if (labelGroupRef.current && meshRef.current) {
      labelGroupRef.current.position.copy(meshRef.current.position);
      labelGroupRef.current.position.y += size + 0.8; // Floating above
    }
  });

  return (
    <>
      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.03, distance + 0.03, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* The Planet */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.7} 
          metalness={0.6} 
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Label wrapped in Billboard to always face camera */}
      {label && (
        <group ref={labelGroupRef}>
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text
              fontSize={0.6}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#000000"
              fillOpacity={0.9}
            >
              {label}
            </Text>
          </Billboard>
        </group>
      )}
    </>
  );
};

const SciFiShipModel = () => {
  return (
    <group rotation={[0, Math.PI, 0]} scale={[0.4, 0.4, 0.4]}>
      {/* Main Hull */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[0.3, 0.15, 1.2]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Cockpit / Data Core */}
      <mesh position={[0, 0.1, 0.4]}>
         <boxGeometry args={[0.2, 0.1, 0.4]} />
         <meshStandardMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Wings */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.6]} />
        <meshStandardMaterial color="#888888" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Vertical Stabilizers */}
      <mesh position={[0.6, 0.2, -0.2]} rotation={[0, 0, Math.PI / 6]}>
         <boxGeometry args={[0.05, 0.4, 0.4]} />
         <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.6, 0.2, -0.2]} rotation={[0, 0, -Math.PI / 6]}>
         <boxGeometry args={[0.05, 0.4, 0.4]} />
         <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.2} />
      </mesh>

      {/* Engine Glow */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.05, 0.1, 16]} />
        <meshBasicMaterial color="#00d9ff" />
      </mesh>
    </group>
  );
};

const Spaceship = ({ radiusX, radiusZ, speed, offset, yOffset }: { radiusX: number, radiusZ: number, speed: number, offset: number, yOffset: number }) => {
  const shipRef = useRef<any>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (shipRef.current) {
      // Elliptical Orbit (Transfer orbit simulation)
      const x = Math.cos(t) * radiusX;
      const z = Math.sin(t) * radiusZ;
      const y = Math.sin(t * 2) * yOffset; // Slight up/down wave

      // Calculate lookAt target (tangent)
      const nextX = Math.cos(t + 0.1) * radiusX;
      const nextZ = Math.sin(t + 0.1) * radiusZ;
      const nextY = Math.sin((t + 0.1) * 2) * yOffset;

      shipRef.current.position.set(x, y, z);
      shipRef.current.lookAt(nextX, nextY, nextZ);
    }
  });

  return (
    <group ref={shipRef}>
      <Trail width={1.5} length={6} color="#00d9ff" attenuation={(t) => t * t}>
         <SciFiShipModel />
      </Trail>
    </group>
  );
};

const SolarSystemScene = () => {
  return (
    <group rotation={[0.2, 0, 0]} position={[2, 0, 0]}> 
      <Sun />
      
      {/* Planets - Distances optimized to avoid overlap */}
      
      {/* 1. React - Close orbit */}
      <Planet distance={6} speed={0.3} size={0.5} color="#00d9ff" label={t('hero.planets.reactTS')} />
      
      {/* 2. Java - Mid orbit */}
      <Planet distance={9} speed={0.25} size={0.7} color="#ff00ff" label={t('hero.planets.javaSpring')} />
      
      {/* 3. NEW: Python / AI - The "Green" Intelligence layer */}
      <Planet distance={12} speed={0.2} size={0.65} color="#10b981" label={t('hero.planets.pythonAI')} />
      
      {/* 4. Kubernetes - Infrastructure layer */}
      <Planet distance={15} speed={0.15} size={0.8} color="#3b82f6" label={t('hero.planets.kubernetes')} />

      {/* 5. NEW: Cloud - Outer layer */}
      <Planet distance={19} speed={0.1} size={0.9} color="#f97316" label={t('hero.planets.cloudAWS')} />


      {/* Spaceships / Data Packets - More complex paths */}
      
      {/* Fast inner couriers */}
      <Spaceship radiusX={6} radiusZ={6} speed={0.6} offset={0} yOffset={0.5} />
      <Spaceship radiusX={7} radiusZ={5} speed={0.5} offset={2} yOffset={-0.5} />
      
      {/* Mid-range transports */}
      <Spaceship radiusX={10} radiusZ={11} speed={0.3} offset={1} yOffset={-1.5} />
      <Spaceship radiusX={12} radiusZ={9} speed={0.25} offset={4} yOffset={1} />
      
      {/* Long-range heavy haulers */}
      <Spaceship radiusX={16} radiusZ={16} speed={0.15} offset={5} yOffset={0} />
      <Spaceship radiusX={18} radiusZ={14} speed={0.12} offset={3} yOffset={2} />
    </group>
  );
};


const Hero: React.FC = () => {
  const { t } = useLanguage();
  
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative w-full min-h-screen bg-background overflow-hidden selection:bg-accent-cyan/30">
      
      {/* 3D Background Layer - Full Viewport, Absolute Positioning */}
      <div className="absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
         {/* 
            Desktop: Canvas anchored to right, occupying 75% width.
            Mobile: Canvas anchored to top, occupying 50% height.
         */}
         <div className="absolute top-0 right-0 w-full h-[55vh] md:h-full md:w-[75vw]">
            <Canvas className="w-full h-full">
              {/* Pulled camera back to Z:28 to see the new outer planets */}
              <PerspectiveCamera makeDefault position={[0, 8, 28]} fov={40} />
              <ambientLight intensity={0.2} />
              <pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" />
              
              <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={0.3} />
              
              <Suspense fallback={null}>
                <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                    <SolarSystemScene />
                </Float>
              </Suspense>
              
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.4} 
                maxPolarAngle={Math.PI / 1.8} 
                minPolarAngle={Math.PI / 3}
              />
            </Canvas>
            
            {/* Desktop Gradient Mask: Seamlessly blends canvas into the left text area */}
            <div className="absolute inset-y-0 left-0 w-24 md:w-[40%] bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none" />
            
            {/* Mobile Gradient Mask: Blends bottom of canvas into text area */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent md:hidden pointer-events-none" />
         </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex flex-col justify-center pointer-events-none">
        {/* Container for Text - Pointer events enabled so buttons work */}
        <div className="w-full md:w-1/2 pt-[45vh] md:pt-0 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-accent-cyan text-sm font-mono mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(0,217,255,0.1)]">
              {t('hero.badge')}
            </span>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
              {t('hero.name')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-magenta filter drop-shadow-[0_0_10px_rgba(255,0,255,0.3)]">
                {t('hero.surname')}
              </span>
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-secondary mb-8 leading-relaxed max-w-lg"
              dangerouslySetInnerHTML={{
                __html: t('hero.description', {
                  years: t('hero.years'),
                  java: t('hero.java'),
                  highload: t('hero.highload'),
                  ai: t('hero.ai')
                }).replace(/\{years\}/g, `<span class="text-white font-semibold">${t('hero.years')}</span>`)
                  .replace(/\{java\}/g, `<span class="text-white font-semibold">${t('hero.java')}</span>`)
                  .replace(/\{highload\}/g, `<span class="text-white font-semibold">${t('hero.highload')}</span>`)
                  .replace(/\{ai\}/g, `<span class="text-white font-semibold">${t('hero.ai')}</span>`)
              }}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#projects"
                onClick={(e) => scrollToSection(e, 'projects')}
                className="group flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                {t('hero.viewProjects')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="group flex items-center justify-center px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all cursor-pointer backdrop-blur-sm"
              >
                {t('hero.contactMe')}
                <Mail className="ml-2 w-5 h-5 group-hover:text-accent-cyan transition-colors" />
              </a>
            </div>

            {/* Stats Row */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-12 grid grid-cols-3 gap-8 border-t border-white/10 pt-8"
              >
                <div>
                  <p className="text-3xl font-bold text-white">10+</p>
                  <p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.yearsExp')}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">1M+</p>
                  <p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.rpsScaled')}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">Full</p>
                  <p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.fullStackCycle')}</p>
                </div>
              </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;