"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { WENSHUGE_FEATURES } from "@/lib/wenshuge/datasets";
import type {
  DetectionLabel,
  WenshugeFeatureKey,
  WenshugeScoredRecord,
} from "@/lib/wenshuge/types";

interface WenshugeQuestScene3DProps {
  stepIndex: number;
  liteMode: boolean;
  selectedFeatureKeys: WenshugeFeatureKey[];
  threshold: number;
  trainProgress: number;
  testRows: WenshugeScoredRecord[];
  manualLabels: Record<number, DetectionLabel>;
  onHoverFeature: (key: WenshugeFeatureKey | null) => void;
  onToggleFeature: (key: WenshugeFeatureKey) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hash(value: string) {
  let h = 17;
  for (const char of value) {
    h = (h * 31 + char.charCodeAt(0)) % 10007;
  }
  return h;
}

function FeatureNode({
  featureKey,
  index,
  selected,
  interactive,
  onHover,
  onToggle,
}: {
  featureKey: WenshugeFeatureKey;
  index: number;
  selected: boolean;
  interactive: boolean;
  onHover: (key: WenshugeFeatureKey | null) => void;
  onToggle: (key: WenshugeFeatureKey) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  const angle = (index / WENSHUGE_FEATURES.length) * Math.PI * 2;
  const radius = 2.15;
  const y = 0.55 + Math.sin(index * 0.9) * 0.22;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) {
      return;
    }
    const t = clock.elapsedTime * (selected ? 2.8 : 1.6) + index * 0.6;
    const pulse = selected ? 1 + Math.sin(t) * 0.12 : 1 + Math.sin(t) * 0.05;
    meshRef.current.scale.setScalar(pulse);
    ringRef.current.rotation.z += 0.004 + (selected ? 0.002 : 0);
  });

  const color = selected ? "#7be0cd" : "#5f7f8f";
  const ringColor = selected ? "#9ef3e2" : "#426273";

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onPointerEnter={(event) => {
          event.stopPropagation();
          onHover(featureKey);
        }}
        onPointerLeave={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
        onClick={(event) => {
          if (!interactive) {
            return;
          }
          event.stopPropagation();
          onToggle(featureKey);
        }}
      >
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.6 : 0.28}
          roughness={0.28}
          metalness={0.22}
          transparent
          opacity={interactive || selected ? 0.96 : 0.55}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[0.16, 0.19, 32]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={selected ? 0.5 : 0.18}
          transparent
          opacity={interactive || selected ? 0.9 : 0.4}
        />
      </mesh>
    </group>
  );
}

function AncientTower({ trainProgress, threshold }: { trainProgress: number; threshold: number }) {
  const towerRef = useRef<Group>(null);
  const pulseRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (towerRef.current) {
      towerRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.06;
    }
    if (pulseRef.current) {
      const p = 0.9 + trainProgress / 100;
      pulseRef.current.scale.setScalar(p);
      if ("material" in pulseRef.current && pulseRef.current.material) {
        const mat = pulseRef.current.material;
        if ("opacity" in mat) {
          mat.opacity = clamp(0.15 + threshold * 0.4, 0.1, 0.35);
        }
      }
    }
  });

  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[1.45, 1.6, 0.32, 8]} />
        <meshStandardMaterial color="#6a4f3f" roughness={0.82} />
      </mesh>

      <group ref={towerRef}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.2, 1, 1]} />
          <meshStandardMaterial color="#d4b28f" roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <coneGeometry args={[0.98, 0.4, 4]} />
          <meshStandardMaterial color="#4f3d34" roughness={0.5} />
        </mesh>

        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[0.84, 0.7, 0.72]} />
          <meshStandardMaterial color="#c7a37f" roughness={0.62} />
        </mesh>
        <mesh position={[0, 1.98, 0]}>
          <coneGeometry args={[0.72, 0.3, 4]} />
          <meshStandardMaterial color="#4b3930" roughness={0.5} />
        </mesh>

        <mesh position={[0, 2.28, 0]}>
          <cylinderGeometry args={[0.14, 0.12, 0.36, 16]} />
          <meshStandardMaterial color="#9cc3cf" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>

      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.55, 1.95, 64]} />
        <meshStandardMaterial color="#90d8de" emissive="#90d8de" emissiveIntensity={0.3} transparent opacity={0.24} />
      </mesh>
    </group>
  );
}

function DayBeacons({
  stepIndex,
  testRows,
  manualLabels,
}: {
  stepIndex: number;
  testRows: WenshugeScoredRecord[];
  manualLabels: Record<number, DetectionLabel>;
}) {
  if (testRows.length === 0) {
    return null;
  }

  return (
    <group position={[0, 0.02, 2.25]}>
      {testRows.map((row, index) => {
        const x = -2.55 + index * 0.57;
        const height = 0.22 + row.score * 1.3;
        const manual = manualLabels[row.day];

        let color = "#5e7d8f";
        if (stepIndex >= 4) {
          color = row.predicted === "anomaly" ? "#f48f63" : "#7fd5d8";
        }
        if (stepIndex >= 5 && manual) {
          color = manual === row.truth ? "#7fd8a5" : "#f0a56f";
        }

        return (
          <group key={row.day} position={[x, 0, 0]}>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[0.24, height, 0.24]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.34} />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.18, 24]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ParticleField({ liteMode }: { liteMode: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: liteMode ? 36 : 80 }, (_, index) => {
        const seed = hash(`particle-${index}`);
        return {
          x: ((seed % 200) / 100 - 1) * 6,
          y: 0.35 + ((seed % 90) / 90) * 3.4,
          z: ((seed % 160) / 80 - 1) * 4,
          phase: (seed % 360) * (Math.PI / 180),
          speed: 0.4 + ((seed % 40) / 100),
        };
      }),
    [liteMode],
  );

  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {particles.map((item, index) => (
        <mesh
          key={index}
          position={[
            item.x,
            item.y + Math.sin(item.phase + item.speed) * 0.05,
            item.z,
          ]}
        >
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#9ed9e7" emissive="#9ed9e7" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

export default function WenshugeQuestScene3D({
  stepIndex,
  liteMode,
  selectedFeatureKeys,
  threshold,
  trainProgress,
  testRows,
  manualLabels,
  onHoverFeature,
  onToggleFeature,
}: WenshugeQuestScene3DProps) {
  const selected = useMemo(() => new Set(selectedFeatureKeys), [selectedFeatureKeys]);
  const featureInteractive = stepIndex === 0;

  return (
    <div
      className="absolute inset-0"
      onPointerLeave={() => onHoverFeature(null)}
    >
      <Canvas
        dpr={liteMode ? [1, 1.4] : [1, 2]}
        shadows={!liteMode}
        camera={{ position: [0, 2.85, 6.4], fov: 43 }}
      >
        <color attach="background" args={["#081726"]} />
        <fog attach="fog" args={["#081726", 7.5, 14]} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[5.2, 6.6, 4.5]} intensity={1.05} color="#f7efe4" />
        <directionalLight position={[-4.8, 3.2, -3.8]} intensity={0.42} color="#7cc6da" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow={!liteMode}>
          <planeGeometry args={[18, 12]} />
          <meshStandardMaterial color="#183041" roughness={0.92} metalness={0.04} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
          <circleGeometry args={[4.2, 64]} />
          <meshStandardMaterial color="#1f4358" roughness={0.86} metalness={0.08} />
        </mesh>

        <AncientTower trainProgress={trainProgress} threshold={threshold} />

        {WENSHUGE_FEATURES.map((feature, index) => (
          <FeatureNode
            key={feature.key}
            featureKey={feature.key}
            index={index}
            selected={selected.has(feature.key)}
            interactive={featureInteractive}
            onHover={onHoverFeature}
            onToggle={onToggleFeature}
          />
        ))}

        <DayBeacons
          stepIndex={stepIndex}
          testRows={testRows}
          manualLabels={manualLabels}
        />

        <ParticleField liteMode={liteMode} />

        <OrbitControls
          enablePan={false}
          target={[0, 0.95, 0]}
          minDistance={4.8}
          maxDistance={8}
          minPolarAngle={Math.PI / 4.4}
          maxPolarAngle={Math.PI / 2.05}
          rotateSpeed={liteMode ? 0.38 : 0.68}
        />
      </Canvas>
    </div>
  );
}
