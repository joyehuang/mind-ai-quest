"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameButton, GamePanel, GameProgress } from "@/components/ui/GameUI";
import {
  FARM_STEPS,
  FIELD_A_SAMPLES,
  FIELD_B_SAMPLES,
  FIELD_C_SAMPLES,
  SECOND_FIELD_TARGET,
  THIRD_FIELD_TARGET,
  TRAINING_POOL_SIZE,
  TRAINING_TARGET,
} from "@/lib/farm/datasets";
import { toConfusionMetrics } from "@/lib/farm/confusion";
import {
  buildPredictions,
  calculateFinalScore,
  calculateSecondFieldAccuracy,
  calculateStep2Errors,
  calculateStep2Score,
  calculateStep4CorrectCount,
  calculateStep4Score,
  calculateTrainingSetQuality,
  countLabeledSamples,
  generateLossSeries,
  toPercent,
} from "@/lib/farm/scoring";
import type { FarmSample, FinalSimulationResult, ModelJudgment, RiceLabel } from "@/lib/farm/types";
import StepCollect from "./steps/StepCollect";
import StepCorrect from "./steps/StepCorrect";
import StepLabel from "./steps/StepLabel";
import StepTrainTest from "./steps/StepTrainTest";
import StepTuneFinal from "./steps/StepTuneFinal";

const FarmQuestScene3D = dynamic(() => import("./FarmQuestScene3D"), {
  ssr: false,
});

interface FarmQuestProps {
  playerName: string;
  playerStyle: string;
  onBack: () => void;
  onComplete: () => void;
}

interface CollectPopupState {
  sample: FarmSample;
  action: "added" | "removed" | "full";
}

export default function FarmQuest({ playerName, playerStyle, onBack, onComplete }: FarmQuestProps) {
  const [step, setStep] = useState(0);

  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, RiceLabel>>({});
  const [activeSampleId, setActiveSampleId] = useState<string | null>(FIELD_A_SAMPLES[0]?.id ?? null);
  const [hoveredSampleId, setHoveredSampleId] = useState<string | null>(null);
  const [collectMessage, setCollectMessage] = useState("");

  const [trainProgress, setTrainProgress] = useState(0);
  const [fieldBReviews, setFieldBReviews] = useState<Record<string, ModelJudgment>>({});

  const [dataAugment, setDataAugment] = useState(false);
  const [layers, setLayers] = useState(3);
  const [learningRate, setLearningRate] = useState(5);
  const [finalResult, setFinalResult] = useState<FinalSimulationResult | null>(null);
  const [collectPopup, setCollectPopup] = useState<CollectPopupState | null>(null);

  const [liteMode, setLiteMode] = useState(true);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCoreDevice = typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 6;
    const connection = typeof navigator !== "undefined" ? (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }).connection : undefined;
    const slowNetwork = connection?.effectiveType
      ? ["slow-2g", "2g", "3g"].includes(connection.effectiveType)
      : false;
    const saveDataMode = connection?.saveData ?? false;

    const frame = window.requestAnimationFrame(() => {
      setLiteMode(reducedMotion || lowCoreDevice || slowNetwork || saveDataMode);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        clearTimeout(hoverLeaveTimerRef.current);
      }
      if (collectPopupTimerRef.current) {
        clearTimeout(collectPopupTimerRef.current);
      }
    };
  }, []);

  const trainingSamples = useMemo(
    () => FIELD_A_SAMPLES.filter((sample) => collectedIds.includes(sample.id)),
    [collectedIds],
  );

  const hoveredSample = useMemo(
    () => [...FIELD_A_SAMPLES, ...FIELD_B_SAMPLES, ...FIELD_C_SAMPLES].find((item) => item.id === hoveredSampleId) ?? null,
    [hoveredSampleId],
  );

  const labeledCount = useMemo(() => countLabeledSamples(labels, trainingSamples), [labels, trainingSamples]);
  const step2Score = useMemo(() => calculateStep2Score(labels, trainingSamples), [labels, trainingSamples]);
  const step2Errors = useMemo(() => calculateStep2Errors(labels, trainingSamples), [labels, trainingSamples]);
  const trainingQuality = useMemo(
    () => calculateTrainingSetQuality(trainingSamples).quality,
    [trainingSamples],
  );

  const secondFieldTargetAccuracy = useMemo(
    () => calculateSecondFieldAccuracy(step2Score, trainingQuality),
    [step2Score, trainingQuality],
  );

  const fieldBPredictions = useMemo(
    () => buildPredictions(FIELD_B_SAMPLES, secondFieldTargetAccuracy, 19),
    [secondFieldTargetAccuracy],
  );

  const fieldBConfusion = useMemo(() => toConfusionMetrics(fieldBPredictions), [fieldBPredictions]);

  const reviewedCount = useMemo(() => Object.keys(fieldBReviews).length, [fieldBReviews]);
  const step4Score = useMemo(
    () => calculateStep4Score(fieldBReviews, fieldBPredictions),
    [fieldBPredictions, fieldBReviews],
  );
  const step4CorrectCount = useMemo(
    () => calculateStep4CorrectCount(fieldBReviews, fieldBPredictions),
    [fieldBPredictions, fieldBReviews],
  );

  useEffect(() => {
    if (step !== 2 || trainProgress >= 100) {
      return;
    }

    const timer = setInterval(() => {
      setTrainProgress((current) => Math.min(100, current + 8));
    }, 380);

    return () => clearInterval(timer);
  }, [step, trainProgress]);

  const effectiveActiveSampleId = useMemo(() => {
    if (step !== 1) {
      return activeSampleId;
    }

    if (trainingSamples.length === 0) {
      return null;
    }

    const stillExists =
      activeSampleId !== null && trainingSamples.some((sample) => sample.id === activeSampleId);
    if (stillExists) {
      return activeSampleId;
    }

    const nextUnlabeled = trainingSamples.find((sample) => labels[sample.id] === undefined);
    return nextUnlabeled?.id ?? trainingSamples[0].id;
  }, [step, trainingSamples, activeSampleId, labels]);

  const canNext = useMemo(() => {
    if (step === 0) {
      return collectedIds.length >= TRAINING_TARGET;
    }
    if (step === 1) {
      return trainingSamples.length === TRAINING_TARGET && labeledCount >= trainingSamples.length;
    }
    if (step === 2) {
      return trainProgress >= 100;
    }
    if (step === 3) {
      return reviewedCount >= SECOND_FIELD_TARGET;
    }
    return finalResult !== null;
  }, [
    step,
    collectedIds.length,
    trainingSamples.length,
    labeledCount,
    trainProgress,
    reviewedCount,
    finalResult,
  ]);

  function resetQuest() {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    if (collectPopupTimerRef.current) {
      clearTimeout(collectPopupTimerRef.current);
      collectPopupTimerRef.current = null;
    }
    setStep(0);
    setCollectedIds([]);
    setLabels({});
    setActiveSampleId(FIELD_A_SAMPLES[0]?.id ?? null);
    setHoveredSampleId(null);
    setCollectMessage("");
    setTrainProgress(0);
    setFieldBReviews({});
    setDataAugment(false);
    setLayers(3);
    setLearningRate(5);
    setFinalResult(null);
    setCollectPopup(null);
  }

  function showCollectPopup(sampleId: string, action: CollectPopupState["action"]) {
    const sample = FIELD_A_SAMPLES.find((item) => item.id === sampleId);
    if (!sample) {
      return;
    }

    if (collectPopupTimerRef.current) {
      clearTimeout(collectPopupTimerRef.current);
      collectPopupTimerRef.current = null;
    }

    setCollectPopup({ sample, action });
    collectPopupTimerRef.current = setTimeout(() => {
      setCollectPopup(null);
    }, 2800);
  }

  function toggleCollect(sampleId: string) {
    setCollectedIds((previous) => {
      const exists = previous.includes(sampleId);
      if (!exists && previous.length >= TRAINING_TARGET) {
        setCollectMessage("训练集已满 10 个，请先移除一个样本再添加新的。");
        showCollectPopup(sampleId, "full");
        return previous;
      }

      const next = exists ? previous.filter((id) => id !== sampleId) : [...previous, sampleId];

      setLabels((current) => {
        const filtered = Object.fromEntries(
          Object.entries(current).filter(([id]) => next.includes(id)),
        ) as Record<string, RiceLabel>;
        return filtered;
      });

      setCollectMessage("");
      showCollectPopup(sampleId, exists ? "removed" : "added");
      return next;
    });
    handleHoverSample(sampleId);
  }

  function markLabel(sampleId: string, label: RiceLabel) {
    setLabels((previous) => {
      const updated = { ...previous, [sampleId]: label };
      const nextUnlabeled = trainingSamples.find((sample) => updated[sample.id] === undefined);
      setActiveSampleId(nextUnlabeled?.id ?? sampleId);
      return updated;
    });
  }

  function handleSceneSelect(sampleId: string) {
    if (step === 0 && FIELD_A_SAMPLES.some((sample) => sample.id === sampleId)) {
      toggleCollect(sampleId);
      return;
    }

    if (step === 1 && trainingSamples.some((sample) => sample.id === sampleId)) {
      setActiveSampleId(sampleId);
      return;
    }

    setActiveSampleId(sampleId);
  }

  function handleHoverSample(sampleId: string | null) {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }

    if (sampleId === null) {
      hoverLeaveTimerRef.current = setTimeout(() => {
        setHoveredSampleId(null);
      }, 180);
      return;
    }

    setHoveredSampleId((current) => (current === sampleId ? current : sampleId));
  }

  function runFinalSimulation() {
    const score = calculateFinalScore({
      step2Score,
      step4Score,
      trainingSetQuality: trainingQuality,
      secondFieldAccuracy: fieldBConfusion.accuracy,
      params: {
        dataAugment,
        layers,
        learningRate,
      },
    });

    const thirdFieldPredictions = buildPredictions(FIELD_C_SAMPLES, score.finalAccuracy, 37);
    const thirdFieldConfusion = toConfusionMetrics(thirdFieldPredictions);
    const lossPoints = generateLossSeries({
      step2Score,
      step4Score,
      trainingSetQuality: trainingQuality,
      finalScore: score,
    });

    setFinalResult({
      score,
      lossPoints,
      thirdFieldPredictions,
      thirdFieldConfusion,
    });
  }

  function previousStep() {
    if (step === 0) {
      onBack();
      return;
    }

    setStep((current) => Math.max(0, current - 1));
  }

  function nextStep() {
    if (!canNext) {
      return;
    }

    if (step === FARM_STEPS.length - 1) {
      onComplete();
      return;
    }

    setStep((current) => current + 1);
  }

  const progress = ((step + 1) / FARM_STEPS.length) * 100;

  const speech =
    step === 0
      ? `从 ${TRAINING_POOL_SIZE} 个候选里挑 ${TRAINING_TARGET} 个样本，当前训练集质量 ${toPercent(trainingQuality)}。`
      : step === 1
        ? `现在开始打标签。你已经标了 ${labeledCount}/${trainingSamples.length || TRAINING_TARGET} 个。`
        : step === 2
          ? trainProgress >= 100
            ? `第二块田测试完成，当前准确率 ${toPercent(fieldBConfusion.accuracy)}。`
            : "训练进行中，等进度到 100% 就能看到第二块田预测结果。"
          : step === 3
            ? `请判断模型预测对错。已纠错 ${reviewedCount}/${SECOND_FIELD_TARGET}。`
            : finalResult
              ? `第三块田最终准确率 ${toPercent(finalResult.score.finalAccuracy)}。`
              : "调节记忆药水、层数和学习速度，再运行最终测试。";

  return (
    <section className="game-quest farm-quest space-y-5">
      <GamePanel variant="strong" glow className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-[#c7f4ff]">主题关卡1：保护我们的稻田</h2>
          <span className="text-sm text-[#8ecfe9]">
            第 {step + 1} 步 / 共 {FARM_STEPS.length} 步
          </span>
        </div>

        <GameProgress value={progress} className="mt-3" />

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {FARM_STEPS.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`game-button rounded-xl border px-2 py-2 text-xs ${
                index <= step
                  ? "border-[rgba(85,233,255,0.55)] bg-[rgba(10,46,76,0.9)] text-[#c9f3ff]"
                  : "border-[rgba(66,136,170,0.42)] bg-[rgba(8,22,40,0.82)] text-[#78b2d1]"
              }`}
              disabled={index > step}
              onClick={() => index <= step && setStep(index)}
            >
              {index + 1}. {item}
            </button>
          ))}
        </div>
      </GamePanel>

      <div className="grid gap-5 xl:grid-cols-[310px_1fr]">
        <aside className="game-left-panel rounded-3xl p-5">
          <div className="game-surface-card rounded-2xl p-4">
            <p className="text-xs text-[#88d8f2]">AI 小助手</p>
            <p className="mt-1 text-lg font-semibold text-[#d5f5ff]">{playerName}</p>
            <p className="text-xs text-[#8bbfd8]">{playerStyle}</p>
          </div>

          <div className="game-surface-soft mt-4 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-[#8ed6f0]">实时提示</p>
            <p className="mt-2 text-sm leading-6 text-[#d7f5ff]">{speech}</p>
          </div>

          <div className="mt-4 space-y-2">
            <GameButton
              type="button"
              variant="primary"
              className="w-full px-3 py-2 text-sm"
              onClick={() => setLiteMode((current) => !current)}
            >
              切换渲染模式：{liteMode ? "轻量" : "标准"}
            </GameButton>
            <GameButton
              type="button"
              variant="secondary"
              className="w-full px-3 py-2 text-sm"
              onClick={resetQuest}
            >
              重置关卡1
            </GameButton>
          </div>
        </aside>

        <main className="game-main-panel space-y-4 rounded-3xl p-5">
          <FarmQuestScene3D
            stepIndex={step}
            liteMode={liteMode}
            fieldASamples={FIELD_A_SAMPLES}
            fieldBSamples={FIELD_B_SAMPLES}
            fieldCSamples={FIELD_C_SAMPLES}
            collectedIds={collectedIds}
            labels={labels}
            fieldBPredictions={fieldBPredictions}
            fieldBReviews={fieldBReviews}
            fieldCPredictions={finalResult?.thirdFieldPredictions ?? []}
            hoveredSampleId={hoveredSampleId}
            activeSampleId={effectiveActiveSampleId}
            onHoverSample={handleHoverSample}
            onSelectSample={handleSceneSelect}
          />

          {step === 0 && (
            <StepCollect
              collectedSamples={trainingSamples}
              collectedIds={collectedIds}
              target={TRAINING_TARGET}
              poolSize={TRAINING_POOL_SIZE}
              trainingQuality={trainingQuality}
              hoveredSample={hoveredSample}
              collectMessage={collectMessage}
            />
          )}

          {step === 1 && (
            <StepLabel
              samples={trainingSamples}
              labels={labels}
              activeSampleId={effectiveActiveSampleId}
              onFocusSample={setActiveSampleId}
              onLabel={markLabel}
            />
          )}

          {step === 2 && (
            <StepTrainTest
              trainProgress={trainProgress}
              step2Score={step2Score}
              step2Errors={step2Errors}
              trainingSetQuality={trainingQuality}
              targetAccuracy={secondFieldTargetAccuracy}
              predictions={fieldBPredictions}
              confusion={fieldBConfusion}
            />
          )}

          {step === 3 && (
            <StepCorrect
              predictions={fieldBPredictions}
              reviews={fieldBReviews}
              step4Score={step4Score}
              correctCount={step4CorrectCount}
              onReview={(sampleId, judgment) =>
                setFieldBReviews((previous) => ({ ...previous, [sampleId]: judgment }))
              }
            />
          )}

          {step === 4 && (
            <StepTuneFinal
              dataAugment={dataAugment}
              layers={layers}
              learningRate={learningRate}
              onDataAugmentChange={setDataAugment}
              onLayersChange={setLayers}
              onLearningRateChange={setLearningRate}
              onRun={runFinalSimulation}
              step2Score={step2Score}
              step4Score={step4Score}
              trainingSetQuality={trainingQuality}
              finalResult={finalResult}
            />
          )}
        </main>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <GameButton
          type="button"
          variant="secondary"
          className="rounded-xl px-4 py-2 text-sm"
          onClick={previousStep}
        >
          {step === 0 ? "返回关卡选择" : "上一步"}
        </GameButton>

        <GameButton
          type="button"
          variant="success"
          className="rounded-xl px-5 py-2 text-sm disabled:bg-[#6f8a9f]"
          disabled={!canNext}
          onClick={nextStep}
        >
          {step === FARM_STEPS.length - 1 ? "完成关卡" : "下一步"}
        </GameButton>
      </div>

      <p className="text-xs text-[#8ec4df]">
        数据规模：第一块田候选 {TRAINING_POOL_SIZE}（训练集选取 {TRAINING_TARGET}），第二块田 {SECOND_FIELD_TARGET}，第三块田 {THIRD_FIELD_TARGET}。
      </p>

      {collectPopup && step === 0 && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[9999] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(93,227,255,0.5)] bg-[rgba(6,20,40,0.95)] p-4 shadow-[0_18px_42px_rgba(9,30,68,0.55)] backdrop-blur-sm">
          <p
            className={`text-sm font-semibold ${
              collectPopup.action === "added"
                ? "text-[#83ffd0]"
                : collectPopup.action === "removed"
                  ? "text-[#ffd18d]"
                  : "text-[#ffc47d]"
            }`}
          >
            {collectPopup.action === "added" && "已加入训练集"}
            {collectPopup.action === "removed" && "已移出训练集"}
            {collectPopup.action === "full" && "训练集已满（10/10）"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#d3f4ff]">{collectPopup.sample.name}</p>
          <p className="mt-1 text-xs text-[#a3d9ef]">叶子：{collectPopup.sample.profile.leaf}</p>
          <p className="text-xs text-[#a3d9ef]">稻秆：{collectPopup.sample.profile.stem}</p>
          <p className="text-xs text-[#a3d9ef]">小稻秆：{collectPopup.sample.profile.tiller}</p>
          <p className="text-xs text-[#a3d9ef]">虫害：{collectPopup.sample.profile.pest}</p>
          <p className="text-xs text-[#a3d9ef]">稻穗：{collectPopup.sample.profile.panicle}</p>
        </div>
      )}
    </section>
  );
}
