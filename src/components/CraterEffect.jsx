import * as THREE from 'three';

export function createCraterOnEarth(earthMesh, localImpactPoint, craterRadius = 2, craterDepth = 1.1) {
  let geom = earthMesh.geometry;
  if (geom.index) {
    geom = geom.toNonIndexed();
    earthMesh.geometry = geom;
  }
  const positions = geom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const dist = vertex.distanceTo(localImpactPoint);
    if (dist < craterRadius) {
      const falloff = 1 - dist / craterRadius;
      const inward = vertex.clone().normalize().negate();
      vertex.add(inward.multiplyScalar(craterDepth * falloff));
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }
  positions.needsUpdate = true;
  geom.computeVertexNormals();
}
