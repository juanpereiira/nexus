import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function WaterHumpsTsunami({ earth, localPosition, earthTextureURL, earthRadius = 32 }) {
  const [isWater, setIsWater] = useState(null);
  const humpsRef = useRef([]);
  const animationFrameIdRef = useRef(null);
  const canvasRef = useRef(null);

  function positionToUV(position) {
    const p = position.clone().normalize();
    const u = 0.5 + Math.atan2(p.z, p.x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(p.y) / Math.PI;
    return { u, v };
  }

  function createHump() {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3399ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    });
    const hump = new THREE.Mesh(geometry, material);
    hump.castShadow = false;
    hump.receiveShadow = false;
    return hump;
  }

  useEffect(() => {
    if (!earth || !localPosition || !earthTextureURL) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = earthTextureURL;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvasRef.current = canvas;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const uv = positionToUV(localPosition);
      const x = Math.floor(uv.u * (canvas.width - 1));
      const y = Math.floor(uv.v * (canvas.height - 1));
      const pixel = ctx.getImageData(x, y, 1, 1).data;

      if (pixel[2] > pixel[0] + 10 && pixel[2] > pixel[1] + 10) {
          console.log("--- 3. Tsunami Check: WATER DETECTED ---"); // <-- ADD THIS
          setIsWater(true);
      } else {
          console.log("--- 3. Tsunami Check: LAND DETECTED ---"); // <-- ADD THIS
        setIsWater(false);
      }
    };

    return () => {
      humpsRef.current.forEach(hump => earth.remove(hump));
      humpsRef.current = [];
      setIsWater(null);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [earth, localPosition, earthTextureURL]);

  useEffect(() => {
    if (!isWater) return;

    const humps = [];
    const numHumpsPerRing = 12;
    const numRings = 4;
    const maxRadius = 10;
    const waveHeight = 1.5;

    const earthNormal = localPosition.clone().normalize();

    for (let ring = 1; ring <= numRings; ring++) {
      const ringRadius = (maxRadius / numRings) * ring;

      const up = earthNormal;
      let tangent = new THREE.Vector3(0, 1, 0);
      if (up.dot(tangent) > 0.99) tangent.set(1, 0, 0);
      const bitangent = new THREE.Vector3().crossVectors(up, tangent).normalize();
      tangent = new THREE.Vector3().crossVectors(bitangent, up).normalize();

      for (let i = 0; i < numHumpsPerRing; i++) {
        const angle = (i / numHumpsPerRing) * 2 * Math.PI;
        const dir = tangent.clone().multiplyScalar(Math.cos(angle))
          .add(bitangent.clone().multiplyScalar(Math.sin(angle)))
          .normalize();

        const posOnSurface = earthNormal.clone().multiplyScalar(earthRadius);
        const humpPos = posOnSurface.clone().add(dir.clone().multiplyScalar(ringRadius));
        const humpPosOnSphere = humpPos.clone().normalize().multiplyScalar(earthRadius);

        const hump = createHump();
        hump.position.copy(humpPosOnSphere);
        earth.add(hump);
        humps.push({ mesh: hump, basePos: humpPosOnSphere.clone(), angleOffset: i * 0.5 + ring * 0.5 });
      }
    }

    humpsRef.current = humps;

    const start = performance.now();

    function animate(time) {
      const elapsed = (time - start) / 1000;

      humps.forEach(({ mesh, basePos, angleOffset }) => {
        const verticalOffset = Math.sin(elapsed * 3 + angleOffset) * waveHeight;
        const outwardDistance = THREE.MathUtils.clamp(elapsed * 2, 0, 10);
        const moveVec = mesh.position.clone().sub(earth.position).normalize().multiplyScalar(outwardDistance);

        mesh.position.copy(basePos).add(moveVec);
        mesh.position.add(mesh.position.clone().normalize().multiplyScalar(verticalOffset));
        mesh.material.opacity = THREE.MathUtils.clamp(0.7 - elapsed * 0.15, 0, 0.7);
      });

      if (elapsed < 7) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        humps.forEach(({ mesh }) => {
          earth.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
        humpsRef.current = [];
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      humps.forEach(({ mesh }) => {
        earth.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      humpsRef.current = [];
    };
  }, [isWater, earth, localPosition, earthRadius]);

  return null;
}

export default WaterHumpsTsunami;
