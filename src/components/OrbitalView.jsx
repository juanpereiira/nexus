import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createAsteroid(radius) {
  const geometry = new THREE.IcosahedronGeometry(radius, 5);
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
  const orbitSpeedRef = useRef(0.002);

  // Expose spawnAsteroid method
  useImperativeHandle(ref, () => ({
    spawnAsteroid({ diameter, velocityChange }) {
      const scene = sceneRef.current;
      if (!scene) return;

      // Remove existing asteroid if any
      if (asteroidRef.current) {
        orbitPivotRef.current.remove(asteroidRef.current);
        asteroidRef.current.geometry.dispose();
        asteroidRef.current.material.dispose();
        asteroidRef.current = null;
      }

      const asteroidRadius = Number(diameter) / 2; // Convert diameter km to radius in scene units
      const asteroid = createAsteroid(asteroidRadius);
      asteroidRef.current = asteroid;

      // Set initial position
      asteroid.position.set(10, 0, 0);

      // Add to scene
      if (scene && orbitPivotRef.current) {
        orbitPivotRef.current.add(asteroid);
      }

      // Adjust orbit speed based on velocityChange
      orbitSpeedRef.current = Number(velocityChange) / 10000;
    }
  }));

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Earth + Lights
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create orbit pivot
    const orbitPivot = new THREE.Group();
    scene.add(orbitPivot);
    orbitPivotRef.current = orbitPivot;

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      scene.children.forEach(obj => {
        if (obj !== scene.children[0]) {
          if (obj.type === 'Mesh') obj.rotation.x += 0.005;
        }
      });
      if (orbitPivotRef.current) orbitPivotRef.current.rotation.y += orbitSpeedRef.current;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (currentMount) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount) currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
});

export default OrbitalView;
