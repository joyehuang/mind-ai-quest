"use client";

import { Clone, Html, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { FarmSample, ModelJudgment, PredictionRecord, RiceLabel } from "@/lib/farm/types";

interface FarmQuestScene3DProps {
  stepIndex: number;
  liteMode: boolean;
  immersive?: boolean;
  className?: string;
  showFieldBadges?: boolean;
  showModeBadge?: boolean;
  showHoverCard?: boolean;
  fieldASamples: FarmSample[];
  fieldBSamples: FarmSample[];
  fieldCSamples: FarmSample[];
  collectedIds: string[];
  labels: Record<string, RiceLabel>;
  fieldBPredictions: PredictionRecord[];
  fieldBReviews: Record<string, ModelJudgment>;
  fieldCPredictions: PredictionRecord[];
  hoveredSampleId: string | null;
  activeSampleId: string | null;
  onHoverSample: (sampleId: string | null) => void;
  onSelectSample: (sampleId: string) => void;
}

interface FieldLayout {
  centerX: number;
  width: number;
  depth: number;
  columns: number;
  spacingX: number;
  spacingZ: number;
  startZ: number;
}

interface PositionedSample {
  sample: FarmSample;
  position: [number, number, number];
}

interface PlantAppearance {
  stemHeight: number;
  stemLean: number;
  leafColor: string;
  stemColor: string;
  panicleColor: string;
  tillerCount: number;
  pestCount: number;
  panicleScale: number;
  damageSpotCount: number;
}

interface WheatModel {
  object: Object3D;
  minY: number;
  height: number;
}

const WHEAT_MODEL_PATHS = ["https://bear-public.tos-cn-shanghai.volces.com/wheet.glb"];
const FARM_BG_IMAGE_PATHS = [
  "https://bear-public.tos-cn-shanghai.volces.com/fram-image-bg-v2.webp",
];

const FIELD_LAYOUT: Record<"A" | "B" | "C", FieldLayout> = {
  A: {
    centerX: -2.8,
    width: 2.9,
    depth: 2.9,
    columns: 5,
    spacingX: 0.67,
    spacingZ: 0.74,
    startZ: -1.05,
  },
  B: {
    centerX: -0.1,
    width: 2.3,
    depth: 2.4,
    columns: 4,
    spacingX: 0.67,
    spacingZ: 0.74,
    startZ: -0.85,
  },
  C: {
    centerX: 2.6,
    width: 2.3,
    depth: 2.4,
    columns: 4,
    spacingX: 0.67,
    spacingZ: 0.74,
    startZ: -0.85,
  },
};
const FIELD_RENDER_SCALE = 1.376;
const PLANT_SCALE_FACTOR = 2.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashId(id: string) {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10007;
  }
  return hash;
}

function parseLeadingNumber(text: string, fallback: number) {
  const match = text.match(/(\d+)/);
  if (!match) {
    return fallback;
  }
  return Number(match[1]);
}

function inferPestLevel(text: string) {
  if (/无|未见/.test(text)) return 0;
  if (/偶见|较少|轻微/.test(text)) return 1;
  if (/明显|聚集|重/.test(text)) return 3;
  return 2;
}

function inferLeafDamage(text: string) {
  let score = 0;
  if (/黄|暗/.test(text)) score += 1;
  if (/破洞|破损/.test(text)) score += 1;
  if (/卷/.test(text)) score += 0.8;
  if (/霉|斑/.test(text)) score += 1;
  return clamp(score / 3.8, 0, 1);
}

function inferPanicleFullness(text: string) {
  if (/饱满|圆润|均匀/.test(text)) return 0.95;
  if (/正常|中等/.test(text)) return 0.72;
  if (/稀疏|偏小|瘪/.test(text)) return 0.46;
  if (/发黑/.test(text)) return 0.34;
  return 0.62;
}

function getPlantAppearance(sample: FarmSample): PlantAppearance {
  const hash = hashId(sample.id);
  const damage = inferLeafDamage(sample.profile.leaf);
  const pestLevel = inferPestLevel(sample.profile.pest);
  const fullness = inferPanicleFullness(sample.profile.panicle);
  const quality = clamp(sample.qualityWeight, 0.55, 1);

  const tillerBase = parseLeadingNumber(sample.profile.tiller, sample.groundTruth === "healthy" ? 3 : 1);
  const tillerCount = Math.max(
    1,
    Math.min(5, tillerBase + (hash % 2 === 0 ? 0 : 1) - (sample.groundTruth === "unhealthy" ? 1 : 0)),
  );

  const stemHeight = clamp(0.38 + quality * 0.2 - damage * 0.09 + (hash % 5) * 0.008, 0.32, 0.62);
  const stemLean = clamp(
    (hash % 7 - 3) * 0.03 + damage * 0.12 + (sample.groundTruth === "unhealthy" ? 0.05 : 0.01),
    -0.18,
    0.24,
  );

  const hue = clamp(106 - damage * 36 - pestLevel * 4 + (hash % 11) - 5, 60, 118);
  const saturation = clamp(58 - damage * 18, 28, 66);
  const lightness = clamp(37 - damage * 11 + quality * 10, 26, 48);

  const stemHue = clamp(102 - damage * 22, 72, 110);
  const stemSat = clamp(30 - damage * 8, 14, 34);
  const stemLight = clamp(30 - damage * 6, 22, 34);

  const panicleHue = clamp(48 - damage * 18, 24, 54);
  const panicleSat = clamp(58 - pestLevel * 6, 26, 60);
  const panicleLight = clamp(58 - damage * 16, 32, 64);

  const pestCount = Math.max(0, Math.min(4, Math.round(pestLevel + (hash % 2 === 0 ? 0 : 1))));
  const damageSpotCount = Math.max(0, Math.min(4, Math.round(damage * 4)));

  return {
    stemHeight,
    stemLean,
    leafColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    stemColor: `hsl(${stemHue} ${stemSat}% ${stemLight}%)`,
    panicleColor: `hsl(${panicleHue} ${panicleSat}% ${panicleLight}%)`,
    tillerCount,
    pestCount,
    panicleScale: clamp(fullness, 0.32, 1),
    damageSpotCount,
  };
}

function markerColorForLabel(label: RiceLabel) {
  return label === "healthy" ? "#6ba8ff" : "#d87d62";
}

function buildPositions(samples: FarmSample[], field: "A" | "B" | "C"): PositionedSample[] {
  const layout = FIELD_LAYOUT[field];
  const startX = layout.centerX - ((layout.columns - 1) * layout.spacingX) / 2;

  return samples.map((sample, index) => {
    const row = Math.floor(index / layout.columns);
    const col = index % layout.columns;

    return {
      sample,
      position: [startX + col * layout.spacingX, 0.02, layout.startZ + row * layout.spacingZ],
    };
  });
}

function SelectionPulse({
  color,
  intensity = 0.45,
}: {
  color: string;
  intensity?: number;
}) {
  const pulseRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const scale = 1 + Math.sin(t * 5.2) * 0.08;
    const opacity = 0.2 + (Math.sin(t * 5.2) + 1) * 0.14;

    if (pulseRef.current) {
      pulseRef.current.scale.set(scale, scale, scale);
    }
    if (haloRef.current && haloRef.current.material && "opacity" in haloRef.current.material) {
      haloRef.current.material.opacity = opacity * intensity;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={3}>
      <mesh>
        <ringGeometry args={[0.085, 0.13, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.2}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.13, 0.17, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.2}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh ref={haloRef}>
        <circleGeometry args={[0.17, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

function useWheatModel(modelPaths: string[]) {
  const [model, setModel] = useState<WheatModel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;
    const loader = new GLTFLoader();

    const tryLoad = (index: number) => {
      if (index >= modelPaths.length) {
        if (!canceled) {
          setLoaded(true);
          setModel(null);
        }
        return;
      }

      loader.load(
        modelPaths[index],
        (gltf) => {
          if (canceled) {
            return;
          }

          const scene = gltf.scene ?? gltf.scenes?.[0];
          if (!scene) {
            tryLoad(index + 1);
            return;
          }

          scene.updateWorldMatrix(true, true);
          const bounds = new Box3().setFromObject(scene);
          const size = new Vector3();
          bounds.getSize(size);

          setModel({
            object: scene,
            minY: bounds.min.y,
            height: Math.max(size.y, 0.001),
          });
          setLoaded(true);
        },
        undefined,
        () => {
          tryLoad(index + 1);
        },
      );
    };

    tryLoad(0);

    return () => {
      canceled = true;
    };
  }, [modelPaths]);

  return { model, loaded };
}

function RicePlant({
  sample,
  markerColor,
  collected,
  selected,
  dimmed,
  liteMode,
  model,
  position,
  hovered,
  onHover,
  onSelect,
}: {
  sample: FarmSample;
  markerColor: string | null;
  collected: boolean;
  selected: boolean;
  dimmed: boolean;
  liteMode: boolean;
  model: WheatModel | null;
  position: [number, number, number];
  hovered: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const appearance = getPlantAppearance(sample);

  const leafColor = dimmed ? "#aeb989" : appearance.leafColor;
  const stemColor = dimmed ? "#8f8a66" : appearance.stemColor;
  const useLitePlant = liteMode || model === null;

  const seed = hashId(sample.id);
  const modelScale = model ? clamp((appearance.stemHeight * 1.35) / model.height, 0.12, 0.34) : 0.24;
  const modelOffsetY = model ? -model.minY * modelScale : 0;
  const modelRotateY = ((seed % 360) * Math.PI) / 180 + appearance.stemLean * 0.5;
  const lift = selected ? 0.03 : 0;
  const hitRadius = useLitePlant ? 0.1 : 0.09;
  const hitHeight = clamp(appearance.stemHeight + 0.18, 0.48, 0.74);
  const hitCapsuleLength = Math.max(0.18, hitHeight - hitRadius * 2);
  const hitCapsuleCenterY = hitHeight / 2;
  const panicleHitY = clamp(appearance.stemHeight + 0.06, 0.3, 0.62);
  const panicleHitRadius = useLitePlant ? 0.12 : 0.11;

  function handleHitHover(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onHover();
  }

  function handleHitSelect(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect();
  }

  return (
    <group position={[position[0], position[1] + lift, position[2]]} scale={[PLANT_SCALE_FACTOR, PLANT_SCALE_FACTOR, PLANT_SCALE_FACTOR]}>
      <mesh
        position={[0, hitCapsuleCenterY, 0]}
        onPointerEnter={handleHitHover}
        onPointerMove={handleHitHover}
        onClick={handleHitSelect}
      >
        <capsuleGeometry args={[hitRadius, hitCapsuleLength, 4, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        position={[0, panicleHitY, 0]}
        onPointerEnter={handleHitHover}
        onPointerMove={handleHitHover}
        onClick={handleHitSelect}
      >
        <sphereGeometry args={[panicleHitRadius, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {useLitePlant ? (
        <>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, appearance.stemLean]}>
            <cylinderGeometry args={[0.05, 0.07, 0.42, 10]} />
            <meshStandardMaterial color={stemColor} roughness={0.74} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.17, 14, 14]} />
            <meshStandardMaterial
              color={leafColor}
              roughness={0.56}
              emissive={selected ? "#ffffff" : "#000000"}
              emissiveIntensity={selected ? 0.18 : 0}
            />
          </mesh>
        </>
      ) : (
        <group
          scale={[modelScale, modelScale, modelScale]}
          position={[0, modelOffsetY, 0]}
          rotation={[0, modelRotateY, appearance.stemLean * 0.16]}
        >
          <Clone object={model.object} />
        </group>
      )}

      <mesh position={[0, appearance.stemHeight * 0.95, 0]}>
        <sphereGeometry args={[0.09 + appearance.panicleScale * 0.04, 10, 10]} />
        <meshStandardMaterial color={leafColor} transparent opacity={dimmed ? 0.08 : 0.22} />
      </mesh>

      {Array.from({ length: appearance.pestCount }, (_, index) => {
        const angle = (index / Math.max(appearance.pestCount, 1)) * Math.PI * 2;
        const radius = 0.08;
        const y = appearance.stemHeight * (0.58 + (index % 2) * 0.18);
        return (
          <mesh key={`${sample.id}-pest-${index}`} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial color={dimmed ? "#8f9793" : "#2f3432"} roughness={0.3} />
          </mesh>
        );
      })}

      {Array.from({ length: appearance.damageSpotCount }, (_, index) => {
        const angle = (index / Math.max(appearance.damageSpotCount, 1)) * Math.PI * 2 + 0.25;
        const radius = 0.06;
        const y = appearance.stemHeight * 0.78;
        return (
          <mesh key={`${sample.id}-damage-${index}`} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color={dimmed ? "#9da6a1" : "#5f5c4d"} roughness={0.6} />
          </mesh>
        );
      })}

      {collected && (
        <SelectionPulse color={dimmed ? "#b2b87e" : "#d8ae64"} />
      )}

      {markerColor && (
        <mesh position={[0, appearance.stemHeight + 0.22, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={dimmed ? "#a8b4ae" : markerColor} roughness={0.3} metalness={0.05} />
        </mesh>
      )}

      {selected && (
        <>
          <SelectionPulse color="#ffffff" intensity={0.55} />
          <mesh position={[0, appearance.stemHeight + 0.33, 0]}>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.65} roughness={0.2} />
          </mesh>
        </>
      )}

      {hovered && (
        <Html
          position={[0, appearance.stemHeight + 0.15, 0]}
          center
          distanceFactor={50}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded border border-[#4c5e84] bg-[rgba(17,27,48,0.94)] px-1 py-0.5 text-[2px] text-[#d7e3ff] shadow-lg max-w-[80px] leading-[2px] whitespace-nowrap">
            <p className="font-semibold">候选稻种 #{sample.id.slice(-3)}</p>
            <p>叶子：{sample.profile.leaf}</p>
            <p>稻杆：{sample.profile.stem}</p>
            <p>虫害：{sample.profile.pest}</p>
            <p>稻穗：{sample.profile.panicle}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function FarmQuestScene3D({
  stepIndex,
  liteMode,
  immersive = false,
  className,
  showFieldBadges = true,
  showModeBadge = true,
  showHoverCard = true,
  fieldASamples,
  fieldBSamples,
  fieldCSamples,
  collectedIds,
  labels,
  fieldBPredictions,
  fieldBReviews,
  fieldCPredictions,
  hoveredSampleId,
  activeSampleId,
  onHoverSample,
  onSelectSample,
}: FarmQuestScene3DProps) {
  const positionedA = useMemo(() => buildPositions(fieldASamples, "A"), [fieldASamples]);
  const positionedB = useMemo(() => buildPositions(fieldBSamples, "B"), [fieldBSamples]);
  const positionedC = useMemo(() => buildPositions(fieldCSamples, "C"), [fieldCSamples]);

  const sampleById = useMemo(() => {
    const all = [...fieldASamples, ...fieldBSamples, ...fieldCSamples];
    return Object.fromEntries(all.map((sample) => [sample.id, sample]));
  }, [fieldASamples, fieldBSamples, fieldCSamples]);

  const fieldBPredictionMap = useMemo(
    () => Object.fromEntries(fieldBPredictions.map((item) => [item.sample.id, item])),
    [fieldBPredictions],
  );
  const fieldCPredictionMap = useMemo(
    () => Object.fromEntries(fieldCPredictions.map((item) => [item.sample.id, item])),
    [fieldCPredictions],
  );

  const activeField = stepIndex <= 1 ? "A" : stepIndex <= 3 ? "B" : "C";
  const cameraFocusX = FIELD_LAYOUT[activeField].centerX * FIELD_RENDER_SCALE;
  const hoveredSample = hoveredSampleId ? sampleById[hoveredSampleId] ?? null : null;
  const enableDetailedModel = !liteMode;
  const { model: wheatModel, loaded: wheatModelLoaded } = useWheatModel(WHEAT_MODEL_PATHS);
  const [backgroundImageIndex, setBackgroundImageIndex] = useState(0);
  const backgroundImageSrc =
    FARM_BG_IMAGE_PATHS[Math.min(backgroundImageIndex, FARM_BG_IMAGE_PATHS.length - 1)] ?? FARM_BG_IMAGE_PATHS[0];

  const showFieldAPlants = true;
  const showFieldBPlants = stepIndex >= 2;
  const showFieldCPlants = stepIndex >= 4;

  function renderPlantMeshes(model: WheatModel | null, useLitePlants: boolean) {
    return (
      <>
        {showFieldAPlants &&
          positionedA.map((item) => {
            const collected = collectedIds.includes(item.sample.id);
            const label = labels[item.sample.id];

            let markerColor: string | null = null;
            if (stepIndex >= 1 && label) {
              markerColor = markerColorForLabel(label);
            }

            return (
              <RicePlant
                key={item.sample.id}
                sample={item.sample}
                markerColor={markerColor}
                collected={collected}
                selected={activeSampleId === item.sample.id}
                dimmed={activeField !== "A"}
                liteMode={useLitePlants}
                model={model}
                position={item.position}
                hovered={hoveredSampleId === item.sample.id}
                onHover={() => onHoverSample(item.sample.id)}
                onSelect={() => onSelectSample(item.sample.id)}
              />
            );
          })}

        {showFieldBPlants &&
          positionedB.map((item) => {
            const prediction = fieldBPredictionMap[item.sample.id];
            const review = fieldBReviews[item.sample.id];

            let markerColor: string | null = null;
            if (prediction) {
              markerColor = markerColorForLabel(prediction.predicted);
            }
            if (stepIndex >= 3 && review === "model_correct") {
              markerColor = "#6ba8ff";
            }
            if (stepIndex >= 3 && review === "model_wrong") {
              markerColor = "#d87d62";
            }

            return (
              <RicePlant
                key={item.sample.id}
                sample={item.sample}
                markerColor={markerColor}
                collected={false}
                selected={activeSampleId === item.sample.id}
                dimmed={activeField !== "B"}
                liteMode={useLitePlants}
                model={model}
                position={item.position}
                hovered={hoveredSampleId === item.sample.id}
                onHover={() => onHoverSample(item.sample.id)}
                onSelect={() => onSelectSample(item.sample.id)}
              />
            );
          })}

        {showFieldCPlants &&
          positionedC.map((item) => {
            const prediction = fieldCPredictionMap[item.sample.id];
            const markerColor = prediction ? markerColorForLabel(prediction.predicted) : null;

            return (
              <RicePlant
                key={item.sample.id}
                sample={item.sample}
                markerColor={markerColor}
                collected={false}
                selected={activeSampleId === item.sample.id}
                dimmed={activeField !== "C"}
                liteMode={useLitePlants}
                model={model}
                position={item.position}
                hovered={hoveredSampleId === item.sample.id}
                onHover={() => onHoverSample(item.sample.id)}
                onSelect={() => onSelectSample(item.sample.id)}
              />
            );
          })}
      </>
    );
  }

  const baseClass = immersive
    ? "relative h-full w-full overflow-hidden bg-transparent"
    : "relative h-[380px] w-full overflow-hidden rounded-2xl border border-[#d7d5c4] bg-gradient-to-b from-[#f4f3e8] via-[#ece8d8] to-[#e0d8bf]";

  return (
    <div
      className={`${baseClass}${className ? ` ${className}` : ""}`}
      onPointerLeave={() => onHoverSample(null)}
    >
      <Image
        src={backgroundImageSrc}
        alt=""
        fill
        sizes="100vw"
        priority
        className="pointer-events-none absolute inset-0 object-cover"
        onError={() =>
          setBackgroundImageIndex((current) =>
            current < FARM_BG_IMAGE_PATHS.length - 1 ? current + 1 : current,
          )
        }
      />

      <Canvas
        key={`field-focus-${activeField}-${liteMode ? "lite" : "std"}`}
        dpr={liteMode ? [1, 1.2] : [1, 1.8]}
        shadows={!liteMode}
        gl={{ antialias: !liteMode, powerPreference: "high-performance", alpha: true }}
        camera={{ position: [cameraFocusX, 4.2, 6.7], fov: 44, near: 0.2, far: 40 }}
      >
        <ambientLight intensity={0.78} />
        <directionalLight
          position={[6, 8, 6]}
          intensity={1.08}
          castShadow={!liteMode}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.00015}
          shadow-normalBias={0.02}
        />

        <group scale={[FIELD_RENDER_SCALE, FIELD_RENDER_SCALE, FIELD_RENDER_SCALE]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow={false}>
            <planeGeometry args={[12, 5.2]} />
            <meshStandardMaterial color="#b8a780" transparent opacity={0} depthWrite={false} />
          </mesh>

          {(["A", "B", "C"] as const).map((field) => {
            const active = activeField === field;
            const layout = FIELD_LAYOUT[field];
            const visible = field === "A" || (field === "B" && stepIndex >= 2) || (field === "C" && stepIndex >= 4);

            return (
              <mesh key={field} position={[layout.centerX, -0.02, 0]} receiveShadow={!liteMode}>
                <boxGeometry args={[layout.width, 0.05, layout.depth]} />
                <meshStandardMaterial
                  color={active ? "#9ab66f" : "#b49d73"}
                  transparent={!visible}
                  opacity={visible ? 1 : 0.38}
                  depthWrite={visible}
                />
              </mesh>
            );
          })}

          {!enableDetailedModel || !wheatModelLoaded || wheatModel === null
            ? renderPlantMeshes(null, true)
            : renderPlantMeshes(wheatModel, false)}
        </group>

        <OrbitControls
          enablePan={false}
          target={[cameraFocusX, 0.18, 0]}
          minDistance={5.4}
          maxDistance={9.4}
          minPolarAngle={Math.PI / 4.6}
          maxPolarAngle={Math.PI / 2.1}
          rotateSpeed={liteMode ? 0.35 : 0.78}
        />
      </Canvas>

      {showFieldBadges && (
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2 text-[11px]">
          <span
            className={`rounded-full border px-2 py-0.5 ${
              activeField === "A"
                ? immersive
                  ? "border-[#6f86b7] bg-[rgba(20,31,55,0.84)] text-[#d4e2ff]"
                  : "border-[#a7bbdf] bg-[#edf2ff] text-[#2a3f68]"
                : immersive
                  ? "border-[#4d5b7d] bg-[rgba(14,22,40,0.76)] text-[#9baccf]"
                  : "border-[#d3dced] bg-white text-[#6a7591]"
            }`}
          >
            练习田
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 ${
              activeField === "B"
                ? immersive
                  ? "border-[#6f86b7] bg-[rgba(20,31,55,0.84)] text-[#d4e2ff]"
                  : "border-[#a7bbdf] bg-[#edf2ff] text-[#2a3f68]"
                : immersive
                  ? "border-[#4d5b7d] bg-[rgba(14,22,40,0.76)] text-[#9baccf]"
                  : "border-[#d3dced] bg-white text-[#6a7591]"
            }`}
          >
            测验田
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 ${
              activeField === "C"
                ? immersive
                  ? "border-[#6f86b7] bg-[rgba(20,31,55,0.84)] text-[#d4e2ff]"
                  : "border-[#a7bbdf] bg-[#edf2ff] text-[#2a3f68]"
                : immersive
                  ? "border-[#4d5b7d] bg-[rgba(14,22,40,0.76)] text-[#9baccf]"
                  : "border-[#d3dced] bg-white text-[#6a7591]"
            }`}
          >
            考试田
          </span>
        </div>
      )}

      {showModeBadge && (
        <div
          className={`pointer-events-none absolute right-3 top-3 rounded-full border px-3 py-1 text-xs ${
            immersive
              ? "border-[#4c5e85] bg-[rgba(17,27,49,0.84)] text-[#afc2eb]"
              : "border-[#cdd8eb] bg-[rgba(255,255,255,0.9)] text-[#44597f]"
          }`}
        >
          {liteMode ? "轻量模式" : "标准模式"}
        </div>
      )}
    </div>
  );
}
