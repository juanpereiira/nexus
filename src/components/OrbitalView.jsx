import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCraterOnEarth } from './CraterEffect';
import { createBlastCircles, createBlastGlow } from './BlastEffects';
import WaterHumpsTsunami from './WaterHumpsTsunami';

function createAsteroid(radius) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const positionAttribute = geometry.getAttribute('position');
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
    const bumpiness = 0.4;
    const randomOffset = new THREE.Vector3(
      (Math.random() - 0.5) * bumpiness,
      (Math.random() - 0.5) * bumpiness,
      (Math.random() - 0.5) * bumpiness
    );
    vertex.add(randomOffset);
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  return new THREE.Mesh(geometry, material);
}

function createOrbitPath(radius) {
  const points = [];
  for (let i = 0; i <= 360; i++) {
    const radians = i * (Math.PI / 180);
    points.push(new THREE.Vector3(Math.cos(radians) * radius, 0, Math.sin(radians) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  return new THREE.Line(geometry, material);
}

const OrbitalView = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const asteroidRef = useRef(null);
  const orbitPathRef = useRef(null);
  const earthRef = useRef(null);
  const impactStartedRef = useRef(false);
  const orbitDataRef = useRef({ angle: 0, initialRadius: 25, currentRadius: 25, speed: 0.005 });
  const [tsunamiData, setTsunamiData] = useState(null);

  useImperativeHandle(ref, () => ({
    spawnAsteroid: ({ diameter, velocity }) => {
      const scene = sceneRef.current;
      if (!scene) return;

      if (asteroidRef.current) scene.remove(asteroidRef.current);
      if (orbitPathRef.current) scene.remove(orbitPathRef.current);

      impactStartedRef.current = false;
      setTsunamiData(null);

      const asteroidRadius = Number(diameter) / 2;
      const asteroid = createAsteroid(asteroidRadius);
      asteroidRef.current = asteroid;
      scene.add(asteroid);

      const initialRadius = 25 + Math.random() * 10;
      orbitDataRef.current = {
        angle: 0,
        initialRadius: initialRadius,
        currentRadius: initialRadius,
        speed: (Number(velocity) / 1000)
      };

      const orbitPath = createOrbitPath(initialRadius);
      orbitPathRef.current = orbitPath;
      scene.add(orbitPath);
    }
  }));

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const textureLoader = new THREE.TextureLoader();
    scene.background = textureLoader.load('/stars.jpg');
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const earthGeometry = new THREE.SphereGeometry(15, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.8 });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthRef.current = earth;
    scene.add(earth);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(20, 10, 15);
    scene.add(directionalLight);

    let animationFrameId = null;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      earth.rotation.y += 0.0005;

      if (asteroidRef.current && orbitPathRef.current) {
        const orbitData = orbitDataRef.current;
        orbitData.angle += orbitData.speed;

        const x = orbitData.currentRadius * Math.cos(orbitData.angle);
        const z = orbitData.currentRadius * Math.sin(orbitData.angle);
        asteroidRef.current.position.set(x, 0, z);
        asteroidRef.current.rotation.x += 0.01;

        const earthRadius = 15;
        if (orbitData.currentRadius > earthRadius) {
          orbitData.currentRadius -= 0.01 * (orbitData.speed / 0.005); // Decay faster with more speed
          orbitPathRef.current.scale.setScalar(orbitData.currentRadius / orbitData.initialRadius);
        } else if (!impactStartedRef.current) {
          impactStartedRef.current = true;
          
          const worldImpactPoint = asteroidRef.current.position.clone();
          
          console.log("IMPACT DETECTED. Triggering effects.");
          const localImpactPoint = earthRef.current.worldToLocal(worldImpactPoint);
          createBlastCircles(worldImpactPoint, earth);
          createCraterOnEarth(earth, worldImpactPoint);
          createBlastGlow(worldImpactPoint, earth);
          
          const lavaTexture = textureLoader.load('/lava.jpg');
          const decalGeometry = new THREE.CircleGeometry(2, 32);
          const decalMaterial = new THREE.MeshBasicMaterial({
            map: lavaTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
          });
          const lavaDecal = new THREE.Mesh(decalGeometry, decalMaterial);

          lavaDecal.position.copy(localImpactPoint).setLength(15.05);
          lavaDecal.lookAt(new THREE.Vector3(0,0,0));
          earthRef.current.add(lavaDecal);

          let opacity = 1.0;
          function fadeLava() {
            if (opacity > 0) {
              opacity -= 0.01;
              lavaDecal.material.opacity = opacity;
              requestAnimationFrame(fadeLava);
            } else {
              earthRef.current.remove(lavaDecal);
              lavaDecal.geometry.dispose();
              lavaDecal.material.dispose();
            }
          }
          fadeLava();
          setTsunamiData({
            earth,
            localPosition: worldImpactPoint,
            earthTextureURL: '/earth-8k.jpg',
            earthRadius: earthRadius,
          });

          scene.remove(asteroidRef.current);
          scene.remove(orbitPathRef.current);
          asteroidRef.current = null;
          orbitPathRef.current = null;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {tsunamiData && (
        <WaterHumpsTsunami
          earth={tsunamiData.earth}
          localPosition={tsunamiData.localPosition}
          earthTextureURL={tsunamiData.earthTextureURL}
          earthRadius={tsunamiData.earthRadius}
        />
      )}
    </>
  );
});

export default OrbitalView;