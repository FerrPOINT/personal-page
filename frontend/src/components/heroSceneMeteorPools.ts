import * as THREE from 'three';
import { BLASTER_BEAM_DURATION } from './heroScenePhysics';

export type BurstKind = 'collision' | 'blaster';
export type CollisionTarget = 'none' | 'sun' | 'planet';

export interface MeteorState {
  active: boolean; position: THREE.Vector3; collisionPosition: THREE.Vector3;
  velocity: THREE.Vector3; age: number; maxAge: number; heat: number; impactHeat: number;
}
export interface BlasterState {
  active: boolean; age: number; duration: number; start: THREE.Vector3; end: THREE.Vector3;
}
export interface BurstState {
  active: boolean; kind: BurstKind; age: number; duration: number; position: THREE.Vector3;
  fragmentPositions: THREE.Vector3[]; fragmentRotations: THREE.Vector3[];
  velocities: THREE.Vector3[]; angularVelocities: THREE.Vector3[]; scales: number[]; visualScale: number;
}

export const METEOR_COUNT = 5;
export const BLASTER_COUNT = 4;
export const BURST_COUNT = 6;
export const BURST_FRAGMENT_COUNT = 26;

export const createMeteorPool = (): MeteorState[] => Array.from({ length: METEOR_COUNT }, () => ({
  active: false, position: new THREE.Vector3(), collisionPosition: new THREE.Vector3(),
  velocity: new THREE.Vector3(), age: 0, maxAge: 0, heat: 0, impactHeat: 0,
}));
export const createBlasterPool = (): BlasterState[] => Array.from({ length: BLASTER_COUNT }, () => ({
  active: false, age: 0, duration: BLASTER_BEAM_DURATION,
  start: new THREE.Vector3(), end: new THREE.Vector3(),
}));
export const createBurstPool = (): BurstState[] => Array.from({ length: BURST_COUNT }, (_, index) => ({
  active: false, kind: index % 2 === 0 ? 'collision' : 'blaster', age: 0, duration: 2.2,
  position: new THREE.Vector3(),
  fragmentPositions: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
  fragmentRotations: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
  velocities: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
  angularVelocities: Array.from({ length: BURST_FRAGMENT_COUNT }, () => new THREE.Vector3()),
  scales: Array.from({ length: BURST_FRAGMENT_COUNT }, () => 1), visualScale: 1,
}));
