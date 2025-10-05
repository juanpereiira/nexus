import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function WaterHumpsTsunami({ earth, localPosition, earthTextureURL, earthRadius = 15 }) {
  // Instead of a boolean, we'll store a number (0 to 1) for the tsunami's strength
  const [tsunamiStrength, setTsunamiStrength] = useState(0); 
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!earth || !localPosition || !earthTextureURL) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = earthTextureURL;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // --- NEW: Check 5 points instead of 1 ---
      const pointsToCheck = [
        localPosition.clone(), // Center
        localPosition.clone().add(new THREE.Vector3(1, 0, 0)), // East-ish
        localPosition.clone().add(new THREE.Vector3(-1, 0, 0)),// West-ish
        localPosition.clone().add(new THREE.Vector3(0, 1, 0)), // North-ish
        localPosition.clone().add(new THREE.Vector3(0, -1, 0)),// South-ish
      ];

      let waterPointCount = 0;
      pointsToCheck.forEach(point => {
        const p = point.normalize();
        const u = 0.5 + Math.atan2(p.z, p.x) / (2 * Math.PI);
        const v = 0.5 - Math.asin(p.y) / Math.PI;
        const x = Math.floor(u * (canvas.width - 1));
        const y = Math.floor(v * (canvas.height - 1));
        const pixel = ctx.getImageData(x, y, 1, 1).data;

        if (pixel[2] > pixel[0] + 10 && pixel[2] > pixel[1] + 10) {
          waterPointCount++;
        }
      });
      
      const strength = waterPointCount / pointsToCheck.length;
      console.log(`Tsunami Strength: ${strength * 100}%`);
      setTsunamiStrength(strength);
      // ------------------------------------------
    };
  }, [earth, localPosition, earthTextureURL]);
  
  useEffect(() => {
    // Only run the animation if the strength is greater than 0
    if (tsunamiStrength === 0 || !earth) return;

    const waveCount = Math.round(3 * tsunamiStrength); // Fewer waves for partial impacts
    if (waveCount === 0) return; // How many concentric ripples to create
    const waves = [];

    for (let i = 0; i < waveCount; i++) {
      // Create a thin ring geometry
      const geometry = new THREE.RingGeometry(0.95, 1, 128); 
      const material = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const wave = new THREE.Mesh(geometry, material);

      // Position the ring at the impact point, slightly above the surface
      wave.position.copy(localPosition).setLength(earthRadius + 0.1);
      // Orient the ring to lie flat against the globe's curvature
      wave.lookAt(earth.position);
      
      earth.add(wave);
      
      waves.push({
        mesh: wave,
        material: material,
        delay: i * 500, // Stagger the start time of each wave
      });
    }

    const duration = 5000; // 5 seconds
    const startTime = performance.now();

    function animateWaves() {
      animationFrameIdRef.current = requestAnimationFrame(animateWaves);
      const elapsed = performance.now() - startTime;

      waves.forEach(wave => {
        const waveElapsed = elapsed - wave.delay;
        if (waveElapsed < 0) return;

        const t = Math.min(waveElapsed / duration, 1);
        const easeT = t * t; // Use an ease-in function to start slow and speed up

        // Expand the ring's scale over time
        const currentScale = THREE.MathUtils.lerp(1, 20, easeT);
        wave.mesh.scale.set(currentScale, currentScale, currentScale);

        // Fade out the ring as it expands
        wave.material.opacity = THREE.MathUtils.lerp(0.8, 0, t);
      });

      // Stop the animation and clean up after it's finished
      if (elapsed > duration + (waveCount * 500)) {
        cancelAnimationFrame(animationFrameIdRef.current);
        waves.forEach(wave => {
          earth.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          wave.material.dispose();
        });
      }
    }

    animateWaves();

    // Cleanup function to remove waves if the component is unmounted mid-animation
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      waves.forEach(wave => {
        if (wave.mesh.parent) {
          earth.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          wave.material.dispose();
        }
      });
    };
  }, [tsunamiStrength, earth, localPosition, earthRadius]);

  return null; // This component only creates 3D effects, it doesn't render any HTML.
}

export default WaterHumpsTsunami;