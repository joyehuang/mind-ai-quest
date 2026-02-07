"use client";

import { Clone, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import type { FarmSample, ModelJudgment, PredictionRecord, RiceLabel } from "@/lib/farm/types";

interface FarmQuestScene3DProps {
  stepIndex: number;
  liteMode: boolean;
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

const WHEAT_MODEL_PATH = "/models/wheet.glb";

const FIELD_LAYOUT: Record<"A" | "B" | "C", FieldLayout> = {
  A: {
    centerX: -2.6,
    width: 3.6,
    depth: 2.9,
    columns: 5,
    spacingX: 0.62,
    spacingZ: 0.62,
    startZ: -1.05,
  },
  B: {
    centerX: 0,
    width: 3,
    depth: 2.4,
    columns: 4,
    spacingX: 0.62,
    spacingZ: 0.62,
    startZ: -0.85,
  },
  C: {
    centerX: 2.6,
    width: 3,
    depth: 2.4,
    columns: 4,
    spacingX: 0.62,
    spacingZ: 0.62,
    startZ: -0.85,
  },
};

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
  return label === "healthy" ? "#4fa978" : "#d47a5d";
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
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
      <mesh>
        <ringGeometry args={[0.085, 0.13, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.2} />
      </mesh>
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.13, 0.17, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.2} />
      </mesh>
      <mesh ref={haloRef}>
        <circleGeometry args={[0.17, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function useWheatModel(): WheatModel {
  const gltf = useGLTF(WHEAT_MODEL_PATH);

  return useMemo(() => {
    gltf.scene.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(gltf.scene);
    const size = new Vector3();
    bounds.getSize(size);

    return {
      object: gltf.scene,
      minY: bounds.min.y,
      height: Math.max(size.y, 0.001),
    };
  }, [gltf.scene]);
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
  onHover: () => void;
  onSelect: () => void;
}) {
  const appearance = getPlantAppearance(sample);

  const leafColor = dimmed ? "#b7c6be" : appearance.leafColor;
  const stemColor = dimmed ? "#9aaea3" : appearance.stemColor;

  const seed = hashId(sample.id);
  const useModel = !liteMode && model !== null;
  const modelScale = useModel ? clamp((appearance.stemHeight * 1.35) / model.height, 0.12, 0.34) : 0;
  const modelOffsetY = useModel ? -model.minY * modelScale : 0;
  const modelRotateY = ((seed % 360) * Math.PI) / 180 + appearance.stemLean * 0.5;
  const lift = selected ? 0.03 : 0;

  return (
    <group position={[position[0], position[1] + lift, position[2]]}>
      <mesh
        position={[0, 0.46, 0]}
        onPointerEnter={(event) => {
          event.stopPropagation();
          onHover();
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          onHover();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.3, 0.92, 0.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {!useModel ? (
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
          <Clone object={model!.object} />
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
        <SelectionPulse color={dimmed ? "#9eb4a9" : "#3fb273"} />
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
    </group>
  );
}

function CameraFocusRig({ focusX }: { focusX: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(focusX, 4.2, 6.7);
  }, [camera, focusX]);

  return null;
}

interface PlantLayerProps {
  model: WheatModel | null;
  liteMode: boolean;
  stepIndex: number;
  activeField: "A" | "B" | "C";
  positionedA: PositionedSample[];
  positionedB: PositionedSample[];
  positionedC: PositionedSample[];
  collectedIds: string[];
  labels: Record<string, RiceLabel>;
  fieldBPredictionMap: Record<string, PredictionRecord>;
  fieldBReviews: Record<string, ModelJudgment>;
  fieldCPredictionMap: Record<string, PredictionRecord>;
  activeSampleId: string | null;
  onHoverSample: (sampleId: string | null) => void;
  onSelectSample: (sampleId: string) => void;
}

function PlantLayer({
  model,
  liteMode,
  stepIndex,
  activeField,
  positionedA,
  positionedB,
  positionedC,
  collectedIds,
  labels,
  fieldBPredictionMap,
  fieldBReviews,
  fieldCPredictionMap,
  activeSampleId,
  onHoverSample,
  onSelectSample,
}: PlantLayerProps) {
  const showFieldAPlants = true;
  const showFieldBPlants = stepIndex >= 2;
  const showFieldCPlants = stepIndex >= 4;

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
              liteMode={liteMode}
              model={model}
              position={item.position}
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
            markerColor = "#4d93c9";
          }
          if (stepIndex >= 3 && review === "model_wrong") {
            markerColor = "#d17b59";
          }

          return (
            <RicePlant
              key={item.sample.id}
              sample={item.sample}
              markerColor={markerColor}
              collected={false}
              selected={activeSampleId === item.sample.id}
              dimmed={activeField !== "B"}
              liteMode={liteMode}
              model={model}
              position={item.position}
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
              liteMode={liteMode}
              model={model}
              position={item.position}
              onHover={() => onHoverSample(item.sample.id)}
              onSelect={() => onSelectSample(item.sample.id)}
            />
          );
        })}
    </>
  );
}

function ModelPlantLayer(props: Omit<PlantLayerProps, "model">) {
  const wheatModel = useWheatModel();
  return <PlantLayer {...props} model={wheatModel} />;
}

export default function FarmQuestScene3D({
  stepIndex,
  liteMode,
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
    () => Object.fromEntries(fieldBPredictions.map((item) => [item.sample.id, item])) as Record<string, PredictionRecord>,
    [fieldBPredictions],
  );
  const fieldCPredictionMap = useMemo(
    () => Object.fromEntries(fieldCPredictions.map((item) => [item.sample.id, item])) as Record<string, PredictionRecord>,
    [fieldCPredictions],
  );

  const activeField = stepIndex <= 1 ? "A" : stepIndex <= 3 ? "B" : "C";
  const cameraFocusX = FIELD_LAYOUT[activeField].centerX;
  const hoveredSample = hoveredSampleId ? sampleById[hoveredSampleId] ?? null : null;

  return (
    <div
      className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-[rgba(71,213,255,0.4)] bg-[radial-gradient(circle_at_20%_15%,rgba(44,205,255,0.14),transparent_48%),radial-gradient(circle_at_82%_82%,rgba(55,255,154,0.12),transparent_48%),linear-gradient(165deg,#071328_0%,#081a34_52%,#0a2142_100%)]"
      onPointerLeave={() => onHoverSample(null)}
    >
      <Canvas
        dpr={liteMode ? [1, 1.15] : [1, 1.35]}
        shadows={!liteMode}
        camera={{ position: [cameraFocusX, 4.2, 6.7], fov: 44, near: 0.1, far: 32 }}
        gl={{ antialias: !liteMode, powerPreference: "high-performance" }}
      >
        <CameraFocusRig focusX={cameraFocusX} />
        <ambientLight intensity={0.68} />
        <directionalLight
          position={[6, 8, 6]}
          intensity={0.92}
          color="#d9f5ff"
          castShadow={!liteMode}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <directionalLight position={[-5, 4, -3]} intensity={0.45} color="#49ddff" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow={!liteMode}>
          <planeGeometry args={[12, 5.2]} />
          <meshStandardMaterial color="#10314b" roughness={0.92} />
        </mesh>

        {(["A", "B", "C"] as const).map((field) => {
          const active = activeField === field;
          const layout = FIELD_LAYOUT[field];
          const visible = field === "A" || (field === "B" && stepIndex >= 2) || (field === "C" && stepIndex >= 4);

          return (
            <mesh key={field} position={[layout.centerX, -0.02, 0]} receiveShadow={!liteMode}>
              <boxGeometry args={[layout.width, 0.05, layout.depth]} />
              <meshStandardMaterial
                color={active ? "#1f4f66" : "#16394f"}
                transparent
                opacity={visible ? 0.95 : 0.35}
              />
            </mesh>
          );
        })}

        {liteMode ? (
          <PlantLayer
            model={null}
            liteMode
            stepIndex={stepIndex}
            activeField={activeField}
            positionedA={positionedA}
            positionedB={positionedB}
            positionedC={positionedC}
            collectedIds={collectedIds}
            labels={labels}
            fieldBPredictionMap={fieldBPredictionMap}
            fieldBReviews={fieldBReviews}
            fieldCPredictionMap={fieldCPredictionMap}
            activeSampleId={activeSampleId}
            onHoverSample={onHoverSample}
            onSelectSample={onSelectSample}
          />
        ) : (
          <Suspense
            fallback={
              <PlantLayer
                model={null}
                liteMode
                stepIndex={stepIndex}
                activeField={activeField}
                positionedA={positionedA}
                positionedB={positionedB}
                positionedC={positionedC}
                collectedIds={collectedIds}
                labels={labels}
                fieldBPredictionMap={fieldBPredictionMap}
                fieldBReviews={fieldBReviews}
                fieldCPredictionMap={fieldCPredictionMap}
                activeSampleId={activeSampleId}
                onHoverSample={onHoverSample}
                onSelectSample={onSelectSample}
              />
            }
          >
            <ModelPlantLayer
              liteMode={false}
              stepIndex={stepIndex}
              activeField={activeField}
              positionedA={positionedA}
              positionedB={positionedB}
              positionedC={positionedC}
              collectedIds={collectedIds}
              labels={labels}
              fieldBPredictionMap={fieldBPredictionMap}
              fieldBReviews={fieldBReviews}
              fieldCPredictionMap={fieldCPredictionMap}
              activeSampleId={activeSampleId}
              onHoverSample={onHoverSample}
              onSelectSample={onSelectSample}
            />
          </Suspense>
        )}

        <OrbitControls
          enablePan={false}
          target={[cameraFocusX, 0.2, 0]}
          minDistance={5.4}
          maxDistance={9.4}
          minPolarAngle={Math.PI / 4.6}
          maxPolarAngle={Math.PI / 2.1}
          rotateSpeed={liteMode ? 0.35 : 0.78}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-3 top-3 flex gap-2 text-[11px]">
        <span
          className={`rounded-full border px-2 py-0.5 ${
            activeField === "A"
              ? "border-[rgba(91,224,255,0.6)] bg-[rgba(9,50,83,0.86)] text-[#c5f3ff]"
              : "border-[rgba(73,136,169,0.45)] bg-[rgba(8,25,46,0.8)] text-[#8bbfd8]"
          }`}
        >
          第一块田
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 ${
            activeField === "B"
              ? "border-[rgba(91,224,255,0.6)] bg-[rgba(9,50,83,0.86)] text-[#c5f3ff]"
              : "border-[rgba(73,136,169,0.45)] bg-[rgba(8,25,46,0.8)] text-[#8bbfd8]"
          }`}
        >
          第二块田
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 ${
            activeField === "C"
              ? "border-[rgba(91,224,255,0.6)] bg-[rgba(9,50,83,0.86)] text-[#c5f3ff]"
              : "border-[rgba(73,136,169,0.45)] bg-[rgba(8,25,46,0.8)] text-[#8bbfd8]"
          }`}
        >
          第三块田
        </span>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-[rgba(84,224,255,0.52)] bg-[rgba(7,25,45,0.9)] px-3 py-1 text-xs text-[#b4e8ff]">
        {liteMode ? "轻量模式" : "标准模式"}
      </div>

      {hoveredSample && (
        <div className="pointer-events-none absolute bottom-3 right-3 min-w-[260px] rounded-lg border border-[rgba(91,224,255,0.52)] bg-[rgba(5,21,41,0.94)] px-3 py-2 text-xs text-[#bce9ff] shadow-[0_10px_24px_rgba(4,13,30,0.55)]">
          <p className="font-semibold text-[#d8f6ff]">{hoveredSample.name}</p>
          <p className="mt-1">叶子：{hoveredSample.profile.leaf}</p>
          <p>稻秆：{hoveredSample.profile.stem}</p>
          <p>小稻秆：{hoveredSample.profile.tiller}</p>
          <p>虫害：{hoveredSample.profile.pest}</p>
          <p>稻穗：{hoveredSample.profile.panicle}</p>
          <p className="mt-1 font-semibold text-[#8fe8ff]">
            {collectedIds.includes(hoveredSample.id) ? "点击可移除训练集" : "点击可加入训练集"}
          </p>
        </div>
      )}
    </div>
  );
}
