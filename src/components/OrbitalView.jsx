import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

const OrbitalView = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const asteroidRef = useRef(null);
  const orbitPivotRef = useRef(null);
  const thetaRef = useRef(0);
  const orbitSpeedRef = useRef(0.01);

  useImperativeHandle(ref, () => ({
    spawnAsteroid({ diameter, velocityChange }) {
      const scene = sceneRef.current;
      if (!scene) return;

      if (asteroidRef.current) {
        orbitPivotRef.current.remove(asteroidRef.current);
        asteroidRef.current.geometry.dispose();
        asteroidRef.current.material.dispose();
        asteroidRef.current = null;
      }

      const asteroidRadius = Number(diameter) / 2;
      const asteroid = createAsteroid(asteroidRadius);
      asteroidRef.current = asteroid;
      thetaRef.current = 0;

      // Prepare orbit pivot group if not existing
      if (!orbitPivotRef.current) {
        const orbitPivot = new THREE.Group();
        scene.add(orbitPivot);
        orbitPivotRef.current = orbitPivot;
      }

      // Add asteroid to orbit pivot
      orbitPivotRef.current.add(asteroid);

      // Position asteroid on orbit radius
      asteroid.position.set(asteroidRadius + 10, 0, 0);

      // Set orbit speed scaled by velocityChange
      orbitSpeedRef.current = Number(velocityChange) / 1000;
    },
  }));

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      earth.rotation.y += 0.0005;

      if (asteroidRef.current) {
        thetaRef.current += orbitSpeedRef.current;
        const orbitRadius = asteroidRef.current.position.length();
        asteroidRef.current.position.x = orbitRadius * Math.cos(thetaRef.current);
        asteroidRef.current.position.z = orbitRadius * Math.sin(thetaRef.current);
        asteroidRef.current.rotation.x += 0.005;
        asteroidRef.current.rotation.y += 0.005;
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
      currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
});

export default OrbitalView;
