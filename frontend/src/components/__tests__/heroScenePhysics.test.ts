import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  calculateFirstContact,
  placeBlasterBeam,
} from '../heroScenePhysics';

const expectVectorClose = (actual: THREE.Vector3, expected: THREE.Vector3) => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
};

describe('hero scene trajectories', () => {
  it('keeps the beam between the moving ship and the actual impact point', () => {
    const destination = new THREE.Vector3(0.5, 0.25, -0.25);
    const movedSource = new THREE.Vector3(1.2, -0.4, 0.8);
    const group = new THREE.Group();
    expect(placeBlasterBeam(group, movedSource, destination, 1)).toBe(true);
    group.updateMatrixWorld(true);

    const renderedStart = new THREE.Vector3(0, -0.5, 0).applyMatrix4(group.matrixWorld);
    const renderedEnd = new THREE.Vector3(0, 0.5, 0).applyMatrix4(group.matrixWorld);
    expectVectorClose(renderedStart, movedSource);
    expectVectorClose(renderedEnd, destination);
    expect(group.scale.y).toBeCloseTo(movedSource.distanceTo(destination), 6);
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
    expect(placeBlasterBeam(new THREE.Group(), point, point, 1)).toBe(false);
  });
});
