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

function randomPointOnSphere(radius) {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Creates concentric colored rings expanding on Earth's surface
function createBlastCircles(localPos, earth) {
  const colors = [0xff0000, 0xffa500, 0xffff00, 0xffffff]; // red, orange, yellow, white
  const maxRadius = 30;
  const duration = 4000; // ms for full expansion
  
  const circles = colors.map((color, i) => {
    const geometry = new THREE.CircleGeometry(0.5, 64);
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8 - i * 0.15, // decreasing opacity for outer circles
      depthWrite: false,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(localPos);
    circle.rotation.x = -Math.PI / 2; // flat on Earth's surface (assumed Y up)
    earth.add(circle);
    return { mesh: circle, material };
  });

  // Animation start time
  const startTime = performance.now();

  function animateCircles(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    circles.forEach(({ mesh, material }, i) => {
      const baseRadius = (maxRadius / colors.length) * (i + 1);
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.5, baseRadius * 2, t));
      material.opacity = THREE.MathUtils.lerp(
        0.8 - i * 0.15,
        0,
        t,
      );
    });

    if (t < 1) {
      requestAnimationFrame(animateCircles);
    } else {
      // cleanup
      circles.forEach(({ mesh, material }) => {
        earth.remove(mesh);
        mesh.geometry.dispose();
        material.dispose();
      });
    }
  }

  requestAnimationFrame(animateCircles);
}

const OrbitalView = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const asteroidRef = useRef(null);
  const orbitPivotRef = useRef(null);
  const asteroidVelocityRef = useRef(new THREE.Vector3());
  const impactStartedRef = useRef(false);
  const earthRef = useRef(null);

  useImperativeHandle(ref, () => ({
    spawnAsteroid({ diameter, velocityChange }) {
      const scene = sceneRef.current;
      const earth = earthRef.current;
      if (!scene || !earth) return;

      impactStartedRef.current = false;

      if (asteroidRef.current) {
        orbitPivotRef.current.remove(asteroidRef.current);
        asteroidRef.current.geometry.dispose();
        asteroidRef.current.material.dispose();
        asteroidRef.current = null;
      }

      const asteroidRadius = Number(diameter) / 2;
      const asteroid = createAsteroid(asteroidRadius);
      asteroid.castShadow = true;
      asteroidRef.current = asteroid;

      if (!orbitPivotRef.current) {
        orbitPivotRef.current = new THREE.Group();
        scene.add(orbitPivotRef.current);
      }

      orbitPivotRef.current.add(asteroid);

      const spawnRadius = asteroidRadius + 60;
      const position = randomPointOnSphere(spawnRadius);
      asteroid.position.copy(position);

      // Velocity direction roughly tangential
      const radial = position.clone().normalize();
      let tangent = new THREE.Vector3().crossVectors(radial, new THREE.Vector3(0, 1, 0));
      if (tangent.length() === 0) tangent.set(1, 0, 0);
      tangent.normalize();

      // Clamp velocityChange to max 80 km/s
      const maxSpeed = 80;
      const speed = Math.min(Number(velocityChange), maxSpeed);
      asteroidVelocityRef.current = tangent.multiplyScalar(speed / 100);
    },
  }));

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      2000
    );
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Earth with receiveShadow enabled and standard material
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth-8k.jpg');
    const earthGeometry = new THREE.SphereGeometry(32, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    earthRef.current = earth;
    scene.add(earth);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    let animationFrameId = null;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      earth.rotation.y += 0.0005;

      if (asteroidRef.current) {
        const dt = 0.016;
        const position = asteroidRef.current.position;
        const velocity = asteroidVelocityRef.current;
        const rVec = position.clone().negate();
        const r = rVec.length();

        const earthMassScaled = 400;
        const accMag = earthMassScaled / (r * r);
        const acceleration = rVec.normalize().multiplyScalar(accMag);

        velocity.add(acceleration.multiplyScalar(dt));
        position.add(velocity.clone().multiplyScalar(dt));
        asteroidRef.current.rotation.x += 0.005;
        asteroidRef.current.rotation.y += 0.005;

        const earthRadius = 32;
        const asteroidRadius = asteroidRef.current.geometry.parameters.radius;

        if (r <= earthRadius + asteroidRadius && !impactStartedRef.current) {
          impactStartedRef.current = true;

          // Blast light and glow as before (same code as you have)

          // Create blast radius concentric circles on Earth's surface
          const localPos = earth.worldToLocal(position.clone());
          createBlastCircles(localPos, earth);
        }

        if (r <= earthRadius) {
          orbitPivotRef.current.remove(asteroidRef.current);
          asteroidRef.current.geometry.dispose();
          asteroidRef.current.material.dispose();
          asteroidRef.current = null;
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
      if (renderer.domElement) currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
});

export default OrbitalView;
