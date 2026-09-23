import type { PlanetDefinition } from './heroScenePhysics';

export const SCENE_PRIMARY = '#00d9ff';
export const SCENE_SECONDARY = '#ff00ff';
export const SUN_BRIGHTNESS = 1.3;
export const MAX_SCENE_FPS = 60;

export interface PlanetSatelliteDefinition {
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
  label: string;
  initialAngle: number;
}

export interface PlanetVisualDefinition extends PlanetDefinition {
  satellite?: PlanetSatelliteDefinition;
}

export function createPlanetDefinitions(
  labels: readonly [string, string, string, string, string, string, string],
): readonly PlanetVisualDefinition[] {
  return [
    {
      orbitRadius: 4.1, orbitSpeed: 0.38, size: 0.34, color: '#a58b72', label: labels[0],
      satellite: {
        orbitRadius: 1.25, orbitSpeed: 1.35, size: 0.13, color: '#22d3ee',
        label: labels[1], initialAngle: 2.2,
      },
    },
    { orbitRadius: 6, orbitSpeed: 0.30, size: 0.5, color: SCENE_PRIMARY, label: labels[2] },
    { orbitRadius: 9, orbitSpeed: 0.25, size: 0.7, color: SCENE_SECONDARY, label: labels[3] },
    { orbitRadius: 12, orbitSpeed: 0.20, size: 0.65, color: '#10b981', label: labels[4] },
    { orbitRadius: 15, orbitSpeed: 0.15, size: 0.8, color: '#3b82f6', label: labels[5] },
    { orbitRadius: 19, orbitSpeed: 0.10, size: 0.9, color: '#f97316', label: labels[6] },
  ];
}
