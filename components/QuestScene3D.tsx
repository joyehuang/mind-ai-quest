"use client";

import { Float, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function Drone() {
  const droneRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!droneRef.current) {
      return;
    }
    droneRef.current.position.y = 1.2 + Math.sin(clock.elapsedTime * 2) * 0.18;
    droneRef.current.rotation.y = clock.elapsedTime * 1.4;
  });

  return (
    <mesh ref={droneRef} position={[0, 1.2, 0]}>
      <sphereGeometry args={[0.24, 24, 24]} />
      <meshStandardMaterial color="#ffe9a8" metalness={0.2} roughness={0.3} />
    </mesh>
  );
}

function Pagoda() {
  const pagodaRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!pagodaRef.current) {
      return;
    }
    pagodaRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.08;
  });

  return (
    <group ref={pagodaRef} position={[1.9, -0.15, -0.2]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.23, 0.3, 0.58, 24]} />
        <meshStandardMaterial color="#d79d64" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.18, 0.23, 0.38, 24]} />
        <meshStandardMaterial color="#f6c887" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <coneGeometry args={[0.26, 0.23, 24]} />
        <meshStandardMaterial color="#8f5229" roughness={0.45} />
      </mesh>
    </group>
  );
}

function RiceField() {
  return (
    <group position={[-1.7, -0.1, 0.3]}>
      {Array.from({ length: 12 }, (_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = col * 0.42;
        const z = row * 0.42;
        const height = 0.2 + ((index % 3) * 0.04 + 0.03);

        return (
          <mesh key={index} position={[x, height / 2, z]}>
            <boxGeometry args={[0.22, height, 0.22]} />
            <meshStandardMaterial color={index % 5 === 0 ? "#d9a45d" : "#7ebd61"} />
          </mesh>
        );
      })}
    </group>
  );
}

function Clouds() {
  return (
    <>
      <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.25}>
        <mesh position={[-2.2, 2.2, -1.4]}>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
      </Float>
      <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.22}>
        <mesh position={[-1.8, 2.15, -1.45]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
      </Float>
      <Float speed={1.05} rotationIntensity={0.08} floatIntensity={0.24}>
        <mesh position={[2.1, 2.05, -1.45]}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
      </Float>
      <Float speed={0.92} rotationIntensity={0.08} floatIntensity={0.23}>
        <mesh position={[2.45, 2.1, -1.4]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
      </Float>
    </>
  );
}

function FloatingCards() {
  return (
    <>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.45}>
        <RoundedBox args={[0.95, 0.62, 0.12]} radius={0.06} position={[-1.7, 1.05, -1.35]}>
          <meshStandardMaterial color="#5ec7a1" roughness={0.32} metalness={0.08} />
        </RoundedBox>
      </Float>
      <Float speed={1.35} rotationIntensity={0.3} floatIntensity={0.45}>
        <RoundedBox args={[0.95, 0.62, 0.12]} radius={0.06} position={[1.7, 1.08, -1.35]}>
          <meshStandardMaterial color="#6faef2" roughness={0.32} metalness={0.08} />
        </RoundedBox>
      </Float>
    </>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[3.2, 4.6, 4.2]} intensity={1.15} color="#fff7de" />
      <directionalLight position={[-2, 2.2, -3]} intensity={0.62} color="#d7f3ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <circleGeometry args={[3.8, 60]} />
        <meshStandardMaterial color="#d8ecb0" roughness={0.82} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.15, -0.24, 0.8]}>
        <circleGeometry args={[1.26, 40]} />
        <meshStandardMaterial color="#a6d1f5" roughness={0.72} />
      </mesh>

      <RiceField />
      <Pagoda />
      <Drone />
      <FloatingCards />
      <Clouds />
    </>
  );
}

export default function QuestScene3D() {
  return (
    <div className="h-[390px] w-full overflow-hidden rounded-[28px] border border-[#bfd5f4] bg-gradient-to-b from-[#b2dcff] via-[#dff1ff] to-[#f8ffec]">
      <Canvas camera={{ position: [0, 2.8, 5.4], fov: 44 }}>
        <SceneContent />
        <OrbitControls
          enablePan={false}
          minDistance={4.8}
          maxDistance={7.6}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
