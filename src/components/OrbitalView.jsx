import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Helper function to generate a procedural asteroid
function createAsteroid(radius) {
  const geometry = new THREE.IcosahedronGeometry(radius, 5);
  const positionAttribute = geometry.getAttribute('position');

  // This loop deforms the shape
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

  // ✅ THE FIX: Recalculate normals for correct lighting
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.8,
  });
  
  return new THREE.Mesh(geometry, material);
}


function OrbitalView() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Asteroid
    const asteroid = createAsteroid(1.5);
    asteroid.position.set(10, 5, -5);
    scene.add(asteroid);

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); 
      earth.rotation.y += 0.0005;
      asteroid.rotation.x += 0.005;
      asteroid.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default OrbitalView;