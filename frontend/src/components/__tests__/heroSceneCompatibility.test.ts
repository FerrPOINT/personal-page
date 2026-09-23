import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyColorTheme } from '../../theme/palettes';
import { createPlanetDefinitions, SCENE_PRIMARY, SCENE_SECONDARY, SUN_BRIGHTNESS } from '../heroSceneConfig';
import { createBlasterPool, createBurstPool, createMeteorPool } from '../heroSceneMeteorPools';
import { sequenceRandomSource } from '../heroSceneRandom';
import { configureMeteorSpawn } from '../heroSceneMeteorRuntime';
import {
  BLASTER_ATTACK_RANGE, BLASTER_BEAM_DURATION, BLASTER_MUZZLE_OFFSET,
  METEOR_SURFACE_OFFSET, SHIP_ORBITS, STARFIELD_DRIFT_SPEED, STARFIELD_IMPACT_SPEED,
} from '../heroScenePhysics';

const labels = ['PDLC', 'AUTOMATION', 'REACT / TS', 'JAVA / SPRING', 'PYTHON / AI', 'KUBERNETES', 'CLOUD / AWS'] as const;

describe('hero scene compatibility contract', () => {
  it('locks physics, pool and visual constants', () => {
    expect({
      BLASTER_ATTACK_RANGE, BLASTER_BEAM_DURATION, BLASTER_MUZZLE_OFFSET, METEOR_SURFACE_OFFSET,
      STARFIELD_DRIFT_SPEED, STARFIELD_IMPACT_SPEED, SUN_BRIGHTNESS,
    }).toEqual({
      BLASTER_ATTACK_RANGE: 2, BLASTER_BEAM_DURATION: 0.32, BLASTER_MUZZLE_OFFSET: 0.16,
      METEOR_SURFACE_OFFSET: 0.22, STARFIELD_DRIFT_SPEED: 0.024,
      STARFIELD_IMPACT_SPEED: 0.06, SUN_BRIGHTNESS: 1.3,
    });
    expect(SHIP_ORBITS).toHaveLength(6);
    expect(createMeteorPool()).toHaveLength(5);
    expect(createBlasterPool()).toHaveLength(4);
    expect(createBurstPool().map(({ kind }) => kind)).toEqual([
      'collision', 'blaster', 'collision', 'blaster', 'collision', 'blaster',
    ]);
  });

  it('provides deterministic test randomness without changing call order', () => {
    const random = sequenceRandomSource([0.2, 0.4, 0.8]);
    expect([random.next(), random.next(), random.next()]).toEqual([0.2, 0.4, 0.8]);
    expect(() => random.next()).toThrow(/exhausted/);
  });

  it('locks the deterministic meteor spawn trajectory', () => {
    const meteor = createMeteorPool()[0];
    const planets = createPlanetDefinitions(labels);
    const motions = planets.map(() => ({
      angle: 0, speedOffset: 0, impactHeat: 0,
      impactDirection: new THREE.Vector3(), impactRevision: 0,
    }));
    const ships = Array.from({ length: 6 }, () => new THREE.Vector3());
    configureMeteorSpawn(
      meteor, 1, 4, ships, planets, motions, new THREE.Vector3(),
      sequenceRandomSource([0.25, 0.5, 0.75, 0.6, 0.1, 0.2, 0.3, 0.4]),
    );
    expect(meteor.position.toArray().map((value) => Number(value.toFixed(6))))
      .toEqual([0, 0.7, 26]);
    expect(meteor.velocity.toArray().map((value) => Number(value.toFixed(6))))
      .toEqual([-0.137023, -0.209341, -4.993736]);
    expect(meteor).toMatchObject({ active: true, age: 0, maxAge: 14, heat: 0, impactHeat: 0 });
  });

  it('keeps solar-system colors independent from the page theme', () => {
    const before = createPlanetDefinitions(labels);
    applyColorTheme('ember');
    const ember = createPlanetDefinitions(labels);
    applyColorTheme('neon');
    const neon = createPlanetDefinitions(labels);
    expect(ember).toEqual(before);
    expect(neon).toEqual(before);
    expect(before.map(({ color }) => color)).toEqual([
      '#a58b72', SCENE_PRIMARY, SCENE_SECONDARY, '#10b981', '#3b82f6', '#f97316',
    ]);
  });
});
