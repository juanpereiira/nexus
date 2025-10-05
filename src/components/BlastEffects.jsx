import * as THREE from 'three';

export function createBlastCircles(localPos, earth) {
  const colors = [0xff0000, 0xffa500, 0xffff00, 0xffffff];
  const maxRadius = 8;
  const duration = 4000;
  const earthRadius = 32;

  const normal = localPos.clone().normalize();

  const circles = colors.map((color, i) => {
    const geometry = new THREE.CircleGeometry(0.5, 64);
    const positions = geometry.attributes.position;
    for (let vi = 0; vi < positions.count; vi++) {
      const x = positions.getX(vi), y = positions.getY(vi), z = 0;
      const dir = new THREE.Vector3(x, y, z).normalize();
      const scaled = dir.multiplyScalar(earthRadius);
      positions.setXYZ(vi, scaled.x, scaled.y, scaled.z);
    }
    positions.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8 - i * 0.15,
      depthWrite: false,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(localPos);
    circle.lookAt(normal);
    earth.add(circle);
    return { mesh: circle, material };
  });

  const startTime = performance.now();
  function animateCircles(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    circles.forEach(({ mesh, material }, i) => {
      const baseRadius = (maxRadius / colors.length) * (i + 1);
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.5, baseRadius * 2, t));
      material.opacity = THREE.MathUtils.lerp(0.8 - i * 0.15, 0, t);
    });
    if (t < 1) requestAnimationFrame(animateCircles);
    else {
      circles.forEach(({ mesh, material }) => {
        earth.remove(mesh);
        mesh.geometry.dispose();
        material.dispose();
      });
    }
  }
  requestAnimationFrame(animateCircles);
}

export function createBlastGlow(localPos, earth) {
  const geom = new THREE.SphereGeometry(1.25, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.45 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(localPos);
  earth.add(mesh);
  setTimeout(() => {
    earth.remove(mesh);
    geom.dispose();
    mat.dispose();
  }, 1600);
}
