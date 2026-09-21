import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  calculateFirstContact,
  getBlasterShotLength,
  getCollisionMotionScale,
  placeBlasterBeam,
} from '../heroScenePhysics';

const expectVectorClose = (actual: THREE.Vector3, expected: THREE.Vector3) => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
};

describe('hero scene trajectories', () => {
  it('reanchors the beam at the moving ship without stretching past the shot length', () => {
    const destination = new THREE.Vector3(0.5, 0.25, -0.25);
    const movedSource = new THREE.Vector3(1.2, -0.4, 0.8);
    const shotLength = 0.75;
    const group = new THREE.Group();
    expect(placeBlasterBeam(group, movedSource, destination, shotLength, 1)).toBe(true);
    group.updateMatrixWorld(true);

    const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
    const expectedEnd = destination.clone().sub(movedSource).setLength(shotLength).add(movedSource);
    expectVectorClose(renderedStart, movedSource);
    expectVectorClose(renderedEnd, expectedEnd);
    expect(group.scale.y).toBeCloseTo(shotLength, 6);
  });

  it('never stretches a shot when the ship moves far from the impact point', () => {
    const currentSource = new THREE.Vector3(10, 0, 0);
    const impactPoint = new THREE.Vector3(0, 0, 0);
    const shotLength = 0.75;
    const group = new THREE.Group();
    expect(placeBlasterBeam(group, currentSource, impactPoint, shotLength, 1)).toBe(true);
    group.updateMatrixWorld(true);

    const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
    expectVectorClose(renderedStart, currentSource);
    expect(renderedStart.distanceTo(renderedEnd)).toBeCloseTo(shotLength, 6);
    expect(renderedEnd.x).toBeCloseTo(9.25, 6);
  });

  it('ends exactly at the impact point when it remains within the shot length', () => {
    const source = new THREE.Vector3(0, 0, 0);
    const impactPoint = new THREE.Vector3(0.3, -0.2, 0.1);
    const group = new THREE.Group();
    expect(placeBlasterBeam(group, source, impactPoint, 0.75, 1)).toBe(true);
    group.updateMatrixWorld(true);

    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
    expectVectorClose(renderedEnd, impactPoint);
  });

  it('preserves beam origin, direction, and maximum length across varied trajectories', () => {
    let seed = 0x5eed1234;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x1_0000_0000;
    };

    for (let index = 0; index < 250; index += 1) {
      const source = new THREE.Vector3(
        random() * 40 - 20,
        random() * 10 - 5,
        random() * 40 - 20,
      );
      const destination = new THREE.Vector3(
        random() * 40 - 20,
        random() * 10 - 5,
        random() * 40 - 20,
      );
      const maxLength = 0.05 + random() * 0.7;
      const group = new THREE.Group();
      expect(placeBlasterBeam(group, source, destination, maxLength, 1)).toBe(true);
      group.updateMatrixWorld(true);

      const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
      const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
      const renderedDirection = renderedEnd.clone().sub(renderedStart).normalize();
      const targetDirection = destination.clone().sub(source).normalize();
      expectVectorClose(renderedStart, source);
      expect(renderedStart.distanceTo(renderedEnd)).toBeCloseTo(
        Math.min(source.distanceTo(destination), maxLength),
        5,
      );
      expect(renderedDirection.dot(targetDirection)).toBeCloseTo(1, 5);
    }
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
    expect(placeBlasterBeam(new THREE.Group(), point, point, 0.75, 1)).toBe(false);
  });

  it('derives beam length from the actual shot and attack radius', () => {
    const source = new THREE.Vector3(0, 0, 0);
    expect(getBlasterShotLength(source, new THREE.Vector3(0.4, 0, 0))).toBeCloseTo(0.4, 6);
    expect(getBlasterShotLength(source, new THREE.Vector3(10, 0, 0))).toBeCloseTo(0.75, 6);
  });

  it('scales fragment motion with collision speed', () => {
    expect(getCollisionMotionScale(new THREE.Vector3(3.5, 0, 0))).toBe(3.5);
    expect(getCollisionMotionScale(new THREE.Vector3(5.5, 0, 0))).toBe(5.5);
    expect(getCollisionMotionScale(new THREE.Vector3())).toBe(2.5);
    expect(getCollisionMotionScale(new THREE.Vector3(20, 0, 0))).toBe(7);
  });
});
