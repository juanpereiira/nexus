import * as THREE from 'three';

export function createAsteroid(radius) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const positionAttribute = geometry.getAttribute('position');

  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
    const bumpiness = 0.4;
    vertex.add(new THREE.Vector3(
      (Math.random() - 0.5) * bumpiness,
      (Math.random() - 0.5) * bumpiness,
      (Math.random() - 0.5) * bumpiness
    ));
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

export function randomPointOnSphere(radius) {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}
