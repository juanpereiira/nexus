import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCraterOnEarth } from './CraterEffect';
import { createBlastCircles, createBlastGlow } from './BlastEffects';
import WaterHumpsTsunami from './WaterHumpsTsunami';

const ASTEROID_COLORS = {
  'Stony': 0x999999,
  'Iron': 0x676775,
  'Carbonaceous': 0x4B3A26,
};

function createAsteroid(radius, type) {
  const geometry = new THREE.IcosahedronGeometry(radius, 25);
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
  const material = new THREE.MeshStandardMaterial({
    color: ASTEROID_COLORS[type] || 0x999999,
    roughness: 0.8
  });
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
  const animationFrameIdRef = useRef(null);
  const orbitRotationRef = useRef(new THREE.Quaternion());

  useImperativeHandle(ref, () => ({
    spawnAsteroid: ({ diameter, velocity, asteroidType }) => {
      const scene = sceneRef.current;
      if (!scene) return;
      if (asteroidRef.current) scene.remove(asteroidRef.current);
      if (orbitPathRef.current) scene.remove(orbitPathRef.current);

      impactStartedRef.current = false;
      setTsunamiData(null);

      const asteroidRadius = Number(diameter) / 2;
      const asteroid = createAsteroid(asteroidRadius, asteroidType);
      asteroidRef.current = asteroid;
      
      const initialRadius = 25 + Math.random() * 10;
      orbitDataRef.current = {
        angle: 0,
        initialRadius: initialRadius,
        currentRadius: initialRadius,
        speed: (Number(velocity) / 1000)
      };
      
      const randomRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (Math.random() - 0.5) * Math.PI,
          Math.random() * Math.PI * 2,
          0,
          'XYZ'
        )
      );
      orbitRotationRef.current = randomRotation;

      const orbitPath = createOrbitPath(initialRadius);
      orbitPath.quaternion.copy(randomRotation);
      orbitPathRef.current = orbitPath;
      
      scene.add(asteroid);
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
    const skyboxGeometry = new THREE.SphereGeometry(500, 64, 64); // A very large sphere
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load('/stars.jpg'),
      side: THREE.BackSide, // Render on the inside of the sphere
      color: 0xFFFFFF     // Tint the texture to make it darker
    });
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const earthGeometry = new THREE.SphereGeometry(15, 64, 64);
    
    // --- THIS IS THE FIX ---
    const earthMaterial = new THREE.MeshStandardMaterial({ 
        map: earthTexture, 
        roughness: 0.8 
    });
    // -----------------------

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthRef.current = earth;
    scene.add(earth);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(20, 10, 15);
    scene.add(directionalLight);
    
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      earth.rotation.y += 0.0005;

      if (asteroidRef.current && orbitPathRef.current) {
        const orbitData = orbitDataRef.current;
        orbitData.angle += orbitData.speed;

        const flatPosition = new THREE.Vector3(
            orbitData.currentRadius * Math.cos(orbitData.angle),
            0,
            orbitData.currentRadius * Math.sin(orbitData.angle)
        );
        flatPosition.applyQuaternion(orbitRotationRef.current);
        asteroidRef.current.position.copy(flatPosition);
        asteroidRef.current.rotation.x += 0.01;

        const earthRadius = 15;
        if (orbitData.currentRadius > earthRadius) {
          orbitData.currentRadius -= 0.01 * (orbitData.speed / 0.005);
          orbitPathRef.current.scale.setScalar(orbitData.currentRadius / orbitData.initialRadius);
        } else if (!impactStartedRef.current) {
          impactStartedRef.current = true;
          const worldImpactPoint = asteroidRef.current.position.clone();
          const localImpactPoint = earthRef.current.worldToLocal(worldImpactPoint);

          createBlastCircles(localImpactPoint, earth);
          createCraterOnEarth(earth, localImpactPoint);
          createBlastGlow(localImpactPoint, earth);


          // Remove asteroid and orbit visuals
          setTsunamiData({
            earth,
            localPosition: localImpactPoint,
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
      cancelAnimationFrame(animationFrameIdRef.current);
      if (currentMount && renderer.domElement) currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {tsunamiData && <WaterHumpsTsunami {...tsunamiData} />}
    </>
  );
});

export default OrbitalView;