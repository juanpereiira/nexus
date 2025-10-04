import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ImpactAnimation({ impactPos, meteorSize, onComplete }) {
  const groupRef = useRef();
  const startTime = useRef(null);
  const maxTime = 5; // seconds
  const craterRadius = meteorSize * 0.5;
  const tsunamiRadius = craterRadius * 3;

  if (!impactPos) return null;

  const posCartesian = new THREE.Vector3().copy(impactPos).multiplyScalar(10);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - startTime.current;

    if (t > maxTime) {
      onComplete();
      return;
    }

    if (groupRef.current.children.length >= 2) {
      const craterScale = Math.min(t / maxTime, 1) * craterRadius;
      const waveScale = Math.min(t / maxTime, 1) * tsunamiRadius;
      groupRef.current.children[0].scale.set(craterScale, 0.1, craterScale);
      groupRef.current.children[1].scale.set(waveScale, 0.01, waveScale);
    }
  });

  return (
    <group ref={groupRef} position={posCartesian} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="brown" />
      </mesh>
      <mesh>
        <ringGeometry args={[1.2, 1.5, 64]} />
        <meshStandardMaterial color="red" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
