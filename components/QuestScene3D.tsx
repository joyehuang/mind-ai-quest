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
      <meshStandardMaterial color="#d7f7ff" emissive="#57d9ff" emissiveIntensity={0.32} metalness={0.26} roughness={0.3} />
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
        <meshStandardMaterial color="#3a6288" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.18, 0.23, 0.38, 24]} />
        <meshStandardMaterial color="#5b95bc" roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <coneGeometry args={[0.26, 0.23, 24]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={0.2} roughness={0.4} />
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
            <meshStandardMaterial color={index % 5 === 0 ? "#6ed6ff" : "#48ffb0"} />
          </mesh>
        );
      })}
    </group>
  );
}

function FloatingCards() {
  return (
    <>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.45}>
        <RoundedBox args={[0.95, 0.62, 0.12]} radius={0.06} position={[-1.7, 1.05, -1.35]}>
          <meshStandardMaterial color="#26b7ff" emissive="#26b7ff" emissiveIntensity={0.24} roughness={0.24} metalness={0.16} />
        </RoundedBox>
      </Float>
      <Float speed={1.35} rotationIntensity={0.3} floatIntensity={0.45}>
        <RoundedBox args={[0.95, 0.62, 0.12]} radius={0.06} position={[1.7, 1.08, -1.35]}>
          <meshStandardMaterial color="#43ffb2" emissive="#43ffb2" emissiveIntensity={0.16} roughness={0.24} metalness={0.14} />
        </RoundedBox>
      </Float>
    </>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[3.2, 4.6, 4.2]} intensity={0.9} color="#d8f7ff" />
      <directionalLight position={[-2, 2.2, -3]} intensity={0.56} color="#49dcff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <circleGeometry args={[3.8, 60]} />
        <meshStandardMaterial color="#112f49" roughness={0.9} />
      </mesh>

      <RiceField />
      <Pagoda />
      <Drone />
      <FloatingCards />
    </>
  );
}

export default function QuestScene3D() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-[rgba(80,223,255,0.38)] bg-[radial-gradient(circle_at_16%_18%,rgba(45,215,255,0.15),transparent_48%),radial-gradient(circle_at_80%_80%,rgba(55,255,154,0.14),transparent_44%),linear-gradient(165deg,#071327_0%,#091c36_54%,#0c2548_100%)]">
      <Canvas camera={{ position: [0, 2.8, 5.5], fov: 46 }}>
        <SceneContent />
        <OrbitControls
          enablePan={false}
          minDistance={4.6}
          maxDistance={7.4}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
