import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  BLASTER_ATTACK_RANGE,
  BLASTER_MUZZLE_OFFSET,
  calculateBlasterSegment,
  calculateFirstContact,
  calculatePlanetOrbitImpulse,
  calculateStarfieldImpulse,
  getCollisionMotionScale,
  METEOR_SURFACE_OFFSET,
  placeBlasterBeam,
  STARFIELD_DRIFT_SPEED,
  STARFIELD_IMPACT_SPEED,
} from '../heroScenePhysics';

const expectVectorClose = (actual: THREE.Vector3, expected: THREE.Vector3) => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
};

describe('hero scene trajectories', () => {
  it('builds the visible shot from the satellite surface to the meteor surface', () => {
    const sourceCenter = new THREE.Vector3(-0.4, 0.25, 0.6);
    const targetCenter = new THREE.Vector3(0.2, -0.1, -0.5);
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();

    expect(calculateBlasterSegment(sourceCenter, targetCenter, start, end)).toBe(true);

    const direction = targetCenter.clone().sub(sourceCenter).normalize();
    expectVectorClose(start, sourceCenter.clone().addScaledVector(direction, BLASTER_MUZZLE_OFFSET));
    expectVectorClose(end, targetCenter.clone().addScaledVector(direction, -METEOR_SURFACE_OFFSET));
    expect(start.distanceTo(end)).toBeCloseTo(
      sourceCenter.distanceTo(targetCenter) - BLASTER_MUZZLE_OFFSET - METEOR_SURFACE_OFFSET,
      6,
    );
  });

  it('renders the immutable 3D shot at its exact calculated endpoints', () => {
    const start = new THREE.Vector3(1.2, -0.4, 0.8);
    const end = new THREE.Vector3(0.5, 0.25, -0.25);
    const group = new THREE.Group();
    expect(placeBlasterBeam(group, start, end, 1)).toBe(true);
    group.updateMatrixWorld(true);

    const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
    expectVectorClose(renderedStart, start);
    expectVectorClose(renderedEnd, end);
    expect(group.scale.y).toBeCloseTo(start.distanceTo(end), 6);
  });

  it('preserves surface offsets, direction, and exact length across varied 3D trajectories', () => {
    let seed = 0x5eed1234;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x1_0000_0000;
    };

    for (let index = 0; index < 250; index += 1) {
      const sourceCenter = new THREE.Vector3(
        random() * 40 - 20,
        random() * 10 - 5,
        random() * 40 - 20,
      );
      const direction = new THREE.Vector3(
        random() * 2 - 1,
        random() * 2 - 1,
        random() * 2 - 1,
      ).normalize();
      const centerDistance = 0.5 + random() * 20;
      const targetCenter = sourceCenter.clone().addScaledVector(direction, centerDistance);
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      expect(calculateBlasterSegment(sourceCenter, targetCenter, start, end)).toBe(true);

      const group = new THREE.Group();
      expect(placeBlasterBeam(group, start, end, 1)).toBe(true);
      group.updateMatrixWorld(true);

      const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
      const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
      const renderedDirection = renderedEnd.clone().sub(renderedStart).normalize();
      expectVectorClose(renderedStart, start);
      expectVectorClose(renderedEnd, end);
      expect(sourceCenter.distanceTo(start)).toBeCloseTo(BLASTER_MUZZLE_OFFSET, 5);
      expect(targetCenter.distanceTo(end)).toBeCloseTo(METEOR_SURFACE_OFFSET, 5);
      expect(renderedStart.distanceTo(renderedEnd)).toBeCloseTo(
        centerDistance - BLASTER_MUZZLE_OFFSET - METEOR_SURFACE_OFFSET,
        5,
      );
      expect(renderedDirection.dot(direction)).toBeCloseTo(1, 5);
    }
  });

  it('keeps beam endpoints aligned when the whole solar system is rotated', () => {
    const parent = new THREE.Group();
    parent.position.set(-2, 1.5, 0.75);
    parent.rotation.set(0.2, -0.4, 0.15);
    const beam = new THREE.Group();
    parent.add(beam);
    const start = new THREE.Vector3(-0.2, 0.3, 0.8);
    const end = new THREE.Vector3(0.4, -0.1, -0.7);
    expect(placeBlasterBeam(beam, start, end, 1)).toBe(true);
    parent.updateMatrixWorld(true);

    const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(beam.matrixWorld);
    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(beam.matrixWorld);
    expectVectorClose(renderedStart, start.clone().applyMatrix4(parent.matrixWorld));
    expectVectorClose(renderedEnd, end.clone().applyMatrix4(parent.matrixWorld));
  });

  it('detects a meteor crossing the interception radius between rendered frames', () => {
    const meteorStart = new THREE.Vector3(-1, 0, 0);
    const meteorEnd = new THREE.Vector3(1, 0, 0);
    const ship = new THREE.Vector3(0, 0.2, 0);
    const contactRadius = 0.75;
    const contactTime = calculateFirstContact(meteorStart, meteorEnd, ship, ship, contactRadius);

    expect(contactTime).not.toBeNull();
    const contactPosition = new THREE.Vector3().lerpVectors(meteorStart, meteorEnd, contactTime!);
    expect(contactPosition.distanceTo(ship)).toBeCloseTo(contactRadius, 6);
  });

  it('accounts for both the ship and meteor moving during the frame', () => {
    const meteorStart = new THREE.Vector3(-1, 0, 0);
    const meteorEnd = new THREE.Vector3(1, 0, 0);
    const shipStart = new THREE.Vector3(0, -1, 0);
    const shipEnd = new THREE.Vector3(0, 1, 0);
    const contactRadius = 0.25;
    const contactTime = calculateFirstContact(meteorStart, meteorEnd, shipStart, shipEnd, contactRadius);

    expect(contactTime).not.toBeNull();
    const meteorAtContact = new THREE.Vector3().lerpVectors(meteorStart, meteorEnd, contactTime!);
    const shipAtContact = new THREE.Vector3().lerpVectors(shipStart, shipEnd, contactTime!);
    expect(meteorAtContact.distanceTo(shipAtContact)).toBeCloseTo(contactRadius, 6);
  });

  it('calculates the shot from both moving bodies at the same 3D contact time', () => {
    const meteorStart = new THREE.Vector3(-1.4, 0.6, 0.9);
    const meteorEnd = new THREE.Vector3(0.7, -0.3, -0.8);
    const shipStart = new THREE.Vector3(0.2, -0.8, -0.2);
    const shipEnd = new THREE.Vector3(-0.1, 0.5, 0.4);
    const contactTime = calculateFirstContact(
      meteorStart,
      meteorEnd,
      shipStart,
      shipEnd,
      BLASTER_ATTACK_RANGE,
    );
    expect(contactTime).not.toBeNull();

    const meteorAtContact = new THREE.Vector3().lerpVectors(meteorStart, meteorEnd, contactTime!);
    const shipAtContact = new THREE.Vector3().lerpVectors(shipStart, shipEnd, contactTime!);
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    expect(calculateBlasterSegment(shipAtContact, meteorAtContact, start, end)).toBe(true);

    const shotDirection = end.clone().sub(start).normalize();
    const contactDirection = meteorAtContact.clone().sub(shipAtContact).normalize();
    expect(shipAtContact.distanceTo(meteorAtContact)).toBeCloseTo(BLASTER_ATTACK_RANGE, 6);
    expect(shotDirection.dot(contactDirection)).toBeCloseTo(1, 6);
    expect(start.distanceTo(end)).toBeCloseTo(
      BLASTER_ATTACK_RANGE - BLASTER_MUZZLE_OFFSET - METEOR_SURFACE_OFFSET,
      6,
    );
    expect(start.distanceTo(end)).toBeGreaterThan(1);
  });

  it('rejects trajectories that never enter the collision radius', () => {
    expect(calculateFirstContact(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(0, 2, 0),
      0.75,
    )).toBeNull();
  });

  it('does not create a ray without a valid firing direction', () => {
    const point = new THREE.Vector3(1, 2, 3);
    expect(placeBlasterBeam(new THREE.Group(), point, point, 1)).toBe(false);
  });

  it('rejects a surface segment when the object centers overlap or are too close', () => {
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    expect(calculateBlasterSegment(
      new THREE.Vector3(1, 2, 3),
      new THREE.Vector3(1, 2, 3),
      start,
      end,
    )).toBe(false);
    expect(calculateBlasterSegment(
      new THREE.Vector3(),
      new THREE.Vector3(BLASTER_MUZZLE_OFFSET + METEOR_SURFACE_OFFSET, 0, 0),
      start,
      end,
    )).toBe(false);
  });

  it('scales fragment motion with collision speed', () => {
    expect(getCollisionMotionScale(new THREE.Vector3(3.5, 0, 0))).toBe(3.5);
    expect(getCollisionMotionScale(new THREE.Vector3(5.5, 0, 0))).toBe(5.5);
    expect(getCollisionMotionScale(new THREE.Vector3())).toBe(2.5);
    expect(getCollisionMotionScale(new THREE.Vector3(20, 0, 0))).toBe(7);
  });

  it('accelerates or slows a planet according to the tangential side of impact', () => {
    const planet = new THREE.Vector3(10, 0, 0);
    const baseSpeed = 0.2;

    expect(calculatePlanetOrbitImpulse(planet, new THREE.Vector3(0, 0, 5), baseSpeed)).toBeCloseTo(0.13, 6);
    expect(calculatePlanetOrbitImpulse(planet, new THREE.Vector3(0, 0, -5), baseSpeed)).toBeCloseTo(-0.13, 6);
    expect(calculatePlanetOrbitImpulse(planet, new THREE.Vector3(-5, 0, 0), baseSpeed)).toBeCloseTo(0, 6);
  });

  it('maps a star impact to a faster background drift in the same direction', () => {
    const impulse = calculateStarfieldImpulse(new THREE.Vector3(4, -2, 3));

    expect(impulse.yaw).toBeGreaterThan(0);
    expect(impulse.pitch).toBeGreaterThan(0);
    expect(impulse.roll).toBeLessThan(0);
    expect(Math.hypot(impulse.yaw, impulse.pitch, impulse.roll)).toBeCloseTo(STARFIELD_IMPACT_SPEED, 8);
    expect(STARFIELD_IMPACT_SPEED).toBeGreaterThan(STARFIELD_DRIFT_SPEED);
  });
});
