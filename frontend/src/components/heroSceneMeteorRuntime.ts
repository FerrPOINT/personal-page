import * as THREE from 'three';
import { placePlanetAtAngle, placeShipAtTime, SHIP_ORBITS, type PlanetDefinition, type PlanetMotionState } from './heroScenePhysics';
import type { MeteorState } from './heroSceneMeteorPools';
import type { RandomSource } from './heroSceneRandom';

export function configureMeteorSpawn(
  meteor: MeteorState,
  sequence: number,
  elapsed: number,
  ships: readonly THREE.Vector3[],
  planets: readonly PlanetDefinition[],
  planetMotions: readonly PlanetMotionState[],
  target: THREE.Vector3,
  random: RandomSource,
): void {
  const threatenedShipIndex = sequence % 2 === 0
    ? (Math.floor(sequence / 2) + 4) % ships.length
    : -1;
  const threatenedShip = threatenedShipIndex >= 0 ? ships[threatenedShipIndex] : null;
  const angle = threatenedShip
    ? Math.atan2(threatenedShip.z, threatenedShip.x) + (random.next() - 0.5) * 0.35
    : random.next() * Math.PI * 2;
  const radius = threatenedShip ? 25 + random.next() * 3 : 23 + random.next() * 6;
  const speed = 3.5 + random.next() * 2;
  meteor.position.set(
    Math.cos(angle) * radius,
    threatenedShip ? threatenedShip.y + (random.next() - 0.5) * 1.5 : (random.next() - 0.5) * 7,
    Math.sin(angle) * radius,
  );

  const aim = random.next();
  if (threatenedShip) {
    const orbit = SHIP_ORBITS[threatenedShipIndex];
    placeShipAtTime(orbit, elapsed, target);
    let travelEstimate = meteor.position.distanceTo(target) / speed;
    placeShipAtTime(orbit, elapsed + travelEstimate, target);
    travelEstimate = meteor.position.distanceTo(target) / speed;
    placeShipAtTime(orbit, elapsed + travelEstimate, target);
    target.x += (random.next() - 0.5) * 0.3;
    target.y += (random.next() - 0.5) * 0.2;
    target.z += (random.next() - 0.5) * 0.3;
  } else if (aim < 0.18) {
    target.set(
      (random.next() - 0.5) * 2.4,
      (random.next() - 0.5) * 2,
      (random.next() - 0.5) * 2.4,
    );
    if (target.lengthSq() > 1.4 ** 2) target.normalize().multiplyScalar(1.4);
  } else if (aim < 0.48) {
    const planetIndex = Math.floor(random.next() * planets.length);
    const planet = planets[planetIndex];
    const motion = planetMotions[planetIndex];
    const effectiveSpeed = planet.orbitSpeed + motion.speedOffset;
    placePlanetAtAngle(planet, motion.angle, target);
    let travelEstimate = meteor.position.distanceTo(target) / speed;
    placePlanetAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
    travelEstimate = meteor.position.distanceTo(target) / speed;
    placePlanetAtAngle(planet, motion.angle + effectiveSpeed * travelEstimate, target);
  } else if (aim < 0.78) {
    const ship = ships[Math.floor(random.next() * ships.length)];
    target.copy(ship);
    target.x += (random.next() - 0.5) * 2;
    target.y += (random.next() - 0.5) * 1.2;
    target.z += (random.next() - 0.5) * 2;
  } else {
    const targetRadius = Math.sqrt(random.next()) * 15;
    const targetAngle = random.next() * Math.PI * 2;
    target.set(
      Math.cos(targetAngle) * targetRadius,
      (random.next() - 0.5) * 5,
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
}
