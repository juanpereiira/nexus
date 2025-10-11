import * as THREE from 'three';

export function createCraterOnEarth(
  earthMesh,
  localImpactPoint,
  craterRadius = 2,
  craterDepth = 1.1
) {
  let geom = earthMesh.geometry;
  if (geom.index) {
    geom = geom.toNonIndexed();
    earthMesh.geometry = geom;
  }
  const positions = geom.attributes.position;
  let colors = geom.getAttribute('color');

  // If no color attribute exists, initialize with white
  if (!colors) {
    colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      colors[i * 3] = 1.0;   // R
      colors[i * 3 + 1] = 1.0; // G
      colors[i * 3 + 2] = 1.0; // B
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    colors = geom.getAttribute('color');
  }

  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const dist = vertex.distanceTo(localImpactPoint);
    if (dist < craterRadius) {
      const falloff = 1 - dist / craterRadius;
      const inward = vertex.clone().normalize().negate();
      vertex.add(inward.multiplyScalar(craterDepth * falloff));
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);

      // Mix black and dark orange based on falloff
      // Black: (0,0,0), Dark Orange: (0.8,0.3,0)
      colors.setX(i, 1.0 * falloff);
      colors.setY(i, 0.3 * falloff);
      colors.setZ(i, 0.0);
    }
  }
  positions.needsUpdate = true;
  colors.needsUpdate = true;
  geom.computeVertexNormals();

  // Update material to use vertex colors
  if (earthMesh.material) {
    earthMesh.material.vertexColors = true;
    earthMesh.material.needsUpdate = true;
  }
}