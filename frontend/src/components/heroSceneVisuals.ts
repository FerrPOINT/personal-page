import * as THREE from 'three';

export const createRadialGlowTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the hero-scene glow texture');

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.92)');
  gradient.addColorStop(0.48, 'rgba(255, 255, 255, 0.28)');
  gradient.addColorStop(0.76, 'rgba(255, 255, 255, 0.07)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
};

export const createMeteorNucleusGeometry = (): THREE.BufferGeometry => {
  const geometry = new THREE.IcosahedronGeometry(0.38, 2);
  const positions = geometry.getAttribute('position');

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const coarseNoise = Math.sin(x * 31 + y * 47 + z * 23);
    const fineNoise = Math.sin(x * 83 - y * 59 + z * 71);
    const deformation = 0.9 + coarseNoise * 0.1 + fineNoise * 0.045;
    positions.setXYZ(
      index,
      x * deformation * 1.08,
      y * deformation * 0.82,
      z * deformation * 0.96,
    );
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
};

export const createMeteorTailGeometry = (
  count: number,
  length: number,
  width: number,
  seed: number,
): THREE.BufferGeometry => {
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const progress = (index + 1) / count;
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * (0.035 + width * progress);
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = -(progress ** 0.82) * length + (random() - 0.5) * 0.16;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
};
